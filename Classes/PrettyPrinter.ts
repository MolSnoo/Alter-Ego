import { Collection, Guild, GuildMember, TextChannel, DMChannel } from 'discord.js';
import { format } from 'pretty-format';
import { Duration } from 'luxon';
import Timer from './Timer.ts';
import Status from '../Data/Status.ts';
import Gesture from '../Data/Gesture.ts';
import Player from '../Data/Player.ts';
import Room from '../Data/Room.ts';
import ClientContext from './ClientContext.ts';
import Puzzle from '../Data/Puzzle.ts';
import Description from '../Data/Description.ts';
import Prefab from '../Data/Prefab.ts';
import Fixture from '../Data/Fixture.ts';
import InventorySlot from '../Data/InventorySlot.ts';
import ItemInstance from '../Data/ItemInstance.ts';
import RoomItem from '../Data/RoomItem.ts';
import InventoryItem from '../Data/InventoryItem.ts';
import EquipmentSlot from '../Data/EquipmentSlot.ts';
import Recipe from '../Data/Recipe.ts';
import type { NewPlugin, Config, Refs } from 'pretty-format';

interface AEConfig extends Config {
	printShadowRoot?: boolean;
}

type AEPrinter = (value: unknown, config: AEConfig, indentation: string, depth: number, refs: Refs, hasCalledToJSON?: boolean) => string;

interface AEPlugin<T> extends NewPlugin {
	serialize(value: T, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter): string;
	test(value: unknown): value is T;
}

export class GuildPlugin implements AEPlugin<Guild> {
	test(value: unknown) {
		return value instanceof Guild;
	}

	serialize(value: Guild): string {
		return `<Guild "${value.name || 'unknown'}">`;
	}
}

export class GuildMemberPlugin implements AEPlugin<GuildMember> {
	test(value: unknown) {
		return value instanceof GuildMember;
	}

	serialize(value: GuildMember) {
		return `<GuildMember "${value.displayName || 'unknown'}">`;
	}
}

export class TextChannelPlugin implements AEPlugin<TextChannel> {
	test(value: unknown) {
		return value instanceof TextChannel;
	}

	serialize(value: TextChannel) {
		return `<TextChannel "${value.name || 'unknown'}">`;
	}
}

export class DMChannelPlugin implements AEPlugin<DMChannel> {
	test(value: unknown) {
		return value instanceof DMChannel;
	}

	serialize(value: DMChannel) {
		return `<DMChannel "${value.recipient !== null ? value.recipient.username : 'unknown'}">`;
	}
}

export class DurationPlugin implements AEPlugin<Duration> {
	test(value: unknown) {
		return Duration.isDuration(value);
	}

	serialize(value: Duration) {
		const format = Math.floor(value.as('days')) !== 0 ? 'd hh:mm:ss' : 'hh:mm:ss';
		const timeString = value.toFormat(format);
		return `<Duration ${timeString}>`;
	}
}

export class TimeoutPlugin implements AEPlugin<NodeJS.Timeout> {
	test(value: any): value is NodeJS.Timeout {
		return value?.constructor?.name === 'Timeout';
	}

	serialize(value: NodeJS.Timeout) {
		// @ts-ignore
		return `<Timeout ${value._idleTimeout}ms>`;
	}
}

export class TimerPlugin implements AEPlugin<Timer> {
	test(value: unknown) {
		return value instanceof Timer;
	}

	serialize(value: Timer) {
		return `<Timer ${value.timerDuration}ms>`;
	}
}

export class GesturePlugin implements AEPlugin<Gesture> {
	test(value: unknown) {
		return value instanceof Gesture;
	}

	serialize(value: Gesture) {
		return `<Gesture "${value.id}">`;
	}
}

export class ClientContextPlugin implements AEPlugin<ClientContext> {
	test(value: unknown) {
		return value instanceof ClientContext;
	}

	serialize() {
		return `<ClientContext>`;
	}
}

export class DescriptionPlugin implements AEPlugin<Description> {
	test(value: unknown) {
		return value instanceof Description;
	}

	serialize(value: Description) {
		return value.text.length !== 0 ? `<Description>${value.text}</Description>` : '<Description empty/>';
	}
}

