export {};

declare global {

	/**
	 * Represents a Discord activity.
	 * @property {string} type - The type of activity. {@link https://discord.com/developers/docs/events/gateway-events#activity-object-activity-types}
	 * @property {string} string - The name of the activity.
	 * @property {string} [url] - The URL of the activity, if applicable.
	 */
	interface Activity {
		type: string;
		string: string;
		url?: string;
	}

	/**
	 * Represents a log entry for a command executed in the game.
	 * @property {Date} timestamp - The date and time when the command was executed.
	 * @property {string} author - Who issued the command.
	 * @property {string} content - The content of the command.
	 */
	interface CommandLogEntry {
		timestamp: Date;
		author: string;
		content: string;
	}
}