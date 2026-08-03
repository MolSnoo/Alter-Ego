// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { default as evaluate, SCRIPT_SCOPE_OPTIONS} from "../../Modules/scriptParser.js";
import * as finder from "../../Modules/finder.js";
import type Player from "../../Data/Player.ts";
import type Fixture from "../../Data/Fixture.ts";

describe('test scriptParser', () => {
    let qm: Player;
    let container: Fixture;

    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        qm = game.entityFinder.getLivingPlayer("???");
        container = game.entityFinder.getFixture('FLOOR');
    });

    describe('test finder functions and data accessors', () => {
        describe('test findRoom', () => {
            describe('test findRoom allowed', () => {
                test('findRoom().name', () => {
                    const script = "findRoom('general-managers-office').name";
                    const expected = 'general-managers-office';
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoom().tags.has()', () => {
                    const script = "findRoom('general-managers-office').tags.has('soundproof')";
                    const expected = true;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoom().iconURL', () => {
                    const script = "findRoom('path-1').iconURL";
                    const expected = "";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoom().exits', () => {
                    const script = "findRoom('general-managers-office').exits.first().unlocked";
                    const expected = false;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoom().occupants', () => {
                    const script = "findRoom('general-managers-office').occupants.length";
                    const expected = 3;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoom().occupantsString', () => {
                    const script = "findRoom('general-managers-office').occupantsString";
                    const expected = "???, Amadeus, and Vivian";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoom().generate_occupantsString()', () => {
                    const script = "findRoom('general-managers-office').generateOccupantsString([findPlayer('Astrid'), findPlayer('Kiara')])";
                    const expected = "Astrid and Kiara";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });
            });

            describe('test findRoom blocked', () => {
                test('findRoom().channel prohibited', () => {
                    const script = "findRoom('general-managers-office').channel.name";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findRoom().tags fails', () => {
                    const script = "findRoom('general-managers-office').tags";
                    expect(() => evaluate(script, container, null)).toThrow(/not a string, number, boolean, or null/);
                });

                test('findRoom().tags.add() fails', () => {
                    const script = "findRoom('general-managers-office').tags.add('general-managers-office')";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                    expect(game.entityFinder.getRoom('general-managers-office').tags.has('general-managers-office')).toBe(false);
                });

                test('findRoom().occupants.push() fails', () => {
                    const script = "findRoom('general-managers-office').occupants.push(player)";
                    expect(() => evaluate(script, container, qm)).toThrow(/Mutation prohibited/);
                });

                test('findRoom().addPlayer() prohibited', () => {
                    const script = "findRoom('general-managers-office').addPlayer(player)";
                    expect(() => evaluate(script, container, qm)).toThrow(/Access prohibited/);
                });

                test('findRoom().removePlayer() prohibited', () => {
                    const script = "findRoom('general-managers-office').removePlayer(player)";
                    expect(() => evaluate(script, container, qm)).toThrow(/Access prohibited/);
                });

                test('findRoom().joinChannel() prohibited', () => {
                    const script = "findRoom('general-managers-office').joinChannel(player)";
                    expect(() => evaluate(script, container, qm)).toThrow(/Access prohibited/);
                });

                test('findRoom().leaveChannel() prohibited', () => {
                    const script = "findRoom('general-managers-office').leaveChannel(player)";
                    expect(() => evaluate(script, container, qm)).toThrow(/Access prohibited/);
                });

                test('findRoom().getExit().unlock() prohibited', () => {
                    const script = "findRoom('general-managers-office').getExit('DOOR').unlock()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findRoom().getExit().lock() prohibited', () => {
                    const script = "findRoom('general-managers-office').getExit('DOOR').lock()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findRoom().getExit().unlocked prohibited', () => {
                    const script = "findRoom('general-managers-office').getExit('DOOR').unlocked = true";
                    expect(() => evaluate(script, container, null)).toThrow(/Unsupported node type/);
                });

                test('findRoom().getExit().unlock() prohibited', () => {
                    const script = "findRoom('general-managers-office').getExit('DOOR').unlock()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findRoom().getExit().lock() prohibited', () => {
                    const script = "findRoom('general-managers-office').getExit('DOOR').lock()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findRoom().getGame() prohibited', () => {
                    const script = "findRoom('general-managers-office').getGame()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });
            });
        });

        describe('test findFixture', () => {
            describe('test findFixture allowed', () => {
                test('findFixture().name', () => {
                    const script = "findFixture('MICROWAVE').name";
                    const expected = "MICROWAVE";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().location.name', () => {
                    const script = "findFixture('MICROWAVE').location.name";
                    const expected = 'kitchen';
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture.accessible', () => {
                    const script = "findFixture('MICROWAVE').accessible";
                    const expected = true;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().childPuzzleName', () => {
                    const script = "findFixture('COMPUTER', 'general-managers-office').childPuzzleName";
                    const expected = "LOGIN";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().childPuzzle.solved', () => {
                    const script = "findFixture('COMPUTER', 'general-managers-office').childPuzzle.solved";
                    const expected = false;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().childPuzzle.outcome', () => {
                    const script = "findFixture('PANEL 1', 'fitness-room').childPuzzle.outcome";
                    const expected = "0.0";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().recipeTag', () => {
                    const script = "findFixture('MICROWAVE').recipeTag";
                    const expected = "microwave";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().activatable', () => {
                    const script = "findFixture('MICROWAVE').activatable";
                    const expected = true;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().activated', () => {
                    const script = "findFixture('MICROWAVE').activated";
                    const expected = false;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().autoDeactivate', () => {
                    const script = "findFixture('MICROWAVE').autoDeactivate";
                    const expected = true;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().hidingSpotCapacity', () => {
                    const script = "findFixture('MICROWAVE').hidingSpotCapacity";
                    const expected = 0;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().preposition', () => {
                    const script = "findFixture('MICROWAVE').preposition";
                    const expected = "in";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findFixture().process.duration', () => {
                    const script = "Math.floor(findFixture('MICROWAVE').process.duration / 1000)";
                    const expected = 0;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });
            });

            describe('test findFixture blocked', () => {
                test('findFixture().location.channel prohibited', () => {
                    const script = "findFixture('MICROWAVE').location.channel.name";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findFixture().childPuzzle.solve() prohibited', () => {
                    const script = "findFixture('MICROWAVE').childPuzzle.solve()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findFixture().recipeInterval prohibited', () => {
                    const script = "findFixture('MICROWAVE').recipeInterval";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findFixture().process.timer.stop() prohibited', () => {
                    const script = "findFixture('MICROWAVE').process.timer.stop()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findFixture().setAccessible() prohibited', () => {
                    const script = "findFixture('MICROWAVE').setAccessible()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findFixture().setInaccessible() prohibited', () => {
                    const script = "findFixture('MICROWAVE').setInaccessible()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findFixture().activate() prohibited', () => {
                    const script = "findFixture('MICROWAVE').activate()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findFixture().deactivate() prohibited', () => {
                    const script = "findFixture('MICROWAVE').deactivate()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findFixture().processRecipes() prohibited', () => {
                    const script = "findFixture('MICROWAVE').processRecipes()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findFixture().findRecipe() prohibited', () => {
                    const script = "findFixture('MICROWAVE').findRecipe()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });
            });
        });

        // From here on out, only test what we need to.
        describe('test findRoomItem', () => {
            describe('test findRoomItem allowed', () => {
                test('findRoomItem().prefab.id', () => {
                    const script = "findRoomItem('KNIFE BLOCK', 'kitchen').prefab.id";
                    const expected = "KNIFE BLOCK";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoomItem().getContainedItemsWeight()', () => {
                    const script = "findRoomItem('KNIFE BLOCK', 'kitchen').getContainedItemsWeight()";
                    const expected = 3;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoomItem().uses', () => {
                    const script = "findRoomItem('WHOLE HAM').uses";
                    const expected = 20;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoomItem().uses in range', () => {
                    const script = "findRoomItem('WHOLE HAM').uses > 0 && findRoomItem('WHOLE HAM').uses <= 40";
                    const expected = true;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findRoomItem().containsNoItems()', () => {
                    const script = "findRoomItem('FRYING PAN 1').containsNoItems()";
                    const expected = true;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });
            });

            describe('test findRoomItem blocked', () => {
                test('findRoomItem().prefab.effects.push() fails', () => {
                    const script = "findRoomItem('FRYING PAN 1').prefab.effects.push('concealed')";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findRoomItem().inventory.set() fails', () => {
                    const script = "findRoomItem('FRYING PAN 1').inventory.set('SLOT', { item: [] })";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findRoomItem().inventory.items.push() fails', () => {
                    const script = "findRoomItem('FRYING PAN 1').inventory.first().items.push(1)";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findRoomItem().insertItem() prohibited', () => {
                    const script = "findRoomItem('FRYING PAN 1').insertItem({}, 'BAG')";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findRoomItem().removeItem() prohibited', () => {
                    const script = "findRoomItem('FRYING PAN 1').removeItem({}, 'BAG')";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findRoomItem().setAccessible() prohibited', () => {
                    const script = "findRoomItem('FRYING PAN 1').setAccessible()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findRoomItem().setInaccessible() prohibited', () => {
                    const script = "findRoomItem('FRYING PAN 1').setInaccessible()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });
            });
        });

        describe('test findPuzzle', () => {
            describe('test findPuzzle allowed', () => {
                test('findPuzzle().solved', () => {
                    const script = "findPuzzle('CALL BUTTON').solved";
                    const expected = true;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findPuzzle().outcome', () => {
                    const script = "findPuzzle('LEFT STAGE LIGHT SWITCH').outcome";
                    const expected = "OFF";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findPuzzle().outcome math', () => {
                    const script = "player.calculateMoveRate(true) >= parseFloat(findPuzzle('TREADMILL 1 PANEL').outcome)";
                    const expected = true;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findPuzzle().parentFixture.name', () => {
                    const script = "findPuzzle('LOGIN', 'general-managers-office').parentFixture.name";
                    const expected = "COMPUTER";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });
            });

            describe('test findPuzzle blocked', () => {
                test('findPuzzle().requirements.push() fails', () => {
                    const script = "findPuzzle('LOGIN').requirements.push({})";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findPuzzle().solutions.push() fails', () => {
                    const script = "findPuzzle('LOGIN').solutions.push('')";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findPuzzle().commandSets.push() fails', () => {
                    const script = "findPuzzle('LOGIN').commandSets.push({})";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findPuzzle().setAccessible() prohibited', () => {
                    const script = "findPuzzle('LOGIN').setAccessible()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findPuzzle().setInaccessible() prohibited', () => {
                    const script = "findPuzzle('LOGIN').setInaccessible()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findPuzzle().solve() prohibited', () => {
                    const script = "findPuzzle('LOGIN').solve()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findPuzzle().unsolve() prohibited', () => {
                    const script = "findPuzzle('LOGIN').unsolve()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findPuzzle().fail() prohibited', () => {
                    const script = "findPuzzle('LOGIN').fail()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findPuzzle().alreadySolved() prohibited', () => {
                    const script = "findPuzzle('LOGIN').alreadySolved()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findPuzzle().requirementsNotMet() prohibited', () => {
                    const script = "findPuzzle('LOGIN').requirementsNotMet()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });
            });
        });

        describe('test findEvent', () => {
            describe('test findEvent allowed', () => {
                test('findEvent().ongoing', () => {
                    const script = "findEvent('SUNSHINE').ongoing";
                    const expected = true;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });

                test('findEvent().remaining', () => {
                    const script = "Math.floor(findEvent('SUNSHINE').remaining / 1000 / 60 / 60)";
                    const expected = 5;
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });
            });

            describe('test findEvent blocked', () => {
                test('findEvent().triggeredCommands.push() fails', () => {
                    const script = "findEvent('NIGHT').triggeredCommands.push({})";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findEvent().endedCommands.push() fails', () => {
                    const script = "findEvent('NIGHT').endedCommands.push({})";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findEvent().effects.push() fails', () => {
                    const script = "findEvent('NIGHT').effects.push({})";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findEvent().refreshes.push() fails', () => {
                    const script = "findEvent('NIGHT').refreshes.push({})";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findEvent().timer.stop() prohibited', () => {
                    const script = "findEvent('NIGHT').timer.stop()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findEvent().effectsTimer.stop() prohibited', () => {
                    const script = "findEvent('NIGHT').effectsTimer.stop()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findEvent().trigger() prohibited', () => {
                    const script = "findEvent('NIGHT').trigger()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findEvent().end() prohibited', () => {
                    const script = "findEvent('NIGHT').end()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findEvent().startTimer() prohibited', () => {
                    const script = "findEvent('NIGHT').startTimer()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findEvent().startEffectsTimer() prohibited', () => {
                    const script = "findEvent('NIGHT').startEffectsTimer()";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });
            });
        });

        describe('test findInventoryItem', () => {
            describe('test findInventoryItem allowed', () => {
                test('findInventoryItem() !== undefined', () => {
                    const script = "findInventoryItem('KYRAS GLASSES', container.name, '', 'GLASSES') !== undefined";
                    const expected = true;
                    const result = evaluate(script, finder.findPlayer(container, 'Kyra'), null);
                    expect(result).toBe(expected);
                });

                test('findInventoryItem().player', () => {
                    const script = "findInventoryItem('KYRAS GLASSES').player.name";
                    const expected = "Kyra";
                    const result = evaluate(script, container, qm);
                    expect(result).toBe(expected);
                });
            });

            describe('test findInventoryItem blocked', () => {
                test('findInventoryItem().player.setOnline() prohibited', () => {
                    const script = "findInventoryItem('KYRAS GLASSES').player.setOnline()"
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findInventoryItem().prefab.effects.push() fails', () => {
                    const script = "findInventoryItem('KYRAS GLASSES').prefab.effects.push('concealed')";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findInventoryItem().inventory.push() fails', () => {
                    const script = "findInventoryItem('KYRAS LAB COAT').inventory.set('MIDDLE POCKET', { item: [] })";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findInventoryItem().inventory.items.push() fails', () => {
                    const script = "findInventoryItem('KYRAS LAB COAT').inventory.first().items.push(1)";
                    expect(() => evaluate(script, container, null)).toThrow(/Mutation prohibited/);
                });

                test('findInventoryItem().insertItem() prohibited', () => {
                    const script = "findInventoryItem('KYRAS LAB COAT').insertItem({}, 'BAG')";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });

                test('findInventoryItem().removeItem() prohibited', () => {
                    const script = "findInventoryItem('KYRAS LAB COAT').removeItem({}, 'BAG')";
                    expect(() => evaluate(script, container, null)).toThrow(/Access prohibited/);
                });
            });
        });
    });

    describe('Modules/scriptParser evaluate()', () => {
        test('findPuzzle(...).outcome.toLowerCase() returns lowercased outcome', () => {
            const result = evaluate("findPuzzle('LEFT STAGE LIGHT SWITCH').outcome.toLowerCase()", container, null);
            expect(result).toBe('off');
        });

        test('player.description.replace(/container\./g, "player.") works', () => {
            const result = evaluate("this.description.parseFor(player)", qm, qm);
            expect(result).toBe('???');
        });

        test('new Date().toLocaleTimeString returns a string time', () => {
            const result = evaluate("new Date('2020-01-01T15:04:00Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })", container, null);
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^\d{1,2}:\d{2}/);
        });

        test('container.hasBehaviorAttribute("hidden") delegates to the passed container', () => {
            const result = evaluate("container.hasBehaviorAttribute('hidden')", qm, null);
            expect(result).toBe(true);
        });

        test('returning an object directly is rejected by final-type guard', () => {
            expect(() => evaluate("findPuzzle('POSE')", container, null)).toThrow(/not a string, number, boolean, or null/);
        });

        test('access to constructor/prototype is blocked', () => {
            expect(() => evaluate('Math.constructor', container, null)).toThrow(/Access prohibited/);
        });

        test('unknown globals are rejected (process)', () => {
            expect(() => evaluate('process.exit(1)', container, null)).toThrow(/Unknown root identifier: process/);
        });

        test('this maps to container identifier and works for method calls', () => {
            const result = evaluate("this.hasBehaviorAttribute('hidden')", qm, null);
            expect(result).toBe(true);
            const eq = evaluate('this === container', container, null);
            expect(eq).toBe(true);
        });

        test('string literals containing the word this are untouched', () => {
            const result = evaluate("'this is literal'", null, null);
            expect(result).toBe('this is literal');
        });

        // Blocked property access tests
        const blockedProps = SCRIPT_SCOPE_OPTIONS.blockedProperties;

        const blockedTargets = [
            { expr: "findRoom('general-managers-office')", setter: () => {} },
            { expr: "findFixture('DESK')", setter: () => {} },
            { expr: "findPrefab('PEN')", setter: () => {} },
            { expr: "findRoomItem('FRYING PAN 1')", setter: () => {} },
            { expr: "findPuzzle('PANEL 1', 'floor-2-hall-1')", setter: () => {} },
            { expr: "findEvent('NIGHT')", setter: () => {} },
            { expr: "findStatusEffect('weary')", setter: () => {} },
            { expr: "findPlayer('Amadeus')", setter: () => {} },
            { expr: "findInventoryItem('KYRAS GLASSES', 'Kyra')", setter: () => {} }
        ];

        describe('properties are blocked', () => {
            for (const target of blockedTargets) {
                for (const prop of blockedProps) {
                    test(`${target.expr} ${prop} access is blocked`, () => {
                        // Arrange: ensure finder returns a simple object
                        if (typeof target.setter === 'function') target.setter();
                        // Act & Assert: accessing blocked property should throw with prohibition message
                        expect(() => evaluate(`${target.expr}.${prop}`, container, null)).toThrow(/Access prohibited/);
                    });
                }
            }
        });

        describe('malicious code protections', () => {
            test('Function identifier is not available', () => {
                expect(() => evaluate("Function('return 1')()", null, null)).toThrow();
            });

            test('new Function constructor is not allowed', () => {
                expect(() => evaluate("new Function('return 1')", null, null)).toThrow();
            });

            test('cannot reach process via constructor.prototype trick', () => {
                expect(() => evaluate("({}).constructor.constructor('return process')()", null, null)).toThrow();
            });

            test('require is not available', () => {
                expect(() => evaluate("require('fs')", null, null)).toThrow();
            });

            test('import is not available', () => {
                expect(() => evaluate("import('fs')", null, null)).toThrow();
            });

            test('globalThis is not available', () => {
                expect(() => evaluate('globalThis.process', null, null)).toThrow(/Unknown root identifier: globalThis/);
            });

            test('eval is not available', () => {
                expect(() => evaluate("eval('1+1')", null, null)).toThrow();
            });

            test('setTimeout is not available', () => {
                expect(() => evaluate('setTimeout(() => {}, 10)', null, null)).toThrow();
            });

            test('this.constructor.constructor attempt is blocked', () => {
                expect(() => evaluate("this.constructor.constructor('return process')()", container, null)).toThrow();
            });

            test('computed property access for blocked property is blocked', () => {
                expect(() => evaluate("Math['constructor']", null, null)).toThrow(/Access prohibited/);
            });

            test('computed property access for blocked property on finder result is blocked', () => {
                expect(() => evaluate("findRoom('general-managers-office')['constructor']", container, null)).toThrow(/Access prohibited/);
            });

            test('blocked property name probe with in operator is handled safely', () => {
                const result = evaluate("'constructor' in findRoom('general-managers-office')", container, null);
                expect(result).toBe(true);
            });
        });

        describe('no side-effects', () => {
            beforeEach(() => {
                global.__SIDE_EFFECT__ = false;
            });

            const attackExprs = [
                "Function('global.__SIDE_EFFECT__ = true')()",
                "new Function('global.__SIDE_EFFECT__ = true')",
                "({}).constructor.constructor('global.__SIDE_EFFECT__ = true')()",
                "this.constructor.constructor('global.__SIDE_EFFECT__ = true')()",
                "globalThis.__SIDE_EFFECT__ = true",
                "(function(){return this})().__SIDE_EFFECT__ = true"
            ];

            for (const expr of attackExprs) {
                test(`attempting '${expr}' does not produce side-effects`, () => {
                    try { expect(() => evaluate(expr, container, null)).toThrow(); } catch (e) { }
                    expect(global.__SIDE_EFFECT__).toBe(false);
                });
            }

            test('player/container objects are not mutated by read-only expressions', () => {
                const oldKeys = Object.keys(qm);
                evaluate("player.description.text.replace(/container\\./g, 'player.')", qm, qm);
                expect(qm.description.text).toBe('<desc><s>???</s></desc>');

                evaluate("container.hasBehaviorAttribute('hidden')", qm, qm);
                // no new properties should be added
                expect(Object.keys(qm)).toEqual(oldKeys);
            });

            test('core prototypes not mutated by evaluator', () => {
                const before = Object.prototype.hasOwnProperty('__EVAL_TEST__');
                try { evaluate("Math.max(1,2)", null, null); } catch (e) { }
                expect(Object.prototype.hasOwnProperty('__EVAL_TEST__')).toBe(before);
            });
        });
    });
});
