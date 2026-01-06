import Whisper from '../Data/Whisper.js';
import WhisperAction from '../Data/Actions/WhisperAction.js';
import handleDialog from '../Modules/dialogHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "whisper_moderator",
    description: "Initiates a whisper with the given players.",
    details: "Creates a channel for the given players to speak in. Only the selected players will be able to read messages "
        + "posted in the new channel, but everyone in the room will be notified that they've begun whispering to each other. "
        + "You can select as many players as you want as long as they're all in the same room. When a player in the whisper "
        + "leaves the room, they will be removed from the channel. If everyone leaves the room, the whisper channel will be "
        + "deleted or archived. If one of the players listed has the talent \"NPC\", the remaining string "
        + "after the list of players will be sent in the whisper channel. Once the channel is created, "
        + "NPC players can only speak in the whisper using this command and the list of players in the whisper.",
    usableBy: "Moderator",
    aliases: ["whisper"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}whisper nestor jun\n`
        + `${settings.commandPrefix}whisper sadie elijah flint\n`
        + `${settings.commandPrefix}whisper amy hibiki Clean it up.\n`
        + `${settings.commandPrefix}whisper amy hibiki The mess you made. Clean it up now.`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    if (args.length < 2)
        return game.communicationHandler.reply(message, `You need to choose at least two players. Usage:\n${usage(game.settings)}`);

    // Get all players mentioned.
    /**
     * @type {Player[]}
     */
    const recipients = new Array();
    let npc = null;
    for (let i = 0; i < args.length; i++) {
        let playerExists = false;
        const player = game.entityFinder.getLivingPlayer(args[i]);
        if (player) {
            for (let j = 0; j < recipients.length; j++) {
                // Player cannot be included multiple times.
                if (recipients[j].name === player.name)
                    return game.communicationHandler.reply(message, `Can't include the same player multiple times.`);
                if (recipients[j].location.id !== player.location.id)
                    return game.communicationHandler.reply(message, `The selected players aren't all in the same room.`);
                // Check attributes that would prohibit the player from whispering to someone in the room.
                let status = player.getBehaviorAttributeStatusEffects("disable whisper");
                if (status.length > 0) return game.communicationHandler.reply(message, `${player.name} can't whisper because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? `are` : `is`) + ` **${status[1].id}**.`);
                status = player.getBehaviorAttributeStatusEffects("no hearing");
                if (status.length > 0) return game.communicationHandler.reply(message, `${player.name} can't whisper because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? `are` : `is`) + ` **${status[1].id}**.`);
                status = player.getBehaviorAttributeStatusEffects("unconscious");
                if (status.length > 0) return game.communicationHandler.reply(message, `${player.name} can't whisper because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? `are` : `is`) + ` **${status[1].id}**.`);
                // If there are no attributes that prevent whispering, add them to the array.
                playerExists = true;
                if (player.isNPC) npc = player;
                recipients.push(player);
                break;
            }
        }
        if (!playerExists) {
            if (npc !== null) {
                args.splice(0, i);
                break;
            }
            else return game.communicationHandler.reply(message, `Couldn't find player "${args[i]}". Make sure you spelled it right.`);
        }
    }
    if (recipients.length < 2) return game.communicationHandler.reply(message, `Can't start a whisper with fewer than 2 players.`);

    const string = args.join(' ');

    // Check if whisper already exists.
    let whisper = game.entityFinder.getWhisper(recipients);
    if (whisper && npc !== null) {
        await sendMessageToWhisper(game, message, string, npc, whisper);
        return;
    }
    else if (whisper) return game.communicationHandler.reply(message, "Whisper group already exists.");

    // Whisper does not exist, so create it.
    const action = new WhisperAction(game, message, recipients[0], recipients[0].location, true);
    whisper = await action.performWhisper(recipients);
    if (npc !== null)
        await sendMessageToWhisper(game, message, string, npc, whisper);
}

/**
 * 
 * @param {Game} game - The game the whisper is occurring in.
 * @param {UserMessage} message - The Discord message that triggered this.
 * @param {string} messageText - The text of the message to send.
 * @param {Player} npc - The NPC player whispering this message.
 * @param {Whisper} whisper - The whisper this is occurring in.
 */
async function sendMessageToWhisper (game, message, messageText, npc, whisper) {
    // Create a webhook for this channel if necessary, or grab the existing one.
    const webHooks = await whisper.channel.fetchWebhooks();
    let webHook = webHooks.find(webhook => webhook.owner.id === game.botContext.client.user.id);
    if (webHook === null || webHook === undefined)
        webHook = await whisper.channel.createWebhook({ name: whisper.channelName });

    const files = [];
    [...message.attachments.values()].forEach(attachment => files.push(attachment.url));

    webHook.send({
        content: messageText,
        username: npc.displayName,
        avatarURL: npc.id,
        embeds: message.embeds,
        files: files
    }).then(message => {
        handleDialog(game, message, true, npc);
    });
}