export class StatusPlugin implements AEPlugin<Status> {
	/** Set of objects currently being processed by the StatusPlugin to prevent recursion errors. */
	processing: Set<Status>;

	/** Depth after which to truncate objects. */
	level: number;

	/**
	 * @param level Depth after which to truncate objects
	 */
	constructor(level = 2) {
		this.processing = new Set();
		this.level = level;
	}

	test(value: any): value is Status {
		return value instanceof Status && !this.processing.has(value);
	}

	serialize(value: Status, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (depth > this.level || this.processing.size > 1) {
			if (value.remaining !== null) {
				const format = Math.floor(value.remaining.as('days')) !== 0 ? 'd hh:mm:ss' : 'hh:mm:ss';
				const timeString = value.remaining.toFormat(format);
				return `<Status "${value.id}" inflicted with ${timeString} remaining>`;
			} else if (value.duration !== null) {
				const format = Math.floor(value.duration.as('days')) !== 0 ? 'd hh:mm:ss' : 'hh:mm:ss';
				const timeString = value.duration.toFormat(format);
				return `<Status "${value.id}" lasting for ${timeString}>`;
			} else return `<Status "${value.id}">`;
		} else {
			this.processing.add(value);
			let serialized = printer(value, config, indentation, depth, refs);
			this.processing.delete(value);
			return serialized;
		}
	}
}

export class PuzzlePlugin implements AEPlugin<Puzzle> {
	/** Set of objects currently being processed by the PuzzlePlugin to prevent recursion errors. */
	processing: Set<Puzzle>;

	/** Depth after which to truncate objects. */
	level: number;

	/**
	 * @param level Depth after which to truncate objects
	 */
	constructor(level = 2) {
		this.processing = new Set();
		this.level = level;
	}

	test(value: any): value is Puzzle {
		return value instanceof Puzzle && !this.processing.has(value);
	}

	serialize(value: Puzzle, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (depth > this.level || this.processing.size > 1) {
			return `<Puzzle "${value.name}" in ${value.location.id}>`;
		} else {
			this.processing.add(value);
			let serialized = printer(value, config, indentation, depth, refs);
			this.processing.delete(value);
			return serialized;
		}
	}
}

export class PrefabPlugin implements AEPlugin<Prefab> {
	/** Set of objects currently being processed by the PrefabPlugin to prevent recursion errors. */
	processing: Set<Prefab>;

	/** Depth after which to truncate objects. */
	level: number;

	/**
	 * @param level Depth after which to truncate objects
	 */
	constructor(level = 2) {
		this.processing = new Set();
		this.level = level;
	}

	test(value: any): value is Prefab {
		return value instanceof Prefab && !this.processing.has(value);
	}

	serialize(value: Prefab, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (depth > this.level || this.processing.size > 1) {
			return `<Prefab "${value.id}">`;
		} else {
			this.processing.add(value);
			let serialized = printer(value, config, indentation, depth, refs);
			this.processing.delete(value);
			return serialized;
		}
	}
}

export class FixturePlugin implements AEPlugin<Fixture> {
	/** Set of objects currently being processed by the FixturePlugin to prevent recursion errors. */
	processing: Set<Fixture>;

	/** Depth after which to truncate objects. */
	level: number;

	/**
	 * @param level Depth after which to truncate objects
	 */
	constructor(level = 2) {
		this.processing = new Set();
		this.level = level;
	}

	test(value: any): value is Fixture {
		return value instanceof Fixture && !this.processing.has(value);
	}

	serialize(value: Fixture, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (depth > this.level || this.processing.size > 1) {
			return `<Fixture "${value.name}" in room ${value.location.id}>`;
		} else {
			this.processing.add(value);
			let serialized = printer(value, config, indentation, depth, refs);
			this.processing.delete(value);
			return serialized;
		}
	}
}

export class InventorySlotPlugin implements AEPlugin<InventorySlot<ItemInstance>> {
	/** Set of objects currently being processed by the InventorySlotPlugin to prevent recursion errors. */
	processing: Set<InventorySlot<ItemInstance>>;

	/** Depth after which to truncate objects. */
	level: number;

	/**
	 * @param level Depth after which to truncate objects
	 */
	constructor(level = 4) {
		this.processing = new Set();
		this.level = level;
	}

