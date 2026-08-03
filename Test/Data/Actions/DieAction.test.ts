// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import DieAction from "../../../Data/Actions/DieAction.ts";
import Player from "../../../Data/Player.ts";
import { createMockMessage } from "../../__mocks__/libs/discord.js";

describe('DieAction test', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll()
    })

    test('DieAction perform', () => {
        const mockMessage = createMockMessage();
        const player = game.entityFinder.getLivingPlayer("???");
        expect(player).toBeInstanceOf(Player);
        const death = new DieAction(game, mockMessage, player, player.location, true);
        death.performDie();
        expect(player.alive).toBeFalsy()
    })
})
