import Fixture from "../Data/Fixture.js";
import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import RoomItem from "../Data/RoomItem.js";
import Player from '../Data/Player.js';
import Puzzle from "../Data/Puzzle.js";
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";
import Narration from '../Data/Narration.js';

/** @type {CommandConfig} */
export const config = {
    name: "inspect_player",
    description: "Learn more about an object, item, or player.",
    details: 'Tells you about an object, item, or player in the room you\'re in. '
        + 'An object is something in the room that you can interact with but not take with you. '
        + 'An item is something that you can both interact with and take with you. If you inspect an object, '
        + 'everyone in the room will see you inspect it. The same goes for very large items. '
        + 'If there are multiple items with the same name in the room, you can specify which one you want to inspect using the name of the container it\'s in. '
        + 'You can also inspect items in your inventory. If you have an item with the same name as an item in the room you\'re currently in, '
        + 'you can specify that you want to inspect your item by adding "my" before the item name. '
        + 'You can even inspect visible items in another player\'s inventory by adding "[player name]\'s" before the item name. No one will '
        + 'see you do this, however you will receive slightly less info when inspecting another player\'s items. '
        + `You can use "room" to get the description of the room you're currently in.`,
    usableBy: "Player",
    aliases: ["inspect", "investigate", "examine", "look", "x"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}inspect desk\n`
        + `${settings.commandPrefix}examine knife\n`
        + `${settings.commandPrefix}look knife on desk\n`
        + `${settings.commandPrefix}x knife in main pouch of red backpack\n`
        + `${settings.commandPrefix}investigate my knife\n`
        + `${settings.commandPrefix}look akari\n`
        + `${settings.commandPrefix}examine an individual wearing a mask\n`
        + `${settings.commandPrefix}look marielle's glasses\n`
        + `${settings.commandPrefix}x an individual wearing a bucket's shirt\n`
        + `${settings.commandPrefix}inspect room`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a fixture/item/player. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable inspect");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // This will be checked multiple times, so get it now.
    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");

    const input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Before anything else, check if the player is trying to inspect the room.
    if (parsedInput === "ROOM") {
        new Narration(game, player, player.location, `${player.displayName} begins looking around the room.`).send();
        player.sendDescription(player.location.description, player.location);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        messageHandler.addLogMessage(game, `${time} - ${player.name} inspected the room in ${player.location.channel}`);

        return;
    }

    // Check if the input is a fixture, or an item on a fixture.
    const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
    const items = game.items.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
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
                    parsedInput === `${fixtureItems[j].name} ${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}` ||
                    parsedInput === `${fixtureItems[j].pluralName} ${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}` ||
                    parsedInput === `${fixtureItems[j].name} IN ${fixtures[i].name}` ||
                    parsedInput === `${fixtureItems[j].pluralName} IN ${fixtures[i].name}`
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
        // Make sure the player can only inspect the fixture they're hiding in, if they're hidden.
        if (hiddenStatus.length > 0 && player.hidingSpot !== fixture.name) return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
        new Narration(game, player, player.location, `${player.displayName} begins inspecting the ${fixture.name}.`).send();
        player.sendDescription(fixture.description, fixture);

        // Don't notify anyone if the player is inspecting the fixture that they're hiding in.
        if (hiddenStatus.length === 0 || player.hidingSpot !== fixture.name) {
            // Make sure the fixture isn't locked.
            if (fixture.childPuzzle === null || !fixture.childPuzzle.type.endsWith("lock") || fixture.childPuzzle.solved) {
                const hiddenPlayers = game.entityFinder.getLivingPlayers(null, null, player.location.id, fixture.name);
                for (let i = 0; i < hiddenPlayers.length; i++) {
                    hiddenPlayers[i].notify(`You've been found by ${player.displayName}!`);
                }

                // Create a list string of players currently hiding in that hiding spot.
                hiddenPlayers.sort(function (a, b) {
                    const nameA = a.displayName.toLowerCase();
                    const nameB = b.displayName.toLowerCase();
                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    return 0;
                });
                let hiddenPlayersString = "";
                if (hiddenPlayers.length === 1) hiddenPlayersString = hiddenPlayers[0].displayName;
                else if (hiddenPlayers.length === 2)
                    hiddenPlayersString += `${hiddenPlayers[0].displayName} and ${hiddenPlayers[1].displayName}`;
                else if (hiddenPlayers.length >= 3) {
                    for (let i = 0; i < hiddenPlayers.length - 1; i++)
                        hiddenPlayersString += `${hiddenPlayers[i].displayName}, `;
                    hiddenPlayersString += `and ${hiddenPlayers[hiddenPlayers.length - 1].displayName}`;
                }

                if (hiddenPlayersString) player.notify(`You find ${hiddenPlayersString} hiding in the ${fixture.name}!`);
            }
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        messageHandler.addLogMessage(game, `${time} - ${player.name} inspected ${fixture.name} in ${player.location.channel}`);

        return;
    }

    let onlySearchInventory = false;
    if (parsedInput.startsWith("MY ")) onlySearchInventory = true;

    if (!onlySearchInventory) {
        // Now check if the input is an item.
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput || items[i].pluralName === parsedInput) {
                item = items[i];
                container = item.container;
                slotName = item.slot;
                break;
            }

            const itemContainer = items[i].container;
            if (itemContainer !== null && itemContainer instanceof RoomItem) {
                const preposition = itemContainer.prefab.preposition.toUpperCase();
                let containerString = "";
                if (parsedInput.startsWith(`${items[i].name} ${preposition} `))
                    containerString = parsedInput.substring(`${items[i].name} ${preposition} `.length).trim();
                else if (parsedInput.startsWith(`${items[i].pluralName} ${preposition} `))
                    containerString = parsedInput.substring(`${items[i].pluralName} ${preposition} `.length).trim();
                else if (parsedInput.startsWith(`${items[i].name} IN `))
                    containerString = parsedInput.substring(`${items[i].name} IN `.length).trim();
                else if (parsedInput.startsWith(`${items[i].pluralName} IN `))
                    containerString = parsedInput.substring(`${items[i].pluralName} IN `.length).trim();
                
                if (containerString !== "") {
                    // Slot name was specified.
                    if (parsedInput.endsWith(` OF ${itemContainer.name}`)) {
                        const tempSlotName = containerString.substring(0, containerString.lastIndexOf(` OF ${itemContainer.name}`)).trim();
                        for (let slot = 0; slot < itemContainer.inventory.length; slot++) {
                            if (itemContainer.inventory[slot].id === tempSlotName && items[i].slot === tempSlotName) {
                                item = items[i];
                                container = item.container;
                                slotName = item.slot;
                                break;
                            }
                        }
                        if (item !== null) break;
                    }
                    // Only a container was specified.
                    else if (itemContainer.name === containerString) {
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
        // Make sure the player can only inspect items contained in the fixture they're hiding in, if they're hidden.
        if (hiddenStatus.length > 0) {
            let topContainer = item.container;
            while (topContainer !== null && topContainer instanceof RoomItem)
                topContainer = topContainer.container;
            if (topContainer !== null && topContainer instanceof Puzzle)
                topContainer = topContainer.parentFixture;

            if (topContainer === null || topContainer instanceof Fixture && topContainer.name !== player.hidingSpot)
                return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
        }

        let preposition = "in";
        let containerName = "";
        let containerIdentifier = "";
        if (container instanceof RoomItem) {
            preposition = container.prefab.preposition;
            containerName = container.singleContainingPhrase;
            containerIdentifier = `${slotName} of ${container.identifier}`;
        }
        else if (container instanceof Fixture) {
            preposition = container.preposition;
            containerName = `the ${container.name}`;
            containerIdentifier = container.name;
        }
        else if (container instanceof Puzzle) {
            preposition = container.parentFixture.preposition;
            containerName = `the ${container.parentFixture.name}`;
            containerIdentifier = container.name;
        }
        if (!item.prefab.discreet)
            new Narration(game, player, player.location, `${player.displayName} begins inspecting ${item.singleContainingPhrase}` + (containerName ? ` ${preposition} ${containerName}` : '') + `.`).send();
        player.sendDescription(item.description, item);

        const time = new Date().toLocaleTimeString();
        const identifier = item.identifier !== "" ? item.identifier : item.prefab.id;
        messageHandler.addLogMessage(game, `${time} - ${player.name} inspected ${identifier} ${preposition} ${containerIdentifier} in ${player.location.channel}`);

        return;
    }

    // Check if the input is an item in the player's inventory.
    const inventory = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
    for (let i = 0; i < inventory.length; i++) {
        parsedInput = parsedInput.replace("MY ", "");
        if (inventory[i].prefab.name === parsedInput && inventory[i].quantity > 0) {
            const item = inventory[i];
            if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} takes out ${item.prefab.singleContainingPhrase} and begins inspecting it.`).send();
            player.sendDescription(item.description, item);

            const time = new Date().toLocaleTimeString();
            messageHandler.addLogMessage(game, `${time} - ${player.name} inspected ` + (item.identifier !== "" ? item.identifier : item.prefab.id) + ` from ${player.originalPronouns.dpos} inventory in ${player.location.channel}`);

            return;
        }
    }

    // Check if the input is a player in the room.
    for (let i = 0; i < player.location.occupants.length; i++) {
        const occupant = player.location.occupants[i];
        const possessive = occupant.displayName.toUpperCase() + "S ";
        if (parsedInput.startsWith(occupant.displayName.toUpperCase()) && occupant.hasAttribute("hidden") && occupant.hidingSpot !== player.hidingSpot)
            return messageHandler.addReply(game, message, `Couldn't find "${input}".`);
        else if (parsedInput.startsWith(occupant.displayName.toUpperCase()) && hiddenStatus.length > 0 && !occupant.hasAttribute("hidden"))
            return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
        if (occupant.displayName.toUpperCase() === parsedInput) {
            // Don't const player inspect themselves.
            if (occupant.name === player.name) return messageHandler.addReply(game, message, `You can't inspect yourself.`);
            player.sendDescription(occupant.description, occupant);

            const time = new Date().toLocaleTimeString();
            messageHandler.addLogMessage(game, `${time} - ${player.name} inspected ${occupant.name} in ${player.location.channel}`);

            return;
        }
        else if (parsedInput.startsWith(possessive)) {
            // Don't const the player inspect their own items this way.
            if (occupant.name === player.name) return messageHandler.addReply(game, message, `You can't inspect your own items this way. Use "my" instead of your name.`);
            parsedInput = parsedInput.replace(possessive, "");
            // Only equipped items should be an option.
            const inventory = game.inventoryItems.filter(item => item.player.name === occupant.name && item.prefab !== null && item.containerName === "" && item.container === null);
            for (let j = 0; j < inventory.length; j++) {
                if (inventory[j].prefab.name === parsedInput && (inventory[j].equipmentSlot !== "LEFT HAND" && inventory[j].equipmentSlot !== "RIGHT HAND" || !inventory[j].prefab.discreet)) {
                    // Make sure the item isn't covered by anything first.
                    const coveringItems = inventory.filter(item =>
                        item.equipmentSlot !== "RIGHT HAND" &&
                        item.equipmentSlot !== "LEFT HAND" &&
                        item.prefab.coveredEquipmentSlots.includes(inventory[j].equipmentSlot)
                    );
                    if (coveringItems.length === 0) {
                        // Clear out any il tags in the description.
                        const description = inventory[j].description.replace(/(<(il)(\s[^>]+?)*>)[\s\S]+?(<\/\2>)/g, "$1$4");
                        player.sendDescription(description, inventory[j]);

                        const time = new Date().toLocaleTimeString();
                        messageHandler.addLogMessage(game, `${time} - ${player.name} inspected ` + (inventory[j].identifier !== "" ? inventory[j].identifier : inventory[j].prefab.id) + ` from ${occupant.name}'s inventory in ${player.location.channel}`);

                        return;
                    }
                }
            }
        }
    }

    return messageHandler.addReply(game, message, `Couldn't find "${input}".`);
}
