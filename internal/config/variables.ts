import * as dotenv from "dotenv";
dotenv.config();

export enum EnvironmentKey {
    CI = "CI",
    EnvironmentName = "ENV_NAME",
    Url = "CONNECTION_STRING_APP",
    ApiUrl = "CONNECTION_STRING_API",
}

export enum EnvironmentName {
    DEV = "DEV",
    QA = "QA",
    LOCAL = "LOCAL",
}

export function getEnvValue(
    key: EnvironmentKey,
    options?: { failOnAbsence: boolean }
): string {
    const value = process.env[key] as string;
    const shouldFail = options?.failOnAbsence ?? true;

    if (!value && shouldFail) {
        throw new Error(
            `Environment value of [${key}] is not defined in the environment!`
        );
    }
    return value;
}

export const isCI = () =>
    getEnvValue(EnvironmentKey.CI, { failOnAbsence: false }) === "true";