	test(value: any): value is InventorySlot<ItemInstance> {
		return value instanceof InventorySlot && !this.processing.has(value);
	}

	serialize(value: InventorySlot<ItemInstance>, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (depth > this.level || this.processing.size > 1) {
			let containing = value.items.length !== 0 ? ` containing ${value.items.map(item => item.getIdentifier()).join(', ')}` : '';
			return `<InventorySlot "${value.id}${containing}">`;
		} else {
			this.processing.add(value);
			let serialized = printer(value, config, indentation, depth, refs);
			this.processing.delete(value);
			return serialized;
		}
	}
}

export class RoomItemPlugin implements AEPlugin<RoomItem> {
	/** Set of objects currently being processed by the RoomItemPlugin to prevent recursion errors. */
	processing: Set<RoomItem>;

	/** Depth after which to truncate objects. */
	level: number;

	/**
	 * @param level Depth after which to truncate objects
	 */
	constructor(level = 2) {
		this.processing = new Set();
		this.level = level;
	}

	test(value: any): value is RoomItem {
		return value instanceof RoomItem && !this.processing.has(value);
	}

	serialize(value: RoomItem, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (depth > this.level || this.processing.size > 1) {
			let container = '';
			if (value.container) {
				if (value.container instanceof RoomItem) {
					container = ` inside RoomItem ${value.container.getIdentifier()}`;
				} else if (value.container instanceof Fixture) {
					container = ` inside Fixture ${value.container.name}`;
				} else if (value.container instanceof Puzzle) {
					container = ` inside Puzzle ${value.container.name}`;
				} else {
					container = ' inside ???';
				}
			}
			return `<${value.quantity}x${isNaN(value.uses) ? "" : ` [${value.uses}x]`} RoomItem of prefab "${value.getIdentifier()}"${container} in room ${value.location.id}>`;
		} else {
			this.processing.add(value);
			let serialized = printer(value, config, indentation, depth, refs);
			this.processing.delete(value);
			return serialized;
		}
	}
}

export class InventoryItemPlugin implements AEPlugin<InventoryItem> {
	/** Set of objects currently being processed by the InventoryItemPlugin to prevent recursion errors. */
	processing: Set<InventoryItem>;

	/** Depth after which to truncate objects. */
	level: number;

	/**
	 * @param level Depth after which to truncate objects
	 */
	constructor(level = 2) {
		this.processing = new Set();
		this.level = level;
	}

	test(value: any): value is InventoryItem {
		return value instanceof InventoryItem && !this.processing.has(value);
	}

	serialize(value: InventoryItem, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (depth > this.level || this.processing.size > 1) {
			let container = '';
			if (value.container) {
				if (value.container instanceof InventoryItem) {
					container = ` inside InventoryItem ${value.container.getIdentifier()}`;
				} else {
					container = ' inside ???';
				}
			}
			return `<${value.quantity}x${isNaN(value.uses) ? "" : ` [${value.uses}x]`} InventoryItem of prefab "${value.getIdentifier()}"${container} on player ${value.player.name}>`;
		} else {
			this.processing.add(value);
			let serialized = printer(value, config, indentation, depth, refs);
			this.processing.delete(value);
			return serialized;
		}
	}
}

export class RoomPlugin implements AEPlugin<Room> {
	/** Set of objects currently being processed by the RoomPlugin to prevent recursion errors. */
	processing: Set<Room>;

	/** Depth after which to truncate objects. */
	level: number;

	/**
	 * @param level Depth after which to truncate objects
	 */
	constructor(level = 2) {
		this.processing = new Set();
		this.level = level;
	}

	test(value: any): value is Room {
		return value instanceof Room && !this.processing.has(value);
	}

	serialize(value: Room, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (depth > this.level || this.processing.size > 1) {
			let occupants = value.occupants.length ? ` occupied by ${value.occupants.map(player => player.name).join(', ')}` : '';
			return `<Room ${value.id}${occupants}>`;
		} else {
			this.processing.add(value);
			let serialized = printer(value, config, indentation, depth, refs);
			this.processing.delete(value);
			return serialized;
		}
	}
}

export class PlayerPlugin implements AEPlugin<Player> {
	/** Set of objects currently being processed by the PlayerPlugin to prevent recursion errors. */
	processing: Set<Player>;

