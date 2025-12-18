import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "setvoice_moderator",
    description: "Sets a player's voice.",
    details: `Sets a player's voice descriptor that will be used when the player uses the `
        + `say command or speaks in a room with a player who can't view the room channel. `
        + `This will not change their voice descriptor on the spreadsheet, and when player data is reloaded, `
        + `their voice descriptor will be reverted to what appears on the spreadsheet. You can also supply another `
        + `player's name instead of a voice descriptor. In this case, the first player's voice will sound exactly like `
        + `the second player's, which they can use to deceive other players. Note that unlike other commands which `
        + `change a player's characteristics, the player's voice will **not** be changed by being inflicted or cured `
        + `of a status effect with the concealed attribute. If this command is used to change a character's voice, it must `
        + `be used again to change it back to normal. It can be reset to their original voice descriptor by omitting a `
        + `voice descriptor in the commands.`,
    usableBy: "Moderator",
    aliases: ["setvoice"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}setvoice kyra a deep modulated voice\n`
        + `${settings.commandPrefix}setvoice spektrum a high digitized voice\n`
        + `${settings.commandPrefix}setvoice persephone multiple overlapping voices\n`
        + `${settings.commandPrefix}setvoice ghost a disembodied voice\n`
        + `${settings.commandPrefix}setvoice typhos pollux\n`
        + `${settings.commandPrefix}setvoice nero haru\n`
        + `${settings.commandPrefix}setvoice kyra`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    var input = args.join(" ");
    if (input === "" || input === null || input === undefined) {
        if (player.voiceString !== player.originalVoiceString) {
            player.voiceString = player.originalVoiceString;
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully reverted ${player.name}'s voice descriptor.`);
        }
        else return messageHandler.addReply(game, message, `The player's voice is unchanged. Please supply a voice descriptor or the name of another player.`);
    }
    else {
        if (args.length === 1) {
            for (let i = 0; i < game.players.length; i++) {
                if (game.players[i].name.toLowerCase() === args[0].toLowerCase() && game.players[i].name !== player.name) {
                    player.voiceString = game.players[i].name;
                    return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully updated ${player.name}'s voice descriptor. ${player.originalPronouns.Sbj} will now impersonate ${game.players[i].name}.`);
                }
                else if (game.players[i].name.toLowerCase() === args[0].toLowerCase() && game.players[i].name === player.name)
                    return messageHandler.addReply(game, message, `The player's voice is unchanged. Please supply a voice descriptor or the name of a different player. To reset ${player.originalPronouns.dpos} voice, send ${game.settings.commandPrefix}setvoice ${player.name}`);
            }
        }
        player.voiceString = input;
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully updated ${player.name}'s voice descriptor.`);
    }

    return;
}
