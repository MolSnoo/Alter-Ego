// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Get the error message from any arbitrary error. It is safe to pass the output of try-catch into this function.
 * @param error - The error to get the message from.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    else return String(error);
}

/**
 * Get the error stack from any arbitrary error. It is safe to pass the output of try-catch into this function.
 * @param error - The error to get the message from.
 */
export function getErrorStack(error: unknown): string {
    if (error instanceof Error) return error.stack;
    else return String(error);
}

/**
 * Get an error from any arbitrary error. It is safe to pass the output of try-catch into this function.
 * @param error - The error to return from.
 */
export function convertToError(error: unknown): Error {
    if (error instanceof Error) return error;
    else return new Error(String(error));
}

/**
 * Adds an error to an array of pre-existing errors. It is safe to pass the output of try-catch into this function.
 * @param errors - An array of pre-existing errors.
 * @param error - The error to add to the array.
 */
export function addToErrors(errors: Error[], error: unknown): void {
    if (error instanceof Array)
        errors.push(...error);
    else
        errors.push(convertToError(error));
}

/**
 * Determine if an object has a given key.
 * @param obj - The object to check.
 * @param key - The key to check for.
 */
export function objectHasKey<T extends object, K extends PropertyKey>(obj: T, key: K): obj is T & Record<K, unknown> {
    return Object.hasOwn(obj, key);
}

/**
 * Returns true if the error has a code property. It is safe to pass the output of try-catch into this function.
 * @param error - The error to check.
 */
export function errorHasCode(error: unknown): error is object & Record<'code', number> {
    return error !== null && typeof error === 'object' && objectHasKey(error, 'code');
}
