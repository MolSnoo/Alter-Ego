import constants from '../Configs/constants.json' with { type: 'json' };
import { replaceInventoryItem } from '../Modules/itemManager.js';
import { addItem as addItemToDescription, removeItem as removeItemFromDescription } from '../Modules/parser.js';

export default class InventoryItem {
    constructor(player, prefab, identifier, equipmentSlot, containerName, quantity, uses, description, row) {
        this.player = player;
        this.prefab = prefab;
        this.identifier = identifier;
        this.name = prefab ? prefab.name : "";
        this.pluralName = prefab ? prefab.pluralName : "";
        this.singleContainingPhrase = prefab ? prefab.singleContainingPhrase : "";
        this.pluralContainingPhrase = prefab ? prefab.pluralContainingPhrase : "";
        this.equipmentSlot = equipmentSlot;
        this.foundEquipmentSlot = false;
        this.containerName = containerName;
        this.container = null;
        this.slot = "";
        this.quantity = quantity;
        this.uses = uses;
        this.weight = prefab ? prefab.weight : 0;
        this.inventory = [];
        this.description = description;
        this.row = row;
    }

    decreaseUses() {
        this.uses--;
        if (this.uses === 0) {
            const nextStage = this.prefab.nextStage;
            const container = this.container !== null ? this.container : this.player;
            const slot = this.container !== null ? this.slot :
                this.equipmentSlot === "RIGHT HAND" || this.equipmentSlot === "LEFT HAND" ? "hands" : "equipment";
            if (nextStage && !this.prefab.discreet)
                container.setDescription(removeItemFromDescription(container.getDescription(), this, slot));
            replaceInventoryItem(this, nextStage);
            if (nextStage && !nextStage.discreet)
                container.setDescription(addItemToDescription(container.getDescription(), this, slot));
        }
    }

    insertItem(item, slot) {
        if (item.quantity !== 0) {
            for (let i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i].name === slot) {
                    let matchedItem = this.inventory[i].item.find(inventoryItem =>
                        inventoryItem.prefab !== null && item.prefab !== null &&
                        inventoryItem.prefab.id === item.prefab.id &&
                        inventoryItem.identifier === item.identifier &&
                        inventoryItem.containerName === item.containerName &&
                        inventoryItem.slot === item.slot &&
                        (inventoryItem.uses === item.uses || isNaN(inventoryItem.uses) && isNaN(item.uses)) &&
                        inventoryItem.description === item.description
                    );
                    if (!matchedItem || isNaN(matchedItem.quantity)) this.inventory[i].item.push(item);
                    if (!isNaN(item.quantity)) {
                        this.inventory[i].weight += item.weight * item.quantity;
                        this.inventory[i].takenSpace += item.prefab.size * item.quantity;
                        this.weight += item.weight * item.quantity;
                    }
                }
            }
        }
    }

    removeItem(item, slot, removedQuantity) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].name === slot) {
                for (let j = 0; j < this.inventory[i].item.length; j++) {
                    if (this.inventory[i].item[j].name === item.name && this.inventory[i].item[j].description === item.description) {
                        if (item.quantity === 0) this.inventory[i].item.splice(j, 1);
                        this.inventory[i].weight -= item.weight * removedQuantity;
                        this.inventory[i].takenSpace -= item.prefab.size * removedQuantity;
                        this.weight -= item.weight * removedQuantity;
                        break;
                    }
                }
            }
        }
    }

    getDescription() {
        return this.description;
    }

    setDescription(description) {
        this.description = description;
    }

    descriptionCell() {
        return constants.inventorySheetDescriptionColumn + this.row;
    }
}
