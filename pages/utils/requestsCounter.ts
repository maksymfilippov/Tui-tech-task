import { Page } from '@playwright/test';

export class NetworkCounter {
	public page: Page;
	private readonly timeout = 30000;
	private readonly interval = 300;
	private requests = 0;
	private responses = 0;

	constructor(page: Page) {
		this.page = page;

		page.on('request', () => {
			this.requests += 1;
		});

		page.on('response', () => {
			this.responses += 1;
		});
	}

	async isIdle(options?: WaitForIdleOptions): Promise<WaitForIdleResponse> {
		const currentTimeout = options?.timeout ?? this.timeout;

		const startTime = Date.now();
		const startResponseCount = this.responses;

		return new Promise(resolve => {
			const intervalFn = setInterval(() => {
				const elapsed = Date.now() - startTime;

				const pending =
					this.responses > this.requests ? 0 : this.requests - this.responses;

				if (pending === 0 || elapsed >= currentTimeout) {
					const finishedRequests = this.responses - startResponseCount;
					resolve({
						elapsed,
						count: finishedRequests,
					});
					clearInterval(intervalFn);
				}
			}, options?.interval ?? this.interval);
		});
	}
}

export interface WaitForIdleOptions {
	timeout?: number;
	interval?: number;
}

interface WaitForIdleResponse {
	elapsed: number;
	count: number;
}
