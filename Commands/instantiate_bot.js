import RoomItem from "../Data/RoomItem.js";
import { instantiateItem, instantiateInventoryItem } from '../Modules/itemManager.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "instantiate_bot",
    description: "Generates an item.",
    details: "Generates an item or inventory item in the specified location. The prefab ID must be used. "
        + "A quantity can also be set. If the prefab has procedural options, they can be manually set in parentheses.\n\n"
        + "To instantiate an item, the name of the room must be given at the end, following \"at\". The name of the container to put it in "
        + "must also be given. If the container is an object with a child puzzle, the puzzle will be its container. If the container is another item, "
        + "the item's name or container identifier can be used. The name of the inventory slot to instantiate the item in can also be specified.\n\n"
        + "To instantiate an inventory item, \"player\", \"room\", \"all\", or the name of a player followed by \"'s\", must be given. A container item can be specified, as well as which slot to "
        + "instantiate the item into. The player will not be notified if a container item is specified. An equipment slot can also be chosen instead of a container item. "
        + "The player will be notified of obtaining the item in this case, and the prefab's equipped commands will be run.",
    usableBy: "Bot",
    aliases: ["instantiate", "create", "generate"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `instantiate raw fish on floor at beach\n`
        + `create pickaxe in locker 1 at mining hub\n`
        + `generate 3 empty drain cleaner in cupboards at kitchen\n`
        + `instantiate green book in main pocket of large backpack 1 at dorm library\n`
        + `create 4 screwdriver in tool box at beach house\n`
        + `instantiate gacha capsule (color=metal + character=upa) in gacha slot at arcade\n`
        + `generate katana in player right hand\n`
        + `instantiate monokuma mask on all face\n`
        + `create laptop in vivian's vivians satchel\n`
        + `generate 2 shotput ball in cassie's main pocket of large backpack`
        + `instantiate 3 capsulebeast card (species=lavazard) in asuka's left pocket of gamer hoodie`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (args.length < 4) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    let quantity = 1;
    if (!isNaN(parseInt(args[0]))) {
        quantity = parseInt(args[0]);
        args.splice(0, 1);
    }

    const input = args.join(" ");
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
    const proceduralSelections = new Map();
    if (parsedInput.indexOf('(') < parsedInput.indexOf(')')) {
        const proceduralString = parsedInput.substring(parsedInput.indexOf('(') + 1, parsedInput.indexOf(')'));
        const proceduralList = proceduralString.split('+');
        for (let procedural of proceduralList) {
            const proceduralAssignment = procedural.split('=');
            if (proceduralAssignment.length !== 2)
                return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Procedural options must be separated with \`+\`, and the name of the poss to select must be assigned to the name of its containing procedural with \`=\`.`);
            proceduralSelections.set(proceduralAssignment[0].toLowerCase().trim(), proceduralAssignment[1].toLowerCase().trim());
        }
        parsedInput = parsedInput.substring(0, parsedInput.indexOf('(')) + parsedInput.substring(parsedInput.indexOf(')'));
    }

    // Room was found. Look for the container in it.
    if (room !== null) {
        // Check if a fixture was specified.
        let fixture = null;
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === room.id && fixture.accessible);
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". You need to supply a prefab and a preposition.`);
            if (parsedInput.endsWith(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`) || parsedInput.endsWith(`IN ${fixtures[i].name}`)) {
                if (fixtures[i].preposition === "") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${fixtures[i].name} cannot hold items.`);
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
            const items = game.entityFinder.getRoomItems(null, room.id, true);
            for (let i = 0; i < items.length; i++) {
                if (items[i].identifier === parsedInput || items[i].name === parsedInput) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". You need to supply a prefab and a preposition.`);
                if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].name)) {
                    if (items[i].inventoryCollection.size === 0 || items[i].prefab.preposition === "") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${items[i].identifier ? items[i].identifier : items[i].name} cannot hold items.`);
                    containerItem = items[i];

                    if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "")
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].identifier)).trimEnd();
                    else if (parsedInput.endsWith(items[i].name))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    let newArgs = parsedInput.split(' ');
                    // Check if a slot was specified.
                    if (parsedInput.endsWith(" OF")) {
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                        newArgs = parsedInput.split(' ');
                        for (const [id, slot] of containerItem.inventoryCollection) {
                            if (parsedInput.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);
                    }
                    if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                    else if (parsedInput.endsWith(" IN"))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                    break;
                }
            }
            if (containerItem !== null && containerItemSlot === null) [containerItemSlot] = containerItem.inventoryCollection.values();
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
            return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput}" to instantiate ${prefab.id} into.`);
        }
        else if (prefab === null && container !== null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find prefab with id "${parsedInput}".`);
        else if (prefab === null && container === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput}".`);

        if (containerItem !== null && container instanceof RoomItem) {
            if (prefab.size > containerItemSlot.capacity && container.inventoryCollection.size !== 1) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${containerItemSlot.id} of ${container.name} because it is too large.`);
            else if (prefab.size > containerItemSlot.capacity) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${container.name} because it is too large.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity && container.inventoryCollection.size !== 1) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${containerItemSlot.id} of ${container.name} because there isn't enough space left.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${container.name} because there isn't enough space left.`);
        }

        // Now instantiate the item.
        // If the prefab has inventory slots, run the instantiate function quantity times so that it generates items with different identifiers.
        if (prefab.inventoryCollection.size > 0) {
            for (let i = 0; i < quantity; i++)
                instantiateItem(prefab, room, container, slotName, 1, proceduralSelections, player);
        }
        else instantiateItem(prefab, room, container, slotName, quantity, proceduralSelections, player);
    }
    else {
        let players = [];
        for (let i = 0; i < args.length; i++) {
            if (args[i].toLowerCase().replace(/'s/g, "") === "player" && player !== null) {
                players.push(player);
                args.splice(i, 1);
                break;
            }
            else if (args[i].toLowerCase().replace(/'s/g, "") === "room" && player !== null) {
                players = player.location.occupants;
                args.splice(i, 1);
                break;
            }
            else if (args[i].toLowerCase().replace(/'s/g, "") === "all") {
                players = game.entityFinder.getLivingPlayers();
                args.splice(i, 1);
                break;
            }
            else {
                let playerName = args[i].toLowerCase();
                if (playerName.endsWith("'s")) {
                    playerName = playerName.slice(0, -2);
                }

                const player = game.entityFinder.getLivingPlayer(playerName);
                if (player) {
                    players.push(player);
                    args.splice(i, 1);
                    break;
                }
            }
        }
        if (players.length === 0) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find a room or player in your input.`);

        parsedInput = args.join(" ").toUpperCase().replace(/\'/g, "");

        for (let j = 0; j < players.length; j++) {
            player = players[j];
            let parsedInput2 = parsedInput;
            // Check if an inventory item was specified.
            let containerItem = null;
            let containerItemSlot = null;
            const items = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
            for (let i = 0; i < items.length; i++) {
                if (items[i].identifier === parsedInput2 || items[i].name === parsedInput2) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". You need to supply a prefab and a preposition.`);
                if (parsedInput2.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput2.endsWith(items[i].name)) {
                    if (items[i].inventoryCollection.size === 0 || items[i].prefab.preposition === "") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${items[i].identifier ? items[i].identifier : items[i].name} cannot hold items.`);
                    containerItem = items[i];

                    if (parsedInput2.endsWith(items[i].identifier) && items[i].identifier !== "")
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(items[i].identifier)).trimEnd();
                    else if (parsedInput2.endsWith(items[i].name))
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(items[i].name)).trimEnd();
                    let newArgs = parsedInput2.split(' ');
                    // Check if a slot was specified.
                    if (parsedInput2.endsWith(" OF")) {
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(" OF")).trimEnd();
                        newArgs = parsedInput2.split(' ');
                        for (const [id, slot] of containerItem.inventoryCollection) {
                            if (parsedInput2.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);

                        if (parsedInput2.endsWith(containerItem.prefab.preposition.toUpperCase()))
                            parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                        else if (parsedInput2.endsWith(" IN"))
                            parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(" IN")).trimEnd();
                        break;
                    }
                }
            }
            if (containerItem !== null && containerItemSlot === null) [containerItemSlot] = containerItem.inventoryCollection.values();
            const slotName = containerItem !== null ? containerItemSlot.id : "";

            // Check if an equipment slot was specified.
            let equipmentSlotName = "";
            if (containerItem === null) {
                for (const [id, slot] of player.inventoryCollection) {
                    if (parsedInput2.endsWith(id)) {
                        equipmentSlotName = id;
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(id)).trimEnd();
                        const newArgs = parsedInput2.split(' ');
                        newArgs.splice(newArgs.length - 1, 1);
                        parsedInput2 = newArgs.join(' ');
                        if (slot.equippedItem !== null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Cannot equip items to ${id} because ${slot.equippedItem.name} is already equipped to it.`);
                        break;
                    }
                }
            }

            // Finally, find the prefab.
            if (matches.length === 1) prefab = matches[0];
            else {
                for (let i = 0; i < matches.length; i++) {
                    if (matches[i].id === parsedInput2) {
                        prefab = matches[i];
                        break;
                    }
                }
            }

            if (prefab !== null && containerItem === null && equipmentSlotName === "") {
                parsedInput2 = parsedInput2.substring(prefab.id.length).trimStart();
                parsedInput2 = parsedInput2.substring(parsedInput2.indexOf(' ')).trimStart();
                return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput2}" to instantiate ${prefab.id} into.`);
            }
            else if (prefab === null && (containerItem !== null || equipmentSlotName !== "")) {
                parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(' '));
                return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find prefab with id "${parsedInput2}".`);
            }
            else if (prefab === null && containerItem === null && equipmentSlotName === "") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput2}".`);

            if (equipmentSlotName !== "" && quantity !== 1) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Cannot instantiate more than 1 item to a player's equipment slot.`);
            if (containerItem !== null) {
                equipmentSlotName = containerItem.equipmentSlot;
                if (prefab.size > containerItemSlot.capacity && containerItem.inventoryCollection.size !== 1) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${containerItemSlot.id} of ${player.name}'s ${containerItem.name} because it is too large.`);
                else if (prefab.size > containerItemSlot.capacity) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${player.name}'s ${containerItem.name} because it is too large.`);
                else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity && containerItem.inventoryCollection.size !== 1) messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${containerItemSlot.id} of ${player.name}'s ${containerItem.name} because there isn't enough space left.`);
                else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity) messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${player.name}'s ${containerItem.name} because there isn't enough space left.`);
            }

            // Now instantiate the item.
            // If the prefab has inventory slots, run the instantiate function quantity times so that it generates items with different identifiers.
            if (prefab.inventoryCollection.size > 0) {
                for (let i = 0; i < quantity; i++)
                    instantiateInventoryItem(prefab, player, equipmentSlotName, containerItem, slotName, 1, proceduralSelections);
            }
            else instantiateInventoryItem(prefab, player, equipmentSlotName, containerItem, slotName, quantity, proceduralSelections);
        }
    }

    return;
}
