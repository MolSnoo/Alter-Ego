module.exports.mock = () => {
    jest.mock('googleapis', () => {
        const valuesGet = jest.fn((req, cb) => {
            cb(null, { data: { values: [['cellA1', 'cellB1'], ['cellA2', 'cellB2']] } });
        });

        const spreadsheetsGet = jest.fn((req, cb) => {
            cb(null, { data: { sheets: [{ properties: { title: 'Sheet1' } }] } });
        });

        const valuesUpdate = jest.fn((req, cb) => {
            cb(null, { data: { updatedRange: req.range, updatedRows: (req.resource && req.resource.values) ? req.resource.values.length : 0 } });
        });

        const valuesAppend = jest.fn((req, cb) => {
            cb(null, { data: { updates: { updatedRange: req.range } } });
        });

        const valuesBatchUpdate = jest.fn((req, cb) => {
            cb(null, { data: { responses: [] } });
        });

        const spreadsheetsBatchUpdate = jest.fn((req, cb) => {
            cb(null, { data: { replies: [] } });
        });

        const sheetsFactory = jest.fn().mockReturnValue({
            spreadsheets: {
                values: {
                    get: valuesGet,
                    update: valuesUpdate,
                    append: valuesAppend,
                    batchUpdate: valuesBatchUpdate
                },
                get: spreadsheetsGet,
                batchUpdate: spreadsheetsBatchUpdate
            }
        });

        const fakeAuthClient = { fakeAuth: true };
        const auth = {
            JWT: jest.fn(() => {
                return fakeAuthClient;
            })
        };

        return {
            google: {
                sheets: sheetsFactory,
                auth: auth
            },
            mockInternals: {
                valuesGet,
                spreadsheetsGet,
                valuesUpdate,
                valuesAppend,
                valuesBatchUpdate,
                spreadsheetsBatchUpdate,
                sheetsFactory,
                fakeAuthClient,
                auth
            }
        };
    });

    const mocked = require('googleapis');
    const internals = mocked.mockInternals || {};

    return {
        sheetsFactory: mocked.google.sheets,
        valuesGet: internals.valuesGet,
        spreadsheetsGet: internals.spreadsheetsGet,
        valuesUpdate: internals.valuesUpdate,
        valuesAppend: internals.valuesAppend,
        valuesBatchUpdate: internals.valuesBatchUpdate,
        spreadsheetsBatchUpdate: internals.spreadsheetsBatchUpdate,
        auth: internals.auth,
        fakeAuthClient: internals.fakeAuthClient
    };
};
