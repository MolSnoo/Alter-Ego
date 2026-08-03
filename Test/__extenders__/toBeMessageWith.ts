// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Message } from "discord.js";

/**
 * @param actual
 * @param username - The username the webhook message should have.
 * @param avatarURL - The avatar URL the webhook message should have.
 * @param content - The text content the webhook message should have.
 */
export default (actual: Message, username: string, avatarURL: string, content: string) => {
	if (!('webhookId' in actual))
		throw new TypeError('This must be a message!');

	let returnMessage = `Arguments meet expectations`;
	const usernameMatches = actual.author.username === username;
	const avatarURLMatches = actual.author.avatarURL() === avatarURL;
	const contentMatches = actual.content === content;
	if (!usernameMatches) returnMessage = `expected username to be "${username}", received "${actual.author.username}"`;
	else if (!avatarURLMatches) returnMessage = `expected avatar URL to be "${avatarURL}", received "${actual.author.avatarURL()}"`;
	else if (!contentMatches) returnMessage = `expected content to be "${content}", received "${actual.content}"`;

	const pass = usernameMatches && avatarURLMatches && contentMatches;
	return {
		message: () => returnMessage,
		pass: pass
	};
};
