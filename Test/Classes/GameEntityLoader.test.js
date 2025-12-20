describe('GameEntityLoader test', () => {
    afterAll(() => {
        game.entityLoader.clearAll();
    });
        
    describe('loadRooms test', () => {
        describe('standard room response', () => {
            test('errorChecking true', async () => {
                /** @type {Error[]} */
                let errors = [];
                const roomCount = await game.entityLoader.loadRooms(true, errors);
                expect(errors).toEqual([]);
                expect(roomCount).toBe(198);
            });
        });
    });
});