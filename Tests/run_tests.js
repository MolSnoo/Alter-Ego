const settings = include('settings.json');

const test_cell_responses = include(`${settings.testsDir}/test_cell_responses.js`);
const test_parse_description = include(`${settings.testsDir}/test_parse_description.js`);
const test_remove_item = include(`${settings.testsDir}/test_remove_item.js`);
const test_add_item = include(`${settings.testsDir}/test_add_item.js`);
const test_whispers = include(`${settings.testsDir}/test_whispers.js`);
const test_calculate_move_time = include(`${settings.testsDir}/test_calculate_move_time.js`);
const test_queuer = include(`${settings.testsDir}/test_queuer.js`);
const test_insert_item = include(`${settings.testsDir}/test_insert_item.js`);

exports.runTests = async function (bot) {
    //test_cell_responses.run();
    test_parse_description.run();
    //test_remove_item.run();
    //test_add_item.run();
    //await test_whispers.run(bot);
    //test_calculate_move_time.run();
    test_queuer.run();
    test_insert_item.run();
    console.log("All tests passed.");
};
