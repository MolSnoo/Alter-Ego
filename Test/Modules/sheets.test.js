var googleapis_mock = include('Test/Mocks/googleapis').mock();

const { google } = require('googleapis');
const sheets = include('Modules/sheets.js');

describe('sheets module', () => {
    test('initialization', async () => {
        expect(google.sheets).toHaveBeenCalledWith('v4');
    });
});