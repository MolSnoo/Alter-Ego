const test_cell_responses = require("./test_cell_responses.js");
const test_parser = require("./test_parser.js");

exports.runTests = function () {
    test_cell_responses.run();
    test_parser.run();
    console.log("All tests passed.");
};
