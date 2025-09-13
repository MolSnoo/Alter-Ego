const _app_root_path_require_ = require('app-root-path').require;
global.include = (path) => {
    if (path.startsWith("Configs/")) {
        const trimmedPath = path.endsWith('.json') ? path.slice(0, -'.json'.length) : path;
        return _app_root_path_require_(`Test/${trimmedPath}`);
    } else {
        return _app_root_path_require_(path);
    }
};

afterEach(() => {
    jest.clearAllMocks();
});