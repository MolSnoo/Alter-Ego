var game = include('game.json');
const constants = include('Configs/constants.json');
const parser = include(`${constants.modulesDir}/parser.js`);

const Event = include(`${constants.dataDir}/Event.js`);
const Player = include(`${constants.dataDir}/Player.js`);
const Prefab = include(`${constants.dataDir}/Prefab.js`);
const InventoryItem = include(`${constants.dataDir}/InventoryItem.js`);

jest.mock(`../../Data/Event.js`);
jest.mock(`../../Data/Player.js`);
jest.mock(`../../Data/InventoryItem.js`);

beforeAll(() => {
	Event.mockImplementation(function(name, ongoing) {
		this.name = name;
		this.ongoing = ongoing;

		game.events.push(this);
	});
	Player.mockImplementation(function(talent, intelligence) {
		this.name = talent;
		this.talent = talent;
		this.intelligence = intelligence;

		game.players.push(this);
		game.players_alive.push(this);
	});
	InventoryItem.mockImplementation(function(player, name, uses, weight) {
		this.player = player;
		this.name = name;
		this.uses = uses;
		this.weight = weight;

		game.inventoryItems.push(this);
	});
});

afterEach(() => {
	game.players = [];
	game.players_alive = [];
	game.players_dead = [];
	game.rooms = [];
	game.objects = [];
	game.prefabs = [];
	game.recipes = [];
	game.items = [];
	game.puzzles = [];
	game.events = [];
	game.whispers = [];
	game.statusEffects = [];
	game.inventoryItems = [];
	game.gestures = [];
});