	/** Depth after which to truncate objects. */
	level: number;

	/**
	 * @param level Depth after which to truncate objects
	 */
	constructor(level = 2) {
		this.processing = new Set();
		this.level = level;
	}

	test(value: any): value is Player {
		return value instanceof Player && !this.processing.has(value);
	}

	serialize(value: Player, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (depth > this.level || this.processing.size > 1) {
			return `<Player ${value.name}>`;
		} else {
			this.processing.add(value);
			let serialized = printer(value, config, indentation, depth, refs);
			this.processing.delete(value);
			return serialized;
		}
	}
}

export class EquipmentSlotPlugin implements AEPlugin<EquipmentSlot> {
    /** Set of objects currently being processed by the EquipmentSlotPlugin to prevent recursion errors. */
    processing: Set<EquipmentSlot>;

    /** Depth after which to truncate objects. */
    level: number;

    /**
     * @param level Depth after which to truncate objects
     */
    constructor(level = 8) {
        this.processing = new Set();
        this.level = level;
    }

    test(value: any): value is EquipmentSlot {
        return value instanceof EquipmentSlot && !this.processing.has(value);
    }

    serialize(value: EquipmentSlot, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
        if (depth > this.level) {
            return `<EquipmentSlot ${value.id} (row ${value.row})>`;
        } else {
            this.processing.add(value);
            let serialized = printer(value, config, indentation, depth, refs);
            this.processing.delete(value);
            return serialized;
        }
    }
}

export class RecipePlugin implements AEPlugin<Recipe> {
    /** Set of objects currently being processed by the RecipePlugin to prevent recursion errors. */
    processing: Set<Recipe>;

    /** Depth after which to truncate objects. */
    level: number;

    /**
     * @param level Depth after which to truncate objects
     */
    constructor(level = 4) {
        this.processing = new Set();
        this.level = level;
    }

    test(value: any): value is Recipe {
        return value instanceof Recipe && !this.processing.has(value);
    }

    serialize(value: Recipe, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
        if (depth > this.level) {
            return `<Recipe ${value.ingredientsStrings.join(",")} -> ${value.productsStrings.join(",")})>`;
        } else {
            this.processing.add(value);
            let serialized = printer(value, config, indentation, depth, refs);
            this.processing.delete(value);
            return serialized;
        }
    }
}

export class CollectionPlugin implements AEPlugin<Collection<any, any>> {
	/** Set of objects currently being processed by the CollectionPlugin to prevent recursion errors. */
	processing: Set<Collection<any, any>>;

	constructor() {
		this.processing = new Set();
	}

	test(value: unknown) {
		return value instanceof Collection;
	}

	serialize(value: Collection<any, any>, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		if (this.processing.has(value)) return `[Circular]`;
		this.processing.add(value);
		let map = new Map();
		for (const [key, val] of value) {
			map.set(key, val);
		}
		let serialized = printer(map, config, indentation, depth, refs);
		this.processing.delete(value);
		return serialized;
	}
}

const plugins = [
	new GuildPlugin(),
	new GuildMemberPlugin(),
	new TextChannelPlugin(),
	new DMChannelPlugin(),
	new DurationPlugin(),
	new TimeoutPlugin(),
	new TimerPlugin(),
	new GesturePlugin(),
	new ClientContextPlugin(),
	new DescriptionPlugin(),
	new StatusPlugin(),
	new PuzzlePlugin(),
	new PrefabPlugin(),
	new FixturePlugin(),
	new InventorySlotPlugin(),
	new RoomItemPlugin(),
	new InventoryItemPlugin(),
	new RoomPlugin(),
	new PlayerPlugin(),
	new EquipmentSlotPlugin(),
	new RecipePlugin(),
	new CollectionPlugin(),
];

const truncate = new Set(['game', 'guild', 'member', 'channel', 'spectateChannel', 'timer']);

/** Check if a given Value is "basic" */
function isBasic(value: unknown): value is null | undefined | string | number | boolean | symbol | bigint | Function {
    return (
        value === null ||
        typeof value !== "object"
    );
}

