import GestureAction from '../Data/Actions/GestureAction.ts';
import Fixture from '../Data/Fixture.ts';
import ItemInstance from '../Data/ItemInstance.ts';
import Puzzle from '../Data/Puzzle.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "gesture_player",
    description: "Performs a gesture.",
    details: `Performs one of a set of pre-defined gestures. Everybody in the room with you will see you do this gesture. `
        + `This allows you to communicate non-verbally, though some gestures cannot be performed if you have certain status effects. `
        + `For example, if your face is concealed with a mask, you cannot use gestures like "smile" or "frown", as nobody would be able to see it. `
        + `To see a list of all of the gestures you can currently perform, send the \`gesture\` command followed by "list".\n\n`
        + `Certain gestures may require a target to perform them. For example, a gesture might require you specify an exit, a fixture, another player, etc. `
        + `To specify a target, enter the name of the target directly after the name of the gesture. Note that a gesture can only be performed with one target at a time.`,
    usableBy: "Player",
    aliases: ["gesture", "g"],
    requiresGame: true,
    usableInEditMode: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}gesture smile\n`
        + `${settings.commandPrefix}g point at DOOR 1\n`
        + `${settings.commandPrefix}gesture wave Johnny\n`
        + `${settings.commandPrefix}g sit CHAIR\n`
        + `${settings.commandPrefix}gesture list`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Player} player - The player who issued the command.
 */
export async function execute(game, message, command, args, player) {
    if (args.length === 0)
        return game.communicationHandler.reply(message, `You need to specify a gesture. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable gesture");
    if (status.length > 0) return game.communicationHandler.reply(message, `You cannot do that because you are **${status[0].id}**.`);

    // This will be checked multiple times, so get it now.
    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");

    let input = args.join(" ").toLowerCase().replace(/\'/g, "");

    if (input === "list") {
        const action = new GestureAction(game, message, player, player.location, false);
        action.performGestureList();
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
            return game.communicationHandler.reply(message, `Couldn't find gesture "${input}". For a list of gestures, send \`${game.settings.commandPrefix}gesture list\`.`);
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
                    if (target) {
                        if (hiddenStatus.length > 0 && player.hidingSpot !== target.name)
                            return game.communicationHandler.reply(message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
                        targetType = "Fixture";
                    } else target = null;
                } else if (requireType === "RoomItem" || requireType == "Item") {
                    target = game.entityFinder.getRoomItems(input2, player.location.id, true, undefined, undefined, undefined, undefined, false, 'player')[0];
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
                                return game.communicationHandler.reply(message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
                        }
                        targetType = "RoomItem";
                    } else target = null;
                } else if (requireType === "Player") {
                    for (const occupant of player.location.occupants) {
                        if (
                            occupant.displayName.toLowerCase().replace(/\'/g, "") === input2 &&
                            ((hiddenStatus.length === 0 && !occupant.isHidden()) ||
                                occupant.hidingSpot === player.hidingSpot)
                        ) {
                            if (occupant.name === player.name)
                                return game.communicationHandler.reply(message, "You can't gesture toward yourself.");
                            targetType = "Player";
                            target = occupant;
                            break;
                        } else if (
                            occupant.displayName.toLowerCase().replace(/\'/g, "") === input2 &&
                            hiddenStatus.length > 0 &&
                            !occupant.isHidden()
                        )
                            return game.communicationHandler.reply(message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
                    }
                } else if (requireType === "InventoryItem") {
                    for (const hand of game.entityFinder.getPlayerHands(player)) {
                        if (
                            hand.equippedItem !== null &&
                            (hand.equippedItem.name.toLowerCase() === input2 ||
                                hand.equippedItem.pluralName.toLowerCase() === input2)
                        ) {
                            targetType = "InventoryItem";
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
            return game.communicationHandler.reply(message, `Couldn't find target "${input}" in the room with you.`);
        for (let i = 0; i < gesture.disabledStatuses.length; i++) {
            if (player.status.has(gesture.disabledStatuses[i].id))
                return game.communicationHandler.reply(message, `You cannot do that gesture because you are **${gesture.disabledStatuses[i].id}**.`);
        }

        const action = new GestureAction(game, message, player, player.location, false);
        action.performGesture(gesture, targetType, target);
    }
}
