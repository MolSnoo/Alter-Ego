import Dialog from '../Data/Dialog.ts';
import NarrateAction from '../Data/Actions/NarrateAction.ts';
import SayAction from '../Data/Actions/SayAction.ts';
import { MessageDisplayType } from '../Modules/enums.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */
/** @import Room from '../Data/Room.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "say_bot",
    description: "Sends a message.",
    details: `Sends a message. A room or player must be specified.\n\n`
        + `If a message is sent to a room, it will be treated as a narration.\n\n`
        + `If the name of a player is specified and that player is an NPC, the player will speak in the channel of the `
        + `room they're in. Their dialog will be treated just like that of any normal player's. The image URL set in `
        + `the player's Discord ID will be used for the player's avatar. It is not possible to use this command on a `
        + `non-NPC player.\n\n`
        + `It is recommended that you do not add line breaks to cells on the sheet. To add line breaks to the `
        + 'command, enter `\n`. It will be replaced with an actual line break in the sent message.\n\n'
        + 'Likewise, because the normal comma character is used as a delimiter in lists of bot commands, you can use '
        + 'the full-width comma character instead (`，`), and it will be replaced with a normal comma in the message.',
    usableBy: "Bot",
    aliases: ["say"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `say Unit_050 Welcome. If you would like to listen to piano music, you may request a song, and I will perform it for you.\n`
        + `say Trash Disposal A strange smell begins emanating from the INCINERATOR.`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Player} [player] - The player who caused the command to be executed, if applicable.
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable.
 */
export async function execute(game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");

    if (args.length < 2) {
        game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    // Try to find a player first.
    const speaker = game.entityFinder.getLivingPlayer(args[0]) ?? null;
    if (speaker) args.splice(0, 1);
    // If a player wasn't specified, check if a room name was.
    /** @type {Room} */
    let room = null;
    if (!player) {
        for (let i = args.length; i >= 0; i--) {
            const searchString = args.slice(0, i).join(" ");
            const foundRoom = game.entityFinder.getRoom(searchString);
            if (foundRoom) {
                room = foundRoom;
                args = args.slice(i);
                break;
            }
        }
    }

    const content = args.join(" ").replace(/\\n/g, '\n').replace(/，/g, ',').replace(/(?<=http(s?))@(?=.*?(jpg|jpeg|png|webp|avif))/g, ':').replace(/(?<=http(s?):.*?)\\(?=.*?(jpg|jpeg|png|webp|avif))/g, '/');

    if (speaker) {
        if (!speaker.isNPC) game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". You cannot speak for a player that isn't an NPC.`);
        const dialog = new Dialog(game, undefined, speaker, speaker.location, await game.communicationHandler.replaceEmoji(content), false);
        const dialogMessage = await game.communicationHandler.sendDialogAsWebhook(speaker.location.channel, dialog, dialog.getDisplayNameForWebhook(false), dialog.getDisplayIconForWebhook(false));
        dialog.setMessage(dialogMessage);
        const sayAction = new SayAction(game, dialogMessage, speaker, speaker.location, true);
        sayAction.performSay(dialog);
    }
    else if (room) {
        const narrateAction = new NarrateAction(game, undefined, undefined, room, true);
        game.narrationHandler.sendNarrateAction(MessageDisplayType.PLAIN_TEXT, narrateAction, await game.communicationHandler.replaceEmoji(content));
    }
    else game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find a player or room.`);
}
