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
        + "items should generally use the prefab ID or container identifier. If there are multiple items in the room "
        + "with the same ID, you can specify which one to inspect using its container's name (if the container is an "
        + "object or puzzle), or its prefab ID or container identifier (if it's an item). The player can be forced "
        + "to inspect items and inventory items belonging to a specific player (including themself) using the "
        + "player's name followed by \"'s\". If inspecting a different player's inventory items, a narration will not be sent.",
    usage: `${settings.commandPrefix}inspect akio desk\n`
        + `${settings.commandPrefix}examine florian knife\n`
        + `${settings.commandPrefix}examine florian knife on desk\n`
        + `${settings.commandPrefix}examine florian knife in left pocket of pants\n`
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
    var object = null;
    var item = null;
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].name === parsedInput) {
            object = objects[i];
            break;
        }

        if (parsedInput.endsWith(` ${objects[i].preposition.toUpperCase()} ${objects[i].name}`)) {
            const items = game.items.filter(item => item.location.name === player.location.name
                && item.accessible
                && (item.quantity > 0 || isNaN(item.quantity))
                && item.container.name === objects[i].name);
            for (let j = 0; j < items.length; j++) {
                if (
                    parsedInput === `${items[j].prefab.name} ${objects[i].preposition.toUpperCase()} ${objects[i].name}` ||
                    parsedInput === `${items[j].prefab.pluralName} ${objects[i].preposition.toUpperCase()} ${objects[i].name}` ||
                    parsedInput === `${items[j].prefab.name} IN ${objects[i].name}` ||
                    parsedInput === `${items[j].prefab.pluralName} IN ${objects[i].name}`
                ) {
                    object = objects[i];
                    item = items[j];
                    break;
                }
            }
        }
    }

    if (item !== null) {
        if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} begins inspecting ${item.prefab.singleContainingPhrase} on ${object.name}.`).send();
        player.sendDescription(game, item.description, item);
        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully inspected ${item.identifier !== "" ? item.identifier : item.prefab.id} ${object.preposition} ${object.name} for ${player.name}`);

        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly inspected ` + (item.identifier !== "" ? item.identifier : item.prefab.id) + ` ${object.preposition} ${object.name} in ${player.location.channel}`);

        return;
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
        const items = game.items.filter(item => item.location.name === player.location.name
            && item.accessible
            && (item.quantity > 0 || isNaN(item.quantity)));
        var item = null;
        var logMsg = null;
        for (let i = 0; i < items.length; i++) {
            if (items[i].identifier !== "" && items[i].identifier === parsedInput || items[i].prefab.id === parsedInput || items[i].prefab.name === parsedInput || items[i].prefab.pluralName === parsedInput) {
                item = items[i];
                break;
            }

            if (parsedInput.startsWith(`${items[i].name} IN `)) {
                const containerName = items[i].containerName;
                const puzzleContainers = game.puzzles.filter(puzzle => puzzle.location.name === player.location.name
                    && puzzle.accessible
                    && `Puzzle: ${puzzle.name}` === containerName);
                for (let j = 0; j < puzzleContainers.length; j++) {
                    if (items[i].container === puzzleContainers[j]) {
                        item = items[i];
                        break;
                    }
                }

                const roomItems = items.filter(item => item.inventory.length > 0);
                for (let j = 0; j < roomItems.length; j++) {
                    let containerSubstr = parsedInput.substring(`${items[i].name} IN`.length).trim();
                    if (parsedInput.endsWith(` OF ${roomItems[j].name}`)) {
                        let tempSlotName = containerSubstr.substring(0, containerSubstr.indexOf(` OF ${items[i].container.name}`));
                        for (let k = 0; k < roomItems[j].inventory.length; k++) {
                            if (containerName === `Item: ${items[i].container.identifier}/${tempSlotName}`) {
                                item = items[i];
                                logMsg = `${player.name} inspected ` + (item.identifier !== "" ? item.identifier : item.prefab.id) + ` in ${tempSlotName} of ${items[i].container.identifier} in ${player.location.channel}`;
                                break;
                            }
                        }
                        if (item !== null) {
                            break;
                        } else if (tempSlotName !== "") {
                            return game.messageHandler.addReply(message, `Couldn't find ${items[i].name} in ${tempSlotName} of ${items[i].container.name}.`);
                        }
                    }
                }
                if (item === null) {
                    for (let j = 0; j < roomItems.length; j++) {
                        if (items[i].container.identifier === roomItems[j].identifier) {
                            item = items[i];
                            logMsg = `${player.name} inspected ` + (item.identifier !== "" ? item.identifier : item.prefab.id) + ` in ${roomItems[j].container.identifier} in ${player.location.channel}`;
                            break;
                        }
                    }
                }
            }
        }

        if (item !== null) {
            if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} begins inspecting ${item.prefab.singleContainingPhrase}.`).send();
            player.sendDescription(game, item.description, item);
            game.messageHandler.addGameMechanicMessage(message.channel, `Successfully inspected ` + (item.identifier !== "" ? item.identifier : item.prefab.id) + ` for ${player.name}.`);

            const time = new Date().toLocaleTimeString();
            if (logMsg !== null) {
                game.messageHandler.addLogMessage(game.logChannel, `${time} - ${logMsg}`);
            } else {
                game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly inspected ` + (item.identifier !== "" ? item.identifier : item.prefab.id) + ` in ${player.location.channel}`);
            }

            return;
        }
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
