// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Command from "./Command.ts";
import type { ValidatedInvocation } from "./Invocation.ts";
import type PlayerContext from "./PlayerContext.ts";

/**
 * New-generation command usable by a player.
 */
export default class PlayerCommand<I extends ValidatedInvocation> extends Command<PlayerContext, I> {
}
