// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Description from "../../Data/Description.ts";
import type Event from "../../Data/Event.ts";
import type GameEntity from "../../Data/GameEntity.ts";
import type Player from "../../Data/Player.ts";
import type RoomItem from "../../Data/RoomItem.ts";
import { parseDescription } from "../../Modules/parser.js";

describe('test parseDescription', () => {
	let kyra: Player;
	let vivian: Player;
	let astrid: Player;
	let nero: Player;
	let evad: Player;
	let asuka: Player;
	let luna: Player;
	let kiara: Player;
	let amadeus: Player;
	let qm: Player;

	beforeAll(async () => {
		await game.entityLoader.loadAll();
		kyra = game.entityFinder.getLivingPlayer("Kyra");
        vivian = game.entityFinder.getLivingPlayer("Vivian");
        astrid = game.entityFinder.getLivingPlayer("Astrid");
        nero = game.entityFinder.getLivingPlayer("Nero");
		evad = game.entityFinder.getPlayer("Evad");
        asuka = game.entityFinder.getLivingPlayer("Asuka");
        luna = game.entityFinder.getLivingPlayer("Luna");
        kiara = game.entityFinder.getLivingPlayer("Kiara");
        amadeus = game.entityFinder.getLivingPlayer("Amadeus");
        qm = game.entityFinder.getLivingPlayer("???");
	});

	describe('test item lists', () => {
		test('empty item list 0', () => {
			const description = new Description(`<desc><s>The floor beneath you is soft and earthy.</s> <s>You find <il></il> haphazardly placed on it.</s></desc>`, null, game);
			const expected = `The floor beneath you is soft and earthy.`;
			const result = parseDescription(description, null, nero);
			expect(result).toBe(expected);
		});

		test('empty item list 1', () => {
			const description = new Description(`<desc><s>You look at the sink.</s> <s>It looks to be very clean.</s> <s>On the wall above it is a mirror.</s> <s>Under the sink, you find <il></il>.</s></desc>`, null, game);
			const expected = `You look at the sink. It looks to be very clean. On the wall above it is a mirror.`;
			const result = parseDescription(description, null, nero);
			expect(result).toBe(expected);
		});

		test('single item list single item 0', () => {
			const description = new Description(`<desc><s>You open the locker.</s> <s>Inside, you find <il><item>a pair of SWIM TRUNKS</item></il>.</s></desc>`, null, game);
			const expected = `You open the locker. Inside, you find a pair of SWIM TRUNKS.`;
			const result = parseDescription(description, null, nero);
			expect(result).toBe(expected);
		});

		test('single item list multiple items 0', () => {
			const description = new Description(`<desc><desc><s>You open the locker.</s> <s>Inside, you find <il><item>a FIRST AID KIT</item>, <item>a bottle of PAINKILLERS</item>, <item>a PILL BOTTLE</item>, and <item>an OLD KEY</item></il>.</s></desc></desc>`, null, game);
			const expected = `You open the locker. Inside, you find a FIRST AID KIT, a bottle of PAINKILLERS, a PILL BOTTLE, and an OLD KEY.`;
			const result = parseDescription(description, null, nero);
			expect(result).toBe(expected);
		});

		test('multiple empty item lists 0', () => {
			const description = new Description(`<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`, null, game);
			const expected = `It's a pair of long, purple pants with a checker pattern. There are four pockets altogether.`;
			const result = parseDescription(description, null, nero);
			expect(result).toBe(expected);
		});

		test('multiple item lists single items 0', () => {
			const description = new Description(`<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"><item>a GUN</item></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"><item>3 pairs of DICE</item></il>.</s></desc>`, null, game);
			const expected = `It's a pair of long, purple pants with a checker pattern. There are four pockets altogether. In the left pocket, you find a GUN. In the right back pocket, you find 3 pairs of DICE.`;
			const result = parseDescription(description, null, nero);
			expect(result).toBe(expected);
		});
	});

	describe('test player perception', () => {
		describe('joshua body', () => {
			let description: Description;

			beforeAll(() => {
				description = new Description(`<desc><s>You inspect Joshua's body.</s> <if cond="player.perception >= 5"><s>He looks pretty emaciated, like he hasn't eaten or drank in days.</s> <s>You don't find any injuries except for a gash in his **NECK**.</s></if> <if cond="player.perception < 5"><s>Nothing seems out of the ordinary except for a gash in his **NECK**.</s></if></desc>`, null, game);
			});

			test('joshua body perception 5', () => {
				const expected = `You inspect Joshua's body. He looks pretty emaciated, like he hasn't eaten or drank in days. You don't find any injuries except for a gash in his **NECK**.`;
				const result = parseDescription(description, null, nero);
				expect(result).toBe(expected);
			});

			test('joshua body perception 4', () => {
				const expected = `You inspect Joshua's body. Nothing seems out of the ordinary except for a gash in his **NECK**.`;
				const result = parseDescription(description, null, luna);
				expect(result).toBe(expected);
			});
		});

		describe('veronica with items', () => {
			let description: Description;

			beforeAll(() => {
				description = new Description(`<desc><s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.perception >= 5"><s>In her pockets, you find <il><item>a CIGARETTE</item>, <item>a KNIFE</item>, and <item>a pair of NEEDLES</item></il>.</s></if></desc>`, null, game);
			});

			test('veronica with items perception 5', () => {
				const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE, a KNIFE, and a pair of NEEDLES.`;
				const result = parseDescription(description, null, nero);
				expect(result).toBe(expected);
			});

			test('veronica with items perception 4', () => {
				const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt.`;
				const result = parseDescription(description, null, luna);
				expect(result).toBe(expected);
			});
		});

		describe('veronica with conditional items', () => {
			let description: Description;

			beforeAll(() => {
				description = new Description(`<desc><s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <s>In her pockets, you find <il><item>a CIGARETTE</item><if cond="player.perception >= 5">, <item>a KNIFE</item>,</if> and <item>a pair of NEEDLES</item></il>.</s></desc>`, null, game);
			});

			test('veronica perception 5 with conditional item', () => {
				const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE, a KNIFE, and a pair of NEEDLES.`;
				const result = parseDescription(description, null, nero);
				expect(result).toBe(expected);
			});

			test('veronica perception 4 with conditional item', () => {
				const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE and a pair of NEEDLES.`;
				const result = parseDescription(description, null, luna);
				expect(result).toBe(expected);
			});
		});

		test('veronica perception 5 with empty item list', () => {
			const description = new Description(`<desc><s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.perception >= 5"><s>In her pockets, you find <il></il>.</s></if></desc>`, null, game);
			const expected = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt.`;
			const result = parseDescription(description, null, nero);
			expect(result).toBe(expected);
		});
	});

	describe('test player title', () => {
		describe('nemu tree', () => {
			let description: Description;

			beforeAll(() => {
				description = new Description(`<desc><s>You take a look at the nemu tree.</s> <s>It's unlike anything you've ever seen before.</s> <s>It has purple wood and blue leaves.</s> <s><if cond="player.title === 'Ultimate Farmer'">Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.</if></s></desc>`, null, game);
			});

			test('nemu tree ultimate farmer', () => {
				const expected = `You take a look at the nemu tree. It's unlike anything you've ever seen before. It has purple wood and blue leaves. Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.`;
				const result = parseDescription(description, null, evad);
				expect(result).toBe(expected);
			});

			test('nemu tree ultimate gamer', () => {
				const expected = `You take a look at the nemu tree. It's unlike anything you've ever seen before. It has purple wood and blue leaves.`;
				const result = parseDescription(description, null, asuka);
				expect(result).toBe(expected);
			});
		});

		describe('pool table', () => {
			let description: Description;

			beforeAll(() => {
				description = new Description(`<desc><s>You examine the pool table.</s> <s>It seems to have everything you need to play a game of pool: <il><item>2 POOL STICKS</item>, <if cond="player.title === 'Ultimate Gamer'"><item>CHALK</item>,</if> <item>a TRIANGLE</item>, and <item>BALLS</item></il>.</s></desc>`, null, game);
			});

			test('pool table not ultimate neuroscientist', () => {
				const expected = `You examine the pool table. It seems to have everything you need to play a game of pool: 2 POOL STICKS, a TRIANGLE, and BALLS.`;
				const result = parseDescription(description, null, kyra);
				expect(result).toBe(expected);
			});

			test('pool table ultimate gamer', () => {
				const expected = `You examine the pool table. It seems to have everything you need to play a game of pool: 2 POOL STICKS, CHALK, a TRIANGLE, and BALLS.`;
				const result = parseDescription(description, null, asuka);
				expect(result).toBe(expected);
			});
		});

		describe('photo album', () => {
			let description: Description;

			beforeAll(() => {
				description = new Description(`<desc><s>You flip through the photo album.</s> <if cond="player.name === 'Kiara'"><s>It's full of pictures of your parents and all of the places they've gone.</s> <s>There are no pictures of you.</s></if><if cond="player.name === 'Astrid'"><s>It's full of pictures of Kiara's parents in various places, but there are no pictures of Kiara in here.</s></if><if cond="player.name !== 'Kiara' && player.name !== 'Astrid'"><s>It's full of pictures of a married couple in various places around the world.</s> <s>You've never seen these people before.</s></if></desc>`, null, game);
			});

			test('photo album asuka', () => {
				const expected = `You flip through the photo album. It's full of pictures of a married couple in various places around the world. You've never seen these people before.`;
				const result = parseDescription(description, null, asuka);
				expect(result).toBe(expected);
			});

			test('photo album kiara', () => {
				const expected = `You flip through the photo album. It's full of pictures of your parents and all of the places they've gone. There are no pictures of you.`;
				const result = parseDescription(description, null, kiara);
				expect(result).toBe(expected);
			});

			test('photo album astrid', () => {
				const expected = `You flip through the photo album. It's full of pictures of Kiara's parents in various places, but there are no pictures of Kiara in here.`;
				const result = parseDescription(description, null, astrid);
				expect(result).toBe(expected);
			});
		});

		describe('locker conditional title', () => {
			let description: Description;

			beforeAll(() => {
				description = new Description(`<desc><s>You open the locker.</s> <s>Inside, you find <il><if cond="player.title === 'Ultimate Nurse'"><item>a SWIMSUIT</item></if></il>.</s></desc>`, null, game);
			});

			test('locker conditional title ultimate farmer', () => {
				const expected = `You open the locker.`;
				const result = parseDescription(description, null, evad);
				expect(result).toBe(expected);
			});

			test('locker conditional title ultimate nurse', () => {
				const expected = `You open the locker. Inside, you find a SWIMSUIT.`;
				const result = parseDescription(description, null, luna);
				expect(result).toBe(expected);
			});
		});
	});

	describe('test inventory items', () => {
		describe('mountain dew', () => {
			let description: Description;
			let item: RoomItem;

			beforeAll(() => {
				description = new Description(`<desc><s>It's a bottle of Code Red Mountain Dew, which has a cherry flavor.</s> <if cond="player.name === 'Asuka'"><s>This is your favorite flavor, naturally.</s></if><if cond="player.name !== 'Asuka'"><s>For some reason, when you hold it, you get the urge to play video games.</s></if> <s>The drink and label are both red.</s> <if cond="this.uses > 0"><s>It's nice and cold.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`, null, game);
				item = game.entityFinder.getRoomItem('CODE RED MOUNTAIN DEW');
			});

			afterAll(() => {
				item.uses = 1;
			});

			test('mountain dew uses 1', () => {
				const expected = `It's a bottle of Code Red Mountain Dew, which has a cherry flavor. For some reason, when you hold it, you get the urge to play video games. The drink and label are both red. It's nice and cold.`;
				const result = parseDescription(description, item, nero);
				expect(result).toBe(expected);
			});

			test('mountain dew uses 0', () => {
				item.uses = 0;
				const expected = `It's a bottle of Code Red Mountain Dew, which has a cherry flavor. For some reason, when you hold it, you get the urge to play video games. The drink and label are both red. It's empty.`;
				const result = parseDescription(description, item, nero);
				expect(result).toBe(expected);
			});
		});

		describe('sniper rifle', () => {
			let description: Description;
			let item: RoomItem;

			beforeAll(() => {
				description = new Description(`<desc><s>It's a long, black sniper rifle with an attached scope.</s> <s>It's the kind that you have to lodge into your shoulder to hold steadily.</s> <s>It's loaded with a 10-round box magazine.</s> <if cond="this.uses > 0"><s><var v="this.uses" /> shot<if cond="this.uses !== 1">s are</if><if cond="this.uses === 1"> is</if> left.</s></if><if cond="this.uses === 0"><s>Unfortunately, all the ammo has been depleted.</s></if></desc>`, null, game);
				item = game.entityFinder.getRoomItem('SNIPER RIFLE');
			});

			afterAll(() => {
				item.uses = 10;
			})

			test('sniper rifle uses 10', () => {
				const expected = `It's a long, black sniper rifle with an attached scope. It's the kind that you have to lodge into your shoulder to hold steadily. It's loaded with a 10-round box magazine. 10 shots are left.`;
				const result = parseDescription(description, item, nero);
				expect(result).toBe(expected);
			});

			test('sniper rifle uses 1', () => {
				item.uses = 1;
				const expected = `It's a long, black sniper rifle with an attached scope. It's the kind that you have to lodge into your shoulder to hold steadily. It's loaded with a 10-round box magazine. 1 shot is left.`;
				const result = parseDescription(description, item, nero);
				expect(result).toBe(expected);
			});

			test('sniper rifle uses 0', () => {
				item.uses = 0;
				const expected = `It's a long, black sniper rifle with an attached scope. It's the kind that you have to lodge into your shoulder to hold steadily. It's loaded with a 10-round box magazine. Unfortunately, all the ammo has been depleted.`;
				const result = parseDescription(description, item, nero);
				expect(result).toBe(expected);
			});
		});

	});

	describe('test events', () => {
		describe('single event blizzard', () => {
			let description: Description;
			let container: GameEntity;
			let event: Event;

			beforeAll(() => {
				description = new Description(`<desc><s>The ground beneath your feet is made of black tarmac.</s> <s>It's fairly smooth, with only a few cracks.</s> <if cond="findEvent('BLIZZARD').ongoing === false"><s>It's surprisingly quite clear of snow.</s></if><if cond="findEvent('BLIZZARD').ongoing === true"><s>Snow is quickly piling up in this blizzard.</s></if> <s>You find <il></il> haphazardly placed on it.</s></desc>`, null, game);
				container = game.entityFinder.getFixture('FLOOR', 'runway');
				event = game.entityFinder.getEvent('BLIZZARD');
			});

			afterAll(() => {
				event.ongoing = false;
			});

			test('blizzard ongoing', () => {
				event.ongoing = true;
				const expected = `The ground beneath your feet is made of black tarmac. It's fairly smooth, with only a few cracks. Snow is quickly piling up in this blizzard.`;
				const result = parseDescription(description, container, nero);
				expect(result).toBe(expected);
			});

			test('blizzard not ongoing', () => {
				event.ongoing = false;
				const expected = `The ground beneath your feet is made of black tarmac. It's fairly smooth, with only a few cracks. It's surprisingly quite clear of snow.`;
				const result = parseDescription(description, container, nero);
				expect(result).toBe(expected);
			});
		});

		describe('multiple events winter checkpoint', () => {
			let description: Description;
			let container: GameEntity;
			let snowEvent: Event;
			let blizzardEvent: Event;
			let overcastEvent: Event;
			let nightEvent: Event;

			beforeAll(() => {
				description = new Description(`<desc><s>You exit the CHECKPOINT.</s> <if cond="findEvent('SNOW').ongoing === true"><s>Snowflakes gently fall from the cloudy sky above.</s></if><if cond="findEvent('BLIZZARD').ongoing === true"><s>You're immediately greeted by a blizzard blowing snow at you at a high speed.</s></if><if cond="findEvent('SNOW').ongoing === false && findEvent('BLIZZARD').ongoing === false"><if cond="findEvent('OVERCAST').ongoing === false && findEvent('NIGHT').ongoing === false"><s>Your eyes take a minute to adjust to the sunlight.</s></if><if cond="findEvent('OVERCAST').ongoing === true && findEvent('NIGHT').ongoing === false"><s>The sky above is covered by thick, light gray clouds.</s></if><if cond="findEvent('NIGHT').ongoing === true"><s>You breathe in the crisp, chilly nighttime air.</s></if></if> <s>The path ahead of you is short and thin, leading to the SOUTH PATH.</s></desc>`, null, game);
				container = game.entityFinder.getRoom('path-2');
				snowEvent = game.entityFinder.getEvent('SNOW');
				blizzardEvent = game.entityFinder.getEvent('BLIZZARD');
				overcastEvent = game.entityFinder.getEvent('OVERCAST');
				nightEvent = game.entityFinder.getEvent('NIGHT');
			});

			afterAll(() => {
				snowEvent.ongoing = false;
				blizzardEvent.ongoing = false;
				overcastEvent.ongoing = false;
				nightEvent.ongoing = false;
			});

			describe('no snow no blizzard', () => {
				describe('overcast ongoing', () => {
					beforeEach(() => {
						overcastEvent.ongoing = true;
					});

					test('overcast ongoing daytime', () => {
						nightEvent.ongoing = false;
						const expected = `You exit the CHECKPOINT. The sky above is covered by thick, light gray clouds. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
						const result = parseDescription(description, container, nero);
						expect(result).toBe(expected);
					});

					test('overcast ongoing night ongoing', () => {
						nightEvent.ongoing = true;
						const expected = `You exit the CHECKPOINT. You breathe in the crisp, chilly nighttime air. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
						const result = parseDescription(description, container, nero);
						expect(result).toBe(expected);
					});
				});

				describe('not overcast', () => {
					beforeEach(() => {
						overcastEvent.ongoing = false;
					});

					test('not overcast daytime', () => {
						nightEvent.ongoing = false;
						const expected = `You exit the CHECKPOINT. Your eyes take a minute to adjust to the sunlight. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
						const result = parseDescription(description, container, nero);
						expect(result).toBe(expected);
					});

					test('not overcast night ongoing', () => {
						nightEvent.ongoing = true;
						const expected = `You exit the CHECKPOINT. You breathe in the crisp, chilly nighttime air. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
						const result = parseDescription(description, container, nero);
						expect(result).toBe(expected);
					});
				});
			});

			test('snow ongoing', () => {
				snowEvent.ongoing = true;
				blizzardEvent.ongoing = false;
				const expected = `You exit the CHECKPOINT. Snowflakes gently fall from the cloudy sky above. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
				const result = parseDescription(description, container, nero);
				expect(result).toBe(expected);
			});

			test('blizzard ongoing', () => {
				snowEvent.ongoing = false;
				blizzardEvent.ongoing = true;
				const expected = `You exit the CHECKPOINT. You're immediately greeted by a blizzard blowing snow at you at a high speed. The path ahead of you is short and thin, leading to the SOUTH PATH.`;
				const result = parseDescription(description, container, nero);
				expect(result).toBe(expected);
			});
		});
	});

	describe('test formatting', () => {
		test('greater than less than', () => {
			const description = new Description(`<desc><s>It's a graph of an algebraic expression.</s> <s>In the corner, "x > -2 && x < 3" is written.</s></desc>`, null, game);
			const expected = `It's a graph of an algebraic expression. In the corner, "x > -2 && x < 3" is written.`;
			const result = parseDescription(description, null, nero);
			expect(result).toBe(expected);
		});

		test('less than greater than', () => {
			const description = new Description(`<desc><s>It's a graph of an algebraic expression.</s> <s>In the corner, "x < 3 && x > -2" is written.</s></desc>`, null, game);
			const expected = `It's a graph of an algebraic expression. In the corner, "x < 3 && x > -2" is written.`;
			const result = parseDescription(description, null, nero);
			expect(result).toBe(expected);
		});

		test('broken opening desc tag', () => {
			const description = new Description(`desc><s>It’s a raspberry blue blanket filled with plastic pellets that weigh it down.</s> <s>It weighs 10 pounds and is very comforting.</s></desc>`, null, game);
			const expected = `It’s a raspberry blue blanket filled with plastic pellets that weigh it down. It weighs 10 pounds and is very comforting.`;
			const result = parseDescription(description, null, nero);
			expect(result).not.toBe(expected);
		});

		test('duplicate closing desc tag', () => {
			const description = new Description(`</desc><s>It's a wide, boxy typewriter set into a wooden base.</s> <s>There is a *QWERTZ* keyboard set into the front that makes heavy, noisy clicks whenever the keys are pressed down.</s> <s>A cylinder at the back of the typewriter has a roll of paper clipped in.</s> <s>When a key is typed, ink stamps down onto the paper, producing letters onto the paper.</s> <s>There are visible signs of aging on this typewriter, as if it’s accompanied its owner for many years.</s> <s>Despite the small placard below the keyboard reading “NEO-TYPEWRITER”, nothing about it seems particularly futuristic.</s></desc>`, null, game);
			const expected = `It's a wide, boxy typewriter set into a wooden base. There is a *QWERTZ* keyboard set into the front that makes heavy, noisy clicks whenever the keys are pressed down. A cylinder at the back of the typewriter has a roll of paper clipped in. When a key is typed, ink stamps down onto the paper, producing letters onto the paper. There are visible signs of aging on this typewriter, as if it’s accompanied its owner for many years. Despite the small placard below the keyboard reading “NEO-TYPEWRITER”, nothing about it seems particularly futuristic.`;
			const result = parseDescription(description, null, nero);
			expect(result).not.toBe(expected);
		});

		test('missing opening desc tag', () => {
			const description = new Description(`<s>It’s a black, early-2000s CD player.</s> <s>Plugged into the audio port is a similarly black pair of earbuds.</s> <s>The player itself is round and its lid flips up with the help of a tiny button, granting access to the CD inside.</s> <s>The CD currently in the player has no design on it, but it has music nonetheless.</s></desc>`, null, game);
			const expected = `It’s a black, early-2000s CD player. Plugged into the audio port is a similarly black pair of earbuds. The player itself is round and its lid flips up with the help of a tiny button, granting access to the CD inside. The CD currently in the player has no design on it, but it has music nonetheless.`;
			const result = parseDescription(description, null, nero);
			expect(result).not.toBe(expected);
		});
	});

	describe('item lists are generated automatically', () => {
		test('empty item list', () => {
			const container = game.entityFinder.getFixture('FLOOR', 'lobby');
			const expected = `The floor is covered in beautifully polished white linoleum tiles.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('only a fixture', () => {
			const container = game.entityFinder.getFixture('COUCH', 'break-room');
			const expected = `It's a large, black and white couch that can hold up to five people, if they all cram in there. It's nice and comfy, and you sink right into it. Underneath the cushions, you find a CRYPTEX LOCK.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('one item quantity 1', () => {
			const container = game.entityFinder.getFixture('DRAWER 2', 'kitchen');
			const expected = `You ruffle through the stainless steel drawer. In it, you find a CUTLERY TRAY.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('one item quantity 30', () => {
			const container = game.entityFinder.getFixture('BEEF PALLET', 'freezer');
			const expected = `On the pallet is a number of boxes of various types of raw beef. Only the boxes on top are open. In them, you find 30 frozen STEAKS.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('one item infinite quantity', () => {
			const container = game.entityFinder.getFixture('PANTRY', 'canteen');
			const expected = `It's a wide wooden pantry. You open it up and look inside. In it, you find lots of CANS OF TOMATO SOUP.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('one item and flavor text', () => {
			const container = game.entityFinder.getFixture('COFFEE TABLE', 'lobby');
			const expected = `It's a wooden coffee table with a glass panel on its surface. On it is a MAGAZINE and a small potted flower.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('one item and a fixture', () => {
			const container = game.entityFinder.getFixture('NIGHTSTAND', 'suite-1');
			const expected = `It's a black nightstand made of a sturdy wood. Feels like teak, or perhaps mahogany. It has a TOP DRAWER and a BOTTOM DRAWER. On top of it is a PHONE and a small, dim lamp that would really only be useful for reading a book at night.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('one item and two fixtures', () => {
			const container = game.entityFinder.getFixture('DESK', 'warehouse-office');
			const expected = `It's a sturdy wooden desk which is fairly large and has two segments that form a corner. On it, you find a RADIO, a TYPEWRITER, and a TELEPHONE. The desk has several DRAWERS underneath its surface. Behind the desk is an OFFICE CHAIR.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('two items and two fixtures', () => {
			const container = game.entityFinder.getFixture('BED', 'cell-1');
			const expected = `The bed is little more than a concrete slab with a thin cushion on top. On it, you find a PILLOW, a BLANKET, a BURN HOLE, and a STAIN.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('two items single quantity', () => {
			const container = game.entityFinder.getFixture('TABLE 1', 'dining-hall');
			const expected = `This table is near the corner to the left of the PIANO. It's a small, circular table covered with a white table cloth that reaches the floor. It's surrounded by 4 chairs. On it, you find a SALT SHAKER and a PEPPER SHAKER.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('two items quantity 6', () => {
			const container = game.entityFinder.getFixture('CUPBOARDS', 'break-room');
			const expected = `The cupboards are made of white wood that doesn't really match the counter below. Ruffling through them, you find 6 MUGS and 6 K CUPS.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('two items and a fixture', () => {
			const container = game.entityFinder.getFixture('COFFEE TABLE', 'green-room');
			const expected = `It's a brown, oval-shaped table in front of the SOFA. On top of it are a SCRIPT, a CLOWN NOSE JAR, and a TELEVISION.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('finite and infinite quantities', () => {
			const container = game.entityFinder.getFixture('DRAWERS', 'warehouse-office');
			expect(container.description.toString()).toBe(`<desc><s>You look through the drawers.</s> <s>They mostly contain a bunch of files in Russian<if cond="player.hasAttribute('knows russian')">, which are all meaningless documents about warehouse shipments, employees, soldiers, etc</if><if cond="!player.hasAttribute('knows russian')">, which you can't read</if>.</s> <s>However, the top drawer contains <il>a stack of PAPER</il>.</s></desc>`)
			const expected = `You look through the drawers. They mostly contain a bunch of files in Russian, which you can't read. However, the top drawer contains a MEDIUM KEY, a DOCUMENT, 7 PENS, and a stack of PAPER.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('multiple items with infinite quantities', () => {
			const container = game.entityFinder.getFixture('FRUIT BASKET', 'kitchen');
			const expected = `You examine the fruit basket. It's filled with an abundance of fresh fruit. Looking through it, you find APPLES, BANANAS, ORANGES, MANGOES, PINEAPPLES, and STRAWBERRIES.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('three items with conditional', () => {
			const container = game.entityFinder.getFixture('BED', 'suite-14');
			expect(container.description.toString()).toBe(`<desc><s>It's a queen bed with perfectly white sheets<if cond="findRoomItem('COMFORTER', this.location.id, 'Fixture', 'BED') !== undefined"> and a thick, black comforter tucked neatly under the mattress</if>.</s> <s>On it, you find <il></il>.</s></desc>`);
			const expected = `It's a queen bed with perfectly white sheets and a thick, black comforter tucked neatly under the mattress. On it, you find 2 PILLOWS, a COMFORTER, and a BILLIARD BALL.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('three items with mixed singleContainingPhrases and pluralContainingPhrase', () => {
			const container = game.entityFinder.getFixture('PROP TABLE', 'backstage');
			const expected = `It's a long, wooden table designed to hold props for the actors to grab before their scenes. On it, you find a PROP PISTOL, 3 SQUIBS, and an AIRHORN.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('four items', () => {
			const container = game.entityFinder.getFixture('PREP TABLE', 'canteen');
			const expected = `You examine the prep table. It's just a stainless steel table for preparing dishes. It's mostly clear, but you do find a POT, a COOKIE SHEET, a FRYING PAN, and a BUTCHERS KNIFE on it.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('many items with the same plural name', () => {
			const container = game.entityFinder.getFixture('POOL TABLE', 'break-room');
			const expected = `You examine the pool table. On it are 2 POOL STICKS, a TRIANGLE, CHALK, and 15 BILLIARD BALLS.`
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

        test('items with the same prefab but different uses are collated', () => {
            const container = game.entityFinder.getFixture('SINK 1', 'video-room');
            const expected = `It's a sink. It has two knobs, one for hot water and one for cold water. It looks impeccably clean. In it, you find 20 DIRTY PLATES and 4 bottles of DETERGENT.`;
            const result = parseDescription(container.description, container, kyra);
            expect(result).toBe(expected);
        });

        test('container items with the same prefab are collated', () => {
            const container = game.entityFinder.getFixture('BURNER 5', 'video-room');
            const expected = `It's an old stovetop burner. It's gas-powered, which means you'll be cooking with actual fire. On it, you find 2 FRYING PANS.`;
            const result = parseDescription(container.description, container, kyra);
            expect(result).toBe(expected);
        });

        test('items with the same prefab but different names are not collated', () => {
            const container = game.entityFinder.getFixture('KILN 3', 'video-room');
            const expected = `It's a large kiln, for firing clay. It's currently off. Inside, you find an unfired RED CLAY POT and an unfired WHITE CLAY POT.`;
            const result = parseDescription(container.description, container, kyra);
            expect(result).toBe(expected);
        });

		test('multiple empty item lists', () => {
			const container = game.entityFinder.getRoomItem('KYRAS PANTS 2', 'suite-9');
			const expected = `It's a pair of straight-leg, black dress pants. They have a button, but no zipper. It has two pockets on the front.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('one item in description with multiple item lists', () => {
			const container = game.entityFinder.getRoomItem('RILEY SHORTS', 'dressing-room');
			const expected = `It's a pair of beige, knee-length cargo shorts. It has six pockets altogether. In the right pocket, you find a RAT PLUSHIE.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('some filled item lists', () => {
			const container = game.entityFinder.getRoomItem('KNIFE BLOCK', 'kitchen');
			const expected = `It's a wooden knife block with several slots. It has one large slot, two medium slots, three small slots, and even a scissor slot. In the large slot is a LARGE KNIFE. In the scissor slot is a pair of SCISSORS.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('all filled item lists', () => {
			const container = game.entityFinder.getRoomItem('CLEANING CART', 'storage');
			const expected = `It's a gray cleaning cart with three shelves, some racks, a trash can, and an extra shelf in the front. The wheels make it really easy to push around. On the bottom shelf are 2 rolls of TOILET PAPER. On the middle shelf are a roll of PAPER TOWELS and a bottle of BLEACH. On the top shelf are a BUCKET, a SPRAY BOTTLE, and a pair of VINYL GLOVES. Hanging from the racks are a BROOM and a DUSTPAN. On the front of the cart is a MOP BUCKET.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('player with one filled item list', () => {
			const container = vivian;
			const expected = `You examine Vivian. She's somewhat short, with a light skin tone. She has long, dark purple hair with straight bangs and an ahoge. Her hair is tied up in a ponytail. Her eyes are light purple. She has a seemingly permanent scowl, making her look a little intimidating, but her size makes her appear relatively harmless. She has a scrawny frame. She wears a BLUE BOW, a pair of GLASSES, a BLACK TIE, a WHITE DRESS SHIRT, a BLACK SUIT JACKET, a QUIVER, a pair of BLACK TROUSERS, and a pair of FLATS.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('player with multiple filled item lists', () => {
			const container = kyra;
			const expected = `You examine Kyra. She's somewhat short with a pale skin tone. She has red eyes and long, brown hair tied back in an extremely long, low ponytail, with bangs swept to the right and two thick, wavy fringes on the sides that reach down to her chest. Her expression is relatively neutral, making it hard to read what's on her mind. She has a thin build. She wears a pair of GLASSES, a RED TIE, a BLACK DRESS SHIRT, a LAB COAT, a pair of BLACK DRESS PANTS, a pair of WHITE SOCKS, and a pair of FLATS. You see her carrying a mug of COFFEE.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('items with the same single and plural containing phrases are combined', () => {
			const container = game.entityFinder.getFixture('CLOSET', 'suite-9');
			const expected = `You open the closet. It's big enough that someone could hide in it. Inside is a silver rack from to which to hang clothes. On the rack, you find 30 BLACK DRESS SHIRTS, 30 LAB COATS, and 30 pairs of BLACK DRESS PANTS.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('last word before item list "are" is changed to "is" when only 1 item with a quantity of 1 remains', () => {
			const container = game.entityFinder.getRoomItem('BOX OF SPAGHETTI 2', 'kitchen');
			const expected = `A box of spaghetti noodles for you to boil. Inside is a serving of raw SPAGHETTI NOODLES.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('last word before item list "are" is remains "are" when only 1 item with a quantity greater than 1 remains', () => {
			const container = game.entityFinder.getRoomItem('BOX OF SPAGHETTI 1', 'kitchen');
			const expected = `A box of spaghetti noodles for you to boil. Inside are 3 servings of raw SPAGHETTI NOODLES.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('last word before item list "is" remains "is" when it contains 1 item with a quantity of 1', () => {
			const container = game.entityFinder.getRoomItem('KYRAS BRA 29', 'suite-9');
			const expected = `It's a basic black bra. The tag says its size is 34D. Tucked away in it is a BLACK AND WHITE PILL.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('last word before item list "is" is changed to "are" when it contains 1 item with a quantity greater than 1', () => {
			const container = game.entityFinder.getRoomItem('KYRAS BRA 30', 'suite-9');
			const expected = `It's a basic black bra. The tag says its size is 34D. Tucked away in it are 2 BLACK AND WHITE PILLS.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('last word before item list "is" is changed to "are" when it contains more than 1 item', () => {
			const container = game.entityFinder.getRoomItem('KYRAS BRA 31', 'suite-9');
			const expected = `It's a basic black bra. The tag says its size is 34D. Tucked away in it are a BLACK AND WHITE PILL and a NOTE.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('first word after item list "is" is changed to "are" when it contains 1 item with a quantity greater than 1', () => {
			const monokumaMask = game.entityFinder.getRoomItem('MONOKUMA MASK', 'treasure-room');
			monokumaMask.quantity = 2;
			const container = game.entityFinder.getFixture('HOOK', 'treasure-room');
			const expected = `You examine the hook. It's just a small hook on the wall. On it, 2 MONOKUMA MASKS are hung.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
			monokumaMask.quantity = 1;
		});

		test('first word after item list "are" is changed to "is" when it contains 1 item with a quantity of 1', () => {
			const smallWeight = game.entityFinder.getRoomItem('SMALL WEIGHT', 'fitness-room');
			const mediumWeight = game.entityFinder.getRoomItem('MEDIUM WEIGHT', 'fitness-room');
			const heavyWeight = game.entityFinder.getRoomItem('HEAVY WEIGHT', 'fitness-room');
			smallWeight.quantity = 0;
			mediumWeight.quantity = 0;
			heavyWeight.quantity = 1;
			const container = game.entityFinder.getFixture('WEIGHT RACK', 'fitness-room');
			const expected = `It's a very long rack for weights that stretches across most of the room. Despite that, you find there to be a distinct shortage of weights. A HEAVY WEIGHT is all that's on it.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
			smallWeight.quantity = 4;
			mediumWeight.quantity = 3;
			heavyWeight.quantity = 2;
		});
	});

	describe('test description contains other description', () => {
		test('item in child puzzle', () => {
			const container = game.entityFinder.getFixture('LOCKER 1', 'locker-room');
			const expected = `You open the locker. Inside, you find a TOWEL.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('realistic fiction section contains already solved description', () => {
			const container = game.entityFinder.getFixture('REALISTIC FICTION SECTION', 'library');
			const expected = `This is the Realistic Fiction section. In it, you find lots of books. There seems to be a single book missing.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('brazen bull contains empty already solved description', () => {
			const container = game.entityFinder.getFixture('BRAZEN BULL', 'torture-chamber');
			const expected = `It’s a life-sized iron bull made out of metal, with a chamber so you can climb inside. Underneath it is what looks like a pit for a campfire. There is a BUTTON on its nose. Do you dare push it?`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('bottom dresser drawer contains already solved description', () => {
			const container = game.entityFinder.getFixture('BOTTOM DRESSER DRAWER', 'suite-7');
			const expected = `You open the bottom dresser drawer. Inside you see 30 pairs of WHITE SOCKS.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});

		test('mirror shows player description', () => {
			const container = game.entityFinder.getFixture('MIRROR', 'locker-room');
			const expected = `It's you! You look at your reflection. You examine Kyra. She's somewhat short with a pale skin tone. She has red eyes and long, brown hair tied back in an extremely long, low ponytail, with bangs swept to the right and two thick, wavy fringes on the sides that reach down to her chest. Her expression is relatively neutral, making it hard to read what's on her mind. She has a thin build. She wears a pair of GLASSES, a RED TIE, a BLACK DRESS SHIRT, a LAB COAT, a pair of BLACK DRESS PANTS, a pair of WHITE SOCKS, and a pair of FLATS. You see her carrying a mug of COFFEE.`;
			const result = parseDescription(container.description, container, kyra);
			expect(result).toBe(expected);
		});
	});
});
