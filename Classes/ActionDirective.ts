// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Data/Action.ts";
import type Game from "../Data/Game.ts";
import type Player from "../Data/Player.ts";
import type Room from "../Data/Room.ts";
import type Whisper from "../Data/Whisper.ts";
import { createHash } from "crypto";

/**
 * Represents an action to perform when a Discord Interaction is executed.
 */
export default class ActionDirective<T extends Action = Action> {
    /**
     * The action this directive should create.
     */
    readonly action: Constructor<T>;
    /**
     * The player the action should be constructed with by default.
     */
    readonly #player?: Player;
    /**
     * The raw arguments provided for this action.
     */
    readonly #args: string[];
    /**
     * A custom ID for this action directive based on its action and arguments.
     * This is used to identify the action directive when an interaction is received.
     */
    readonly customId: string;

    /**
     * @param action - The action this directive should create.
     * @param args - The raw arguments provided for this action. These will be used to generate the custom ID, and will be passed to the action's perform function.
     * @param user - The user this directive is being generated for. This is included in the hash to ensure that directives generated for different user with the same action and arguments will have different custom IDs, preventing conflicts.
     * @param player - The player the action should be constructed with by default.
     * @throws {TypeError} If the provided action is not a subclass of Action.
     */
    constructor(action: T, args: any[], user: User, player?: Player) {
        this.action = action.constructor as Constructor<T>;
        this.#player = player;
        this.#args = args;
        this.customId = this.#generateCustomId(user);
    }

    /**
     * Generates a custom ID for this action directive based on its action and arguments. This is used to identify the directive when an interaction is received.
     * @param user - The user this directive is being generated for. This is included in the hash to ensure that directives generated for different user with the same action and arguments will have different custom IDs, preventing conflicts.
     */
    #generateCustomId(user: User) {
        const input = [user.id].concat(this.#args).join(",");
        const hashHex = createHash("sha256").update(input).digest("hex");
        return `${this.action.name}:${hashHex}`;
    }

    /**
     * Creates an instance of the given action.
     * @param game - The game this belongs to.
     * @param message - The message that initiated the action.
     * @param player - The player performing the action.
     * @param location - The location where this action is being performed.
     * @param forced - Whether or not the action was performed by someone other than the player themselves.
     * @param whisper - The whisper where this action is being performed, if applicable.
     * @param user - The user who created the action, if applicable.
     */
    createAction(game: Game, message: UserMessage, player: Player, location: Room, forced: boolean, whisper?: Whisper, user?: User) {
        return new this.action(game, message, player, location, forced, whisper, user);
    }

    getPlayerName() {
        return this.#player?.name;
    }

    getArgs() {
        return this.#args;
    }
}
