// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Command from "./Command.ts";
import type { ValidatedInvocation } from "./Invocation.ts";
import type ModeratorContext from "./ModeratorContext.ts";

/**
 * New-generation command usable by a moderator.
 */
export default class ModeratorCommand<I extends ValidatedInvocation> extends Command<ModeratorContext, I> {
}
