import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import ItemInstance from '../Data/ItemInstance.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { createPaginatedEmbed } from '../Modules/helpers.js';
import Room from '../Data/Room.js';

/** @type {CommandConfig} */
export const config = {
    name: "gesture_moderator",
    description: "Performs a gesture for the given player.",
    details: `Makes the given player perform one of a set of predefined gestures. Everybody in the room with them will see them do this gesture. `
        + `Certain gestures may require a target to perform them. For example, a gesture might require you specify an Exit, an Object, another Player, etc. `
        + `A gesture can only be performed with one target at a time. Gestures can be made impossible if the given player is inflicted with certain Status Effects. `
        + `For example, if they are concealed, they cannot smile, frown, etc. as nobody would be able to see it. `
        + `To see a list of all possible gestures, use "list".`,
    usableBy: "Moderator",
    aliases: ["gesture"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}gesture astrid smile\n`
        + `${settings.commandPrefix}gesture akira point at door 1\n`
        + `${settings.commandPrefix}gesture holly wave johnny`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    let input = args.join(" ").toLowerCase().replace(/\'/g, "");

    if (input === "list") {
        const fields = game.entityFinder.getGestures().map(gesture => gesture);
        const pages = [];
        let page = 0;

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
        game.guildContext.commandChannel.send({ embeds: [embed] }).then(msg => {
            msg.react('⏪').then(() => {
                msg.react('⏩');

                const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
                const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

                const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 300000 });
                const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 300000 });

                backwards.on("collect", () => {
                    const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏪');
                    if (reaction) reaction.users.cache.forEach(user => { if (user.id !== game.botContext.client.user.id) reaction.users.remove(user.id); });
                    if (page === 0) return;
                    page--;
                    embed = embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
                    msg.edit({ embeds: [embed] });
                });

                forwards.on("collect", () => {
                    const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏩');
                    if (reaction) reaction.users.cache.forEach(user => { if (user.id !== game.botContext.client.user.id) reaction.users.remove(user.id); });
                    if (page === pages.length - 1) return;
                    page++;
                    embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
                    msg.edit({ embeds: [embed] });
                });
            });
        });
    }
    else {
        if (args.length < 2)
            return messageHandler.addReply(game, message, `You need to specify a player and a gesture. Usage:\n${usage(game.settings)}`);

        const player = game.entityFinder.getLivingPlayer(args[0]);
        if (player === undefined) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);
        args.splice(0, 1);
        input = args.join(" ").toLowerCase().replace(/\'/g, "");

        let gesture = null;
        let targetType = "";
        let target = null;
        for (let i = 0; i < game.gestures.length; i++) { // TODO: optimize this ENTIRE for block later!!! very evil!!!
            if (game.gestures[i].id.toLowerCase().replace(/\'/g, "") === input) {
                if (game.gestures[i].requires.length > 0)
                    return messageHandler.addReply(game, message, `You need to specify a target for that gesture.`);
                gesture = game.gestures[i];
                break;
            }
            else if (input.startsWith(game.gestures[i].id.toLowerCase().replace(/\'/g, "") + ' ')) {
                gesture = game.gestures[i];
                const input2 = input.substring(game.gestures[i].id.toLowerCase().replace(/\'/g, "").length).trim();

                if (input2 !== "") {
                    for (let j = 0; j < gesture.requires.length; j++) {
                        if (gesture.requires[j] === "Exit") {
                            target = game.entityFinder.getExit(player.location, input2);
                            if (target)
                                targetType = "Exit";
                            else
                                target = null;
                        }
                        else if (gesture.requires[j] === "Fixture" || gesture.requires[j] === "Object") {
                            const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
                            for (let k = 0; k < fixtures.length; k++) {
                                if (fixtures[k].name.toLowerCase() === input2) {
                                    targetType = "Fixture";
                                    target = fixtures[k];
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Room Item" || gesture.requires[j] === "Item") {
                            const items = game.items.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
                            for (let k = 0; k < items.length; k++) {
                                if (items[k].prefab.id.toLowerCase() === input2 || items[k].name.toLowerCase() === input2) {
                                    targetType = "Room Item";
                                    target = items[k];
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Player") {
                            const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");
                            for (let k = 0; k < player.location.occupants.length; k++) {
                                const occupant = player.location.occupants[k];
                                if (occupant.name.toLowerCase().replace(/\'/g, "") === input2 && (hiddenStatus.length === 0 && !occupant.hasBehaviorAttribute("hidden") || occupant.hidingSpot === player.hidingSpot)) {
                                    // Player cannot gesture toward themselves.
                                    if (occupant.name === player.name) return messageHandler.addReply(game, message, `${player.name} can't gesture toward ${player.originalPronouns.ref}.`);
                                    targetType = "Player";
                                    target = occupant;
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Inventory Item") {
                            for (let slot = 0; slot < player.inventory.length; slot++) {
                                if ((player.inventory[slot].id === "RIGHT HAND" || player.inventory[slot].id === "LEFT HAND")
                                    && player.inventory[slot].equippedItem !== null
									&& (player.inventory[slot].equippedItem.prefab.id.toLowerCase() === input2 || player.inventory[slot].equippedItem.name.toLowerCase() === input2)) {
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
            return messageHandler.addReply(game, message, `Couldn't find target "${input}" in the room with ${player.name}.`);
        for (let i = 0; i < gesture.disabledStatuses.length; i++) {
            if (player.statusString.includes(gesture.disabledStatuses[i].id))
                return messageHandler.addReply(game, message, `${player.name} cannot do that gesture because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? "are" : "is") + ` **${gesture.disabledStatuses[i].id}**.`);
        }

        player.gesture(gesture, targetType, target);
        // Post log message. Message should vary based on target type.
        const time = new Date().toLocaleTimeString();
        if (targetType === "")
            messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly did gesture ${gesture.id} in ${player.location.channel}`);
        else if (targetType === "Exit" || targetType === "Fixture" || targetType === "Player")
            messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly did gesture ${gesture.id} to ${target.name} in ${player.location.channel}`);
        else if (target instanceof ItemInstance)
            messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly did gesture ${gesture.id} to ${target.identifier ? target.identifier : target.prefab.id} in ${player.location.channel}`);
    }

    return;
}
