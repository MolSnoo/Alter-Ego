// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import MonologAction from "../../../Data/Actions/MonologAction.ts";
import type Player from "../../../Data/Player.ts";
import type Room from "../../../Data/Room.ts";
import { sendQueuedMessages } from "../../../Modules/messageHandler.js";

describe('MonologAction test', () => {
	let kyra: Player;
	let vivian: Player;
	let astrid: Player;
	let nero: Player;
	let asuka: Player;
	let luna: Player;
	let kiara: Player;
	let amadeus: Player;
	let qm: Player;
	let breakRoom: Room;
	let gmOffice: Room;
	let f1h1: Room;
	let f1h2: Room;
	let lobby: Room;
	let commandCenter: Room;
	let courtyard: Room;
	let players: Player[];
	let rooms: Room[];

	beforeAll(async () => {
		if (!game.inProgress) await game.entityLoader.loadAll();
		kyra = game.entityFinder.getLivingPlayer("Kyra");
        vivian = game.entityFinder.getLivingPlayer("Vivian");
        astrid = game.entityFinder.getLivingPlayer("Astrid");
        nero = game.entityFinder.getLivingPlayer("Nero");
        asuka = game.entityFinder.getLivingPlayer("Asuka");
        luna = game.entityFinder.getLivingPlayer("Luna");
        kiara = game.entityFinder.getLivingPlayer("Kiara");
        amadeus = game.entityFinder.getLivingPlayer("Amadeus");
        qm = game.entityFinder.getLivingPlayer("???");
        breakRoom = game.entityFinder.getRoom("break-room");
        gmOffice = game.entityFinder.getRoom("general-managers-office");
        f1h1 = game.entityFinder.getRoom("floor-1-hall-1");
        f1h2 = game.entityFinder.getRoom("floor-1-hall-2");
        lobby = game.entityFinder.getRoom("lobby");
        commandCenter = game.entityFinder.getRoom("command-center");
        courtyard = game.entityFinder.getRoom("courtyard");
		players = [kyra, vivian, astrid, nero, asuka, luna, kiara, amadeus];
		rooms = [breakRoom, gmOffice, f1h1, f1h2, lobby, commandCenter, courtyard];

		kyra.location.removePlayer(kyra);
		commandCenter.addPlayer(kyra);
		amadeus.location.removePlayer(amadeus);
		commandCenter.addPlayer(amadeus);

		vivian.location.removePlayer(vivian);
		gmOffice.addPlayer(vivian);

		nero.location.removePlayer(nero);
		breakRoom.addPlayer(nero);

		astrid.location.removePlayer(astrid);
		f1h2.addPlayer(astrid);

		kiara.location.removePlayer(kiara);
		f1h1.addPlayer(kiara);

		luna.location.removePlayer(luna);
		courtyard.addPlayer(luna);
		asuka.location.removePlayer(asuka);
		courtyard.addPlayer(asuka);
	});

	afterAll(async () => {
		await game.entityLoader.loadPlayers(false);
	});

	describe('performMonolog tests', () => {
		afterEach(() => {
            for (const player of players) {
                if (player.isNPC) continue;
                player.spectateChannel.messages.cache.clear();
                player.notificationChannel.messages.cache.clear();
            }
            for (const room of rooms)
                room.channel.messages.cache.clear();
        });

		test('standard monolog is communicated to performing player and nobody else', async () => {
			const monologAction = new MonologAction(game, undefined, kyra, kyra.location, false);
			const messageText = "What could this Amadeus character be up to? She doesn't have even the slightest guess.";
			monologAction.performMonolog(messageText);
			await sendQueuedMessages(game);
			for (const player of players) {
				if (player.isNPC) continue;
				const notificationMessage = player.notificationChannel.messages.cache.first();
				const spectateMessage = player.spectateChannel.messages.cache.first();
				if (player.name === kyra.name) {
					expect(player.notificationChannel.messages.cache).toHaveSize(1);
					expect(notificationMessage.content).toBe(messageText);
					expect(player.spectateChannel.messages.cache).toHaveSize(1);
					expect(spectateMessage).toBeWebhookMessage();
					expect(spectateMessage).toBeMessageWith("Kyra", kyra.member.avatarURL(), messageText);
				}
				else {
					expect(player.notificationChannel.messages.cache).toHaveSize(0);
					expect(player.spectateChannel.messages.cache).toHaveSize(0);
				}
			}
		});
	});
});