describe('test item lists', () => {
	const player = new Player("", 5);

	test('empty item list 0', () => {
		const text = `<s>The floor beneath you is soft and earthy.</s> <s>You find <il></il> haphazardly placed on it.</s>`;
		const expected = `The floor beneath you is soft and earthy.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});

	test('empty item list 1', () => {
		const text = `<s>You look at the sink.</s> <s>It looks to be very clean.</s> <s>On the wall above it is a mirror.</s> <s>Under the sink, you find <il></il>.</s>`;
		const expected = `You look at the sink. It looks to be very clean. On the wall above it is a mirror.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});
	
	test('single item list single item 0', () => {
		const text = `<s>You open the locker.</s> <s>Inside, you find <il><item>a pair of SWIM TRUNKS</item></il>.</s>`;
		const expected = `You open the locker. Inside, you find a pair of SWIM TRUNKS.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});

	test('single item list multiple items 0', () => {
		const text = `<desc><desc><s>You open the locker.</s> <s>Inside, you find <il><item>a FIRST AID KIT</item>, <item>a bottle of PAINKILLERS</item>, <item>a PILL BOTTLE</item>, and <item>an OLD KEY</item></il>.</s></desc></desc>`;
		const expected = `You open the locker. Inside, you find a FIRST AID KIT, a bottle of PAINKILLERS, a PILL BOTTLE, and an OLD KEY.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});

	test('multiple empty item lists 0', () => {
		const text = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`;
		const expected = `It's a pair of long, purple pants with a checker pattern. There are four pockets altogether.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});
	
	test('multiple item lists single items 0', () => {
		const text = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"><item>a GUN</item></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"><item>3 pairs of DICE</item></il>.</s></desc>`;
		const expected = `It's a pair of long, purple pants with a checker pattern. There are four pockets altogether. In the left pocket, you find a GUN. In the right back pocket, you find 3 pairs of DICE.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});
});

describe('test player intelligence', () => {
	describe('joshua body', () => {
		const text = `<s>You inspect Joshua's body.</s> <if cond="player.intelligence >= 5"><s>He looks pretty emaciated, like he hasn't eaten or drank in days.</s> <s>You don't find any injuries except for a gash in his **NECK**.</s></if> <if cond="player.intelligence < 5"><s>Nothing seems out of the ordinary except for a gash in his **NECK**.</s></if>`;

		test('joshua body intelligence 5', () => {
			const player = new Player("", 5);
			const expected = `You inspect Joshua's body. He looks pretty emaciated, like he hasn't eaten or drank in days. You don't find any injuries except for a gash in his **NECK**.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
		
		test('joshua body intelligence 4', () => {
			const player = new Player("", 4);
			const expected = `You inspect Joshua's body. Nothing seems out of the ordinary except for a gash in his **NECK**.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});

	describe('veronica with items', () => {
		const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.intelligence >= 5"><s>In her pockets, you find <il><item>a CIGARETTE</item>, <item>a KNIFE</item>, and <item>a pair of NEEDLES</item></il>.</s></if>`;

		test('veronica with items intelligence 5', () => {
			const player = new Player("", 5);
			const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE, a KNIFE, and a pair of NEEDLES.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});

		test('veronica with items intelligence 4', () => {
			const player = new Player("", 4);
			const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});

	describe('veronica with conditional items', () => {
		const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <s>In her pockets, you find <il><item>a CIGARETTE</item><if cond="player.intelligence >= 5">, <item>a KNIFE</item>,</if> and <item>a pair of NEEDLES</item></il>.</s>`;

		test('veronica intelligence 5 with conditional item', () => {
			const player = new Player("", 5);
			const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE, a KNIFE, and a pair of NEEDLES.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
		
		test('veronica intelligence 4 with conditional item', () => {
			const player = new Player("", 4);
			const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE and a pair of NEEDLES.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});

	test('veronica intelligence 5 with empty item list', () => {
		const player = new Player("", 5);
		const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.intelligence >= 5"><s>In her pockets, you find <il></il>.</s></if>`;
		const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});
});

describe('test player talent', () => {
	describe('nemu tree', () => {
		const text = `<s>You take a look at the nemu tree.</s> <s>It's unlike anything you've ever seen before.</s> <s>It has purple wood and blue leaves.</s> <s><if cond="player.talent === 'Ultimate Herbalist'">Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.</if></s>`;

		test('nemu tree ultimate herbalist', () => {
			const player = new Player("Ultimate Herbalist", 5);
			const expected = `You take a look at the nemu tree. It's unlike anything you've ever seen before. It has purple wood and blue leaves. Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
		
		test('nemu tree ultimate dancer', () => {
			const player = new Player("Ultimate Dancer", 5);
			const expected = `You take a look at the nemu tree. It's unlike anything you've ever seen before. It has purple wood and blue leaves.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});
	
	describe('pool table', () => {
		const text = `<desc><s>You examine the pool table.</s> <s>It seems to have everything you need to play a game of pool: <il><item>2 POOL STICKS</item>, <if cond="player.talent === 'Ultimate Tabletop Player'"><item>CHALK</item>,</if> <item>a TRIANGLE</item>, and <item>BALLS</item></il>.</s></desc>`;

		test('pool table no talent', () => {
			const player = new Player("", 5);
			const expected = `You examine the pool table. It seems to have everything you need to play a game of pool: 2 POOL STICKS, a TRIANGLE, and BALLS.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
		
		test('pool table ultimate tabletop player', () => {
			const player = new Player("Ultimate Tabletop Player", 5);
			const expected = `You examine the pool table. It seems to have everything you need to play a game of pool: 2 POOL STICKS, CHALK, a TRIANGLE, and BALLS.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});

	describe('tool shelves', () => {
		const text = `<desc><s>You examine the shelves.</s> <s>There are a number of tools on them.</s> <s>In particular, you find <il><item>a SAW</item>, <if cond="player.talent === 'Ultimate Lumberjack'"><item>an AX</item></if>, and <item>a pair of HEDGE TRIMMERS</item></il>.</s></desc>`;

		test('tool shelves ultimate lumberjack', () => {
			const player = new Player("Ultimate Lumberjack", 5);
			const expected = `You examine the shelves. There are a number of tools on them. In particular, you find a SAW, an AX, and a pair of HEDGE TRIMMERS.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
		
		test('tool shelves ultimate botanist', () => {
			const player = new Player("Ultimate Botanist", 5);
			const expected = `You examine the shelves. There are a number of tools on them. In particular, you find a SAW and a pair of HEDGE TRIMMERS.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});

	describe('photo album', () => {
		const text = `<desc><s>You flip through the photo album.</s> <if cond="player.talent === 'Iris'"><s>It's full of pictures of your parents and all of the places they've gone.</s> <s>There are no pictures of you.</s></if><if cond="player.talent === 'Scarlet'"><s>It's full of pictures of Iris's parents in various places, but there are no pictures of Iris in here.</s></if><if cond="player.talent !== 'Iris' && player.talent !== 'Scarlet'"><s>It's full of pictures of a married couple in various places around the world.</s> <s>You've never seen these people before.</s></if></desc>`;

		test('photo album cella', () => {
			const player = new Player("Cella", 5);
			const expected = `You flip through the photo album. It's full of pictures of a married couple in various places around the world. You've never seen these people before.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
		
		test('photo album iris', () => {
			const player = new Player("Iris", 5);
			const expected = `You flip through the photo album. It's full of pictures of your parents and all of the places they've gone. There are no pictures of you.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
		
		test('photo album scarlet', () => {
			const player = new Player("Scarlet", 5);
			const expected = `You flip through the photo album. It's full of pictures of Iris's parents in various places, but there are no pictures of Iris in here.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});

	describe('locker conditional talent', () => {
		test('locker conditional talent ultimate botanist', () => {
			const player = new Player("Ultimate Botanist", 5);
			const text = `<desc><s>You open the locker.</s> <s>Inside, you find <il><if cond="player.talent === 'Ultimate Swimmer'"><item>a SWIMSUIT</item></if></il>.</s></desc>`;
			const expected = `You open the locker.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});

		test('locker conditional talent ultimate swimmer', () => {
			const player = new Player("Ultimate Swimmer", 5);
			const text = `<desc><s>You open the locker.</s> <s>Inside, you find <il><if cond="player.talent === 'Ultimate Swimmer'"><item>a SWIMSUIT</item></if></il>.</s></desc>`;
			const expected = `You open the locker. Inside, you find a SWIMSUIT.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});
});

describe('test inventory items', () => {
	const player = new Player("", 5);

	describe('mountain dew', () => {
		const text = `<desc><s>It's a bottle of Code Red Mountain Dew, which has a cherry flavor.</s> <if cond="player.name === 'Veronica'"><s>This is your favorite flavor, naturally.</s></if><if cond="player.name !== 'Veronica'"><s>For some reason, when you hold it, you get the urge to play video games.</s></if> <s>The drink and label are both red.</s> <if cond="this.uses > 0"><s>It's nice and cold.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

		test('mountain dew uses 1', () => {
			const item = new InventoryItem(player, "CODE RED MOUNTAIN DEW", 1, 1);
			const expected = `It's a bottle of Code Red Mountain Dew, which has a cherry flavor. For some reason, when you hold it, you get the urge to play video games. The drink and label are both red. It's nice and cold.`;
			const result = parser.parseDescription(text, item, player);
			expect(result).toBe(expected);
		});
		
		test('mountain dew uses 0', () => {
			const item = new InventoryItem(player, "CODE RED MOUNTAIN DEW", 0, 1);
			const expected = `It's a bottle of Code Red Mountain Dew, which has a cherry flavor. For some reason, when you hold it, you get the urge to play video games. The drink and label are both red. It's empty.`;
			const result = parser.parseDescription(text, item, player);
			expect(result).toBe(expected);
		});
	});

	describe('breadsticks', () => {
		const text = `<desc><s>It's a box of frozen garlic <var v="this.name">.</s> <if cond="this.uses > 1"><s>There are <var v="this.uses" /> <var v="this.name"> inside.</s></if><if cond="this.uses === 1"><s>There is only <var v="this.uses"> breadstick inside.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

		test('breadsticks uses 6', () => {
			const item = new InventoryItem(player, "BREADSTICKS", 6, 1);
			const expected = `It's a box of frozen garlic BREADSTICKS. There are 6 BREADSTICKS inside.`;
			const result = parser.parseDescription(text, item, player);
			expect(result).toBe(expected);
		});
		
		test('breadsticks uses 1', () => {
			const item = new InventoryItem(player, "BREADSTICKS", 1, 1);
			const expected = `It's a box of frozen garlic BREADSTICKS. There is only 1 breadstick inside.`;
			const result = parser.parseDescription(text, item, player);
			expect(result).toBe(expected);
		});
		
		test('breadsticks uses 0', () => {
			const item = new InventoryItem(player, "BREADSTICKS", 0, 1);
			const expected = `It's a box of frozen garlic BREADSTICKS. It's empty.`;
			const result = parser.parseDescription(text, item, player);
			expect(result).toBe(expected);
		});
	});

	describe('chicken nuggets', () => {
		const text = `<desc><s>It's a bag of frozen chicken nuggets.</s> <s>Sadly, they don't come in fun shapes.</s> <if cond="this.uses > 0"><s>It looks like there are enough in here for <var v="this.uses" /> serving<if cond="this.uses > 1">s</if>, though.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

		test('chicken nuggets uses 5', () => {
			const item = new InventoryItem(player, "CHICKEN NUGGETS", 5, 1);
			const expected = `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It looks like there are enough in here for 5 servings, though.`;
			const result = parser.parseDescription(text, item, player);
			expect(result).toBe(expected);
		});
		
		test('chicken nuggets uses 1', () => {
			const item = new InventoryItem(player, "CHICKEN NUGGETS", 1, 1);
			const expected = `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It looks like there are enough in here for 1 serving, though.`;
			const result = parser.parseDescription(text, item, player);
			expect(result).toBe(expected);
		});
		
		test('chicken nuggets uses 0', () => {
			const item = new InventoryItem(player, "CHICKEN NUGGETS", 0, 1);
			const expected = `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It's empty.`;
			const result = parser.parseDescription(text, item, player);
			expect(result).toBe(expected);
		});
	});
});

describe('test events', () => {
	const player = new Player("", 5);

	describe('single event birthday', () => {
		const text = `<desc><s>It's a wooden picnic table with <if cond="findEvent('BIRTHDAY').ongoing === true">a flame-themed</if><if cond="findEvent('BIRTHDAY').ongoing === false">a red and white checkered</if> tablecloth.</s> <s>It has two benches built in on either side of it.</s> <s>On it, you find <il></il>.</s> <if cond="findEvent('BIRTHDAY').ongoing === true"><s>In the center of the table is a BIRTHDAY CAKE.</s></if></desc>`;

		test('birthday ongoing', () => {
			const event = new Event("BIRTHDAY", true);
			const expected = `It's a wooden picnic table with a flame-themed tablecloth. It has two benches built in on either side of it. In the center of the table is a BIRTHDAY CAKE.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});

		test('birthday not ongoing', () => {
			const event = new Event("BIRTHDAY", false);
			const expected = `It's a wooden picnic table with a red and white checkered tablecloth. It has two benches built in on either side of it.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});

	describe('multiple events winter checkpoint', () => {
		const text = `<desc><s>You exit the CHECKPOINT.</s> <if cond="findEvent('SNOW').ongoing === true"><s>Snowflakes gently fall from the cloudy sky above.</s></if><if cond="findEvent('BLIZZARD').ongoing === true"><s>You're immediately greeted by a blizzard blowing snow at you at a high speed.</s></if><if cond="findEvent('SNOW').ongoing === false && findEvent('BLIZZARD').ongoing === false"><if cond="findEvent('OVERCAST').ongoing === false && findEvent('NIGHT').ongoing === false"><s>Your eyes take a minute to adjust to the sunlight.</s></if><if cond="findEvent('OVERCAST').ongoing === true && findEvent('NIGHT').ongoing === false"><s>The sky above is covered by thick, light gray clouds.</s></if><if cond="findEvent('NIGHT').ongoing === true"><s>You breathe in the crisp, chilly nighttime air.</s></if></if> <s>The path ahead of you is short and thin, leading to the SOUTH PATH.</s></desc>`;

		describe('no snow no blizzard', () => {
			beforeEach(() => {
				const snowEvent = new Event("SNOW", false);
				const blizzardEvent = new Event("BLIZZARD", false);
			});
			
			describe('overcast ongoing', () => {
				beforeEach(() => {
					const overcastEvent = new Event("OVERCAST", true);
				});

				test('overcast ongoing daytime', () => {
					const nightEvent = new Event("NIGHT", false);
					const expected = `You exit the CHECKPOINT. The sky above is covered by thick, light gray clouds. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
					const result = parser.parseDescription(text, null, player);
					expect(result).toBe(expected);
				});

				test('overcast ongoing night ongoing', () => {
					const nightEvent = new Event("NIGHT", true);
					const expected = `You exit the CHECKPOINT. You breathe in the crisp, chilly nighttime air. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
					const result = parser.parseDescription(text, null, player);
					expect(result).toBe(expected);
				});
			});

			describe('not overcast', () => {
				beforeEach(() => {
					const overcastEvent = new Event("OVERCAST", false);
				});

				test('not overcast daytime', () => {
					const nightEvent = new Event("NIGHT", false);
					const expected = `You exit the CHECKPOINT. Your eyes take a minute to adjust to the sunlight. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
					const result = parser.parseDescription(text, null, player);
					expect(result).toBe(expected);
				});

				test('not overcast night ongoing', () => {
					const nightEvent = new Event("NIGHT", true);
					const expected = `You exit the CHECKPOINT. You breathe in the crisp, chilly nighttime air. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
					const result = parser.parseDescription(text, null, player);
					expect(result).toBe(expected);
				});
			});
		});

		test('snow ongoing', () => {
			const snowEvent = new Event("SNOW", true);
			const blizzardEvent = new Event("BLIZZARD", false);
			const expected = `You exit the CHECKPOINT. Snowflakes gently fall from the cloudy sky above. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});

		test('blizzard ongoing', () => {
			const snowEvent = new Event("SNOW", false);
			const blizzardEvent = new Event("BLIZZARD", true);
			const expected = `You exit the CHECKPOINT. You're immediately greeted by a blizzard blowing snow at you at a high speed. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
			const result = parser.parseDescription(text, null, player);
			expect(result).toBe(expected);
		});
	});
});
	
describe('test formatting', () => {
	const player = new Player("", 5);

	test('greater than less than', () => {
		const text = `<desc><s>It's a graph of an algebraic expression.</s> <s>In the corner, "x > -2 && x < 3" is written.</s></desc>`;
		const expected = `It's a graph of an algebraic expression. In the corner, "x > -2 && x < 3" is written.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});
	
	test('less than greater than', () => {
		const text = `<desc><s>It's a graph of an algebraic expression.</s> <s>In the corner, "x < 3 && x > -2" is written.</s></desc>`;
		const expected = `It's a graph of an algebraic expression. In the corner, "x < 3 && x > -2" is written.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});

	test('broken opening desc tag', () => {
		const text = `desc><s>It’s a raspberry blue blanket filled with plastic pellets that weigh it down.</s> <s>It weighs 10 pounds and is very comforting.</s></desc>`;
		const expected = `It’s a raspberry blue blanket filled with plastic pellets that weigh it down. It weighs 10 pounds and is very comforting.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});

	test('duplicate closing desc tag', () => {
		const text = `</desc><s>It's a wide, boxy typewriter set into a wooden base.</s> <s>There is a *QWERTZ* keyboard set into the front that makes heavy, noisy clicks whenever the keys are pressed down.</s> <s>A cylinder at the back of the typewriter has a roll of paper clipped in.</s> <s>When a key is typed, ink stamps down onto the paper, producing letters onto the paper.</s> <s>There are visible signs of aging on this typewriter, as if it’s accompanied its owner for many years.</s> <s>Despite the small placard below the keyboard reading “NEO-TYPEWRITER”, nothing about it seems particularly futuristic.</s></desc>`;
		const expected = `It's a wide, boxy typewriter set into a wooden base. There is a *QWERTZ* keyboard set into the front that makes heavy, noisy clicks whenever the keys are pressed down. A cylinder at the back of the typewriter has a roll of paper clipped in. When a key is typed, ink stamps down onto the paper, producing letters onto the paper.</s> <s>There are visible signs of aging on this typewriter, as if it’s accompanied its owner for many years. Despite the small placard below the keyboard reading “NEO-TYPEWRITER”, nothing about it seems particularly futuristic.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	});

	test('missing opening desc tag', () => {
		const text = `<s>It’s a black, early-2000s CD player.</s> <s>Plugged into the audio port is a similarly black pair of earbuds.</s> <s>The player itself is round and its lid flips up with the help of a tiny button, granting access to the CD inside.</s> <s>The CD currently in the player has no design on it, but it has music nonetheless.</s></desc>`;
		const expected = `It’s a black, early-2000s CD player. Plugged into the audio port is a similarly black pair of earbuds. The player itself is round and its lid flips up with the help of a tiny button, granting access to the CD inside. The CD currently in the player has no design on it, but it has music nonetheless.`;
		const result = parser.parseDescription(text, null, player);
		expect(result).toBe(expected);
	})
});