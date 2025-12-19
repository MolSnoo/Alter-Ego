import dayjs from "dayjs";
import { Guild, GuildMember, TextChannel } from "discord.js";
import { format } from "pretty-format";
import Timer from "./Timer.js";
import Status from "../Data/Status.js";
import Gesture from "../Data/Gesture.js";
import Player from "../Data/Player.js";
import Room from "../Data/Room.js";

/** @type {import('pretty-format').NewPlugin} */
class SimpleFilterPlugin {
    /**
     * List of formatters used by the SimpleFilterPlugin.
     * @type {FormatterPairs}
     */
    formatters;

    /**
     * List of constructor names accepted by SimpleFilterPlugin.
     * @type {Set<string>}
     */
    constructors;

    /** @constructor */
    constructor() {
        this.constructors = new Set([
            "Guild",
            "GuildMember",
            "TextChannel",
            "Duration",
            "Timeout",
            "Timer",
            "Status",
            "Gesture",
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
                (value) => dayjs.isDuration(value),
                (/** @type {import('dayjs/plugin/duration.js').Duration} */ value) =>
                    `<Duration ${value.humanize() || "unknown"}>`,
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
                    `<Status "${value.id}" lasting ${value.duration?.humanize() || "unknown"}>`,
            ],
            [(value) => value instanceof Gesture, (/** @type {Gesture} */ value) => `<Gesture "${value.id}">`],
        ];
    }

    /** @type {import('pretty-format').NewPlugin['test']} */
    test(value) {
        if (value === null || typeof value !== "object") return false;
        return this.constructors.has(value.constructor?.name);
    }

    /** @type {import('pretty-format').NewPlugin['serialize']} */
    serialize(value) {
        for (const [tester, formatter] of this.formatters) {
            if (tester(value)) return formatter(value);
        }

        return `<${value.constructor?.name || "Unknown"}>`;
    }
}

/** @type {import('pretty-format').NewPlugin} */
class ComplexFilterPlugin {
    /**
     * List of formatters used by the ComplexFilterPlugin.
     * @type {FormatterPairs}
     */
    formatters;

    /**
     * Set of objects currently being processed by the ComplexFilterPlugin to prevent recursion errors.
     * @type {Set<any>}
     */
    processing;

    /**
     * List of constructor names accepted by ComplexFilterPlugin.
     * @type {Set<string>}
     */
    constructors;

    /** @constructor */
    constructor() {
        this.formatters = [
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
        ];
        this.processing = new Set();
        this.constructors = new Set(["Player", "Room"]);
    }

    /** @type {import('pretty-format').NewPlugin['test']} */
    test(value) {
        if (value === null || typeof value !== "object") return false;
        if (this.processing.has(value)) return false;
        return this.constructors.has(value.constructor?.name);
    }

    /** @type {import('pretty-format').NewPlugin['serialize']} */
    serialize(value, config, indentation, depth, refs, printer) {
        for (const [tester, formatter] of this.formatters) {
            if (tester(value)) return formatter(value, config, indentation, depth, refs, printer);
        }

        return `<${value.constructor?.name || "Unknown"}>`;
    }
}

export default class PrettyPrinter {
    /**
     * "Simple" filter plugin for prettyString
     * @type {import('pretty-format').NewPlugin}
     */
    simpleFilterPlugin;

    /**
     * "Complex" filter plugin for prettyString
     * @type {import('pretty-format').NewPlugin}
     */
    complexFilterPlugin;

    constructor() {
        this.simpleFilterPlugin = new SimpleFilterPlugin();
        this.complexFilterPlugin = new ComplexFilterPlugin();
    }

    /**
     * Returns a pretty string representation of the given object with unneeded data filtered out.
     * @param {any} object - The object to display.
     */
    prettyString(object) {
        return format(object, {
            plugins: [this.simpleFilterPlugin, this.complexFilterPlugin],
            indent: 4,
        });
    }

    /**
     * Returns a copy of the object to display in console.log with certain properties excluded.
     * @param {any} object - The object to display.
     */
    prettyObject(object) {
        const properties = new Set(["game", "guild", "member", "channel", "spectateChannel", "timer", "exitCollection"]);
        const clone = {};
        for (const key of Object.keys(object)) {
            if (properties.has(key)) {
                clone[key] = `<Truncated>`;
            } else {
                clone[key] = object[key];
            }
        }
        return clone
    }
}
