import InstantiateInventoryItemAction from '../Data/Actions/InstantiateInventoryItemAction.ts';
import InstantiateRoomItemAction from '../Data/Actions/InstantiateRoomItemAction.ts';
import RoomItem from '../Data/RoomItem.ts';
import { parseProceduralSelections } from '../Modules/stringDataExtractor.ts';
import { getErrorMessage } from '../Modules/helpers.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "instantiate_moderator",
    description: "Generates an item.",
    details: `Generates a room item or inventory item in the specified location. The prefab ID must be used. `
        + `A quantity can also be set by supplying a number before the prefab ID. If no quantity is given, the item `
        + `will be instantiated with a quantity of 1.\n\n`
        + `If the prefab has procedural options, they can be manually selected in parentheses. To do this, write the `
        + `name of the procedural tag and the poss tag to select within it, separated by an equal sign (\`=\`). `
        + `Multiple procedural selections can be made, separated by a plus sign (\`+\`).\n\n`
        + `To instantiate a room item, the display name or ID of the room must be given at the end, following \"at\". `
        + `The container to put it in must also be specified after the prefab's ID, preceded by the container's `
        + `preposition or "in". If the container is a fixture with a child puzzle, the puzzle will be its container. `
        + `If the container is another room item, the container's identifier, prefab ID, or name can be used.\n\n`
        + `To instantiate an inventory item, the name of the player must be given followed by \`'s\`. It is possible to `
        + `instantiate an inventory item directly to a player's equipment slot by specifying the equipment slot's ID. `
        + `In this case, the player will be notified that they equipped the item, and the prefab's equipped commands `
        + `will be executed. However, a container item can be specified instead by entering its preposition or "in" `
        + `followed by its identifier, prefab ID, or name. The player will not be notified when the item is instantiated this way.\n\n`
        + `If the container to instantiate the item into is a room item or inventory item, the ID of the inventory slot `
        + `to instantiate the item into can be specified, followed by "of" before the container's identifier.`,
    usableBy: "Moderator",
    aliases: ["instantiate", "create", "generate", "is", "gn"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}instantiate RAW FISH on FLOOR at Beach\n`
        + `${settings.commandPrefix}create PICKAXE in LOCKER 1 at mining-hub\n`
        + `${settings.commandPrefix}generate 3 EMPTY DRAIN CLEANER in CUPBOARDS at Kitchen\n`
        + `${settings.commandPrefix}instantiate GREEN BOOK in MAIN POCKET of LARGE BACKPACK 1 at dorm-library\n`
        + `${settings.commandPrefix}is 4 SCREWDRIVER in TOOL BOX at Beach House\n`
        + `${settings.commandPrefix}gn WET CLAY POT (quality = excellent) on POTTERY WHEEL at Art Studio\n`
        + `${settings.commandPrefix}instantiate KATANA in Nero's RIGHT HAND\n`
        + `${settings.commandPrefix}create GORILLA MASK on Evad's FACE\n`
        + `${settings.commandPrefix}generate VIVIANS LAPTOP in Vivian's VIVIANS SATCHEL\n`
        + `${settings.commandPrefix}is 2 SHOTPUT BALL in Cassie's MAIN POCKET of LARGE BACKPACK\n`
        + `${settings.commandPrefix}gn 3 GACHA CAPSULE (color=metal + character=upa) in Asuka's LEFT POCKET of GAMER HOODIE`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    // The `is` alias makes it so error messages trigger very frequently in the bot commands channel if people start a message with "is".
    // Guard against that.
    const isMessageStartingWithIs = command === 'is' && !message.content.startsWith(game.settings.commandPrefix);
    if (args.length < 4 && !isMessageStartingWithIs)
        return game.communicationHandler.reply(message, `Not enough arguments given. Usage:\n${usage(game.settings)}`);

    let quantity = 1;
    if (args[0].match(/^\d+$/)) {
        quantity = parseInt(args[0]);
        args.splice(0, 1);
    }

    let input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");
    const undashedInput = parsedInput.replace(/-/g, " ");

    // Some prefabs might have similar names. Make a list of all the ones that are found at the beginning of parsedInput.
    let prefab = null;
    const matches = [];
    for (let i = 1; i <= args.length; i++) {
        const match = game.entityFinder.getPrefab(args.slice(0, i).join(" "));
        if (match)
            matches.push(match);
    }

    // Find room specified at the end of args.
    let room = game.entityFinder.getRoom(input.substring(undashedInput.lastIndexOf(" AT ") + 4));
    if (!room) room = null;
    else parsedInput = parsedInput.substring(0, undashedInput.lastIndexOf(` AT ${room.id.toUpperCase().replace(/-/g, " ")}`));

    // If a parenthetical expression is included, procedural options are being manually set.
    /** @type {Map<string, string>} */
    let proceduralSelections = new Map();
    if (parsedInput.indexOf('(') < parsedInput.indexOf(')')) {
        try {
            proceduralSelections = parseProceduralSelections(parsedInput);
        }
        catch (error) {
            return game.communicationHandler.reply(message, getErrorMessage(error));
        }
        input = input.substring(0, input.indexOf('(')) + input.substring(input.indexOf(')') + 1).trimStart();
        parsedInput = parsedInput.substring(0, parsedInput.indexOf('(')) + parsedInput.substring(parsedInput.indexOf(')') + 1).trimStart();
    }
    args = parsedInput.split(' ');

    /** @type import('../Data/Player.ts').default | null */
    let player = null;
    // Room was found. Look for the container in it.
    if (room !== null) {
        // Check if a fixture was specified.
        let fixture = null;
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === room.id);
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput) return game.communicationHandler.reply(message, `You need to supply a prefab and a preposition.`);
            if (parsedInput.endsWith(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`) || parsedInput.endsWith(`IN ${fixtures[i].name}`)) {
                if (fixtures[i].preposition === "") return game.communicationHandler.reply(message, `${fixtures[i].name} cannot hold items.`);
                fixture = fixtures[i];
                if (parsedInput.endsWith(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`)).trimEnd();
                else if (parsedInput.endsWith(`IN ${fixtures[i].name}`))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(`IN ${fixtures[i].name}`)).trimEnd();
                else
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(fixtures[i].name)).trimEnd();
                break;
            }
        }

        let containerItem = null;
        let containerItemSlot = null;
        if (fixture === null) {
            // Check if a container item was specified.
            const items = game.entityFinder.getRoomItems(null, room.id);
            for (let i = 0; i < items.length; i++) {
                if (items[i].identifier === parsedInput || items[i].prefab.id === parsedInput || items[i].name === parsedInput) return game.communicationHandler.reply(message, `You need to supply a prefab and a preposition.`);
                if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].prefab.id) || parsedInput.endsWith(items[i].name)) {
                    if (items[i].inventory.size === 0 || items[i].prefab.preposition === "") return game.communicationHandler.reply(message, `${items[i].identifier ? items[i].identifier : items[i].name} cannot hold items.`);
                    containerItem = items[i];

                    if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "")
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].identifier)).trimEnd();
                    else if (parsedInput.endsWith(items[i].prefab.id))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].prefab.id)).trimEnd();
                    else if (parsedInput.endsWith(items[i].name))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    let newArgs = parsedInput.split(' ');
                    // Check if a slot was specified.
                    if (parsedInput.endsWith(" OF")) {
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                        newArgs = parsedInput.split(' ');
                        for (const [id, slot] of containerItem.inventory) {
                            if (parsedInput.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return game.communicationHandler.reply(message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);
                    }
                    if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                    else if (parsedInput.endsWith(" IN"))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                    break;
                }
            }
            if (containerItem !== null && containerItemSlot === null) [containerItemSlot] = containerItem.inventory.values();
        }

        // Now decide what the container should be.
        let container = null;
        let slotName = "";
        if (fixture !== null && fixture.childPuzzle === null && containerItem === null)
            container = fixture;
        else if (fixture !== null && fixture.childPuzzle !== null && containerItem === null)
            container = fixture.childPuzzle;
        else if (containerItem !== null) {
            container = containerItem;
            slotName = containerItemSlot.id;
        }

        // Finally, find the prefab.
        if (matches.length === 1) prefab = matches[0];
        else {
            for (let i = 0; i < matches.length; i++) {
                if (matches[i].id === parsedInput) {
                    prefab = matches[i];
                    break;
                }
            }
        }

        if (prefab !== null && container === null) {
            parsedInput = parsedInput.substring(prefab.id.length).trimStart();
            parsedInput = parsedInput.substring(parsedInput.indexOf(' ')).trimStart();
            return game.communicationHandler.reply(message, `Couldn't find "${parsedInput}" to instantiate ${prefab.id} into.`);
        }
        else if (prefab === null && container !== null) return game.communicationHandler.reply(message, `Couldn't find prefab with id "${parsedInput}".`);
        else if (prefab === null && container === null) return game.communicationHandler.reply(message, `Couldn't find "${parsedInput}".`);

        if (containerItem !== null && container instanceof RoomItem) {
            if (prefab.size > containerItemSlot.capacity && container.inventory.size !== 1) return game.communicationHandler.reply(message, `${prefab.id} will not fit in ${containerItemSlot.id} of ${container.name} because it is too large.`);
            else if (prefab.size > containerItemSlot.capacity) return game.communicationHandler.reply(message, `${prefab.id} will not fit in ${container.name} because it is too large.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity && container.inventory.size !== 1) return game.communicationHandler.reply(message, `${prefab.id} will not fit in ${containerItemSlot.id} of ${container.name} because there isn't enough space left.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity) return game.communicationHandler.reply(message, `${prefab.id} will not fit in ${container.name} because there isn't enough space left.`);
        }
        // Check for procedural selections errors.
        for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
            if (!prefab.proceduralOptions.has(proceduralName))
                return game.communicationHandler.reply(message, `${prefab.id} does not have procedural "${proceduralName}".`);
            if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                return game.communicationHandler.reply(message, `${prefab.id}'s procedural "${proceduralName}" does not have possibility "${proceduralValue}".`);
        }

        // Now instantiate the item.
        const instantiateAction = new InstantiateRoomItemAction(game, message, undefined, room, true);
        instantiateAction.performInstantiateRoomItem(prefab, container, slotName, quantity, proceduralSelections);
        instantiateAction.sendSuccessMessageToCommandChannel();
    }
    else {
        const newArgs = input.split(' ');
        for (let i = 0; i < newArgs.length; i++) {
            let playerName = newArgs[i].toUpperCase();
            if (playerName.endsWith("'S")) {
                playerName = playerName.slice(0, -2);
            }

            const fetchedPlayer = game.entityFinder.getLivingPlayer(playerName);
            if (fetchedPlayer) {
                player = fetchedPlayer;
                newArgs.splice(i, 1);
                break;
            }
        }
        if (player === null) {
            if (!isMessageStartingWithIs) game.communicationHandler.reply(message, `Couldn't find a room or player in your input.`);
            return;
        }

        parsedInput = newArgs.join(" ").toUpperCase().replace(/\'/g, "");

        // Check if an inventory item was specified.
        let containerItem = null;
        let containerItemSlot = null;
        const items = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
        for (let i = 0; i < items.length; i++) {
            if (items[i].identifier === parsedInput || items[i].prefab.id === parsedInput || items[i].name === parsedInput) return game.communicationHandler.reply(message, `You need to supply a prefab and a preposition.`);
            if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].prefab.id) || parsedInput.endsWith(items[i].name)) {
                if (items[i].inventory.size === 0 || items[i].prefab.preposition === "") return game.communicationHandler.reply(message, `${items[i].identifier ? items[i].identifier : items[i].name} cannot hold items.`);
                containerItem = items[i];

                if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "")
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].identifier)).trimEnd();
                else if (parsedInput.endsWith(items[i].prefab.id))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].prefab.id)).trimEnd();
                else if (parsedInput.endsWith(items[i].name))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                let newArgs = parsedInput.split(' ');
                // Check if a slot was specified.
                if (parsedInput.endsWith(" OF")) {
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                    newArgs = parsedInput.split(' ');
                    for (const [id, slot] of containerItem.inventory) {
                        if (parsedInput.endsWith(id)) {
                            containerItemSlot = slot;
                            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
                        }
                    }
                    if (containerItemSlot === null) return game.communicationHandler.reply(message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);
                }
                if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                else if (parsedInput.endsWith(" IN"))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                break;
            }
        }
        if (containerItem !== null && containerItemSlot === null) [containerItemSlot] = containerItem.inventory.values();
        const slotName = containerItem !== null ? containerItemSlot.id : "";

        // Check if an equipment slot was specified.
        let equipmentSlotName = "";
        if (containerItem === null) {
            for (const [id, slot] of player.inventory) {
                if (parsedInput.endsWith(id)) {
                    equipmentSlotName = id;
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
                    const newArgs = parsedInput.split(' ');
                    newArgs.splice(newArgs.length - 1, 1);
                    parsedInput = newArgs.join(' ');
                    if (slot.equippedItem !== null) return game.communicationHandler.reply(message, `Cannot equip items to ${equipmentSlotName} because ${slot.equippedItem.name} is already equipped to it.`);
                    break;
                }
            }
        }

        // Finally, find the prefab.
        if (matches.length === 1) prefab = matches[0];
        else {
            for (let i = 0; i < matches.length; i++) {
                if (matches[i].id === parsedInput) {
                    prefab = matches[i];
                    break;
                }
            }
        }

        if (prefab !== null && containerItem === null && equipmentSlotName === "") {
            parsedInput = parsedInput.substring(prefab.id.length).trimStart();
            parsedInput = parsedInput.substring(parsedInput.indexOf(' ')).trimStart();
            return game.communicationHandler.reply(message, `Couldn't find "${parsedInput}" to instantiate ${prefab.id} into.`);
        }
        else if (prefab === null && (containerItem !== null || equipmentSlotName !== "")) {
            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(' '));
            return game.communicationHandler.reply(message, `Couldn't find prefab with id "${parsedInput}".`);
        }
        else if (prefab === null && containerItem === null && equipmentSlotName === "") return game.communicationHandler.reply(message, `Couldn't find "${parsedInput}".`);

        if (equipmentSlotName !== "" && quantity !== 1) return game.communicationHandler.reply(message, `Cannot instantiate more than 1 item to a player's equipment slot.`);
        if (containerItem !== null) {
            equipmentSlotName = containerItem.equipmentSlot;
            if (prefab.size > containerItemSlot.capacity && containerItem.inventory.size !== 1) return game.communicationHandler.reply(message, `${prefab.id} will not fit in ${containerItemSlot.id} of ${player.name}'s ${containerItem.name} because it is too large.`);
            else if (prefab.size > containerItemSlot.capacity) return game.communicationHandler.reply(message, `${prefab.id} will not fit in ${player.name}'s ${containerItem.name} because it is too large.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity && containerItem.inventory.size !== 1) return game.communicationHandler.reply(message, `${prefab.id} will not fit in ${containerItemSlot.id} of ${player.name}'s ${containerItem.name} because there isn't enough space left.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity) return game.communicationHandler.reply(message, `${prefab.id} will not fit in ${player.name}'s ${containerItem.name} because there isn't enough space left.`);
        }
        // Check for procedural selections errors.
        for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
            if (!prefab.proceduralOptions.has(proceduralName))
                return game.communicationHandler.reply(message, `${prefab.id} does not have procedural "${proceduralName}".`);
            if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                return game.communicationHandler.reply(message, `${prefab.id}'s procedural "${proceduralName}" does not have possibility "${proceduralValue}".`);
        }

        // Now instantiate the item.
        const instantiateAction = new InstantiateInventoryItemAction(game, message, player, player.location, true);
        instantiateAction.performInstantiateInventoryItem(prefab, equipmentSlotName, containerItem, slotName, quantity, proceduralSelections);
        instantiateAction.sendSuccessMessageToCommandChannel();
    }
}
