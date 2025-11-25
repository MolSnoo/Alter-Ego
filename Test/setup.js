const { expect } = require('@jest/globals');
const { toBeWithinRange } = require('./__extenders__/toBeWithinRange.js');
const { toHaveSize } = require('./__extenders__/toHaveSize.js');

const _app_root_path_require_ = require('app-root-path').require;
global.include = (path) => {
    if (path.startsWith("Configs/")) {
        const trimmedPath = path.endsWith('.json') ? path.slice(0, -'.json'.length) : path;
        return _app_root_path_require_(`Test/${trimmedPath}`);
    }
    else if (path === "game.json") {
        return _app_root_path_require_(`Test/Mocks/game.js`);
    }
    else {
        return _app_root_path_require_(path);
    }
};

afterEach(() => {
    jest.clearAllMocks();
});

expect.extend({
    toBeWithinRange,
    toHaveSize
});
