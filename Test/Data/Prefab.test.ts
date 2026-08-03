// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

describe('Prefab test', () => {
    beforeAll(async () => {
        if (game.prefabs.size === 0) await game.entityLoader.loadPrefabs(false);
    });

    describe('proceduralOptions test', () => {
        test('CAPSULE proceduralOptions', () => {
            const entity = game.entityFinder.getPrefab("CAPSULE");
            const expected = new Map<string, Set<string>>([
                ["color", new Set<string>(["red", "blue", "green", "black", "white"])],
                ["species", new Set<string>(["lavazard", "loamander", "tortide"])],
                ["finish", new Set<string>(["glass", "metal", "standard"])]
            ]);
            expect(entity.proceduralOptions).toEqual(expected);
        });

        test('DEPLETED CAPSULE proceduralOptions', () => {
            const entity = game.entityFinder.getPrefab("DEPLETED CAPSULE");
            const expected = new Map<string, Set<string>>([
                ["species", new Set<string>(["lavazard", "loamander", "tortide"])],
                ["finish", new Set<string>(["glass", "metal", "standard"])]
            ]);
            expect(entity.proceduralOptions).toEqual(expected);
        });

        test('WET CLAY POT proceduralOptions', () => {
            const entity = game.entityFinder.getPrefab("WET CLAY POT");
            const expected = new Map<string, Set<string>>([
                ["base color", new Set<string>(["red", "white"])],
                ["quality", new Set<string>(["terrible", "poor", "decent", "excellent"])]
            ]);
            expect(entity.proceduralOptions).toEqual(expected);
        });

        test('FIRED CLAY POT proceduralOptions', () => {
            const entity = game.entityFinder.getPrefab("FIRED CLAY POT");
            const expected = new Map<string, Set<string>>([
                ["base color", new Set<string>(["red", "white"])],
                ["quality", new Set<string>(["default", "terrible", "poor", "decent", "excellent"])]
            ]);
            expect(entity.proceduralOptions).toEqual(expected);
        });

        test('GLAZED CLAY POT proceduralOptions', () => {
            const entity = game.entityFinder.getPrefab("GLAZED CLAY POT");
            const expected = new Map<string, Set<string>>([
                ["base color", new Set<string>(["obscured", "red", "white"])],
                ["quality", new Set<string>(["default", "terrible", "poor", "decent", "excellent"])],
                ["glaze color", new Set<string>(["clear", "red", "orange", "brown", "yellow", "green", "teal", "light blue", "indigo", "violet", "pink", "white", "gray", "black"])],
                ["pattern", new Set<string>(["stripes", "spots", "stars", "zigzagging lines", "hearts", "broken hearts", "webs", "drip lines", "flowers", "trees", "clouds", "waves", "bubbles", "fish", "turtles", "sea creatures", "rabbits", "horses", "farm animals", "cats", "dogs", "birds", "spiders", "beetles"])],
                ["pattern quality", new Set<string>(["crude", "simple", "detailed", "ornate"])],
                ["pattern color", new Set<string>(["colorful", "red", "orange", "brown", "yellow", "green", "teal", "light blue", "indigo", "violet", "pink", "white", "gray", "black"])],
            ]);
            expect(entity.proceduralOptions).toEqual(expected);
        });

        test('FIRED GLAZED CLAY POT proceduralOptions', () => {
            const entity = game.entityFinder.getPrefab("FIRED GLAZED CLAY POT");
            const expected = new Map<string, Set<string>>([
                ["base color", new Set<string>(["obscured", "red", "white"])],
                ["quality", new Set<string>(["default", "terrible", "poor", "decent", "excellent"])],
                ["glaze color", new Set<string>(["clear", "red", "orange", "brown", "yellow", "green", "teal", "light blue", "indigo", "violet", "pink", "white", "gray", "black"])],
                ["pattern", new Set<string>(["stripes", "spots", "stars", "zigzagging lines", "hearts", "broken hearts", "webs", "drip lines", "flowers", "trees", "clouds", "waves", "bubbles", "fish", "turtles", "sea creatures", "rabbits", "horses", "farm animals", "cats", "dogs", "birds", "spiders", "beetles"])],
                ["pattern quality", new Set<string>(["crude", "simple", "detailed", "ornate"])],
                ["pattern color", new Set<string>(["colorful", "red", "orange", "brown", "yellow", "green", "teal", "light blue", "indigo", "violet", "pink", "white", "gray", "black"])],
            ]);
            expect(entity.proceduralOptions).toEqual(expected);
        });

        test('GLAZE proceduralOptions', () => {
            const entity = game.entityFinder.getPrefab("GLAZE");
            const expected = new Map<string, Set<string>>([
                ["glaze color", new Set<string>(["clear", "red", "orange", "brown", "yellow", "green", "teal", "light blue", "indigo", "violet", "pink", "white", "gray", "black"])],
                ["secondary glaze color", new Set<string>(["clear", "red", "orange", "brown", "yellow", "green", "teal", "light blue", "indigo", "violet", "pink", "white", "gray", "black"])],
                ["base color", new Set<string>(["obscured"])],
                ["secondary base color", new Set<string>(["obscured"])]
            ]);
            expect(entity.proceduralOptions).toEqual(expected);
        });
    });
});
