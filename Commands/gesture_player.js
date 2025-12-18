import GameSettings from '../Classes/GameSettings.js';
import Fixture from '../Data/Fixture.js';
import Game from '../Data/Game.js';
import ItemInstance from '../Data/ItemInstance.js';
import Player from '../Data/Player.js';
import Puzzle from '../Data/Puzzle.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { createPaginatedEmbed } from '../Modules/helpers.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "gesture_player",
    description: "Performs a gesture.",
    details: `Performs one of a set of predefined gestures. Everybody in the room with you will see you do this gesture. `
        + `This allows you to communicate during times where you are unable to speak for some reason, though you can gesture at any time, with few exceptions. `
        + `Certain gestures may require a target to perform them. For example, a gesture might require you specify an Exit, an Object, another Player, etc. `
        + `A gesture can only be performed with one target at a time. Gestures can be made impossible if you are inflicted with certain Status Effects. `
        + `For example, if you are concealed, you cannot smile, frown, etc. as nobody would be able to see it. `
        + `To see a list of all possible gestures, send use "list".`,
    usableBy: "Player",
    aliases: ["gesture"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}gesture smile\n`
        + `${settings.commandPrefix}gesture point at door 1\n`
        + `${settings.commandPrefix}gesture wave johnny`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {AEMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a gesture. Usage:\n${usage(game.settings)}`);

    const status = player.getAttributeStatusEffects("disable gesture");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // This will be checked multiple times, so get it now.
    const hiddenStatus = player.getAttributeStatusEffects("hidden");

    var input = args.join(" ").toLowerCase().replace(/\'/g, "");

    if (input === "list") {
        var fields = [];
        var pages = [];
        var page = 0;

        for (let i = 0; i < game.gestures.length; i++)
            fields.push(game.gestures[i]);

        // Divide the fields into pages.
        for (let i = 0, pageNo = 0; i < fields.length; i++) {
            // Divide the menu into groups of 10.
            if (i % 15 === 0) {
                pages.push([]);
                if (i !== 0) pageNo++;
            }
            pages[pageNo].push(fields[i]);
        }

        const embedAuthorName = `Gestures List`;
        const embedAuthorIcon = game.guildContext.guild.members.me.avatarURL() || game.guildContext.guild.members.me.user.avatarURL();
        const embedDescription = `These are the available gestures.\nFor more information on the gesture command, send \`${game.settings.commandPrefix}help gesture\`.`;
        const fieldName = (entryIndex) => pages[page][entryIndex].id;
        const fieldValue = (entryIndex) => pages[page][entryIndex].description;
        let embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
        message.author.send({ embeds: [embed] }).then(msg => {
            msg.react('⏪').then(() => {
                msg.react('⏩');

                const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
                const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

                const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 300000 });
                const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 300000 });

                backwards.on("collect", () => {
                    if (page === 0) return;
                    page--;
                    embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
                    msg.edit({ embeds: [embed] });
                });

                forwards.on("collect", () => {
                    if (page === pages.length - 1) return;
                    page++;
                    embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
                    msg.edit({ embeds: [embed] });
                });
            });
        });
    }
    else {
        var gesture = null;
        var targetType = "";
        var target = null;
        for (let i = 0; i < game.gestures.length; i++) {
            if (game.gestures[i].id.toLowerCase().replace(/\'/g, "") === input) {
                if (game.gestures[i].requires.length > 0)
                    return messageHandler.addReply(game, message, `You need to specify a target for that gesture.`);
                gesture = game.gestures[i];
                break;
            }
            else if (input.startsWith(game.gestures[i].id.toLowerCase().replace(/\'/g, "") + ' ')) {
                gesture = game.gestures[i];
                let input2 = input.substring(game.gestures[i].id.toLowerCase().replace(/\'/g, "").length).trim();

                if (input2 !== "") {
                    for (let j = 0; j < gesture.requires.length; j++) {
                        if (gesture.requires[j] === "Exit") {
                            for (let k = 0; k < player.location.exit.length; k++) {
                                if (player.location.exit[k].name.toLowerCase() === input2) {
                                    if (hiddenStatus.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
                                    targetType = "Exit";
                                    target = player.location.exit[k];
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Fixture" || gesture.requires[j] === "Object") {
                            const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
                            for (let k = 0; k < fixtures.length; k++) {
                                if (fixtures[k].name.toLowerCase() === input2) {
                                    // Make sure the player can only gesture to the fixture they're hiding in, if they're hidden.
                                    if (hiddenStatus.length > 0 && player.hidingSpot !== fixtures[k].name) return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
                                    targetType = "Fixture";
                                    target = fixtures[k];
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Room Item" || gesture.requires[j] === "Item") {
                            const items = game.items.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
                            for (let k = 0; k < items.length; k++) {
                                if (items[k].name.toLowerCase() === input2) {
                                    // Make sure the player can only gesture to items contained in the fixture they're hiding in, if they're hidden.
                                    if (hiddenStatus.length > 0) {
                                        let topContainer = items[k].container;
                                        while (topContainer !== null && topContainer instanceof ItemInstance)
                                            topContainer = topContainer.container;
                                        if (topContainer !== null && topContainer instanceof Puzzle)
                                            topContainer = topContainer.parentFixture;

                                        if (topContainer === null || topContainer instanceof Fixture && topContainer.name !== player.hidingSpot)
                                            return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
                                    }
                                    targetType = "Room Item";
                                    target = items[k];
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Player") {
                            for (let k = 0; k < player.location.occupants.length; k++) {
                                let occupant = player.location.occupants[k];
                                // Make sure the player can only gesture to players hiding in the same fixture they're hiding in, if they're hidden.
                                if (occupant.displayName.toLowerCase().replace(/\'/g, "") === input2 && (hiddenStatus.length === 0 && !occupant.hasAttribute("hidden") || occupant.hidingSpot === player.hidingSpot)) {
                                    // Player cannot gesture toward themselves.
                                    if (occupant.name === player.name) return messageHandler.addReply(game, message, "You can't gesture toward yourself.");
                                    targetType = "Player";
                                    target = occupant;
                                    break;
                                }
                                else if (occupant.displayName.toLowerCase().replace(/\'/g, "") === input2 && hiddenStatus.length > 0 && !occupant.hasAttribute("hidden"))
                                    return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
                            }
                        }
                        else if (gesture.requires[j] === "Inventory Item") {
                            for (let slot = 0; slot < player.inventory.length; slot++) {
                                if ((player.inventory[slot].id === "RIGHT HAND" || player.inventory[slot].id === "LEFT HAND")
                                    && player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name.toLowerCase() === input2) {
                                    targetType = "Inventory Item";
                                    target = player.inventory[slot].equippedItem;
                                    break;
                                }
                            }
                        }
                        if (target !== null) break;
                    }
                    if (gesture !== null && target !== null)
                        break;
                }
            }
        }
        if (gesture === null) return messageHandler.addReply(game, message, `Couldn't find gesture "${input}". For a list of gestures, send \`${game.settings.commandPrefix}gesture list\`.`);
        input = input.substring(gesture.id.toLowerCase().replace(/\'/g, "").length).trim();
        if (input !== "" && gesture.requires.length === 0)
            return messageHandler.addReply(game, message, `That gesture doesn't take a target.`);
        if (target === null && gesture.requires.length > 0)
            return messageHandler.addReply(game, message, `Couldn't find target "${input}" in the room with you.`);
        for (let i = 0; i < gesture.disabledStatuses.length; i++) {
            if (player.statusString.includes(gesture.disabledStatuses[i].id))
                return messageHandler.addReply(game, message, `You cannot do that gesture because you are **${gesture.disabledStatuses[i].id}**.`);
        }

        player.gesture(gesture, targetType, target);
        // Post log message. Message should vary based on target type.
        const time = new Date().toLocaleTimeString();
        if (targetType === "")
            messageHandler.addLogMessage(game, `${time} - ${player.name} did gesture ${gesture.id} in ${player.location.channel}`);
        else if (targetType === "Exit" || targetType === "Fixture" || targetType === "Player")
            messageHandler.addLogMessage(game, `${time} - ${player.name} did gesture ${gesture.id} to ${target.name} in ${player.location.channel}`);
        else if (target instanceof ItemInstance)
            messageHandler.addLogMessage(game, `${time} - ${player.name} did gesture ${gesture.id} to ${target.identifier ? target.identifier : target.prefab.id} in ${player.location.channel}`);
    }

    return;
}
