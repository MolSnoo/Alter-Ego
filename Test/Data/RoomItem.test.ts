// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

describe('RoomItem test', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll(true, false);
    });

    describe('decreaseUses test', () => {
        test('procedural selections are preserved when transformed into next stage', () => {
            const item = game.entityFinder.getRoomItem('CAPSULE', 'video-room', 'Fixture', 'FLOOR');
            const expectedSelections = new Map<string, string>([
                ['species', 'tortide'],
                ['finish', 'metal']
            ]);
            const expectedDescription = `<desc><s>It's a capsule from your favorite game, Capsulebeasts!</s> <s>This is a faded gray <procedural name="species"><poss name="tortide">Tortide</poss></procedural>.</s> <s><procedural name="finish"><poss name="metal">This one has a metallic finish.</poss></procedural></s></desc>`;
            item.decreaseUses();
            const newItem = game.entityFinder.getRoomItems('DEPLETED CAPSULE', 'video-room', true, 'Fixture', 'Floor')[1];
            expect(newItem.proceduralSelections).toEqual(expectedSelections);
            expect(newItem.description.text).toEqual(expectedDescription);
        });
    });
});