/** Returns a copy of the object to display in console.log with certain properties excluded. */
function prettyObject<T extends any>(object: T, level = 0): T | string {
    if (level >= 3) return `<Truncated [Depth]>`;
    else if (isBasic(object)) return object;
    else if (Array.isArray(object)) {
        const ctor = object.constructor as Constructor<T & any[]>;
        const clone = new ctor();
        for (const item of object)
            clone.push(prettyObject(item, level + 1));
        return clone;
    } else if (object instanceof Set) {
        const ctor = object.constructor as Constructor<T & Set<any>>;
        const clone = new ctor();
        for (const value of object)
            clone.add(prettyObject(value, level + 1));
        return clone;
    } else if (object instanceof Map) {
        const ctor = object.constructor as Constructor<T & Map<any, any>>;
        const clone = new ctor();
        for (const [key, value] of object)
            clone.set(key, prettyObject(value, level + 1));
        return clone;
    } else {
        const clone: T = Object.create(Object.getPrototypeOf(object));
        for (const key of Object.keys(object)) {
            if (truncate.has(key)) {
                clone[key] = `<Truncated [Filtered]>`;
            } else {
                if (object[key] && typeof object[key] === "object") {
                    if (object[key] instanceof Array) {
                        clone[key] = object[key].map((value) => prettyObject(value, level + 1));
                    } else if (object[key] instanceof Set) {
                        const ctor = object[key].constructor as Constructor<T & Set<any>>;
                        clone[key] = new ctor();
                        object[key].forEach(val => clone[key].add(prettyObject(val, level + 1)));
                    } else if (object[key] instanceof Map) {
                        const ctor = object[key].constructor as Constructor<T & Map<any, any>>;
                        clone[key] = new ctor();
                        for (const [k, v] of object[key])
                            clone[key].set(k, prettyObject(v, level + 1));
                    } else clone[key] = prettyObject(object[key], level + 1);
                } else clone[key] = prettyObject(object[key], level + 1);
            }
        }
        return clone;
    }
}

const find = (value: unknown, plugins: readonly AEPlugin<any>[]): { plugin: AEPlugin<unknown>; value: unknown } | null => {
	for (const plugin of plugins) {
		if (plugin.test(value)) {
			return { plugin, value: value as any };
        }
    }
	return null;
};

export class PolyPlugin implements AEPlugin<unknown> {
	test(value: unknown): value is unknown {
		const processed = prettyObject(value);
		const plugin = find(processed, plugins);
		if (plugin) return true;
		return false;
	}

	serialize(value: any, config: AEConfig, indentation: string, depth: number, refs: Refs, printer: AEPrinter) {
		const processed: typeof value = prettyObject(value);
		const search = find(processed, plugins);
		if (search) return search.plugin.serialize(search.value, config, indentation, depth, refs, printer);
		return '';
	}
}

export default class PrettyPrinter {
	/** Game filtering plugins for prettyString */
	readonly gameFilterPlugins: readonly AEPlugin<unknown>[];

    /** Game filtering plugins for miniString */
    readonly miniFilterPlugins: readonly AEPlugin<unknown>[];

	/** Properties truncated by prettyObject */
	readonly truncateProperties: Set<string>;

	/** Returns a copy of the object to display in console.log with certain properties excluded. */
	readonly prettyObject = prettyObject;

	constructor() {
		this.gameFilterPlugins = plugins;
        this.miniFilterPlugins = [
            new RoomPlugin(-Infinity),
            new FixturePlugin(-Infinity),
            new RoomItemPlugin(-Infinity),
            new InventoryItemPlugin(-Infinity),
            new PlayerPlugin(-Infinity),
            new EquipmentSlotPlugin(-Infinity),
            new PuzzlePlugin(-Infinity),
            new InventorySlotPlugin(-Infinity),
            new RecipePlugin(-Infinity),
            new PrefabPlugin(-Infinity),
        ];
		this.truncateProperties = truncate;
		this.prettyObject = prettyObject;
	}

	/** Returns a pretty string representation of the given object with unneeded data filtered out. */
	prettyString(object: any) {
		return format(object, {
			plugins: [...this.gameFilterPlugins],
			indent: 4,
		});
	}

    /** Returns a minified string representation of the given object with unneeded data filtered out. */
    miniString(object: any) {
        return format(object, {
            plugins: [...this.miniFilterPlugins],
            min: true,
        });
    }
}
