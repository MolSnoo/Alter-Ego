// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Client } from "discord.js";
import type ClientEvent from "./ClientEvent.ts";
import { getErrorStack } from "../Modules/errorHandler.ts";

/**
 * Represents the client event handler as a singleton.
 */
export default class ClientEventHandler {
    /**
     * The single instance of the event handler that can exist.
     */
    static #instance: ClientEventHandler;
    /**
     * The client handling the events.
     */
    readonly #client: Client;

    private constructor(client: Client) {
        this.#client = client;
    }

    /**
     * Gets the event handler, or creates it if it doesn't exist.
     * @param client - The client associated with the event handler.
     */
    public static Instance(client: Client) {
        if (ClientEventHandler.#instance) return ClientEventHandler.#instance;
        else return this.#instance = new this(client);
    }

    /**
     * The single instance of the event handler that can exist.
     */
    public static get instance() {
        return ClientEventHandler.#instance;
    }

    /**
     * Handles the given client event when it occurs.
     * @param event - The event to handle.
     */
    public async handle(event: ClientEvent): Promise<void> {
        const avoidException = async (...args: any) => {
            try {
                await event.execute(...args);
            }
            catch (error) {
                /**
                 * @privateRemarks
                 * Discarding the error stack trace is extremely unhelpful when debugging errors that occur within events.
                 * This can be reverted before merge, but please keep in mind that this is the only way to catch the
                 * stack trace of a command validator error.
                 * - AC
                 */
                console.error(
                    `An error occurred in event "${event.name}".\n${getErrorStack(error)}\n`
                );
            }
        };

        if (event.once)
            this.#client.once(event.name, (...args) => avoidException(...args));
        else
            this.#client.on(event.name, (...args) => avoidException(...args));
    }
}
