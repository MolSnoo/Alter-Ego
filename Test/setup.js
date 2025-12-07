import { afterEach, vi, expect } from 'vitest';
import toBeWithinRange from './__extenders__/toBeWithinRange.js';
import toHaveSize from './__extenders__/toHaveSize.js';

afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
});

expect.extend({
    toBeWithinRange,
    toHaveSize
});