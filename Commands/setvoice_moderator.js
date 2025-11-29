import settings from '../Configs/settings.json' with { type: 'json' };

module.exports.config = {
    name: "setvoice_moderator",
    description: "Sets a player's voice.",
    details: `Sets a player's voice descriptor that will be used when the player uses the `
        + `${settings.commandPrefix}say command or speaks in a room with a player who can't view the room channel. `
        + `This will not change their voice descriptor on the spreadsheet, and when player data is reloaded, `
        + `their voice descriptor will be reverted to what appears on the spreadsheet. You can also supply another `
        + `player's name instead of a voice descriptor. In this case, the first player's voice will sound exactly like `
        + `the second player's, which they can use to deceive other players. Note that unlike other commands which `
        + `change a player's characteristics, the player's voice will **not** be changed by being inflicted or cured `
        + `of a status effect with the concealed attribute. If this command is used to change a character's voice, it must `
        + `be used again to change it back to normal. It can be reset to their original voice descriptor by omitting a `
        + `voice descriptor in the commands.`,
    usage: `${settings.commandPrefix}setvoice kyra a deep modulated voice\n`
        + `${settings.commandPrefix}setvoice spektrum a high digitized voice\n`
        + `${settings.commandPrefix}setvoice persephone multiple overlapping voices\n`
        + `${settings.commandPrefix}setvoice ghost a disembodied voice\n`
        + `${settings.commandPrefix}setvoice typhos pollux\n`
        + `${settings.commandPrefix}setvoice nero haru\n`
        + `${settings.commandPrefix}setvoice kyra`,
    usableBy: "Moderator",
    aliases: ["setvoice"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a player. Usage:\n${exports.config.usage}`);

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
    if (input === "" || input === null || input === undefined) {
        if (player.voiceString !== player.originalVoiceString) {
            player.voiceString = player.originalVoiceString;
            game.messageHandler.addGameMechanicMessage(message.channel, `Successfully reverted ${player.name}'s voice descriptor.`);
        }
        else return game.messageHandler.addReply(message, `The player's voice is unchanged. Please supply a voice descriptor or the name of another player.`);
    }
    else {
        if (args.length === 1) {
            for (let i = 0; i < game.players.length; i++) {
                if (game.players[i].name.toLowerCase() === args[0].toLowerCase() && game.players[i].name !== player.name) {
                    player.voiceString = game.players[i].name;
                    return game.messageHandler.addGameMechanicMessage(message.channel, `Successfully updated ${player.name}'s voice descriptor. ${player.originalPronouns.Sbj} will now impersonate ${game.players[i].name}.`);
                }
                else if (game.players[i].name.toLowerCase() === args[0].toLowerCase() && game.players[i].name === player.name)
                    return game.messageHandler.addReply(message, `The player's voice is unchanged. Please supply a voice descriptor or the name of a different player. To reset ${player.originalPronouns.dpos} voice, send ${settings.commandPrefix}setvoice ${player.name}`);
            }
        }
        player.voiceString = input;
        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully updated ${player.name}'s voice descriptor.`);
    }

    return;
};
