const settings = require("../settings.json");

const Die = require('../House-Data/Die.js');

module.exports.config = {
    name: "roll_moderator",
    description: "Rolls a die.",
    details: `Rolls a d${settings.diceMax}. If a player is specified, calculates the result plus any modifiers brought about `
        + "by any status effects that player has. If two players are specified, the roll uses "
        + "the first person's modifiers like normal, and applies the modifiers of any status effects "
        + "that the second person has that affect the first person's roll. The second person's status effects "
        + "will be inverted and applied to the first person's roll. Any modifiers will be mentioned in the result, "
        + "but please note that the result sent has already had the modifiers applied.",
    usage: `${settings.commandPrefix}roll\n`
        + `${settings.commandPrefix}roll colin\n`
        + `${settings.commandPrefix}roll faye devyn`,
    usableBy: "Moderator",
    aliases: ["roll"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    let attacker = null;
    if (args[0]) {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
                attacker = game.players_alive[i];
                break;
            }
        }
        if (attacker === null) return message.reply(`couldn't find player "${args[0]}".`);
    }

    let defender = null;
    if (args[1]) {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[1].toLowerCase()) {
                defender = game.players_alive[i];
                break;
            }
        }
        if (defender === null) return message.reply(`couldn't find player "${args[1]}".`);
    }

    const die = new Die(attacker, defender);
    if (die.modifier === 0) message.channel.send(`Rolled a **${die.result}** with no modifiers.`);
    else message.channel.send(`Rolled a **${die.result}** with modifiers ${die.modifierString}.`);

    return;
};
