const settings = include('settings.json');

const test_cell_responses = include(`${settings.testsDir}/test_cell_responses.js`);
const test_parse_description = include(`${settings.testsDir}/test_parse_description.js`);
const test_remove_item = include(`${settings.testsDir}/test_remove_item.js`);
const test_add_item = include(`${settings.testsDir}/test_add_item.js`);
const test_calculate_move_time = include(`${settings.testsDir}/test_calculate_move_time.js`);
const test_take_drop = include(`${settings.testsDir}/test_take_drop.js`);
const test_stash_unstash = include(`${settings.testsDir}/test_stash_unstash.js`);
const test_recalculate_stats = include(`${settings.testsDir}/test_recalculate_stats.js`);
const test_finder = include(`${settings.testsDir}/test_finder.js`);

exports.runTests = async function (bot) {
    //test_cell_responses.run();
    //test_parse_description.run();
    //test_remove_item.run();
    //test_add_item.run();
    //test_calculate_move_time.run();
    //test_take_drop.run();
    //test_stash_unstash.run();
    //test_recalculate_stats.run(bot);
    //await test_finder.run(bot);
    console.log("All tests passed.");
};
