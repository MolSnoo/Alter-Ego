// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Command from "./Command.ts";
import type EligibleContext from "./EligibleContext.ts";
import type { ValidatedInvocation } from "./Invocation.ts";

/**
 * New-generation command usable by a Discord user with the eligible role.
 */
export default class EligibleCommand<I extends ValidatedInvocation> extends Command<EligibleContext, I> {
}
