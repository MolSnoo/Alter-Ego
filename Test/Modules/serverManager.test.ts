// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {readFile} from "fs/promises";
import {readFileSync} from "fs";
import {loadServerConfig, type ServerConfig} from "../../Modules/serverManager.js";

vi.mock("node:fs/promises");
vi.mock("node:fs");

const mockedRead = vi.mocked(readFile);
const mockedReadFileSync = vi.mocked(readFileSync);

describe("serverManager tests", () => {
    beforeEach(() => {
        mockedRead.mockReset();
        mockedReadFileSync.mockReset();
        vi.unstubAllEnvs();
        stubEmptyLoadServerConfigEnvs();
    });

    afterAll(() => {
        vi.resetAllMocks()
        vi.unstubAllEnvs();
    });

    describe("loadServerConfig tests", () => {
        test("With valid serverconfig file, return ServerConfig object", async () => {
            mockedRead.mockResolvedValueOnce(TEST_SERVERCONFIG_FILE);
            let config = await loadServerConfig();
            expect(config).toStrictEqual(TEST_SERVERCONFIG);
        });
        test("With inaccessible serverconfig file, throw error", async () => {
            mockedRead.mockRejectedValueOnce(new Error("ENOENT: file not found"));
            await expect(async () => await loadServerConfig()).rejects.toThrow();
        });
        test("With invalid serverconfig file, throw error", async () => {
            mockedRead.mockResolvedValueOnce("{");
            await expect(async () => await loadServerConfig()).rejects.toThrow();
        });
        test("With environment variables set, override serverConfig file", async () => {
            mockedRead.mockResolvedValueOnce(TEST_SERVERCONFIG_FILE);
            stubLoadServerConfigEnvs();
            let config = await loadServerConfig();
            expect(config.testerRole).toBe("env");
            expect(config.eligibleRole).toBe("env");
            expect(config.playerRole).toBe("env");
            expect(config.freeMovementRole).toBe("env");
            expect(config.moderatorRole).toBe("env");
            expect(config.deadRole).toBe("env");
            expect(config.spectatorRole).toBe("env");
            expect(config.roomCategories).toBe("env");
            expect(config.whisperCategory).toBe("env");
            expect(config.spectateCategory).toBe("env");
            expect(config.testingChannel).toBe("env");
            expect(config.generalChannel).toBe("env");
            expect(config.announcementChannel).toBe("env");
            expect(config.commandChannel).toBe("env");
            expect(config.logChannel).toBe("env");
        });
    });

    function stubLoadServerConfigEnvs() {
        vi.stubEnv("TESTER_ROLE", "env");
        vi.stubEnv("ELIGIBLE_ROLE", "env");
        vi.stubEnv("PLAYER_ROLE", "env");
        vi.stubEnv("FREE_MOVEMENT_ROLE", "env");
        vi.stubEnv("MODERATOR_ROLE", "env");
        vi.stubEnv("DEAD_ROLE", "env");
        vi.stubEnv("SPECTATOR_ROLE", "env");
        vi.stubEnv("ROOM_CATEGORIES", "env");
        vi.stubEnv("WHISPER_CATEGORY", "env");
        vi.stubEnv("SPECTATE_CATEGORY", "env");
        vi.stubEnv("TESTING_CHANNEL", "env");
        vi.stubEnv("GENERAL_CHANNEL", "env");
        vi.stubEnv("ANNOUNCEMENT_CHANNEL", "env");
        vi.stubEnv("COMMAND_CHANNEL", "env");
        vi.stubEnv("LOG_CHANNEL", "env");
    }

    function stubEmptyLoadServerConfigEnvs() {
        vi.stubEnv("TESTER_ROLE", undefined);
        vi.stubEnv("ELIGIBLE_ROLE", undefined);
        vi.stubEnv("PLAYER_ROLE", undefined);
        vi.stubEnv("FREE_MOVEMENT_ROLE", undefined);
        vi.stubEnv("MODERATOR_ROLE", undefined);
        vi.stubEnv("DEAD_ROLE", undefined);
        vi.stubEnv("SPECTATOR_ROLE", undefined);
        vi.stubEnv("ROOM_CATEGORIES", undefined);
        vi.stubEnv("WHISPER_CATEGORY", undefined);
        vi.stubEnv("SPECTATE_CATEGORY", undefined);
        vi.stubEnv("TESTING_CHANNEL", undefined);
        vi.stubEnv("GENERAL_CHANNEL", undefined);
        vi.stubEnv("ANNOUNCEMENT_CHANNEL", undefined);
        vi.stubEnv("COMMAND_CHANNEL", undefined);
        vi.stubEnv("LOG_CHANNEL", undefined);
    }

    const TEST_SERVERCONFIG_FILE: string = `{
      "testerRole": "test",
      "eligibleRole": "test",
      "playerRole": "test",
      "freeMovementRole": "test",
      "moderatorRole": "test",
      "deadRole": "test",
      "spectatorRole": "test",
      "roomCategories": "test",
      "whisperCategory": "test",
      "spectateCategory": "test",
      "testingChannel": "test",
      "generalChannel": "test",
      "announcementChannel": "test",
      "commandChannel": "test",
      "logChannel": "test"
    }`;

    const TEST_SERVERCONFIG: ServerConfig = {
        announcementChannel: "test",
        commandChannel: "test",
        deadRole: "test",
        eligibleRole: "test",
        freeMovementRole: "test",
        generalChannel: "test",
        logChannel: "test",
        moderatorRole: "test",
        playerRole: "test",
        roomCategories: "test",
        spectateCategory: "test",
        spectatorRole: "test",
        testerRole: "test",
        testingChannel: "test",
        whisperCategory: "test"
    }
});
