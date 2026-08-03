// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

describe('Player test', () => {
	beforeAll(async () => {
		if (!game.inProgress) await game.entityLoader.loadAll();
	});

	describe('Crafting', () => {
		afterEach(async () => {
			await game.entityLoader.loadInventoryItems(false);
		});

		test('Hand-crafting 1', () => {
			const player = game.entityFinder.getPlayer('Astrid');
			const appleSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'APPLE');
			const orangeSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'ORANGE');
			expect(appleSlot).not.toBeUndefined();
			expect(orangeSlot).not.toBeUndefined();
			expect(appleSlot.equippedItem).not.toBeUndefined();
			expect(orangeSlot.equippedItem).not.toBeUndefined();
			expect(appleSlot.equippedItem.uses).toBe(1);
			expect(orangeSlot.equippedItem.uses).toBe(1);
			expect(appleSlot.equippedItem.quantity).toBe(1);
			expect(orangeSlot.equippedItem.quantity).toBe(1);
			const recipe = game.entityFinder.getRecipes('crafting', '', 'apple, orange', 'apple orange smoothie')[0];
			expect(recipe).not.toBeUndefined();
			player.craft(recipe);
			const smoothieSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'APPLE ORANGE SMOOTHIE');
			expect(smoothieSlot).not.toBeUndefined();
			expect(smoothieSlot.equippedItem).not.toBeUndefined();
			expect(smoothieSlot.equippedItem.uses).toBe(2);
			expect(smoothieSlot.equippedItem.quantity).toBe(1);
		});

		test('Hand-crafting 2', () => {
			const player = game.entityFinder.getPlayer('Asuka');
			let potSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'POT');
			const eggSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'RAW EGG');
			expect(potSlot).not.toBeUndefined();
			expect(eggSlot).not.toBeUndefined();
			expect(potSlot.equippedItem).not.toBeUndefined();
			expect(eggSlot.equippedItem).not.toBeUndefined();
			expect(potSlot.equippedItem.uses).toBe(NaN);
			expect(eggSlot.equippedItem.uses).toBe(1);
			expect(potSlot.equippedItem.quantity).toBe(1);
			expect(eggSlot.equippedItem.quantity).toBe(1);
			const recipe = game.entityFinder.getRecipes('crafting', '', 'pot, raw egg', 'pot')[0];
			expect(recipe).not.toBeUndefined();
			player.craft(recipe);
			potSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'POT');
			expect(potSlot).not.toBeUndefined();
			expect(potSlot.equippedItem).not.toBeUndefined();
			expect(potSlot.equippedItem.uses).toBe(NaN);
			expect(potSlot.equippedItem.quantity).toBe(1);
			const eggItem = game.entityFinder.getInventoryItem("RAW EGG", "Asuka", `${potSlot.equippedItem.getIdentifier()}/POT`);
			expect(eggItem).not.toBeUndefined();
			expect(eggItem.uses).toBe(1);
			expect(eggItem.quantity).toBe(1);
		});

		test('Hand-crafting 3', () => {
			const player = game.entityFinder.getPlayer('Luna');
			let potSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'POT');
			const orangeJuiceSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'ORANGE JUICE');
			expect(potSlot).not.toBeUndefined();
			expect(orangeJuiceSlot).not.toBeUndefined();
			expect(potSlot.equippedItem).not.toBeUndefined();
			expect(orangeJuiceSlot.equippedItem).not.toBeUndefined();
			expect(potSlot.equippedItem.uses).toBe(NaN);
			expect(orangeJuiceSlot.equippedItem.uses).toBe(4);
			expect(potSlot.equippedItem.quantity).toBe(1);
			expect(orangeJuiceSlot.equippedItem.quantity).toBe(1);
			const recipe = game.entityFinder.getRecipes('crafting', '', 'pot, orange juice', 'pot')[0];
			expect(recipe).not.toBeUndefined();
			player.craft(recipe);
			potSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'POT');
			expect(potSlot).not.toBeUndefined();
			expect(potSlot.equippedItem).not.toBeUndefined();
			expect(potSlot.equippedItem.uses).toBe(NaN);
			expect(potSlot.equippedItem.quantity).toBe(1);
			const orangeJuiceItem = game.entityFinder.getInventoryItem("ORANGE JUICE", "Luna", `${potSlot.equippedItem.getIdentifier()}/POT`);
			expect(orangeJuiceItem).not.toBeUndefined();
			expect(orangeJuiceItem.uses).toBe(4);
			expect(orangeJuiceItem.quantity).toBe(1);
		});

		test('Hand-crafting 4', () => {
			const player = game.entityFinder.getPlayer('Kiara');
			let tamponSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'TAMPON');
			const orangeJuiceSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'ORANGE JUICE');
			expect(tamponSlot).not.toBeUndefined();
			expect(orangeJuiceSlot).not.toBeUndefined();
			expect(tamponSlot.equippedItem).not.toBeUndefined();
			expect(orangeJuiceSlot.equippedItem).not.toBeUndefined();
			expect(tamponSlot.equippedItem.uses).toBe(NaN);
			expect(orangeJuiceSlot.equippedItem.uses).toBe(4);
			expect(tamponSlot.equippedItem.quantity).toBe(1);
			expect(orangeJuiceSlot.equippedItem.quantity).toBe(1);
			const recipe = game.entityFinder.getRecipes('crafting', '', 'tampon, orange juice', 'tampon, milk')[0];
			expect(recipe).not.toBeUndefined();
			player.craft(recipe);
			tamponSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'TAMPON');
			expect(tamponSlot).not.toBeUndefined();
			expect(tamponSlot.equippedItem).not.toBeUndefined();
			expect(tamponSlot.equippedItem.uses).toBe(NaN);
			expect(tamponSlot.equippedItem.quantity).toBe(1);
			const milkSlot = game.entityFinder.getPlayerHandHoldingItem(player, 'MILK');
			expect(milkSlot).not.toBeUndefined();
			expect(milkSlot.equippedItem).not.toBeUndefined();
			expect(milkSlot.equippedItem.uses).toBe(4);
			expect(milkSlot.equippedItem.quantity).toBe(1);
		});
	});

    describe('Procedural selection preservation', () => {
        test('Procedural selections are preserved during crafting and uncrafting', () => {
            const player = game.entityFinder.getPlayer('???');
            let rightHand = game.entityFinder.getPlayerHandHoldingItem(player, 'FIRED CLAY POT 91');
            let leftHand = game.entityFinder.getPlayerHandHoldingItem(player, 'GLAZE');
            expect(rightHand).not.toBeUndefined();
            expect(leftHand).not.toBeUndefined();
            expect(rightHand.equippedItem).not.toBeUndefined();
            expect(leftHand.equippedItem).not.toBeUndefined();
            expect(rightHand.equippedItem.uses).toBe(NaN);
            expect(leftHand.equippedItem.uses).toBe(NaN);
            expect(rightHand.equippedItem.quantity).toBe(1);
            expect(leftHand.equippedItem.quantity).toBe(1);
            const recipe = game.entityFinder.getRecipes('crafting', '', 'FIRED CLAY POT, GLAZE', 'GLAZED CLAY POT')[0];
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
});
