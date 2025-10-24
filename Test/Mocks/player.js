const InventoryItem = include("Data/InventoryItem");
const EquipmentSlot = include("Data/EquipmentSlot");
const Prefab = include("Data/Prefab");
const playerdefaults = include('Configs/playerdefaults.json');
const demodata = include('Configs/demodata.json');

const prefabMap = {};
if (demodata.prefabs) {
    demodata.prefabs.forEach(prefabArray => {
        const prefab = new Prefab(
            prefabArray[0],
            prefabArray[1],
            prefabArray[2],
            prefabArray[3],
            prefabArray[4],
            prefabArray[5] === "TRUE",
            Number(prefabArray[6]),
            Number(prefabArray[7]),
            prefabArray[8] === "TRUE",
            prefabArray[9],
            prefabArray[10] ? Number(prefabArray[10]) : null,
            prefabArray[11] ? prefabArray[11].split(',') : [],
            prefabArray[12] ? prefabArray[12].split(',') : [],
            prefabArray[13],
            prefabArray[14] === "TRUE",
            prefabArray[15] ? prefabArray[15].split(',') : [],
            prefabArray[16] ? prefabArray[16].split(',') : [],
            prefabArray[17] ? prefabArray[17].split(',') : [],
            prefabArray[18] ? prefabArray[18].split(',') : [],
            prefabArray[19] ? JSON.parse(prefabArray[19]) : [],
            prefabArray[20],
            prefabArray[21],
            prefabArray[22]
        );
        prefabMap[prefab.id] = prefab;
    });
}

module.exports.createInventory = (prefabs) => {
    const inventory = [];
    
    playerdefaults.defaultInventory.forEach((item, index) => {
        const [prefabId, identifier, equipmentSlotName, containerName, quantity, uses, description] = item;
        
        const equipmentSlot = new EquipmentSlot(equipmentSlotName, index + 1);
        
        let equippedItem = null;
        
        if (prefabId !== "NULL") {
            const prefab = prefabs[prefabId];
            if (!prefab) {
                throw new Error(`Prefab with id ${prefabId} not found in demodata`);
            }
            
            let finalIdentifier = identifier;
            if (identifier.includes('#')) {
                finalIdentifier = identifier.replace('#', '1');
            }
            
            equippedItem = new InventoryItem(
                module.exports.mock, // Player
                prefab,
                finalIdentifier,
                equipmentSlotName,
                containerName || "",
                quantity && !isNaN(Number(quantity)) ? Number(quantity) : null,
                uses && !isNaN(Number(uses)) ? Number(uses) : null,
                description || "",
                index + 1
            );
            
            equipmentSlot.items.push(equippedItem);
        }
        
        equipmentSlot.equippedItem = equippedItem;
        inventory.push(equipmentSlot);
    });
    
    return inventory;
}

module.exports.mock = {
    cure: jest.fn(),
    getAttributeStatusEffects: jest.fn(),
    inflict: jest.fn(),
    member: {},
    setOffline: jest.fn(),
    statusString: {
        includes: jest.fn()
    },
    inventory: module.exports.createInventory(prefabMap)
};