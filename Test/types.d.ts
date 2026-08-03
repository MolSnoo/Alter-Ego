// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Game from "../Data/Game.ts";
import "vitest";

declare global {
    var game: Game;
}

interface CustomMatchers<R = unknown> {
    toBeInvokedWith: (...args: any) => R;
    toBeLength: (length: number) => R;
    toHaveSize: (size: number) => R;
    toBeWithinRange: (floor: number, ceiling: number) => R;
    toBeWebhookMessage: () => R;
    toBeMessageWith: (username: string, avatarURL: string, content: string) => R;
}

declare module "vitest" {
    interface Matchers<T = any> extends CustomMatchers<T> {}
}

export {};
