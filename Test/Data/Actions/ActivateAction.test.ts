// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {createMockMessage} from "../../__mocks__/libs/discord.js";
import ActivateAction from "../../../Data/Actions/ActivateAction.ts";
import Fixture from "../../../Data/Fixture.ts";
import type Player from "../../../Data/Player.ts";
import type Room from "../../../Data/Room.ts";
import type { Mock } from "vitest";

describe('ActivateAction test', () => {
    let player: Player;
    let location: Room;
    let message: UserMessage;
    let fixture: Fixture;

    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        player = game.entityFinder.getLivingPlayer('Kyra');
        location = game.entityFinder.getRoom('lobby');
        message = createMockMessage({
            content: 'Hello.',
            member: player.member,
            author: player.member.user,
            channel: player.location.channel
        });
    });

    describe('performActivate tests', () => {
        let fixtureActivateSpy: Mock<(player: Player) => void>;

        beforeEach(() => {
            fixture = game.entityFinder.getFixture('OVEN 1');
            fixtureActivateSpy = vi.spyOn(Fixture.prototype, 'activate');
        });

        test('performed should be true', () => {
            let action = new ActivateAction(game, message, player, location, false);
            action.performActivate(fixture, true);
            // @ts-ignore
            expect(action.performed).toBe(true);
        });

        test('fixture activate should be called', () => {
            let action = new ActivateAction(game, message, player, location, false);
            action.performActivate(fixture, true);
            expect(fixtureActivateSpy).toHaveBeenCalled();
        });
    });
});
