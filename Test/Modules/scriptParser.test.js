//const scriptParser = require('../../Modules/scriptParser.js');

// Mock the finder module so tests don't depend on game.json
/*jest.mock('../../Modules/finder.js', () => ({
    findRoom: vi.fn(),
    findObject: vi.fn(),
    findPrefab: vi.fn(),
    findItem: vi.fn(),
    findPuzzle: vi.fn(),
    findEvent: vi.fn(),
    findStatusEffect: vi.fn(),
    findPlayer: vi.fn(),
	findLivingPlayer: vi.fn(),
	findDeadPlayer: vi.fn(),
    findInventoryItem: vi.fn(),
    findFlag: vi.fn()
}), { virtual: false });
const finder = require('../../Modules/finder.js');*/

beforeEach(() => {
	//jest.resetAllMocks();
});

describe('test finder functions and data accessors', () => {
	test('', () => {});
	/*describe('test findRoom', () => {
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

			test('findItem().uses', () => {
				const script = "findItem('CHICKEN NUGGETS').uses * 8";
				const expected = 32;
				finder.findItem.mockReturnValue({ uses: 4 })
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findItem().uses in range', () => {
				const script = "findItem('CHICKEN NUGGETS').uses > 0 && findItem('CHICKEN NUGGETS').uses <= 4";
				const expected = true;
				finder.findItem.mockReturnValue({ uses: 4 })
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findItem().inventory[].item.length', () => {
				const script = "findItem('BAG OF CHICKEN NUGGETS').inventory[0].item.length";
				const expected = 3;
				finder.findItem.mockReturnValue({ inventory: [ { item: [1, 2, 3] }] })
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

			test('findItem().inventory.push() fails', () => {
				const script = "findItem('BAG OF CHICKEN NUGGETS').inventory.push({ item: [] })";
				finder.findItem.mockReturnValue({ inventory: [] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findItem().inventory[].item.push() fails', () => {
				const script = "findItem('BAG OF CHICKEN NUGGETS').inventory[0].item.push(1)";
				finder.findItem.mockReturnValue({ inventory: [ { item: [] } ] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findItem().insertItem() prohibited', () => {
				const script = "findItem('BAG OF CHICKEN NUGGETS').insertItem({}, 'BAG')";
				finder.findItem.mockReturnValue({ insertItem: (item, slot) => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findItem().removeItem() prohibited', () => {
				const script = "findItem('BAG OF CHICKEN NUGGETS').removeItem({}, 'BAG')";
				finder.findItem.mockReturnValue({ removeItem: (item, slot) => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findItem().setAccessible() prohibited', () => {
				const script = "findItem('BAG OF CHICKEN NUGGETS').setAccessible()";
				finder.findItem.mockReturnValue({ setAccessible: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findItem().setInaccessible() prohibited', () => {
				const script = "findItem('BAG OF CHICKEN NUGGETS').setInaccessible()";
				finder.findItem.mockReturnValue({ setInaccessible: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
		});
	});

	describe('test findPuzzle', () => {
		describe('test findPuzzle allowed', () => {
			test('findPuzzle().solved', () => {
				const script = "findPuzzle('201 LOCK').solved";
				const expected = true;
				finder.findPuzzle.mockReturnValue({ solved: true });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
			
			test('findPuzzle().outcome', () => {
				const script = "findPuzzle('201 LOCK').outcome";
				const expected = "10-15-29";
				finder.findPuzzle.mockReturnValue({ outcome: '10-15-29' });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findPuzzle().outcome math', () => {
				const script = "0.0183 * Math.pow(2 * player.speed, 2) + 0.005 * 2 * player.speed + 0.916 >= parseFloat(findPuzzle('TREADMILL').outcome)";
				const expected = true;
				const player = { speed: 9 };
				finder.findPuzzle.mockReturnValue({ outcome: '4.1' });
				const result = scriptParser.evaluate(script, null, player);
				expect(result).toBe(expected);
			});

			test('findPuzzle().parentObject.name', () => {
				const script = "findPuzzle('201 LOCK').parentObject.name";
				const expected = "LOCKER";
				finder.findPuzzle.mockReturnValue({ parentObject: { name: 'LOCKER' } });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
		});

		describe('test findPuzzle blocked', () => {
			test('findPuzzle().requirements.push() fails', () => {
				const script = "findPuzzle('201 LOCK').requirements.push({})";
				finder.findPuzzle.mockReturnValue({ requirements: [] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findPuzzle().solutions.push() fails', () => {
				const script = "findPuzzle('201 LOCK').solutions.push('')";
				finder.findPuzzle.mockReturnValue({ solutions: [] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findPuzzle().commandSets.push() fails', () => {
				const script = "findPuzzle('201 LOCK').commandSets.push({})";
				finder.findPuzzle.mockReturnValue({ commandSets: [] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findPuzzle().setAccessible() prohibited', () => {
				const script = "findPuzzle('201 LOCK').setAccessible()";
				finder.findPuzzle.mockReturnValue({ setAccessible: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findPuzzle().setInaccessible() prohibited', () => {
				const script = "findPuzzle('201 LOCK').setInaccessible()";
				finder.findPuzzle.mockReturnValue({ setInaccessible: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findPuzzle().solve() prohibited', () => {
				const script = "findPuzzle('201 LOCK').solve()";
				finder.findPuzzle.mockReturnValue({ solve: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findPuzzle().unsolve() prohibited', () => {
				const script = "findPuzzle('201 LOCK').unsolve()";
				finder.findPuzzle.mockReturnValue({ unsolve: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findPuzzle().fail() prohibited', () => {
				const script = "findPuzzle('201 LOCK').fail()";
				finder.findPuzzle.mockReturnValue({ fail: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findPuzzle().alreadySolved() prohibited', () => {
				const script = "findPuzzle('201 LOCK').alreadySolved()";
				finder.findPuzzle.mockReturnValue({ alreadySolved: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findPuzzle().requirementsNotMet() prohibited', () => {
				const script = "findPuzzle('201 LOCK').requirementsNotMet()";
				finder.findPuzzle.mockReturnValue({ requirementsNotMet: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
		});
	});

	describe('test findEvent', () => {
		describe('test findEvent allowed', () => {
			test('findEvent().solved', () => {
				const script = "findEvent('NIGHT').ongoing";
				const expected = true;
				finder.findEvent.mockReturnValue({ ongoing: true });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});

			test('findEvent().remaining', () => {
				const script = "Math.floor(findEvent('NIGHT').remaining / 1000 / 60)";
				const expected = 45;
				finder.findEvent.mockReturnValue({ remaining: 2700001 });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
		});

		describe('test findEvent blocked', () => {
			test('findEvent().triggeredCommands.push() fails', () => {
				const script = "findEvent('NIGHT').triggeredCommands.push({})";
				finder.findEvent.mockReturnValue({ triggeredCommands: [] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findEvent().endedCommands.push() fails', () => {
				const script = "findEvent('NIGHT').endedCommands.push({})";
				finder.findEvent.mockReturnValue({ endedCommands: [] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findEvent().effects.push() fails', () => {
				const script = "findEvent('NIGHT').effects.push({})";
				finder.findEvent.mockReturnValue({ effects: [] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findEvent().refreshes.push() fails', () => {
				const script = "findEvent('NIGHT').refreshes.push({})";
				finder.findEvent.mockReturnValue({ refreshes: [] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findEvent().timer.stop() prohibited', () => {
				const script = "findEvent('NIGHT').timer.stop()";
				finder.findEvent.mockReturnValue({ timer: { stop: () => {} } });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findEvent().effectsTimer.stop() prohibited', () => {
				const script = "findEvent('NIGHT').effectsTimer.stop()";
				finder.findEvent.mockReturnValue({ effectsTimer: { stop: () => {} } });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
			
			test('findEvent().trigger() prohibited', () => {
				const script = "findEvent('NIGHT').trigger()";
				finder.findEvent.mockReturnValue({ trigger: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
			
			test('findEvent().end() prohibited', () => {
				const script = "findEvent('NIGHT').end()";
				finder.findEvent.mockReturnValue({ end: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
			
			test('findEvent().startTimer() prohibited', () => {
				const script = "findEvent('NIGHT').startTimer()";
				finder.findEvent.mockReturnValue({ startTimer: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
			
			test('findEvent().startEffectsTimer() prohibited', () => {
				const script = "findEvent('NIGHT').startEffectsTimer()";
				finder.findEvent.mockReturnValue({ startEffectsTimer: () => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});
		});
	});

	describe('test findInventoryItem', () => {
		describe('test findInventoryItem allowed', () => {
			test('findInventoryItem() !== undefined', () => {
				const script = "findInventoryItem('HAIR TIE', container.name, '', 'HAT') !== undefined";
				const expected = true;
				finder.findInventoryItem.mockReturnValue({ identifier: 'HAIR TIE', player: { name: 'Kyra' }, equipmentSlot: 'HAT' });
				const container = { name: 'Kyra' };
				const result = scriptParser.evaluate(script, container, null);
				expect(result).toBe(expected);
			});

			test('findInventoryItem().player', () => {
				const script = "findInventoryItem('HAIR TIE').player.name";
				const expected = "Kyra";
				finder.findInventoryItem.mockReturnValue({ identifier: 'HAIR TIE', player: { name: 'Kyra' } });
				const result = scriptParser.evaluate(script, null, null);
				expect(result).toBe(expected);
			});
		});

		describe('test findInventoryItem blocked', () => {
			test('findInventoryItem().player.setOnline() prohibited', () => {
				const script = "findInventoryItem('HAIR TIE').player.setOnline()"
				finder.findInventoryItem.mockReturnValue({ player: { setOnline: () => {} } });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findInventoryItem().prefab.effects.push() fails', () => {
				const script = "findInventoryItem('SLEEPING BAG 1').prefab.effects.push('concealed')";
				finder.findInventoryItem.mockReturnValue({ identifier: 'SLEEPING BAG 1', prefab: { effects: [] } });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findInventoryItem().inventory.push() fails', () => {
				const script = "findInventoryItem('BAG OF CHICKEN NUGGETS').inventory.push({ item: [] })";
				finder.findInventoryItem.mockReturnValue({ inventory: [] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findInventoryItem().inventory[].item.push() fails', () => {
				const script = "findInventoryItem('BAG OF CHICKEN NUGGETS').inventory[0].item.push(1)";
				finder.findInventoryItem.mockReturnValue({ inventory: [ { item: [] } ] });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Mutation prohibited/);
			});

			test('findInventoryItem().insertItem() prohibited', () => {
				const script = "findInventoryItem('BAG OF CHICKEN NUGGETS').insertItem({}, 'BAG')";
				finder.findInventoryItem.mockReturnValue({ insertItem: (item, slot) => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
			});

			test('findInventoryItem().removeItem() prohibited', () => {
				const script = "findInventoryItem('BAG OF CHICKEN NUGGETS').removeItem({}, 'BAG')";
				finder.findInventoryItem.mockReturnValue({ removeItem: (item, slot) => {} });
				expect(() => scriptParser.evaluate(script, null, null)).toThrow(/Access prohibited/);
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
        { expr: "findRoom('living-room')", setter: () => finder.findRoom.mockReturnValue({}) },
        { expr: "findObject('DESK')", setter: () => finder.findObject.mockReturnValue({}) },
        { expr: "findPrefab('PEN')", setter: () => finder.findPrefab.mockReturnValue({}) },
        { expr: "findItem('SLEEPING BAG 1')", setter: () => finder.findItem.mockReturnValue({}) },
        { expr: "findPuzzle('201 LOCK')", setter: () => finder.findPuzzle.mockReturnValue({}) },
        { expr: "findEvent('NIGHT')", setter: () => finder.findEvent.mockReturnValue({}) },
        { expr: "findStatusEffect('weary')", setter: () => finder.findStatusEffect.mockReturnValue({}) },
        { expr: "findPlayer('Amadeus')", setter: () => finder.findPlayer.mockReturnValue({}) },
        { expr: "findInventoryItem('SLEEPING BAG', 'Kyra')", setter: () => finder.findInventoryItem.mockReturnValue({}) }
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
                try { expect(() => scriptParser.evaluate(expr, {}, null)).toThrow(); } catch (e) { }
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
	*/
});
