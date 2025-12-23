import GameSettings from '../Classes/GameSettings.js';
import Action from '../Data/Action.js';
import Game from '../Data/Game.js';
import RoomItem from "../Data/RoomItem.js";
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "inspect_moderator",
    description: "Inspects something for a player.",
    details: "Inspect something for the given player. The target must be the \"room\" argument, an object, an item, "
        + "a player, or an inventory item, and it must be in the same room as the given player. The description will "
        + "be parsed and sent to the player in DMs. If the target is an object, or a non-discreet item or inventory "
        + "item, a narration will be sent about the player inspecting it to the room channel. Items and inventory "
        + "items should use the prefab ID or container identifier. If there are multiple items in the room "
        + "with the same ID, you can specify which one to inspect using its container's name (if the container is an "
        + "object or puzzle), or its prefab ID or container identifier (if it's an item). The player can be forced "
        + "to inspect items and inventory items belonging to a specific player (including themself) using the "
        + "player's name followed by \"'s\". If inspecting a different player's inventory items, a narration will not be sent.",
    usableBy: "Moderator",
    aliases: ["inspect", "investigate", "examine", "look", "x"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}inspect akio desk\n`
        + `${settings.commandPrefix}examine florian knife\n`
        + `${settings.commandPrefix}look florian knife on desk\n`
        + `${settings.commandPrefix}x florian knife in main pouch of red backpack 1\n`
        + `${settings.commandPrefix}investigate blake blake's knife\n`
        + `${settings.commandPrefix}look jun amadeus\n`
        + `${settings.commandPrefix}examine nestor jae-seong\n`
        + `${settings.commandPrefix}look roma lain's glasses\n`
        + `${settings.commandPrefix}x haruka binita's shirt\n`
        + `${settings.commandPrefix}inspect ambrosia room`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return addReply(game, message, `You need to specify a player and a fixture/item/player. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].toLowerCase());
    if (player === undefined) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    const input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    // What we do with this action, if anything, depends on what the player inspects.
    const action = new Action(game, ActionType.Inspect, message, player, player.location, true);

    // Before anything else, check if the player is trying to inspect the room.
    if (parsedInput === "ROOM") {
        action.performInspect(player.location);
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully inspected ${player.location.id} for ${player.name}.`);
        return;
    }

    // Check if the input is a fixture, or an item on a fixture.
    const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
    const items = game.entityFinder.getRoomItems(null, player.location.id, true);
    let fixture = null;
    let item = null;
    let container = null;
    let slotName = "";
    for (let i = 0; i < fixtures.length; i++) {
        if (fixtures[i].name === parsedInput) {
            fixture = fixtures[i];
            break;
        }

        if ((parsedInput.endsWith(` ${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`) || parsedInput.endsWith(` IN ${fixtures[i].name}`)) && fixtures[i].preposition !== "") {
            const fixtureItems = items.filter(item => item.containerName === `Object: ${fixtures[i].name}` || fixtures[i].childPuzzle !== null && item.containerName === `Puzzle: ${fixtures[i].childPuzzle.name}`);
            for (let j = 0; j < fixtureItems.length; j++) {
                if (
                    fixtureItems[j].identifier !== "" && parsedInput === `${fixtureItems[j].identifier} ${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}` ||
                    parsedInput === `${fixtureItems[j].prefab.id} ${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}` ||
                    fixtureItems[j].identifier !== "" && parsedInput === `${fixtureItems[j].identifier} IN ${fixtures[i].name}` ||
                    parsedInput === `${fixtureItems[j].prefab.id} IN ${fixtures[i].name}`
                ) {
                    item = fixtureItems[j];
                    container = item.container;
                    slotName = item.slot;
                    break;
                }
            }
            if (item !== null) break;
        }
    }

    if (fixture !== null) {
        action.performInspect(fixture);
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully inspected ${fixture.name} for ${player.name}.`);
        return;
    }

    let onlySearchInventory = false;
    if (parsedInput.startsWith(`${player.name.toUpperCase()}S `)) onlySearchInventory = true;

    if (!onlySearchInventory) {
        // Now check if the input is an item.
        for (let i = 0; i < items.length; i++) {
            if (items[i].identifier !== "" && items[i].identifier === parsedInput || items[i].prefab.id === parsedInput) {
                item = items[i];
                container = item.container;
                slotName = item.slot;
                break;
            }

            const itemContainer = items[i].container;
            if (itemContainer !== null && itemContainer instanceof RoomItem) {
                const preposition = itemContainer.prefab.preposition.toUpperCase();
                let containerString = "";
                if (items[i].identifier !== "" && parsedInput.startsWith(`${items[i].identifier} ${preposition} `))
                    containerString = parsedInput.substring(`${items[i].identifier} ${preposition} `.length).trim();
                else if (parsedInput.startsWith(`${items[i].prefab.id} ${preposition} `))
                    containerString = parsedInput.substring(`${items[i].prefab.id} ${preposition} `.length).trim();
                else if (items[i].identifier !== "" && parsedInput.startsWith(`${items[i].identifier} IN `))
                    containerString = parsedInput.substring(`${items[i].identifier} IN `.length).trim();
                else if (parsedInput.startsWith(`${items[i].prefab.id} IN `))
                    containerString = parsedInput.substring(`${items[i].prefab.id} IN `.length).trim();
                
                if (containerString !== "") {
                    // Slot name was specified.
                    let containerName = "";
                    if (itemContainer.identifier !== "" && parsedInput.endsWith(` OF ${itemContainer.identifier}`))
                        containerName = itemContainer.identifier;
                    else if (parsedInput.endsWith(` OF ${itemContainer.prefab.id}`))
                        containerName = itemContainer.prefab.id;
                    if (containerName !== "") {
                        const tempSlotName = containerString.substring(0, containerString.lastIndexOf(` OF ${containerName}`)).trim();
                        container = itemContainer.inventoryCollection.get(tempSlotName)
                        if (container && items[i].slot === tempSlotName) {
                            item = items[i];
                            slotName = item.slot;
                        } else {
                            for (const [id, slot] of itemContainer.inventoryCollection) {
                                if (id === tempSlotName && items[i].slot === tempSlotName) {
                                    item = items[i];
                                    container = item.container;
                                    slotName = item.slot;
                                    break;
                                }
                            }
                        }
                        if (!(item === null || item === undefined)) break;
                    }
                    // Only a container was specified.
                    else if (itemContainer.identifier !== "" && itemContainer.identifier === containerString || itemContainer.prefab.id === containerString) {
                        item = items[i];
                        container = item.container;
                        slotName = item.slot;
                        break;
                    }
                }
            }
        }
    }

    if (item !== null) {
        action.performInspect(item);
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully inspected ${item.getIdentifier()} ${item.getContainerPreposition()} ${item.getContainerPhrase()} for ${player.name}.`);
        return;
    }

    // Check if the input is an item in the player's inventory.
    const inventory = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
    for (let i = 0; i < inventory.length; i++) {
        parsedInput = parsedInput.replace(`${player.name.toUpperCase()}S `, "");
        if ((inventory[i].identifier !== "" && inventory[i].identifier === parsedInput || inventory[i].prefab.id === parsedInput || inventory[i].prefab.name === parsedInput)
            && inventory[i].quantity > 0) {
            action.performInspect(inventory[i]);
            addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully inspected ${player.name}'s ` + (inventory[i].getIdentifier()) + ` for ${player.name}.`);
            return;
        }
    }

    // Check if the input is a player in the room.
    for (let i = 0; i < player.location.occupants.length; i++) {
        const occupant = player.location.occupants[i];
        const possessive = occupant.name.toUpperCase() + "S ";
        if (parsedInput.startsWith(occupant.name.toUpperCase()) && occupant.hasBehaviorAttribute("hidden"))
            return addReply(game, message, `Couldn't find "${input}".`);
        if (occupant.name.toUpperCase() === parsedInput) {
            // Don't let player inspect themselves.
            if (occupant.name === player.name) return addReply(game, message, `${player.name} can't inspect ${player.originalPronouns.ref}.`);
            action.performInspect(occupant);
            addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully inspected ${occupant.name} for ${player.name}.`);
            return;
        }
        else if (parsedInput.startsWith(possessive)) {
            parsedInput = parsedInput.replace(possessive, "");
            // Only equipped items should be an option.
            const inventory = game.inventoryItems.filter(item => item.player.name === occupant.name && item.prefab !== null && item.containerName === "" && item.container === null);
            for (let j = 0; j < inventory.length; j++) {
                if ((inventory[j].identifier !== "" && inventory[j].identifier === parsedInput || inventory[j].prefab.id === parsedInput || inventory[j].prefab.name === parsedInput)
                    && (inventory[j].equipmentSlot !== "LEFT HAND" && inventory[j].equipmentSlot !== "RIGHT HAND" || !inventory[j].prefab.discreet)) {
                    // Make sure the item isn't covered by anything first.
                    const coveringItems = inventory.filter(item =>
                        item.equipmentSlot !== "RIGHT HAND" &&
                        item.equipmentSlot !== "LEFT HAND" &&
                        item.prefab.coveredEquipmentSlots.includes(inventory[j].equipmentSlot)
                    );
                    if (coveringItems.length === 0) {
                        action.performInspect(inventory[j]);
                        addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully inspected ${occupant.name}'s ` + (inventory[j].getIdentifier()) + ` for ${player.name}.`);
                        return;
                    }
                }
            }
        }
    }

    return addReply(game, message, `Couldn't find "${input}".`);
}
