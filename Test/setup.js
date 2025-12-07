import { afterEach, vi, expect } from 'vitest';

import credentials from './__mocks__/configs/credentials.js';
import demodata from './__mocks__/configs/demodata.js';
import playerdefaults from './__mocks__/configs/playerdefaults.js';
import serverconfig from './__mocks__/configs/serverconfig.js';
import settings from './__mocks__/configs/settings.js';

import toBeWithinRange from './__extenders__/toBeWithinRange.js';
import toHaveSize from './__extenders__/toHaveSize.js';

vi.mock('./Configs/credentials.json', () => ({ default: credentials }));
vi.mock('./Configs/demodata.json', () => ({ default: demodata }));
vi.mock('./Configs/playerdefaults.json', () => ({ default: playerdefaults }));
vi.mock('./Configs/serverconfig.json', () => ({ default: serverconfig }));
vi.mock('./Configs/settings.json', () => ({ default: settings }));

afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
});

expect.extend({
    toBeWithinRange,
    toHaveSize
});