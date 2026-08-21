// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Command from "./Command.ts";
import type BotContext from "./BotContext.ts";
import type { ValidatedInvocation } from "./Invocation.ts";

/**
 * New-generation command usable by the bot.
 */
export default class BotCommand<I extends ValidatedInvocation> extends Command<BotContext, I> {
}
