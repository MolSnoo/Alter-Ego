// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Interface for args object to bench.
 */
interface benchArgs<F extends (...args: any) => any, T = unknown> {
    /** A function, taking in the given args. */
    function: F;
    /** The "this" paramter to F. Defaults to undefined. */
    context?: T;
    /** Args to F. Defaults to an empty array. */
    args?: Parameters<F>;
    /** The iterations to run for. Defaults to 1000. */
    iterations?: number;
    /** Whether or not bench should immediately return a single invocation of the function instead of benchmarking. */
    shortcircuit?: boolean;
}

/**
 * Utility function for benchmarking. Run function() iterations number of times, returning the bigint representing the duration in nanoseconds of the fastest call.
 * @param args - The arguments to provide to the benchmarking function.
 */
export function bench<F extends (...args: any) => any>(args: benchArgs<F>): [ReturnType<F>, bigint] {
    const f = args.function;
    const c = args.context;
    const a = args.args ?? [] as const;
    const n = args.iterations ?? 1000;
    const s = args.shortcircuit ?? true;
    // short-circuit outside of DEBUG
    if (s)
        return [f.apply(c, a), 0n];
    // try to warmup
    for (let i = 0; i < 10; i++)
        f.apply(c, a);
    // benchmark
    let output: [ReturnType<F>, bigint];
    for (let i = 0; i < n; i++) {
        const start = process.hrtime.bigint();
        const out = f.apply(c, a);
        const end = process.hrtime.bigint();
        if (output === undefined || output[1] >= (end - start))
            output = [out, end - start];
    }
    // return
    return output;
}