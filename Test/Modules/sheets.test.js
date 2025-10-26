const googleapisMock = include('Test/Mocks/googleapis').mock();
const sheets = include('Modules/sheets.js');

describe('sheets module', () => {
    describe('getData', () => {
        test('calls values.get with correct request and forwards response to callback', (done) => {
            const dataOperation = jest.fn((response) => {
                expect(response.data.values).toEqual([['cellA1', 'cellB1'], ['cellA2', 'cellB2']]);
                expect(googleapisMock.valuesGet).toHaveBeenCalled();
                const req = googleapisMock.valuesGet.mock.calls[0][0];
                expect(req.range).toBe('Sheet1!A1:B2');
                expect(req.valueRenderOption).toBe('FORMATTED_VALUE');
                expect(req.dateTimeRenderOption).toBe('SERIAL_NUMBER');
                expect(req.auth).toBe(googleapisMock.fakeAuthClient);
                done();
            });

            sheets.getData('Sheet1!A1:B2', dataOperation, 'MY_SPREADSHEET_ID');
        });
    });

    describe('getDataWithProperties', () => {
        test('calls spreadsheets.get with includeGridData true and forwards response', (done) => {
            const dataOperation = jest.fn((response) => {
                expect(response.data.sheets).toBeDefined();
                expect(googleapisMock.spreadsheetsGet).toHaveBeenCalled();
                const req = googleapisMock.spreadsheetsGet.mock.calls[0][0];
                expect(Array.isArray(req.ranges)).toBe(true);
                expect(req.ranges[0]).toBe('Sheet1!A1:B2');
                expect(req.includeGridData).toBe(true);
                expect(req.auth).toBe(googleapisMock.fakeAuthClient);
                done();
            });

            sheets.getDataWithProperties('Sheet1!A1:B2', dataOperation, 'MY_SPREADSHEET_ID');
        });
    });

    describe('updateData', () => {
        test('calls values.update with provided data and resolves via callback', (done) => {
            const payload = [['a', 'b'], ['c', 'd']];
            const dataOperation = jest.fn((response) => {
                expect(response.data.updatedRange).toBe('Sheet1!A1:B2');
                done();
            });

            sheets.updateData('Sheet1!A1:B2', payload, dataOperation);
            expect(googleapisMock.valuesUpdate).toHaveBeenCalled();
            const req = googleapisMock.valuesUpdate.mock.calls[0][0];
            expect(req.range).toBe('Sheet1!A1:B2');
            expect(req.valueInputOption).toBe('RAW');
            expect(req.resource.values).toBe(payload);
        });
    });

    describe('batchUpdateData', () => {
        test('invokes values.batchUpdate and resolves the returned promise', async () => {
            const data = [
                { range: 'Sheet1!A1:B1', values: [['x', 'y']] },
                { range: 'Sheet1!A2:B2', values: [['1', '2']] }
            ];

            await sheets.batchUpdateData(data);
            expect(googleapisMock.valuesBatchUpdate).toHaveBeenCalled();
            const req = googleapisMock.valuesBatchUpdate.mock.calls[0][0];
            expect(req.resource.valueInputOption).toBe('RAW');
            expect(req.resource.data).toBe(data);
        });
    });

    describe('batchUpdate', () => {
        test('sends batch update requests to spreadsheets.batchUpdate and resolves', async () => {
            const requests = [{ repeatCell: {} }, { addSheet: {} }];
            await sheets.batchUpdate(requests, null, 'ANOTHER_SHEET_ID');
            expect(googleapisMock.spreadsheetsBatchUpdate).toHaveBeenCalled();
            const req = googleapisMock.spreadsheetsBatchUpdate.mock.calls[0][0];
            expect(req.resource.requests).toBe(requests);
            expect(req.spreadsheetId).toBe('ANOTHER_SHEET_ID');
        });
    });

    describe('appendRows', () => {
        test('appends rows using values.append and forwards the response', (done) => {
            const rows = [['one', 'two', 'three']];
            const dataOperation = jest.fn((response) => {
                expect(googleapisMock.valuesAppend).toHaveBeenCalled();
                done();
            });

            sheets.appendRows('Sheet1!A:A', rows, dataOperation);
            const req = googleapisMock.valuesAppend.mock.calls[0][0];
            expect(req.range).toBe('Sheet1!A:A');
            expect(req.valueInputOption).toBe('RAW');
            expect(req.insertDataOption).toBe('INSERT_ROWS');
            expect(req.resource.values).toBe(rows);
        });
    });
});