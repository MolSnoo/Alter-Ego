const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');

const Narration = include(`${constants.dataDir}/Narration.js`);

module.exports.config = {
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
    usage: `${settings.commandPrefix}inspect akio desk\n`
        + `${settings.commandPrefix}examine florian knife\n`
        + `${settings.commandPrefix}look florian knife on desk\n`
        + `${settings.commandPrefix}x florian knife in main pouch of red backpack 1\n`
        + `${settings.commandPrefix}investigate blake blake's knife\n`
        + `${settings.commandPrefix}look jun amadeus\n`
        + `${settings.commandPrefix}examine nestor jae-seong\n`
        + `${settings.commandPrefix}look roma lain's glasses\n`
        + `${settings.commandPrefix}x haruka binita's shirt\n`
        + `${settings.commandPrefix}inspect ambrosia room`,
    usableBy: "Moderator",
    aliases: ["inspect", "investigate", "examine", "look", "x"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a player and an object/item/player. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Before anything else, check if the player is trying to inspect the room.
    if (parsedInput === "ROOM") {
        new Narration(game, player, player.location, `${player.displayName} begins looking around the room.`).send();
        player.sendDescription(game, player.location.description, player.location);
        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully inspected ${player.location.name} for ${player.name}.`);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly inspected the room in ${player.location.channel}`);

        return;
    }

    // Check if the input is an object, or an item on an object.
    const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
    const items = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    var object = null;
    var item = null;
    var container = null;
    var slotName = "";
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].name === parsedInput) {
            object = objects[i];
            break;
        }

        if ((parsedInput.endsWith(` ${objects[i].preposition.toUpperCase()} ${objects[i].name}`) || parsedInput.endsWith(` IN ${objects[i].name}`)) && objects[i].preposition !== "") {
            const objectItems = items.filter(item => item.containerName === `Object: ${objects[i].name}` || objects[i].childPuzzle !== null && item.containerName === `Puzzle: ${objects[i].childPuzzle.name}`);
            for (let j = 0; j < objectItems.length; j++) {
                if (
                    objectItems[j].identifier !== "" && parsedInput === `${objectItems[j].identifier} ${objects[i].preposition.toUpperCase()} ${objects[i].name}` ||
                    parsedInput === `${objectItems[j].prefab.id} ${objects[i].preposition.toUpperCase()} ${objects[i].name}` ||
                    objectItems[j].identifier !== "" && parsedInput === `${objectItems[j].identifier} IN ${objects[i].name}` ||
                    parsedInput === `${objectItems[j].prefab.id} IN ${objects[i].name}`
                ) {
                    item = objectItems[j];
                    container = item.container;
                    slotName = item.slot;
                    break;
                }
            }
            if (item !== null) break;
        }
    }

    if (object !== null) {
        new Narration(game, player, player.location, `${player.displayName} begins inspecting the ${object.name}.`).send();
        player.sendDescription(game, object.description, object);
        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully inspected ${object.name} for ${player.name}.`);

        // Don't notify anyone if the player is inspecting the object that they're hiding in.
        if (!player.hasAttribute("hidden") || player.hidingSpot !== object.name) {
            // Make sure the object isn't locked.
            if (object.childPuzzle === null || !object.childPuzzle.type.endsWith("lock") || object.childPuzzle.solved) {
                let hiddenPlayers = [];
                for (let i = 0; i < game.players_alive.length; i++) {
                    if (game.players_alive[i].location.name === player.location.name && game.players_alive[i].hidingSpot === object.name) {
                        hiddenPlayers.push(game.players_alive[i]);
                        game.players_alive[i].notify(game, `You've been found by ${player.displayName}!`);
                    }
                }

                // Create a list string of players currently hiding in that hiding spot.
                hiddenPlayers.sort(function (a, b) {
                    let nameA = a.displayName.toLowerCase();
                    let nameB = b.displayName.toLowerCase();
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

                if (hiddenPlayersString) player.notify(game, `You find ${hiddenPlayersString} hiding in the ${object.name}!`);
            }
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly inspected ${object.name} in ${player.location.channel}`);

        return;
    }

    var onlySearchInventory = false;
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

            if (items[i].container !== null && items[i].container.hasOwnProperty("prefab")) {
                const preposition = items[i].container.prefab.preposition.toUpperCase();
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
                    if (items[i].container.identifier !== "" && parsedInput.endsWith(` OF ${items[i].container.identifier}`))
                        containerName = items[i].container.identifier;
                    else if (parsedInput.endsWith(` OF ${items[i].container.prefab.id}`))
                        containerName = items[i].container.prefab.id;
                    if (containerName !== "") {
                        let tempSlotName = containerString.substring(0, containerString.lastIndexOf(` OF ${containerName}`)).trim();
                        for (let slot = 0; slot < items[i].container.inventory.length; slot++) {
                            if (items[i].container.inventory[slot].name === tempSlotName && items[i].slot === tempSlotName) {
                                item = items[i];
                                container = item.container;
                                slotName = item.slot;
                                break;
                            }
                        }
                        if (item !== null) break;
                    }
                    // Only a container was specified.
                    else if (items[i].container.identifier !== "" && items[i].container.identifier === containerString || items[i].container.prefab.id === containerString) {
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
        let preposition = "in";
        let containerName = "";
        let containerIdentifier = "";
        if (container.hasOwnProperty("prefab")) {
            preposition = container.prefab.preposition;
            containerName = container.singleContainingPhrase;
            containerIdentifier = `${slotName} of ${container.identifier}`;
        }
        else if (container.hasOwnProperty("hidingSpotCapacity")) {
            preposition = container.preposition;
            containerName = `the ${container.name}`;
            containerIdentifier = container.name;
        }
        else if (container.hasOwnProperty("solved")) {
            preposition = container.parentObject.preposition;
            containerName = `the ${container.parentObject.name}`;
            containerIdentifier = container.name;
        }
        if (!item.prefab.discreet)
            new Narration(game, player, player.location, `${player.displayName} begins inspecting ${item.singleContainingPhrase}` + (containerName ? ` ${preposition} ${containerName}` : '') + `.`).send();
        player.sendDescription(game, item.description, item);
        const identifier = item.identifier !== "" ? item.identifier : item.prefab.id;
        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully inspected ${identifier} ${preposition} ${containerIdentifier} for ${player.name}.`);

        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly inspected ${identifier} ${preposition} ${containerIdentifier} in ${player.location.channel}`);

        return;
    }

    // Check if the input is an item in the player's inventory.
    const inventory = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
    for (let i = 0; i < inventory.length; i++) {
        parsedInput = parsedInput.replace(`${player.name.toUpperCase()}S `, "");
        if ((inventory[i].identifier !== "" && inventory[i].identifier === parsedInput || inventory[i].prefab.id === parsedInput || inventory[i].prefab.name === parsedInput)
            && inventory[i].quantity > 0) {
            const item = inventory[i];
            if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} takes out ${item.prefab.singleContainingPhrase} and begins inspecting it.`).send();
            player.sendDescription(game, item.description, item);
            game.messageHandler.addGameMechanicMessage(message.channel, `Successfully inspected ${player.name}'s ` + (item.identifier !== "" ? item.identifier : item.prefab.id) + ` for ${player.name}.`);

            const time = new Date().toLocaleTimeString();
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly inspected ` + (item.identifier !== "" ? item.identifier : item.prefab.id) + ` from ${player.originalPronouns.dpos} inventory in ${player.location.channel}`);

            return;
        }
    }

    // Check if the input is a player in the room.
    for (let i = 0; i < player.location.occupants.length; i++) {
        let occupant = player.location.occupants[i];
        const possessive = occupant.name.toUpperCase() + "S ";
        if (parsedInput.startsWith(occupant.name.toUpperCase()) && occupant.hasAttribute("hidden"))
            return game.messageHandler.addReply(message, `Couldn't find "${input}".`);
        if (occupant.name.toUpperCase() === parsedInput) {
            // Don't let player inspect themselves.
            if (occupant.name === player.name) return game.messageHandler.addReply(message, `${player.name} can't inspect ${player.originalPronouns.ref}.`);
            player.sendDescription(game, occupant.description, occupant);
            game.messageHandler.addGameMechanicMessage(message.channel, `Successfully inspected ${occupant.name} for ${player.name}.`);

            const time = new Date().toLocaleTimeString();
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly inspected ${occupant.name} in ${player.location.channel}`);

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
                        // Clear out any il tags in the description.
                        let description = inventory[j].description.replace(/(<(il)(\s[^>]+?)*>)[\s\S]+?(<\/\2>)/g, "$1$4");
                        player.sendDescription(game, description, inventory[j]);
                        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully inspected ${occupant.name}'s ` + (inventory[j].identifier !== "" ? inventory[j].identifier : inventory[j].prefab.id) + ` for ${player.name}.`);

                        const time = new Date().toLocaleTimeString();
                        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly inspected ` + (inventory[j].identifier !== "" ? inventory[j].identifier : inventory[j].prefab.id) + ` from ${occupant.name}'s inventory in ${player.location.channel}`);

                        return;
                    }
                }
            }
        }
    }

    return game.messageHandler.addReply(message, `Couldn't find "${input}".`);
};
