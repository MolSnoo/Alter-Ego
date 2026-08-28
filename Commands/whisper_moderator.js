import Dialog from '../Data/Dialog.ts';
import Whisper from '../Data/Whisper.ts';
import SayAction from '../Data/Actions/SayAction.ts';
import WhisperAction from '../Data/Actions/WhisperAction.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "whisper_moderator",
    description: "Initiates a whisper between the given players.",
    details: `Creates a channel for the given players to whisper in. Only the selected players will be able to read `
        + `messages posted in the new channel, but a narration will be sent in the room indicating that they've begun `
        + `whispering to each other. You can select as many players as you want as long as they're all in the same room.\n\n`
        + `When a player in the whisper leaves the room, they will be removed from the channel. If everyone leaves the `
        + `room, the whisper channel will be deleted or archived, depending on the \`AUTO_DELETE_WHISPER_CHANNELS\` `
        + `setting in your \`.env\` file.\n\n`
        + `If one of the players listed is an NPC, any text that remains after the list of players will be sent to the `
        + `new whisper channel as dialog from that NPC. After the channel has been created, sending the command again `
        + `with a different string of text at the end will make the NPC whisper that text as dialog in the channel.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["whisper", "w"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}whisper Nestor Jun\n`
        + `${settings.commandPrefix}w Sadie Elijah Flint\n`
        + `${settings.commandPrefix}whisper Amy Asuka Clean it up.\n`
        + `${settings.commandPrefix}w Amy Asuka The mess you made. Clean it up now.`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    const sentMessageInLatchChannel = moderator?.sentMessageInLatchChannel(message) ?? false;
    if (!sentMessageInLatchChannel && args.length < 2)
        return game.communicationHandler.reply(message, `You need to choose at least two players. Usage:\n${usage(game.settings)}`);
    if (sentMessageInLatchChannel && args.length < 1)
        return game.communicationHandler.reply(message, `You need to choose a recipient. Usage:\n${usage(game.settings)}`);

    // Get all players mentioned.
    /** @type {Player[]} */
    const recipients = new Array();
    let npc = null;
    if (sentMessageInLatchChannel) {
        recipients.push(moderator.getLatch());
        npc = moderator.getLatch();
    }
    let i;
    for (i = 0; i < args.length; i++) {
        let playerExists = false;
        const player = game.entityFinder.getLivingPlayer(args[i]);
        if (player) {
            for (let j = 0; j < recipients.length; j++) {
                // Player cannot be included multiple times.
                if (recipients[j].name === player.name)
                    return game.communicationHandler.reply(message, `Can't include the same player multiple times.`);
                if (recipients[j].location.id !== player.location.id)
                    return game.communicationHandler.reply(message, `The selected players aren't all in the same room.`);
                if (player.isHidden() && (!recipients[j].isHidden() || recipients[j].hidingSpot !== player.hidingSpot))
                    return game.communicationHandler.reply(message, `The selected players aren't all hidden together.`);
                // Check attributes that would prohibit the player from whispering to someone in the room.
                let status = player.getBehaviorAttributeStatusEffects("disable whisper");
                if (!player.isHidden() && status.length > 0) return game.communicationHandler.reply(message, `${player.name} can't whisper because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? `are` : `is`) + ` **${status[0].id}**.`);
                status = player.getBehaviorAttributeStatusEffects("no hearing");
                if (status.length > 0) return game.communicationHandler.reply(message, `${player.name} can't whisper because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? `are` : `is`) + ` **${status[0].id}**.`);
                status = player.getBehaviorAttributeStatusEffects("unconscious");
                if (status.length > 0) return game.communicationHandler.reply(message, `${player.name} can't whisper because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? `are` : `is`) + ` **${status[0].id}**.`);
            }
            // If there are no attributes that prevent whispering, add them to the array.
            playerExists = true;
            if (!npc && player.isNPC) npc = player;
            recipients.push(player);
        }
        if (!playerExists) {
            if (npc !== null) {
                break;
            }
            else return game.communicationHandler.reply(message, `Couldn't find player "${args[i]}". Make sure you spelled it right.`);
        }
    }
    if (recipients.length < 2) return game.communicationHandler.reply(message, `Can't start a whisper with fewer than 2 players.`);
    if (npc !== null) args.splice(0, i);

    const communication = args.join(' ');

    // Check if whisper already exists.
    const hidingSpot = recipients[0].hidingSpot;
    let whisper = game.entityFinder.getWhisper(recipients, hidingSpot);
    if (whisper && npc !== null && communication) {
        await sendMessageToWhisper(game, message, communication, npc, whisper);
        return;
    }
    else if (whisper) return game.communicationHandler.reply(message, "Whisper group already exists.");

    // Whisper does not exist, so create it.
    if (!whisper) {
        const action = new WhisperAction(game, message, recipients[0], recipients[0].location, true);
        whisper = await action.performWhisper(recipients);
        action.sendSuccessMessageToCommandChannel();
    }
    if (npc !== null && communication)
        await sendMessageToWhisper(game, message, communication, npc, whisper);
}

/**
 *
 * @param {Game} game - The game the whisper is occurring in.
 * @param {UserMessage} message - The Discord message that triggered this.
 * @param {string} messageText - The text of the message to send.
 * @param {Player} npc - The NPC player whispering this message.
 * @param {Whisper} whisper - The whisper this is occurring in.
 */
async function sendMessageToWhisper(game, message, messageText, npc, whisper) {
    const dialog = new Dialog(game, message, npc, npc.location, await game.communicationHandler.replaceEmoji(messageText), false, whisper);
    const dialogMessage = await game.communicationHandler.sendDialogAsWebhook(whisper.channel, dialog, dialog.getDisplayNameForWebhook(true), dialog.getDisplayIconForWebhook(true));
    dialog.setMessage(dialogMessage);
    const sayAction = new SayAction(game, dialogMessage, npc, npc.location, true, whisper);
    sayAction.performSay(dialog);
    sayAction.sendSuccessMessageToCommandChannel();
}
