// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

describe('InventoryItem test', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll(true, false);
    });

    afterAll(async () => {
        await game.entityLoader.loadInventoryItems(false);
    });

    describe('decreaseUses test', () => {
        test('procedural selections are preserved when transformed into next stage 1', () => {
            const item = game.entityFinder.getInventoryItem('CAPSULE', 'Nero', undefined, 'RIGHT HAND');
            const expectedSelections = new Map([
                ['species', 'tortide'],
                ['finish', 'metal']
            ]);
            const expectedDescription = `<desc><s>It's a capsule from your favorite game, Capsulebeasts!</s> <s>This is a faded gray <procedural name="species"><poss name="tortide">Tortide</poss></procedural>.</s> <s><procedural name="finish"><poss name="metal">This one has a metallic finish.</poss></procedural></s></desc>`;
            item.decreaseUses();
            const newItem = game.entityFinder.getInventoryItem('DEPLETED CAPSULE', 'Nero', undefined, 'RIGHT HAND');
            expect(newItem.proceduralSelections).toEqual(expectedSelections);
            expect(newItem.description.text).toEqual(expectedDescription);
        });

        test('procedural selections are preserved when transformed into next stage 2', () => {
            const item = game.entityFinder.getInventoryItem('CAPSULE', 'Nero', undefined, 'LEFT HAND');
            const expectedSelections = new Map([
                ['species', 'lavazard'],
                ['finish', 'glass']
            ]);
            const expectedDescription = `<desc><s>It's a capsule from your favorite game, Capsulebeasts!</s> <s>This is a faded gray <procedural name="species"><poss name="lavazard">Lavazard</poss></procedural>.</s> <s><procedural name="finish"><poss name="glass">This one has a glassy finish.</poss></procedural></s></desc>`;
            item.decreaseUses();
            const newItem = game.entityFinder.getInventoryItem('DEPLETED CAPSULE', 'Nero', undefined, 'LEFT HAND');
            expect(newItem.proceduralSelections).toEqual(expectedSelections);
            expect(newItem.description.text).toEqual(expectedDescription);
        });
    });
});