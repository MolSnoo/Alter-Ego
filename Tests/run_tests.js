const test_cell_responses = include(`${settings.testsDir}/test_cell_responses.js`);
const test_parser = include(`${settings.testsDir}/test_parser.js`);
const test_whispers = include(`${settings.testsDir}/test_whispers.js`);

exports.runTests = async function (bot) {
    test_cell_responses.run();
    test_parser.run();
    await test_whispers.run(bot);
    console.log("All tests passed.");
};
