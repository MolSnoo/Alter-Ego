import { Collection, Guild, GuildMember, TextChannel } from "discord.js";
import { format } from "pretty-format";
import { Duration } from 'luxon';
import humanize from 'humanize-duration';
import Timer from "./Timer.js";
import Status from "../Data/Status.js";
import Gesture from "../Data/Gesture.js";
import Player from "../Data/Player.js";
import Room from "../Data/Room.js";
import BotContext from "./BotContext.js";

/** @typedef {import('pretty-format').NewPlugin} Plugin */
/** @typedef {Plugin['test']} Test */
/** @typedef {Plugin['serialize']} Serialize */

/** @type {Plugin} */
class GameFilterPlugin {
    /**
     * List of formatters used by the SimpleFilterPlugin.
     * @type {FormatterPairs}
     */
    formatters;

    /**
     * Set of objects currently being processed by the ComplexFilterPlugin to prevent recursion errors.
     * @type {Set<any>}
     */
    processing;

    /**
     * List of constructor names accepted by SimpleFilterPlugin.
     * @type {Set<string>}
     */
    constructors;

    /** @constructor */
    constructor() {
        this.processing = new Set();
        this.constructors = new Set([
            "Guild",
            "GuildMember",
            "TextChannel",
            "Duration",
            "Timeout",
            "Timer",
            "Status",
            "Gesture",
            "Room",
            "Player",
            "BotContext",
        ]);
        this.formatters = [
            [(value) => value instanceof Guild, (/** @type {Guild} */ value) => `<Guild "${value.name || "unknown"}">`],
            [
                (value) => value instanceof GuildMember,
                (/** @type {GuildMember} */ value) => `<GuildMember "${value.displayName || "unknown"}">`,
            ],
            [
                (value) => value instanceof TextChannel,
                (/** @type {TextChannel} */ value) => `<TextChannel "${value.name || "unknown"}">`,
            ],
            [
                (value) => Duration.isDuration(value),
                (/** @type {Duration} */ value) =>
                    `<Duration ${humanize(value.as('milliseconds')) || "unknown"}>`,
            ],
            [
                // @ts-ignore
                (value) => value.constructor.name === "Timeout",
                // @ts-ignore
                (/** @type {NodeJS.Timeout} */ value) => `<Timeout ${value._idleTimeout}ms>`,
            ],
            [(value) => value instanceof Timer, (/** @type {Timer} */ value) => `<Timer ${value.timerDuration}ms>`],
            [
                (value) => value instanceof Status,
                (/** @type {Status} */ value) =>
                    `<Status "${value.id}" lasting ${humanize(value.duration?.as('milliseconds')) || "unknown"}>`,
            ],
            [(value) => value instanceof Gesture, (/** @type {Gesture} */ value) => `<Gesture "${value.id}">`],
            [
                (value) => value instanceof Player,
                (/** @type {Player} */ value, config, indentation, depth, refs, printer) => {
                    if (depth > 2) {
                        return `<Player ${value.name}>`;
                    } else {
                        this.processing.add(value);
                        let serialized = printer(value, config, indentation, depth, refs);
                        this.processing.delete(value);
                        return serialized;
                    }
                },
            ],
            [
                (value) => value instanceof Room,
                (/** @type {Room} */ value, config, indentation, depth, refs, printer) => {
                    if (depth > 2) {
                        let occupants = value.occupants.length
                            ? ` occupied by ${value.occupants.map((player) => player.name).join(", ")}`
                            : "";
                        return `<Room ${value.id}${occupants}>`;
                    } else {
                        this.processing.add(value);
                        let serialized = printer(value, config, indentation, depth, refs);
                        this.processing.delete(value);
                        return serialized;
                    }
                },
            ],
            [(value) => value instanceof BotContext, (/** @type {BotContext} */ value) => `<BotContext>`],
        ];
    }

    /** @type {Test} */
    test(value) {
        if (value === null || typeof value !== "object") return false;
        if (this.processing.has(value)) return false;
        return this.constructors.has(value.constructor?.name);
    }

    /** @type {Serialize} */
    serialize(value, config, indentation, depth, refs, printer) {
        for (const [tester, formatter] of this.formatters) {
            if (tester(value)) return formatter(value, config, indentation, depth, refs, printer);
        }

        return `<${value.constructor?.name || "Unknown"}>`;
    }
}

export default class PrettyPrinter {
    /**
     * Game filtering filter plugin for prettyString
     * @type {Plugin}
     */
    gameFilterPlugin;

    /**
     * Properties truncated by prettyObject
     * @type {Set<string>}
     */
    truncateProperties;

    constructor() {
        this.gameFilterPlugin = new GameFilterPlugin();
        this.truncateProperties = new Set([
            "game",
            "guild",
            "member",
            "channel",
            "spectateChannel",
            "timer",
        ]);
    }

    /**
     * Returns a pretty string representation of the given object with unneeded data filtered out.
     * @param {any} object - The object to display.
     */
    prettyString(object) {
        return format(object, {
            plugins: [this.gameFilterPlugin],
            indent: 4,
        });
    }

    /**
     * Returns a copy of the object to display in console.log with certain properties excluded.
     * @param {any} object - The object to display.
     * @param {number} level - Level of recursion, for internel use only.
     */
    prettyObject(object, level = 0) {
        if (level >= 3) return object;
        const clone = Object.create(Object.getPrototypeOf(object));
        for (const key of Object.keys(object)) {
            if (this.truncateProperties.has(key)) {
                clone[key] = `<Truncated>`;
            } else {
                if (object[key] && typeof object[key] === "object") {
                    if (object[key] instanceof Array) {
                        clone[key] = object[key].map((value) => this.prettyObject(value, level + 1))
                    } else if (object[key] instanceof Collection) {
                        clone[key] = new Collection();
                        for (const [k, v] of object[key]) {
                            clone[key].set(k, this.prettyObject(v, level + 1))
                        }
                    } else if (object[key] instanceof Map) {
                        clone[key] = new Map();
                        for (const [k, v] of object[key]) {
                            clone[key].set(k, this.prettyObject(v, level + 1))
                        }
                    } else clone[key] = this.prettyObject(object[key], level + 1)
                } else clone[key] = object[key];
            }
        }
        return clone;
    }
}
