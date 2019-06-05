const test_parser = require("./test_parser.js");

exports.runTests = function () {
    test_parser.run();
    console.log("All tests passed.");
}