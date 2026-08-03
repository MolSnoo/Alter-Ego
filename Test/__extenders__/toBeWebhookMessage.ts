// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Message } from "discord.js";

export default (actual: Message) => {
	if (!('webhookId' in actual))
		throw new TypeError('This must be a message!');

	const pass = actual.webhookId !== null && actual.webhookId !== undefined && typeof actual.webhookId === 'string';
	if (pass) {
		return {
			message: () => `expected ${actual} not to be a webhook message`,
			pass: true,
		};
	} else {
		return {
			message: () => `expected ${actual} to be a webhook message`,
			pass: false,
		};
	}
};
