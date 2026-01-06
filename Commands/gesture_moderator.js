import GestureAction from '../Data/Actions/GestureAction.js';
import { createPaginatedEmbed } from '../Modules/helpers.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

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
export function usage(settings) {
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
export async function execute(game, message, command, args) {
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
            return game.communicationHandler.reply(message, `You need to specify a player and a gesture. Usage:\n${usage(game.settings)}`);

        const player = game.entityFinder.getLivingPlayer(args[0]);
        if (player === undefined) return game.communicationHandler.reply(message, `Player "${args[0]}" not found.`);
        args.splice(0, 1);
        input = args.join(" ").toLowerCase().replace(/\'/g, "");

        let gesture;
        let targetType = "";
        let target = null;
        for (let index = args.length; index >= 0; index--) {
            gesture = game.entityFinder.getGesture(args.slice(0, index).join(" "));
            if (gesture) {
                args = args.slice(index);
                break;
            }
        }
        if (gesture === undefined)
            return game.communicationHandler.reply(message,  `Couldn't find gesture "${input}". For a list of gestures, send \`${game.settings.commandPrefix}gesture list\`.`);
        else if (args.length === 0 && gesture.requires.length > 0)
            return game.communicationHandler.reply(message, `You need to specify a target for that gesture.`);
        else if (args.length > 0 && gesture.requires.length === 0)
            return game.communicationHandler.reply(message, `That gesture doesn't take a target.`);
        else if (args.length > 0 && gesture.requires.length > 0) {
            const input2 = args.join(" ").toLowerCase().replace(/\'/g, "");
            for (const requireType of gesture.requires) {
                if (requireType === "Exit") {
                    target = game.entityFinder.getExit(player.location, input2);
                    if (target) targetType = "Exit";
                    else target = null;
                } else if (requireType === "Fixture" || requireType === "Object") {
                    target = game.entityFinder.getFixtures(input2, player.location.id, true)[0];
                    if (target) targetType = "Fixture";
                    else target = null;
                } else if (requireType === "Room Item" || requireType == "Item") {
                    target = game.entityFinder.getRoomItems(input2, player.location.id, true)[0];
                    if (target) targetType = "Room Item";
                    else target = null;
                } else if (requireType === "Player") {
                    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");
                    for (const occupant of player.location.occupants) {
                        if (
                            occupant.name.toLowerCase().replace(/\'/g, "") === input2 &&
                            ((hiddenStatus.length === 0 && !occupant.hasBehaviorAttribute("hidden")) ||
                                occupant.hidingSpot === player.hidingSpot)
                        ) {
                            if (occupant.name === player.name)
                                return game.communicationHandler.reply(message, `${player.name} can't gesture toward ${player.originalPronouns.ref}.`);
                            targetType = "Player";
                            target = occupant;
                            break;
                        }
                    }
                } else if (requireType === "Inventory Item") {
                    for (const hand of game.entityFinder.getPlayerHands(player)) {
                        if (
                            hand.equippedItem !== null &&
                            (hand.equippedItem.prefab.id.toLowerCase() === input2 ||
                                hand.equippedItem.name.toLowerCase() === input2)
                        ) {
                            targetType = "Inventory Item";
                            target = hand.equippedItem;
                            break;
                        }
                    }
                }
                if (target !== null) break;
            }
        }
        input = input.substring(gesture.id.toLowerCase().replace(/\'/g, "").length).trim();
        if (target === null && gesture.requires.length > 0)
            return game.communicationHandler.reply(message, `Couldn't find target "${input}" in the room with ${player.name}.`);
        for (let i = 0; i < gesture.disabledStatuses.length; i++) {
            if (player.statusCollection.has(gesture.disabledStatuses[i].id))
                return game.communicationHandler.reply(message, `${player.name} cannot do that gesture because ${player.originalPronouns.sbj} ${player.originalPronouns.plural ? "are" : "is"} **${gesture.disabledStatuses[i].id}**.`);
        }

        const action = new GestureAction(game, message, player, player.location, true);
        action.performGesture(gesture, targetType, target);
        game.communicationHandler.sendToCommandChannel(`Successfully made ${player.name} perform gesture ${gesture.id}.`);
    }
}
