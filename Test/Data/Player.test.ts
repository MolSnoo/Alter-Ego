// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Player from "../../Data/Player.ts";
import type Exit from "../../Data/Exit.ts";

describe('Player test', () => {
	beforeAll(async () => {
		if (!testGame.inProgress) await testGame.entityLoader.loadAll();
	});

    describe('Movement speed', () => {
        let player: Player;
        let exit: Exit;
        let originalExitPos: Pos;
        /**
         * First number: speed stat.
         *
         * Second number: carry weight.
         *
         * Third number: expected move rate (walking).
         *
         * Fourth number: expected move rate (running).
         *
         * @remarks
         * All of these values were calculated with a TI-84 Plus CE, using the following equations and variables:
         *
         * Y₁=(0.0183(RX)²+0.005RX+0.916)Y₂
         *
         * Y₂=min(max(15/C,0.25),1)
         *
         * R=1 if player is walking, 2 if player is running
         *
         * C=player carry weight
         */
        const rateData = [
            // Carry weight: 1
            [1,  1, 0.9393,  0.9992],
            [2,  1, 0.9992,  1.2288],
            [3,  1, 1.0957,  1.6048],
            [4,  1, 1.2288,  2.1272],
            [5,  1, 1.3985,  2.7960],
            [6,  1, 1.6048,  3.6112],
            [7,  1, 1.8477,  4.5728],
            [8,  1, 2.1272,  5.6808],
            [9,  1, 2.4433,  6.9352],
            [10, 1, 2.7960,  8.3360],
            [11, 1, 3.1853,  9.8832],
            [12, 1, 3.6112, 11.5768],
            [13, 1, 4.0737, 13.4168],
            [14, 1, 4.5728, 15.4032],
            [15, 1, 5.1085, 17.5360],
            [16, 1, 5.6808, 19.8152],
            [17, 1, 6.2897, 22.2408],
            [18, 1, 6.9352, 24.8128],
            [19, 1, 7.6173, 27.5312],
            [20, 1, 8.3360, 30.3960],
            // Carry weight: 30
            [1,  30, 0.4697,  0.4996],
            [2,  30, 0.4996,  0.6144],
            [3,  30, 0.5479,  0.8024],
            [4,  30, 0.6144,  1.0636],
            [5,  30, 0.6993,  1.3980],
            [6,  30, 0.8024,  1.8056],
            [7,  30, 0.9239,  2.2864],
            [8,  30, 1.0636,  2.8404],
            [9,  30, 1.2217,  3.4676],
            [10, 30, 1.3980,  4.1680],
            [11, 30, 1.5927,  4.9416],
            [12, 30, 1.8056,  5.7884],
            [13, 30, 2.0369,  6.7084],
            [14, 30, 2.2864,  7.7016],
            [15, 30, 2.5543,  8.7680],
            [16, 30, 2.8404,  9.9076],
            [17, 30, 3.1449, 11.1204],
            [18, 30, 3.4676, 12.4064],
            [19, 30, 3.8087, 13.7656],
            [20, 30, 4.1680, 15.1980],
            // Carry weight: 100
            [1,  100, 0.2348, 0.2498],
            [2,  100, 0.2498, 0.3072],
            [3,  100, 0.2739, 0.4012],
            [4,  100, 0.3072, 0.5318],
            [5,  100, 0.3496, 0.6990],
            [6,  100, 0.4012, 0.9028],
            [7,  100, 0.4619, 1.1432],
            [8,  100, 0.5318, 1.4202],
            [9,  100, 0.6108, 1.7338],
            [10, 100, 0.6990, 2.0840],
            [11, 100, 0.7963, 2.4708],
            [12, 100, 0.9028, 2.8942],
            [13, 100, 1.0184, 3.3542],
            [14, 100, 1.1432, 3.8508],
            [15, 100, 1.2771, 4.3840],
            [16, 100, 1.4202, 4.9538],
            [17, 100, 1.5724, 5.5602],
            [18, 100, 1.7338, 6.2032],
            [19, 100, 1.9043, 6.8828],
            [20, 100, 2.0840, 7.5990]
        ];
        /**
         * First number: speed stat.
         *
         * Second number: X distance.
         *
         * Third number: Y distance.
         *
         * Fourth number: expected move time in milliseconds (walking).
         *
         * Fifth number: expected move time in milliseconds (running).
         *
         * @remarks
         * All of these values were calculated with a TI-84 Plus CE, using the following equations and variables:
         *
         * Y₁=(0.0183(RX)²+0.005RX+0.916)Y₂
         *
         * Y₂=min(max(15/C,0.25),1)
         *
         * Y₃=Y₁-SY₁
         *
         * Y₄=D/Y₃*1000 [calculated time in milliseconds when flat distance is not 0]
         *
         * Y₅=(2*sqrt(2(I/2)²))/(Y₆*Y₁)*2*1000 [calculated time in milliseconds when flat distance is 0 but rise is not 0]
         *
         * Y₆=1-(I/abs(I)/3) [2/3rds if rise is positive, 4/3rds if rise is negative]
         *
         * R=1 if player is walking, 2 if player is running
         *
         * C=player carry weight
         *
         * D=[X distance in pixels]/P (flat distance in meters)
         *
         * P=25 (pixels per meter)
         *
         * I=[Y distance in pixels]/P (rise in meters)
         *
         * S=I/D (slope)
         */
        const timeData = [
            // X distance: 1000, Y distance: 0
            [1,  1000, 0, 42584.904, 40032.026],
            [2,  1000, 0, 40032.026, 32552.083],
            [3,  1000, 0, 36506.343, 24925.224],
            [4,  1000, 0, 32552.083, 18804.062],
            [5,  1000, 0, 28602.074, 14306.152],
            [6,  1000, 0, 24925.224, 11076.650],
            [7,  1000, 0, 21648.536,  8747.376],
            [8,  1000, 0, 18804.062,  7041.262],
            [9,  1000, 0, 16371.301,  5767.678],
            [10, 1000, 0, 14306.152,  4798.465],
            [11, 1000, 0, 12557.687,  4047.272],
            [12, 1000, 0, 11076.650,  3455.186],
            [13, 1000, 0,  9819.083,  2981.337],
            [14, 1000, 0,  8747.376,  2596.863],
            [15, 1000, 0,  7830.087,  2281.022],
            [16, 1000, 0,  7041.262,  2018.652],
            [17, 1000, 0,  6359.604,  1798.497],
            [18, 1000, 0,  5767.678,  1612.071],
            [19, 1000, 0,  5251.205,  1452.897],
            [20, 1000, 0,  4798.465,  1315.963],
            // X distance: 2000, Y distance: 0
            [1,  2000, 0, 85169.807, 80064.051],
            [5,  2000, 0, 57204.147, 28612.303],
            [10, 2000, 0, 28612.303,  9596.929],
            [15, 2000, 0, 15660.174,  4562.044],
            [20, 2000, 0,  9596.929,  2631.925],
            // X distance: 5000, Y distance: 0
            [1,  5000, 0, 212924.518, 200160.128],
            [5,  5000, 0, 143010.368,  71530.758],
            [10, 5000, 0,  71530.758,  23992.322],
            [15, 5000, 0,  39150.436,  11405.109],
            [20, 5000, 0,  23992.322,   6579.813],
            // X distance: 1000, Y distance: 100
            [1,  1000, 100, 47316.560, 44480.028],
            [5,  1000, 100, 31780.082, 15895.724],
            [10, 1000, 100, 15895.724,  5331.627],
            [15, 1000, 100,  8700.097,  2534.469],
            [20, 1000, 100,  5331.627,  1462.181],
            // X distance: 1000, Y distance: -100
            [1,  1000, -100, 38713.549, 36392.751],
            [5,  1000, -100, 26001.885, 13005.592],
            [10, 1000, -100, 13005.592,  4362.240],
            [15, 1000, -100,  7118.261,  2073.656],
            [20, 1000, -100,  4362.240,  1196.330],
            // X distance: 1000, Y distance: 500
            [1,  1000, 500, 85169.807, 80064.051],
            [5,  1000, 500, 57204.147, 28612.303],
            [10, 1000, 500, 28612.303,  9596.928],
            [15, 1000, 500, 15660.174,  4562.044],
            [20, 1000, 500,  9596.929,  2631.925],
            // X distance: 1000, Y distance: -500
            [1,  1000, -500, 28389.936, 26688.017],
            [5,  1000, -500, 19068.049,  9537.434],
            [10, 1000, -500,  9537.434,  3198.976],
            [15, 1000, -500,  5220.058,  1520.681],
            [20, 1000, -500,  3198.976,   877.308],
            // X distance: 1000, Y distance: approaching 1000
            [1, 1000,  900,  425849.037,  400320.256],
            [1, 1000,  950,  851698.073,  800640.512],
            [1, 1000,  999, 3600000.000, 3600000.000],
            // X distance: 1000, Y distance: 1000
            // We can expect the final rate to equal 0, which would cause a division by 0 error.
            // As a fallback, these are treated as if the slope is 0.
            [1,  1000, 1000, 42584.904, 40032.026],
            [5,  1000, 1000, 28602.074, 14306.152],
            [10, 1000, 1000, 14306.152,  4798.465],
            [15, 1000, 1000,  7830.087,  2281.022],
            [20, 1000, 1000,  4798.465,  1315.963],
            // X distance: 1000, Y distance: -1000
            [1,  1000, -1000, 21292.452, 20016.013],
            [5,  1000, -1000, 14301.037,  7153.076],
            [10, 1000, -1000,  7153.076,  2399.232],
            [15, 1000, -1000,  3915.04,   1140.511],
            [20, 1000, -1000,  2399.232,   657.981],
            // X distance: 0, Y distance: 100 (stairwell calculation)
            [1,  0, 100, 18067.244, 16984.150],
            [5,  0, 100, 12134.832,  6069.586],
            [10, 0, 100,  6069.586,  2035.816],
            [15, 0, 100,  3322.025,   967.756],
            [20, 0, 100,  2035.816,   558.316],
            // X distance: 0, Y distance: -100 (stairwell calculation)
            [1,  0, -100, 9033.622, 8492.075],
            [5,  0, -100, 6067.416, 3034.793],
            [10, 0, -100, 3034.793, 1017.908],
            [15, 0, -100, 1661.012,  483.878],
            [20, 0, -100, 1017.908,  279.158],
            // X distance: 0, Y distance: 500 (stairwell calculation)
            [1,  0, 500, 90336.222, 84920.750],
            [5,  0, 500, 60674.161, 30347.931],
            [10, 0, 500, 30347.931, 10179.080],
            [15, 0, 500, 16610.123,  4838.778],
            [20, 0, 500, 10179.080,  2791.578],
            // X distance: 0, Y distance: -500 (stairwell calculation)
            [1,  0, -500, 45168.111, 42460.375],
            [5,  0, -500, 30337.080, 15173.965],
            [10, 0, -500, 15173.965,  5089.540],
            [15, 0, -500,  8305.062,  2419.389],
            [20, 0, -500,  5089.540,  1395.789]
        ];

        beforeAll(() => {
            player = testGame.entityFinder.getPlayer("Kyra");
            exit = player.location.exits.at(0);
            originalExitPos = exit.pos;
        });

        beforeEach(() => {
            player.pos.x = 0;
            player.pos.y = 0;
            player.pos.z = 0;
        });

        afterEach(() => {
            player.updateCarryWeight();
        });

        afterAll(() => {
            player.pos.x = originalExitPos.x;
            player.pos.y = originalExitPos.y;
            player.pos.z = originalExitPos.z;
        });

        test.for(rateData)('calculateMoveRate for speed %i and carryWeight %i = %f (walking) and %f (running)',
        ([speed, carryWeight, expectedWalkingRate, expectedRunningRate]) => {
            player.carryWeight = carryWeight;
            const walkingRate = player.calculateMoveRate(false, speed);
            const runningRate = player.calculateMoveRate(true, speed);
            expect(walkingRate).toBeCloseTo(expectedWalkingRate, 3);
            expect(runningRate).toBeCloseTo(expectedRunningRate, 3);
        });

        test.for(timeData)('calculateMoveTime for speed %i, x distance %i, y distance %i = %f (walking) and %f (running)',
        ([speed, xDist, yDist, expectedWalkingTime, expectedRunningTime]) => {
            testGame.settings.pixelsPerMeter = 25;
            player.carryWeight = 1;
            exit.pos.x = xDist;
            exit.pos.y = yDist;
            exit.pos.z = 0;
            const walkingTime = player.calculateMoveTime(exit, false, speed);
            const runningTime = player.calculateMoveTime(exit, true, speed);
            expect(walkingTime).toBeCloseTo(expectedWalkingTime, 2);
            expect(runningTime).toBeCloseTo(expectedRunningTime, 2);
        });
    });

	describe('Crafting', () => {
		afterEach(async () => {
			await testGame.entityLoader.loadInventoryItems(false);
		});

		test('Hand-crafting 1', () => {
			const player = testGame.entityFinder.getPlayer('Astrid');
			const appleSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'APPLE');
			const orangeSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'ORANGE');
			expect(appleSlot).not.toBeUndefined();
			expect(orangeSlot).not.toBeUndefined();
			expect(appleSlot.equippedItem).not.toBeUndefined();
			expect(orangeSlot.equippedItem).not.toBeUndefined();
			expect(appleSlot.equippedItem.uses).toBe(1);
			expect(orangeSlot.equippedItem.uses).toBe(1);
			expect(appleSlot.equippedItem.quantity).toBe(1);
			expect(orangeSlot.equippedItem.quantity).toBe(1);
			const recipe = testGame.entityFinder.getRecipes('crafting', '', 'apple, orange', 'apple orange smoothie')[0];
			expect(recipe).not.toBeUndefined();
			player.craft(recipe);
			const smoothieSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'APPLE ORANGE SMOOTHIE');
			expect(smoothieSlot).not.toBeUndefined();
			expect(smoothieSlot.equippedItem).not.toBeUndefined();
			expect(smoothieSlot.equippedItem.uses).toBe(2);
			expect(smoothieSlot.equippedItem.quantity).toBe(1);
		});

		test('Hand-crafting 2', () => {
			const player = testGame.entityFinder.getPlayer('Asuka');
			let potSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'POT');
			const eggSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'RAW EGG');
			expect(potSlot).not.toBeUndefined();
			expect(eggSlot).not.toBeUndefined();
			expect(potSlot.equippedItem).not.toBeUndefined();
			expect(eggSlot.equippedItem).not.toBeUndefined();
			expect(potSlot.equippedItem.uses).toBe(NaN);
			expect(eggSlot.equippedItem.uses).toBe(1);
			expect(potSlot.equippedItem.quantity).toBe(1);
			expect(eggSlot.equippedItem.quantity).toBe(1);
			const recipe = testGame.entityFinder.getRecipes('crafting', '', 'pot, raw egg', 'pot')[0];
			expect(recipe).not.toBeUndefined();
			player.craft(recipe);
			potSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'POT');
			expect(potSlot).not.toBeUndefined();
			expect(potSlot.equippedItem).not.toBeUndefined();
			expect(potSlot.equippedItem.uses).toBe(NaN);
			expect(potSlot.equippedItem.quantity).toBe(1);
			const eggItem = testGame.entityFinder.getInventoryItem("RAW EGG", "Asuka", `${potSlot.equippedItem.getIdentifier()}/POT`);
			expect(eggItem).not.toBeUndefined();
			expect(eggItem.uses).toBe(1);
			expect(eggItem.quantity).toBe(1);
		});

		test('Hand-crafting 3', () => {
			const player = testGame.entityFinder.getPlayer('Luna');
			let potSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'POT');
			const orangeJuiceSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'ORANGE JUICE');
			expect(potSlot).not.toBeUndefined();
			expect(orangeJuiceSlot).not.toBeUndefined();
			expect(potSlot.equippedItem).not.toBeUndefined();
			expect(orangeJuiceSlot.equippedItem).not.toBeUndefined();
			expect(potSlot.equippedItem.uses).toBe(NaN);
			expect(orangeJuiceSlot.equippedItem.uses).toBe(4);
			expect(potSlot.equippedItem.quantity).toBe(1);
			expect(orangeJuiceSlot.equippedItem.quantity).toBe(1);
			const recipe = testGame.entityFinder.getRecipes('crafting', '', 'pot, orange juice', 'pot')[0];
			expect(recipe).not.toBeUndefined();
			player.craft(recipe);
			potSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'POT');
			expect(potSlot).not.toBeUndefined();
			expect(potSlot.equippedItem).not.toBeUndefined();
			expect(potSlot.equippedItem.uses).toBe(NaN);
			expect(potSlot.equippedItem.quantity).toBe(1);
			const orangeJuiceItem = testGame.entityFinder.getInventoryItem("ORANGE JUICE", "Luna", `${potSlot.equippedItem.getIdentifier()}/POT`);
			expect(orangeJuiceItem).not.toBeUndefined();
			expect(orangeJuiceItem.uses).toBe(4);
			expect(orangeJuiceItem.quantity).toBe(1);
		});

		test('Hand-crafting 4', () => {
			const player = testGame.entityFinder.getPlayer('Kiara');
			let tamponSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'TAMPON');
			const orangeJuiceSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'ORANGE JUICE');
			expect(tamponSlot).not.toBeUndefined();
			expect(orangeJuiceSlot).not.toBeUndefined();
			expect(tamponSlot.equippedItem).not.toBeUndefined();
			expect(orangeJuiceSlot.equippedItem).not.toBeUndefined();
			expect(tamponSlot.equippedItem.uses).toBe(NaN);
			expect(orangeJuiceSlot.equippedItem.uses).toBe(4);
			expect(tamponSlot.equippedItem.quantity).toBe(1);
			expect(orangeJuiceSlot.equippedItem.quantity).toBe(1);
			const recipe = testGame.entityFinder.getRecipes('crafting', '', 'tampon, orange juice', 'tampon, milk')[0];
			expect(recipe).not.toBeUndefined();
			player.craft(recipe);
			tamponSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'TAMPON');
			expect(tamponSlot).not.toBeUndefined();
			expect(tamponSlot.equippedItem).not.toBeUndefined();
			expect(tamponSlot.equippedItem.uses).toBe(NaN);
			expect(tamponSlot.equippedItem.quantity).toBe(1);
			const milkSlot = testGame.entityFinder.getPlayerHandHoldingItem(player, 'MILK');
			expect(milkSlot).not.toBeUndefined();
			expect(milkSlot.equippedItem).not.toBeUndefined();
			expect(milkSlot.equippedItem.uses).toBe(4);
			expect(milkSlot.equippedItem.quantity).toBe(1);
		});
	});

    describe('Procedural selection preservation', () => {
        test('Procedural selections are preserved during crafting and uncrafting', () => {
            const player = testGame.entityFinder.getPlayer('QM');
            let rightHand = testGame.entityFinder.getPlayerHandHoldingItem(player, 'FIRED CLAY POT 91');
            let leftHand = testGame.entityFinder.getPlayerHandHoldingItem(player, 'GLAZE');
            expect(rightHand).not.toBeUndefined();
            expect(leftHand).not.toBeUndefined();
            expect(rightHand.equippedItem).not.toBeUndefined();
            expect(leftHand.equippedItem).not.toBeUndefined();
            expect(rightHand.equippedItem.uses).toBe(NaN);
            expect(leftHand.equippedItem.uses).toBe(NaN);
            expect(rightHand.equippedItem.quantity).toBe(1);
            expect(leftHand.equippedItem.quantity).toBe(1);
            const recipe = testGame.entityFinder.getRecipes('crafting', '', 'FIRED CLAY POT, GLAZE', 'GLAZED CLAY POT')[0];
            expect(recipe).not.toBeUndefined();
            {
                player.craft(recipe);
                const expectedProceduralSelections = new Map<string, string>([
                    ["base color", "obscured"],
                    ["quality", "excellent"],
                    ["glaze color", "light blue"]
                ]);
                const expectedDescription = `<desc><s>This is a pot made of <procedural name="base color"><poss name="obscured"/></procedural>clay.</s> <s>It was made on a pottery wheel.</s> <procedural name="quality"><s><poss name="excellent">The craftsmanship is *excellent*. It has a flat, sturdy bottom that sits level on any surface. The sides have perfect radial symmetry, and a very smooth texture. It makes for a good container, as any pot should.</poss></s></procedural> <s>It's already been fired in a kiln, but it's been coated with glaze.</s> <s>The glaze is <procedural name="glaze color"><poss name="light blue">light blue</poss></procedural> in color.</s> <s>It's still wet, so you might not want to use it as a container just yet.</s> <s>It should be fired in a kiln one more time before it's truly complete.</s> <s>In it, you find <il></il>.</s></desc>`;
                expect(rightHand.equippedItem.prefab.id).toBe('GLAZED CLAY POT');
                expect(rightHand.equippedItem.name).toBe('LIGHT BLUE GLAZED CLAY POT');
                expect(rightHand.equippedItem.pluralName).toBe('LIGHT BLUE GLAZED CLAY POTS');
                expect(rightHand.equippedItem.singleContainingPhrase).toBe('a LIGHT BLUE GLAZED CLAY POT');
                expect(rightHand.equippedItem.pluralContainingPhrase).toBe('LIGHT BLUE GLAZED CLAY POTS');
                expect(leftHand.equippedItem).toBeNull();
                expect(rightHand.equippedItem.uses).toBe(NaN);
                expect(rightHand.equippedItem.quantity).toBe(1);
                expect(rightHand.equippedItem.proceduralSelections).toEqual(expectedProceduralSelections);
                expect(rightHand.equippedItem.description.text).toEqual(expectedDescription);
            }

            {
                player.uncraft(rightHand.equippedItem, recipe);
                // The original base color is expected to have been lost.
                const clayPotRedProceduralSelections = new Map<string, string>([
                    ["base color", "red"],
                    ["quality", "excellent"]
                ]);
                const clayPotWhiteProceduralSelections = new Map<string, string>([
                    ["base color", "white"],
                    ["quality", "excellent"]
                ]);
                const glazeExpectedProceduralSelections = new Map<string, string>([
                    ["glaze color", "light blue"],
                    ["base color", "obscured"],
                    ["secondary glaze color", "light blue"],
                    ["secondary base color", "obscured"]
                ]);
                const clayPotRedDescription = `<desc><s>This is a pot made of <procedural name="base color"><poss name="red">red</poss></procedural> clay.</s> <s>It was made on a pottery wheel.</s> <procedural name="quality"><s><poss name="excellent">The craftsmanship is *excellent*. It has a flat, sturdy bottom that sits level on any surface. The sides have perfect radial symmetry, and a very smooth texture. It makes for a good container, as any pot should.</poss></s></procedural> <s>Since it's unglazed, it's bone dry, and feels quite delicate.</s> <s>If it comes into contact with moisture, it will absorb it, and it may eventually break.</s> <s>In it, you find <il></il>.</s></desc>`;
                const clayPotWhiteDescription = `<desc><s>This is a pot made of <procedural name="base color"><poss name="white">white</poss></procedural> clay.</s> <s>It was made on a pottery wheel.</s> <procedural name="quality"><s><poss name="excellent">The craftsmanship is *excellent*. It has a flat, sturdy bottom that sits level on any surface. The sides have perfect radial symmetry, and a very smooth texture. It makes for a good container, as any pot should.</poss></s></procedural> <s>Since it's unglazed, it's bone dry, and feels quite delicate.</s> <s>If it comes into contact with moisture, it will absorb it, and it may eventually break.</s> <s>In it, you find <il></il>.</s></desc>`;
                const glazeExpectedDescription = `<desc><s>This is a ceramics glaze.</s> <s>The color is <procedural name="glaze color"><poss name="light blue"><procedural name="base color"><poss name="obscured"><procedural name="secondary glaze color"><poss name="light blue"><procedural name="secondary base color"><poss name="obscured">light blue</poss></procedural></poss></procedural></poss></procedural></poss></procedural>.</s> <s>You can apply it to a fired clay sculpture before putting it in the kiln to give it a glossy finish.</s></desc>`;
                expect(rightHand.equippedItem).not.toBeNull();
                expect(leftHand.equippedItem).not.toBeNull();
                expect(rightHand.equippedItem.proceduralSelections).toEqual(glazeExpectedProceduralSelections);
                expect(leftHand.equippedItem.proceduralSelections).toBeOneOf([clayPotRedProceduralSelections, clayPotWhiteProceduralSelections]);
                const clayPotBaseColor = leftHand.equippedItem.proceduralSelections.get("base color");
                expect(rightHand.equippedItem.prefab.id).toBe('GLAZE');
                expect(rightHand.equippedItem.name).toBe('LIGHT BLUE GLAZE');
                expect(rightHand.equippedItem.pluralName).toBe('');
                expect(rightHand.equippedItem.singleContainingPhrase).toBe('a bottle of LIGHT BLUE GLAZE');
                expect(rightHand.equippedItem.pluralContainingPhrase).toBe('bottles of LIGHT BLUE GLAZE');
                expect(leftHand.equippedItem.prefab.id).toBe('FIRED CLAY POT');
                if (clayPotBaseColor === "red") {
                    expect(leftHand.equippedItem.name).toBe('RED CLAY POT');
                    expect(leftHand.equippedItem.pluralName).toBe('RED CLAY POTS');
                    expect(leftHand.equippedItem.singleContainingPhrase).toBe('a RED CLAY POT');
                    expect(leftHand.equippedItem.pluralContainingPhrase).toBe('RED CLAY POTS');
                    expect(leftHand.equippedItem.description.text).toEqual(clayPotRedDescription);
                }
                else if (clayPotBaseColor === "white") {
                    expect(leftHand.equippedItem.name).toBe('WHITE CLAY POT');
                    expect(leftHand.equippedItem.pluralName).toBe('WHITE CLAY POTS');
                    expect(leftHand.equippedItem.singleContainingPhrase).toBe('a WHITE CLAY POT');
                    expect(leftHand.equippedItem.pluralContainingPhrase).toBe('WHITE CLAY POTS');
                    expect(leftHand.equippedItem.description.text).toEqual(clayPotWhiteDescription);
                }
                expect(rightHand.equippedItem.uses).toBe(NaN);
                expect(leftHand.equippedItem.uses).toBe(NaN);
                expect(rightHand.equippedItem.quantity).toBe(1);
                expect(leftHand.equippedItem.quantity).toBe(1);
                expect(rightHand.equippedItem.description.text).toEqual(glazeExpectedDescription);
            }
        });
    });

	describe('generateValidName', () => {
		test('preserves basic Latin names unchanged', () => {
			expect(Player.generateValidName('Astrid')).toBe('Astrid');
			expect(Player.generateValidName('John')).toBe('John');
			expect(Player.generateValidName('DEE')).toBe('DEE');
		});

		test('preserves names with diacritics and combining marks', () => {
			// French
			expect(Player.generateValidName('Renée')).toBe('Renée');
			expect(Player.generateValidName('François')).toBe('François');
			// German
			expect(Player.generateValidName('Jürgen')).toBe('Jürgen');
			// Spanish
			expect(Player.generateValidName('Peña')).toBe('Peña');
			// Nordic
			expect(Player.generateValidName('Søren')).toBe('Søren');
			expect(Player.generateValidName('Åström')).toBe('Åström');
			// Portuguese
			expect(Player.generateValidName('João')).toBe('João');
			// Czech/Slovak
			expect(Player.generateValidName('Tomáš')).toBe('Tomáš');
			expect(Player.generateValidName('Ľubica')).toBe('Ľubica');
			// Polish
			expect(Player.generateValidName('Łukasz')).toBe('Łukasz');
			// Turkish
			expect(Player.generateValidName('Güneş')).toBe('Güneş');
			// Vietnamese (multiple diacritics per letter)
			expect(Player.generateValidName('Nguyễn')).toBe('Nguyễn');
		});

		test('preserves names from non-Latin scripts', () => {
			// Cyrillic
			expect(Player.generateValidName('Дмитрий')).toBe('Дмитрий');
			expect(Player.generateValidName('Анна')).toBe('Анна');
			// CJK
			expect(Player.generateValidName('田中')).toBe('田中');
			expect(Player.generateValidName('王小明')).toBe('王小明');
			expect(Player.generateValidName('한국')).toBe('한국');
			// Arabic (with combining marks / harakat)
			expect(Player.generateValidName('فاطمة')).toBe('فاطمة');
			// Hebrew
			expect(Player.generateValidName('אברהם')).toBe('אברהם');
			// Greek
			expect(Player.generateValidName('Δημήτρης')).toBe('Δημήτρης');
			// Armenian
			expect(Player.generateValidName('Արամ')).toBe('Արամ');
			// Georgian
			expect(Player.generateValidName('თამარ')).toBe('თამარ');
			// Devanagari (Hindi/Sanskrit) — vowel signs are combining marks
			expect(Player.generateValidName('अनिल')).toBe('अनिल');
			// Thai — vowel signs and tone marks are combining marks
			expect(Player.generateValidName('สมชาย')).toBe('สมชาย');
		});

		test('preserves ASCII digits, hyphens, apostrophes, underscores, and spaces', () => {
			expect(Player.generateValidName('Jean-Luc')).toBe('Jean-Luc');
			expect(Player.generateValidName("O'Brien")).toBe("O'Brien");
			expect(Player.generateValidName('Player_One')).toBe('Player_One');
			expect(Player.generateValidName('User 42')).toBe('User_42');
			expect(Player.generateValidName('User 42', true)).toBe('User 42');
			expect(Player.generateValidName('Test123')).toBe('Test123');
		});

		test('strips non-ASCII digits (e.g. Arabic-Indic numerals)', () => {
			// U+0660 ARABIC-INDIC DIGIT ZERO
			expect(Player.generateValidName('DEE٠')).toBe('DEE');
			// U+06F0 EXTENDED ARABIC-INDIC DIGIT ZERO
			expect(Player.generateValidName('Num۰')).toBe('Num');
		});

		test('strips special characters from the problematic name', () => {
			// U+0660 Arabic-Indic digit, U+08EA Arabic tone mark, U+2B51 black small star
			// The Arabic-Indic digit (٠) and the star symbol (⭑) are stripped.
			// The Arabic tone mark (࣪) is a valid combining mark and is preserved.
			expect(Player.generateValidName('DEE٠࣪⭑')).toBe('DEE࣪');
		});

		test('strips miscellaneous symbols and punctuation', () => {
			// Stars, hearts, music notes
			expect(Player.generateValidName('Star⭑⭒★☆')).toBe('Star');
			expect(Player.generateValidName('Love♥❤')).toBe('Love');
			// Arrows and math symbols
			expect(Player.generateValidName('Go→↑↓←')).toBe('Go');
			// Currency symbols
			expect(Player.generateValidName('Rich$€£¥')).toBe('Rich');
			// Hashtags, at signs, exclamation marks
			expect(Player.generateValidName('Cool@#!')).toBe('Cool');
			// Emoji
			expect(Player.generateValidName('Smile😀🎉')).toBe('Smile');
		});

		test('strips combining marks and zero-width characters', () => {
			// Zero-width joiner and non-joiner
			expect(Player.generateValidName('AB‍CD')).toBe('ABCD');
			expect(Player.generateValidName('AB‌CD')).toBe('ABCD');
		});

		test('handles empty or all-special-character input', () => {
			expect(Player.generateValidName('')).toBe('');
			expect(Player.generateValidName('⭑⭒★☆♥❤→↑↓←')).toBe('');
			expect(Player.generateValidName('   ')).toBe('');
		});

		test('trims leading and trailing whitespace', () => {
			expect(Player.generateValidName('  Astrid  ')).toBe('Astrid');
			expect(Player.generateValidName('\t\n Luna \t')).toBe('Luna');
		});
	});
});
