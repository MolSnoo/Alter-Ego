const settings = include('settings.json');

module.exports.config = {
    name: "steal_player",
    description: "Steals an item from another player.",
    details: "Attempts to steal an item from another player in the room with you. "
        + "The item you attempt to steal from the given player is randomized, and so is the outcome. "
        + "There are three possible outcomes: you steal the item without them noticing, you steal the item but they notice, "
        + "and you fail to steal the item because they notice in time. If you happen to steal a very large item "
        + "(a sword, for example), the other player will notice you taking it whether you successfully steal it or not, "
        + "and so will everyone else in the room. Various status effects affect the outcome. For example, "
        + "if the player you're stealing from is unconscious, they won't notice you stealing their items no matter what.",
    usage: `${settings.commandPrefix}steal faye`,
    usableBy: "Player",
    aliases: ["steal"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify a player. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable steal");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    // First, check if the player has free space in their inventory.
    var freeSlot = -1;
    for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i].name === null) {
            freeSlot = i;
            break;
        }
    }
    if (freeSlot === -1) return message.reply("your inventory is full. You cannot steal an item until you drop something.");

    var victim = null;
    // Player cannot steal from themselves.
    if (args[0].toLowerCase() === player.name.toLowerCase()) return message.reply("you can't steal from yourself.");
    // Player cannot steal from dead players.
    for (let i = 0; i < game.players_dead.length; i++) {
        if (game.players_dead[i].name.toLowerCase() === args[0].toLowerCase()) return message.reply(`can't steal from ${game.players_dead[i].name} because they aren't in the room with you.`);
    }
    for (let i = 0; i < game.players_alive.length; i++) {
        let other = game.players_alive[i];
        // Check if player exists and is in the same room.
        if (other.name.toLowerCase() === args[0].toLowerCase() && other.location.name === player.location.name) {
            // Check attributes that would prohibit the player from stealing from someone.
            if (other.hasAttribute("hidden") || other.hasAttribute("concealed"))
                return message.reply(`can't steal from ${other.name} because they aren't in the room with you.`);
            victim = other;
        }
        // If the player exists but is not in the same room, return error.
        else if (other.name.toLowerCase() === args[0].toLowerCase()) return message.reply(`can't steal from ${other.name} because they aren't in the room with you.`);
    }
    if (victim === null) return message.reply(`couldn't find player "${args[0]}". Make sure you spelled it right.`);

    const result = player.steal(game, freeSlot, victim);

    const time = new Date().toLocaleTimeString();
    if (result.successful)
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} stole ${result.itemName} from ${victim.name} in ${player.location.channel}`);
    else
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} attempted and failed to steal ${result.itemName} from ${victim.name} in ${player.location.channel}`);

    return;
};
