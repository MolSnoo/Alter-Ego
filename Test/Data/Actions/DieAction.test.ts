// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import DieAction from "../../../Data/Actions/DieAction.ts";
import FollowAction from "../../../Data/Actions/FollowAction.ts";
import HideAction from "../../../Data/Actions/HideAction.ts";
import LeadAction from "../../../Data/Actions/LeadAction.ts";
import type HidingSpot from "../../../Data/HidingSpot.ts";
import Player from "../../../Data/Player.ts";
import { sendQueuedMessages } from "../../../Modules/messageHandler.ts";
import type { Message } from "discord.js";

describe('DieAction test', () => {
    /**
     * Location: lobby
     */
    let astrid: Player;
    /**
     * Location: lobby
     */
    let asuka: Player;
    /**
     * Location: lobby
     */
    let nero: Player;
    /**
     * Location: lobby (originally in the kitchen)
     */
    let luna: Player;
    let hidingSpot: HidingSpot;
    let narrationMessage: Message<boolean>;
    let hidingSpotNarrationMessage: Message<boolean>;
    let astridNotificationMessage: Message<boolean>;
    let asukaNotificationMessage: Message<boolean>;
    let neroNotificationMessage: Message<boolean>;

    const clearMessages = () => {
        astrid.location.channel.messages.cache.clear();
        hidingSpot.whisper.channel.messages.cache.clear();
        astrid.notificationChannel.messages.cache.clear();
        asuka.notificationChannel.messages.cache.clear();
        luna.notificationChannel.messages.cache.clear();
        nero.notificationChannel.messages.cache.clear();
    };

    const sendMessages = async () => {
        await sendQueuedMessages(testGame);
        narrationMessage = astrid.location.channel.messages.cache.last();
        hidingSpotNarrationMessage = hidingSpot.whisper.channel.messages.cache.last();
        astridNotificationMessage = astrid.notificationChannel.messages.cache.last();
        asukaNotificationMessage = asuka.notificationChannel.messages.cache.last();
        neroNotificationMessage = nero.notificationChannel.messages.cache.last();
    }

    beforeEach(async () => {
        await testGame.entityLoader.loadAll();
        astrid = testGame.entityFinder.getLivingPlayer("Astrid");
        asuka = testGame.entityFinder.getLivingPlayer("Asuka");
        nero = testGame.entityFinder.getLivingPlayer("Nero");
        luna = testGame.entityFinder.getLivingPlayer("Luna");
        luna.location.removePlayer(luna);
        nero.location.addPlayer(luna);
        hidingSpot = testGame.entityFinder.getFixture("RECEPTION DESK", asuka.location.id).hidingSpot;
        const hideAction1 = new HideAction(testGame, undefined, asuka, asuka.location, true);
        await hideAction1.performHide(hidingSpot);
        const hideAction2 = new HideAction(testGame, undefined, nero, nero.location, true);
        await hideAction2.performHide(hidingSpot);
        const hideAction3 = new HideAction(testGame, undefined, luna, luna.location, true);
        await hideAction3.performHide(hidingSpot)
        const followAction1 = new FollowAction(testGame, undefined, astrid, astrid.location, true);
        await followAction1.performFollow(nero);
        const followAction2 = new FollowAction(testGame, undefined, asuka, asuka.location, true);
        await followAction2.performFollow(nero);
        const followAction3 = new FollowAction(testGame, undefined, luna, luna.location, true);
        await followAction3.performFollow(nero);
        const leadAction = new LeadAction(testGame, undefined, nero, nero.location, true);
        await leadAction.performLead([asuka]);
        await sendMessages();
        clearMessages();
    });

    afterEach(async () => {
        await sendMessages();
        clearMessages();
        testGame.entityLoader.clearAll();
    });

    test('DieAction.performDie', async () => {
        const death = new DieAction(testGame, undefined, nero, nero.location, true);
        await death.performDie();
        expect(nero.alive).toBe(false);
        expect(astrid.location.occupants).not.toContain(nero);
        expect(hidingSpot.whisper.players.has("Nero")).toBe(false);
        expect(hidingSpot.hasOccupant(nero)).toBe(false);
        expect(nero.location).toBeNull();
        expect(nero.hidingSpot).toBe("");
        expect(nero.isMoving).toBe(false);
        expect(nero.statusDisplays).toHaveLength(0);
        expect(nero.status).toHaveSize(0);
        expect(testGame.livingPlayers.has("NERO")).toBe(false);
        expect(testGame.deadPlayers.has("NERO")).toBe(true);

        // Verify party has been destroyed properly.
        expect(astrid.party).toBeNull();
        expect(asuka.party).toBeNull();
        expect(luna.party).toBeNull();
        expect(nero.party).toBeNull();
        // Astrid did not witness Nero's death, so she should still believe she's following him.
        expect(astrid.viewParty(false)).toBe(`You are not in a party. However, you are following Nero.`);
        expect(asuka.viewParty(false)).toBe(`You are not in a party.`);
        expect(luna.viewParty(false)).toBe(`You are not in a party.`);
        expect(nero.viewParty(false)).toBe(`You are not in a party.`);
        expect(astrid.viewParty(true)).toBe(`Astrid is not in a party. However, she is following Nero.`);
        expect(asuka.viewParty(true)).toBe(`Asuka is not in a party.`);
        expect(luna.viewParty(true)).toBe(`Luna is not in a party.`);
        expect(nero.viewParty(true)).toBe(`Nero is not in a party.`);

        // Check all of the sent messages.
        await sendMessages();
        expect(hidingSpot.whisper.channel.messages.cache).toHaveSize(1);
        expect(hidingSpotNarrationMessage.content).toBe(`Nero dies.`);
        expect(astrid.location.channel.messages.cache).toHaveSize(0);
        expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
        expect(luna.notificationChannel.messages.cache).toHaveSize(0);
        expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
        expect(asukaNotificationMessage.content).toBe(`Your party has been disbanded because Nero is dead. You are no longer following him.`);
        expect(nero.notificationChannel.messages.cache).toHaveSize(1);
        expect(neroNotificationMessage.content).toBe(`You have died. When your body is discovered, you will be given the ${testGame.guildContext.deadRole.name} role. Until then, your death must remain a secret to the server and to other players.`);
    });
});
