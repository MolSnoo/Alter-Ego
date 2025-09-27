const InventoryItem = include("Data/InventoryItem");
const playerdefaults = include('Configs/playerdefaults.json');

module.exports.mock = {
    cure: jest.fn(),
    getAttributeStatusEffects: jest.fn(),
    inflict: jest.fn(),
    member: {},
    setOffline: jest.fn(),
    statusString: {
        includes: jest.fn()
    },
    inventory: (() => {
        return playerdefaults.defaultInventory.map(item => 
            new InventoryItem(
                module.exports.mock,
                (item[0] === "NULL") ? null : undefined, // TODO: mock prefabs
                item[1].replace("#", "1"), // TODO: allow for iterative instantiation, rather than fixed identifiers
                item[2],
                (item[3] === "") ? null : undefined, // TODO: handle containers
                (item[4] && !isNaN(Number(item[4]))) ? Number(item[4]) : null,
                (item[5] && !isNaN(Number(item[5]))) ? Number(item[5]) : null,
                item[6],
                null
            ) // TODO: provide equippedItem
        )
    })()
};