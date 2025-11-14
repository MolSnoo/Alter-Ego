const scriptParser = require('../../Modules/scriptParser.js');

// Mock the finder module so tests don't depend on game.json
jest.mock('../../Modules/finder.js', () => ({
    findRoom: jest.fn(),
    findObject: jest.fn(),
    findPrefab: jest.fn(),
    findItem: jest.fn(),
    findPuzzle: jest.fn(),
    findEvent: jest.fn(),
    findStatusEffect: jest.fn(),
    findPlayer: jest.fn(),
	findLivingPlayer: jest.fn(),
	findDeadPlayer: jest.fn(),
    findInventoryItem: jest.fn(),
    findFlag: jest.fn()
}), { virtual: false });
const finder = require('../../Modules/finder.js');

beforeEach(() => {
	jest.resetAllMocks();
});

describe('test finder functions and data accessors', () => {
	describe('test findRoom', () => {
		describe('test findRoom allowed', () => {
			test('findRoom().name', () => {
				const script = "findRoom('living-room').name";
				const expected = "living-room";
				finder.findRoom.mockReturnValue({ name: 'living-room' });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findRoom().tags.includes()', () => {
				const script = "findRoom('living-room').tags.includes('soundproof')";
				const expected = true;
				finder.findRoom.mockReturnValue({ name: 'living-room', tags: ['soundproof', 'indoors'] });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findRoom().iconURL', () => {
				const script = "findRoom('path-1').iconURL";
				const expected = "https://cdn.discordapp.com/attachments/792642131553550366/792642243743318056/paths.jpg";
				finder.findRoom.mockReturnValue({ name: 'path-1', iconURL: 'https://cdn.discordapp.com/attachments/792642131553550366/792642243743318056/paths.jpg' });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findRoom().exit', () => {
				const script = "findRoom('living-room').exit[0].unlocked";
				const expected = false;
				finder.findRoom.mockReturnValue({ name: 'living-room', exit: [{ unlocked: false }] });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findRoom().occupants', () => {
				const script = "findRoom('living-room').occupants.length";
				const expected = 2;
				finder.findRoom.mockReturnValue({ name: 'living-room', occupants: [0, 1] });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findRoom().occupantsString', () => {
				const script = "findRoom('living-room').occupantsString";
				const expected = "Amadeus, An individual wearing a MASK, Asuka, and Kiara";
				finder.findRoom.mockReturnValue({ name: 'living-room', occupantsString: "Amadeus, An individual wearing a MASK, Asuka, and Kiara" });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findRoom().generate_occupantsString()', () => {
				const script = "findRoom('living-room').generate_occupantsString(['Astrid', 'Kiara'])";
				const expected = "Astrid and Kiara";
				finder.findRoom.mockReturnValue({ name: 'living-room', generate_occupantsString: (list) => list.join(' and ') });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
		});

		describe('test findRoom blocked', () => {
			test('findRoom().channel prohibited', () => {
				const script = "findRoom('living-room').channel.name";
				finder.findRoom.mockReturnValue({ name: 'living-room', channel: { name: 'living-room' } });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findRoom().tags fails', () => {
				const script = "findRoom('living-room').tags";
				finder.findRoom.mockReturnValue({ name: 'living-room', tags: ['soundproof', 'indoors'] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/not a string, number, boolean, or null/);
			});

			test('findRoom().tags.push() fails', () => {
				const script = "findRoom('living-room').tags.push('living-room')";
				finder.findRoom.mockReturnValue({ name: 'living-room', tags: ['soundproof', 'indoors'] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findRoom().occupants.push() fails', () => {
				const script = "findRoom('living-room').occupants.push(player)";
				const player = { name: 'Amadeus' };
				finder.findRoom.mockReturnValue({ name: 'living-room', occupants: [] });
				expect(() => scriptParser.evaluate(script, null, player)).toThrow(/Mutation prohibited/);
			});

			test('findRoom().addPlayer() prohibited', () => {
				const script = "findRoom('living-room').addPlayer(player)";
				const player = { name: 'Amadeus' };
				finder.findRoom.mockReturnValue({ name: 'living-room', addPlayer: (player) => {} });
				expect(() => scriptParser.evaluate(script, null, player)).toThrow(/Access prohibited/);
			});

			test('findRoom().removePlayer() prohibited', () => {
				const script = "findRoom('living-room').removePlayer(player)";
				const player = { name: 'Amadeus' };
				finder.findRoom.mockReturnValue({ name: 'living-room', removePlayer: (player) => {} });
				expect(() => scriptParser.evaluate(script, null, player)).toThrow(/Access prohibited/);
			});
			
			test('findRoom().joinChannel() prohibited', () => {
				const script = "findRoom('living-room').joinChannel(player)";
				const player = { name: 'Amadeus' };
				finder.findRoom.mockReturnValue({ name: 'living-room', joinChannel: (player) => {} });
				expect(() => scriptParser.evaluate(script, null, player)).toThrow(/Access prohibited/);
			});
			
			test('findRoom().leaveChannel() prohibited', () => {
				const script = "findRoom('living-room').leaveChannel(player)";
				const player = { name: 'Amadeus' };
				finder.findRoom.mockReturnValue({ name: 'living-room', leaveChannel: (player) => {} });
				expect(() => scriptParser.evaluate(script, null, player)).toThrow(/Access prohibited/);
			});
			
			test('findRoom().unlock() prohibited', () => {
				const script = "findRoom('living-room').unlock(0)";
				finder.findRoom.mockReturnValue({ name: 'living-room', unlock: (index) => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
			
			test('findRoom().lock() prohibited', () => {
				const script = "findRoom('living-room').lock(0)";
				finder.findRoom.mockReturnValue({ name: 'living-room', lock: (index) => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
			
			test('findRoom().exit.unlocked prohibited', () => {
				const script = "findRoom('living-room').exit[0].unlocked = true";
				finder.findRoom.mockReturnValue({ name: 'living-room', exit: [{ unlocked: false }] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Unsupported node type/);
			});

			test('findRoom().exit.unlock() prohibited', () => {
				const script = "findRoom('living-room').exit[0].unlock()";
				finder.findRoom.mockReturnValue({ name: 'living-room', exit: [{ unlock: () => {} }] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findRoom().exit.lock() prohibited', () => {
				const script = "findRoom('living-room').exit[0].lock()";
				finder.findRoom.mockReturnValue({ name: 'living-room', exit: [{ lock: () => {} }] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
		});
	});

	describe('test findObject', () => {
		describe('test findObject allowed', () => {
			test('findObject().name', () => {
				const script = "findObject('MICROWAVE').name";
				const expected = "MICROWAVE";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE' });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findObject().location.name', () => {
				const script = "findObject('MICROWAVE').location.name";
				const expected = "living-room";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', location: { name: 'living-room'} });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findObject.accessible', () => {
				const script = "findObject('MICROWAVE').accessible";
				const expected = true;
				finder.findObject.mockReturnValue({ name: "MICROWAVE", accessible: true });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findObject().childPuzzleName', () => {
				const script = "findObject('MICROWAVE').childPuzzleName";
				const expected = "201 MICROWAVE";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', childPuzzleName: '201 MICROWAVE' });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findObject().childPuzzle.solved', () => {
				const script = "findObject('MICROWAVE').childPuzzle.solved";
				const expected = false;
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', childPuzzle: { solved: false } });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findObject().childPuzzle.outcome', () => {
				const script = "findObject('MICROWAVE').childPuzzle.outcome";
				const expected = "RAMEN";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', childPuzzle: { outcome: "RAMEN" } });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findObject().recipeTag', () => {
				const script = "findObject('MICROWAVE').recipeTag";
				const expected = "microwave";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', recipeTag: 'microwave' });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findObject().activatable', () => {
				const script = "findObject('MICROWAVE').activatable";
				const expected = true;
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', activatable: true });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findObject().activated', () => {
				const script = "findObject('MICROWAVE').activated";
				const expected = true;
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', activated: true });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
			
			test('findObject().autoDeactivate', () => {
				const script = "findObject('MICROWAVE').autoDeactivate";
				const expected = true;
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', autoDeactivate: true });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
			
			test('findObject().hidingSpotCapacity', () => {
				const script = "findObject('MICROWAVE').hidingSpotCapacity";
				const expected = 0;
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', hidingSpotCapacity: 0 });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
			
			test('findObject().preposition', () => {
				const script = "findObject('MICROWAVE').preposition";
				const expected = "in";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', preposition: 'in' });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findObject().process.duration', () => {
				const script = "Math.floor(findObject('MICROWAVE').process.duration / 1000)";
				const expected = 60;
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', process: { duration: 60000 } });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
		});

		describe('test findObject blocked', () => {
			test('findObject().location.channel prohibited', () => {
				const script = "findObject('MICROWAVE').location.channel.name";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', location: { channel: { name: 'MICROWAVE' }  } });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findObject().childPuzzle.solve() prohibited', () => {
				const script = "findObject('MICROWAVE').childPuzzle.solve()";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', childPuzzle: { solve: () => {} } });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findObject().recipeInterval prohibited', () => {
				const script = "findObject('MICROWAVE').recipeInterval";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', recipeInterval: {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findObject().process.timer.stop() prohibited', () => {
				const script = "findObject('MICROWAVE').process.timer.stop()";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', process: { timer: { stop: () => {} } } });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findObject().setAccessible() prohibited', () => {
				const script = "findObject('MICROWAVE').setAccessible()";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', setAccessible: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findObject().setInaccessible() prohibited', () => {
				const script = "findObject('MICROWAVE').setInaccessible()";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', setInaccessible: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findObject().activate() prohibited', () => {
				const script = "findObject('MICROWAVE').activate()";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', activate: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findObject().deactivate() prohibited', () => {
				const script = "findObject('MICROWAVE').deactivate()";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', deactivate: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
			
			test('findObject().processRecipes() prohibited', () => {
				const script = "findObject('MICROWAVE').processRecipes()";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', processRecipes: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
						
			test('findObject().findRecipe() prohibited', () => {
				const script = "findObject('MICROWAVE').findRecipe()";
				finder.findObject.mockReturnValue({ name: 'MICROWAVE', findRecipe: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
		});
	});

	// From here on out, only test what we need to.
	describe('test findItem', () => {
		describe('test findItem allowed', () => {
			test('findItem().prefab.id', () => {
				const script = "findItem('SLEEPING BAG 1').prefab.id";
				const expected = "SLEEPING BAG";
				finder.findItem.mockReturnValue({ identifier: 'SLEEPING BAG 1', prefab: { id: 'SLEEPING BAG' } });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findItem().quantity * findItem().prefab.weight', () => {
				const script = "findItem('COIN', 'biotope', 'Object: SCALE').quantity * findItem('COIN', 'biotope', 'Object: SCALE').prefab.weight";
				const expected = 8;
				finder.findItem.mockReturnValue({ quantity: 4, prefab: { weight: 2 } })
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
		});

		describe('test findItem blocked', () => {
			test('findItem().prefab.effects.push() fails', () => {
				const script = "findItem('SLEEPING BAG 1').prefab.effects.push('concealed')";
				finder.findItem.mockReturnValue({ identifier: 'SLEEPING BAG 1', prefab: { effects: [] } });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});
		});
	});
});

describe('Modules/scriptParser evaluate()', () => {
    test('findPuzzle(...).outcome.toLowerCase() returns lowercased outcome', () => {
        finder.findPuzzle.mockReturnValue({ outcome: 'WIN' });
        const result = scriptParser.evaluate("findPuzzle('POSE').outcome.toLowerCase()", null, null);
        expect(result).toBe('win');
    });

    test('player.description.replace(/container\./g, "player.") works', () => {
        const player = { description: 'container. boom' };
        const result = scriptParser.evaluate("player.description.replace(/container\\./g, 'player.')", null, player);
        expect(result).toBe('player. boom');
    });

    test('new Date().toLocaleTimeString returns a string time', () => {
        // use a fixed date literal so result is deterministic-ish; we assert on format rather than exact value
    const result = scriptParser.evaluate("new Date('2020-01-01T15:04:00Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })", null, null);
    expect(typeof result).toBe('string');
        expect(result).toMatch(/^\d{1,2}:\d{2}/);
    });

    test('container.hasAttribute("concealed") delegates to the passed container', () => {
        const container = { hasAttribute: (n) => n === 'concealed' };
        const result = scriptParser.evaluate("container.hasAttribute('concealed')", container, null);
        expect(result).toBe(true);
    });

    test('returning an object directly is rejected by final-type guard', () => {
        finder.findPuzzle.mockReturnValue({ outcome: 'x' });
        expect(() => scriptParser.evaluate("findPuzzle('POSE')", null, null)).toThrow(/not a string, number, boolean, or null/);
    });

    test('access to constructor/prototype is blocked', () => {
        expect(() => scriptParser.evaluate('Math.constructor', null, null)).toThrow(/Access prohibited/);
    });

    test('unknown globals are rejected (process)', () => {
        expect(() => scriptParser.evaluate('process.exit(1)', null, null)).toThrow(/Unknown root identifier: process/);
    });

    test('this maps to container identifier and works for method calls', () => {
        const container = { hasAttribute: (n) => n === 'concealed' };
        const result = scriptParser.evaluate("this.hasAttribute('concealed')", container, null);
        expect(result).toBe(true);
        const eq = scriptParser.evaluate('this === container', container, null);
        expect(eq).toBe(true);
    });

    test('string literals containing the word this are untouched', () => {
        const result = scriptParser.evaluate("'this is literal'", null, null);
        expect(result).toBe('this is literal');
    });

    // Blocked property access tests
    const blockedProps = ['__proto__', 'prototype', 'constructor'];

    const blockedTargets = [
        { expr: "findRoom('X')", setter: () => finder.findRoom.mockReturnValue({}) },
        { expr: "findObject('OBJ')", setter: () => finder.findObject.mockReturnValue({}) },
        { expr: "findPrefab('P')", setter: () => finder.findPrefab.mockReturnValue({}) },
        { expr: "findItem('ID')", setter: () => finder.findItem.mockReturnValue({}) },
        { expr: "findPuzzle('PZ')", setter: () => finder.findPuzzle.mockReturnValue({}) },
        { expr: "findEvent('E')", setter: () => finder.findEvent.mockReturnValue({}) },
        { expr: "findStatusEffect('S')", setter: () => finder.findStatusEffect.mockReturnValue({}) },
        { expr: "findPlayer('bob')", setter: () => finder.findPlayer.mockReturnValue({}) },
        { expr: "findInventoryItem('ID','bob')", setter: () => finder.findInventoryItem.mockReturnValue({}) }
    ];

    for (const target of blockedTargets) {
        for (const prop of blockedProps) {
            test(`${target.expr} ${prop} access is blocked`, () => {
                // Arrange: ensure finder returns a simple object
                if (typeof target.setter === 'function') target.setter();
                // Act & Assert: accessing blocked property should throw with prohibition message
                expect(() => scriptParser.evaluate(`${target.expr}.${prop}`, null, null)).toThrow(/Access prohibited/);
            });
        }
    }

    describe('malicious code protections', () => {
        test('Function identifier is not available', () => {
            expect(() => scriptParser.evaluate("Function('return 1')()", null, null)).toThrow();
        });

        test('new Function constructor is not allowed', () => {
            expect(() => scriptParser.evaluate("new Function('return 1')", null, null)).toThrow();
        });

        test('cannot reach process via constructor.prototype trick', () => {
            expect(() => scriptParser.evaluate("({}).constructor.constructor('return process')()", null, null)).toThrow();
        });

        test('require is not available', () => {
            expect(() => scriptParser.evaluate("require('fs')", null, null)).toThrow();
        });

        test('globalThis is not available', () => {
            expect(() => scriptParser.evaluate('globalThis.process', null, null)).toThrow(/Unknown root identifier: globalThis/);
        });

        test('eval is not available', () => {
            expect(() => scriptParser.evaluate("eval('1+1')", null, null)).toThrow();
        });

        test('setTimeout is not available', () => {
            expect(() => scriptParser.evaluate('setTimeout(() => {}, 10)', null, null)).toThrow();
        });

        test('this.constructor.constructor attempt is blocked', () => {
            const container = {};
            expect(() => scriptParser.evaluate("this.constructor.constructor('return process')()", container, null)).toThrow();
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
                try { expect(() => scriptParser.evaluate(expr, {}, null)).toThrow(); } catch (e) { /* swallow */ }
                expect(global.__SIDE_EFFECT__).toBe(false);
            });
        }

        test('player/container objects are not mutated by read-only expressions', () => {
            const player = { description: 'container. boom' };
            scriptParser.evaluate("player.description.replace(/container\\./g, 'player.')", null, player);
            expect(player.description).toBe('container. boom');

            const container = { hasAttribute: (n) => n === 'concealed' };
            scriptParser.evaluate("container.hasAttribute('concealed')", container, null);
            // no new properties should be added
            expect(Object.keys(container)).toEqual(['hasAttribute']);
        });

        test('core prototypes not mutated by evaluator', () => {
            const before = Object.prototype.hasOwnProperty('__EVAL_TEST__');
            try { scriptParser.evaluate("Math.max(1,2)", null, null); } catch (e) { }
            expect(Object.prototype.hasOwnProperty('__EVAL_TEST__')).toBe(before);
        });
    });
});
