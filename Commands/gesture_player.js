import GestureAction from '../Data/Actions/GestureAction.js';
import Fixture from '../Data/Fixture.js';
import ItemInstance from '../Data/ItemInstance.js';
import Puzzle from '../Data/Puzzle.js';
import { addReply } from '../Modules/messageHandler.js';
import { createPaginatedEmbed } from '../Modules/helpers.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

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
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify a gesture. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable gesture");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // This will be checked multiple times, so get it now.
    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");

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
            return addReply(
                game,
                message,
                `Couldn't find gesture "${input}". For a list of gestures, send \`${game.settings.commandPrefix}gesture list\`.`
            );
        else if (args.length === 0 && gesture.requires.length > 0)
            return addReply(game, message, `You need to specify a target for that gesture.`);
        else if (args.length > 0 && gesture.requires.length === 0)
            return addReply(game, message, `That gesture doesn't take a target.`);
        else if (args.length > 0 && gesture.requires.length > 0) {
            const input2 = args.join(" ").toLowerCase().replace(/\'/g, "");
            for (const requireType of gesture.requires) {
                if (requireType === "Exit") {
                    target = game.entityFinder.getExit(player.location, input2);
                    if (target) targetType = "Exit";
                    else target = null;
                } else if (requireType === "Fixture" || requireType === "Object") {
                    target = game.entityFinder.getFixtures(input2, player.location.id, true)[0];
                    if (target) {
                        if (hiddenStatus.length > 0 && player.hidingSpot !== target.name)
                            return addReply(
                                game,
                                message,
                                `You cannot do that because you are **${hiddenStatus[0].id}**.`
                            );
                        targetType = "Fixture";
                    } else target = null;
                } else if (requireType === "Room Item" || requireType == "Item") {
                    target = game.entityFinder.getRoomItems(input2, player.location.id, true)[0];
                    if (target) {
                        if (hiddenStatus.length > 0) {
                            let topContainer = target.container;
                            while (topContainer !== null && topContainer instanceof ItemInstance)
                                topContainer = topContainer.container;
                            if (topContainer !== null && topContainer instanceof Puzzle)
                                topContainer = topContainer.parentFixture;

                            if (
                                topContainer === null ||
                                (topContainer instanceof Fixture && topContainer.name !== player.hidingSpot)
                            )
                                return addReply(
                                    game,
                                    message,
                                    `You cannot do that because you are **${hiddenStatus[0].id}**.`
                                );
                        }
                        targetType = "Room Item";
                    } else target = null;
                } else if (requireType === "Player") {
                    for (const occupant of player.location.occupants) {
                        if (
                            occupant.displayName.toLowerCase().replace(/\'/g, "") === input2 &&
                            ((hiddenStatus.length === 0 && !occupant.hasBehaviorAttribute("hidden")) ||
                                occupant.hidingSpot === player.hidingSpot)
                        ) {
                            if (occupant.name === player.name)
                                return addReply(game, message, "You can't gesture toward yourself.");
                            targetType = "Player";
                            target = occupant;
                            break;
                        } else if (
                            occupant.displayName.toLowerCase().replace(/\'/g, "") === input2 &&
                            hiddenStatus.length > 0 &&
                            !occupant.hasBehaviorAttribute("hidden")
                        )
                            return addReply(
                                game,
                                message,
                                `You cannot do that because you are **${hiddenStatus[0].id}**.`
                            );
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
            return addReply(game, message, `Couldn't find target "${input}" in the room with you.`);
        for (let i = 0; i < gesture.disabledStatuses.length; i++) {
            if (player.statusCollection.has(gesture.disabledStatuses[i].id))
                return addReply(
                    game,
                    message,
                    `You cannot do that gesture because you are **${gesture.disabledStatuses[i].id}**.`
                );
        }

        const action = new GestureAction(game, message, player, player.location, false);
        action.performGesture(gesture, targetType, target);
    }
}
