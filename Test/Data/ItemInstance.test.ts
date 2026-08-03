// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

describe('ItemInstance test', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll(true, false);
    });

    describe('proceduralSelections test', () => {
        test('RoomItem CAPSULE proceduralSelections', () => {
            const entity = game.entityFinder.getRoomItem('CAPSULE', 'video-room', 'Fixture', 'FLOOR');
            const expected = new Map<string, string>([
                ["color", "blue"],
                ["species", "tortide"],
                ["finish", "metal"]
            ]);
            expect(entity.proceduralSelections).toEqual(expected);
            expect(entity.name).toBe("TORTIDE CAPSULE");
            expect(entity.pluralName).toBe("TORTIDE CAPSULES");
            expect(entity.singleContainingPhrase).toBe("a TORTIDE CAPSULE");
            expect(entity.pluralContainingPhrase).toBe("TORTIDE CAPSULES");
        });

        test('RoomItem DEPLETED CAPSULE proceduralSelections', () => {
            const entity = game.entityFinder.getRoomItem('DEPLETED CAPSULE', 'video-room', 'Fixture', 'FLOOR');
            const expected = new Map<string, string>([
                ["species", "loamander"]
            ]);
            expect(entity.proceduralSelections).toEqual(expected);
            expect(entity.name).toBe("DEPLETED LOAMANDER CAPSULE");
            expect(entity.pluralName).toBe("DEPLETED LOAMANDER CAPSULES");
            expect(entity.singleContainingPhrase).toBe("a DEPLETED LOAMANDER CAPSULE");
            expect(entity.pluralContainingPhrase).toBe("DEPLETED LOAMANDER CAPSULES");
        });

        test('RoomItem WET CLAY POT proceduralSelections', () => {
            const entity = game.entityFinder.getRoomItem('WET CLAY POT', 'video-room', 'Fixture', 'KILN 1');
            const expected = new Map<string, string>([
                ["base color", "white"],
                ["quality", "decent"]
            ]);
            expect(entity.proceduralSelections).toEqual(expected);
            expect(entity.name).toBe("WHITE CLAY POT");
            expect(entity.pluralName).toBe("WHITE CLAY POTS");
            expect(entity.singleContainingPhrase).toBe("an unfired WHITE CLAY POT");
            expect(entity.pluralContainingPhrase).toBe("unfired WHITE CLAY POTS");
        });

        test('RoomItem GLAZED CLAY POT proceduralSelections', () => {
            const entity = game.entityFinder.getRoomItem('GLAZED CLAY POT 1', 'video-room', 'Fixture', 'KILN 2');
            const expected = new Map<string, string>([
                ["base color", "obscured"],
                ["quality", "excellent"],
                ["glaze color", "orange"],
                ["pattern", "waves"],
                ["pattern quality", "detailed"],
                ["pattern color", "teal"]
            ]);
            expect(entity.proceduralSelections).toEqual(expected);
            expect(entity.name).toBe("ORANGE GLAZED CLAY POT");
            expect(entity.pluralName).toBe("ORANGE GLAZED CLAY POTS");
            expect(entity.singleContainingPhrase).toBe("an ORANGE GLAZED CLAY POT");
            expect(entity.pluralContainingPhrase).toBe("ORANGE GLAZED CLAY POTS");
        });

        test('InventoryItem CAPSULE proceduralSelections 1', () => {
            const entity = game.entityFinder.getInventoryItem('CAPSULE', 'Nero', undefined, 'RIGHT HAND');
            const expected = new Map<string, string>([
                ["color", "blue"],
                ["species", "tortide"],
                ["finish", "metal"]
            ]);
            expect(entity.proceduralSelections).toEqual(expected);
            expect(entity.name).toBe("TORTIDE CAPSULE");
            expect(entity.pluralName).toBe("TORTIDE CAPSULES");
            expect(entity.singleContainingPhrase).toBe("a TORTIDE CAPSULE");
            expect(entity.pluralContainingPhrase).toBe("TORTIDE CAPSULES");
        });

        test('InventoryItem CAPSULE proceduralSelections 2', () => {
            const entity = game.entityFinder.getInventoryItem('CAPSULE', 'Nero', undefined, 'LEFT HAND');
            const expected = new Map<string, string>([
                ["color", "black"],
                ["species", "lavazard"],
                ["finish", "glass"]
            ]);
            expect(entity.proceduralSelections).toEqual(expected);
            expect(entity.name).toBe("LAVAZARD CAPSULE");
            expect(entity.pluralName).toBe("LAVAZARD CAPSULES");
            expect(entity.singleContainingPhrase).toBe("a LAVAZARD CAPSULE");
            expect(entity.pluralContainingPhrase).toBe("LAVAZARD CAPSULES");
        });

        test('InventoryItem FIRED CLAY POT proceduralSelections', () => {
            const entity = game.entityFinder.getInventoryItem('FIRED CLAY POT 91', '???', undefined, 'RIGHT HAND');
            const expected = new Map<string, string>([
                ["base color", "red"],
                ["quality", "excellent"]
            ]);
            expect(entity.proceduralSelections).toEqual(expected);
            expect(entity.name).toBe("RED CLAY POT");
            expect(entity.pluralName).toBe("RED CLAY POTS");
            expect(entity.singleContainingPhrase).toBe("a RED CLAY POT");
            expect(entity.pluralContainingPhrase).toBe("RED CLAY POTS");
        });

        test('InventoryItem GLAZE proceduralSelections', () => {
            const entity = game.entityFinder.getInventoryItem('GLAZE', '???', undefined, 'LEFT HAND');
            const expected = new Map<string, string>([
                ["glaze color", "light blue"],
                ["base color", "obscured"],
                ["secondary glaze color", "light blue"],
                ["secondary base color", "obscured"]
            ]);
            expect(entity.proceduralSelections).toEqual(expected);
            expect(entity.name).toBe("LIGHT BLUE GLAZE");
            expect(entity.pluralName).toBe("");
            expect(entity.singleContainingPhrase).toBe("a bottle of LIGHT BLUE GLAZE");
            expect(entity.pluralContainingPhrase).toBe("bottles of LIGHT BLUE GLAZE");
        });
    });
});
