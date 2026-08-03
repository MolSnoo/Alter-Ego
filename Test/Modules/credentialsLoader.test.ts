// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
    type Credentials,
    loadCredentials,
    parseCredentialsFile,
    readCredentialsEnv
} from "../../Modules/credentialsLoader.js";
import {readFile} from "fs/promises";
import {readFileSync} from "fs";

vi.mock("node:fs/promises");
vi.mock("node:fs");

const mockedReadFile = vi.mocked(readFile);
const mockedReadFileSync = vi.mocked(readFileSync);

describe("credentialsLoader tests", () => {
    beforeEach(() => {
        mockedReadFile.mockReset();
        mockedReadFileSync.mockReset();
        vi.unstubAllEnvs();
        mockEmptyCredentialsEnv();
    });

    afterAll(() => {
        vi.unstubAllEnvs();
        vi.resetAllMocks();
    });

    describe("loadCredentials tests", () => {
        test("When valid credentials file exists, return credentials", () => {
            mockedReadFileSync.mockReturnValueOnce(TEST_CREDENTIALS_FILE);
            const credentials = loadCredentials();
            expect(credentials).toStrictEqual(TEST_CREDENTIALS);
        });
        test("When credentials file does not exist, return environmental variables", () => {
            mockedReadFileSync.mockImplementation(() => {
                throw new Error("ENOENT: file not found")
            });
            mockCredentialsEnv();
            const credentials = loadCredentials();
            expect(credentials).toStrictEqual(TEST_CREDENTIALS);
        });
        test("When credentials file does not exist and environmental variables not set, throw error", () => {
            mockedReadFileSync.mockImplementation(() => {
                throw new Error("ENOENT: file not found")
            });
            expect(() => loadCredentials()).toThrowError();
        });
    });

    describe("readCredentialsEnv tests", () => {
        test("When all environmental variables set, return credentials", () => {
            mockCredentialsEnv();
            const credentials = readCredentialsEnv();

            expect(credentials.discord.token).toBe("test");
            expect(credentials.google.type).toBe("service_account");
            expect(credentials.google.project_id).toBe("test");
            expect(credentials.google.private_key_id).toBe("test");
            expect(credentials.google.private_key).toBe("test");
            expect(credentials.google.client_email).toBe("test");
            expect(credentials.google.client_id).toBe("test");
            expect(credentials.google.auth_uri).toBe("https://accounts.google.com/o/oauth2/auth");
            expect(credentials.google.token_uri).toBe("https://oauth2.googleapis.com/token");
            expect(credentials.google.auth_provider_x509_cert_url).toBe("https://www.googleapis.com/oauth2/v1/certs");
            expect(credentials.google.client_x509_cert_url).toBe("test");
        });
        test("When not all environmental variables set, throw error", () => {
            vi.stubEnv("DISCORD_TOKEN", "test");
            expect(() => readCredentialsEnv()).toThrowError();
        });
        test("When new line character in private key, should convert to string properly", () => {
            mockCredentialsEnv();
            const testString = "test\ntest";
            vi.stubEnv("G_PRIVATE_KEY", testString);
            const credentials = readCredentialsEnv();

            expect(credentials.google.private_key).toBe(testString);
        });
    });

    describe("parseCredentialFile tests", () => {
        test("When credentials file is valid, return credentials", () => {
            const credentials = parseCredentialsFile(TEST_CREDENTIALS_FILE);

            expect(credentials.discord.token).toBe("test");
            expect(credentials.google.type).toBe("service_account");
            expect(credentials.google.project_id).toBe("test");
            expect(credentials.google.private_key_id).toBe("test");
            expect(credentials.google.private_key).toBe("test");
            expect(credentials.google.client_email).toBe("test");
            expect(credentials.google.client_id).toBe("test");
            expect(credentials.google.auth_uri).toBe("https://accounts.google.com/o/oauth2/auth");
            expect(credentials.google.token_uri).toBe("https://oauth2.googleapis.com/token");
            expect(credentials.google.auth_provider_x509_cert_url).toBe("https://www.googleapis.com/oauth2/v1/certs");
            expect(credentials.google.client_x509_cert_url).toBe("test");
        });
        test("When credentials file is invalid, throw error", () => {
            expect(() => parseCredentialsFile("{\"discord\": \"test\}")).toThrowError();
        });
    });

    function mockCredentialsEnv() {
        vi.stubEnv("DISCORD_TOKEN", "test");
        vi.stubEnv("G_PROJECT_ID", "test");
        vi.stubEnv("G_PRIVATE_KEY_ID", "test");
        vi.stubEnv("G_PRIVATE_KEY", "test");
        vi.stubEnv("G_CLIENT_EMAIL", "test");
        vi.stubEnv("G_CLIENT_ID", "test");
        vi.stubEnv("G_CLIENT_X509_CERT_URL", "test");
    }

    function mockEmptyCredentialsEnv() {
        vi.stubEnv("DISCORD_TOKEN", undefined);
        vi.stubEnv("G_PROJECT_ID", undefined);
        vi.stubEnv("G_PRIVATE_KEY_ID", undefined);
        vi.stubEnv("G_PRIVATE_KEY", undefined);
        vi.stubEnv("G_CLIENT_EMAIL", undefined);
        vi.stubEnv("G_CLIENT_ID", undefined);
        vi.stubEnv("G_CLIENT_X509_CERT_URL", undefined);
    }

    const TEST_CREDENTIALS_FILE = "{\n" +
        "    \"discord\": {\n" +
        "        \"token\": \"test\"\n" +
        "    },\n" +
        "    \"google\": {\n" +
        "        \"type\": \"service_account\",\n" +
        "        \"project_id\": \"test\",\n" +
        "        \"private_key_id\": \"test\",\n" +
        "        \"private_key\": \"test\",\n" +
        "        \"client_email\": \"test\",\n" +
        "        \"client_id\": \"test\",\n" +
        "        \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\n" +
        "        \"token_uri\": \"https://oauth2.googleapis.com/token\",\n" +
        "        \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\n" +
        "        \"client_x509_cert_url\": \"test\"\n" +
        "    }\n" +
        "}"

    const TEST_CREDENTIALS: Credentials = {
        discord: {
            token: "test",
        },
        google: {
            type: "service_account",
            project_id: "test",
            private_key_id: "test",
            private_key: "test",
            client_email: "test",
            client_id: "test",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "test"
        }
    }
});
