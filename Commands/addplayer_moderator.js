const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');
const playerdefaults = include('Configs/playerdefaults.json');
const serverconfig = include('Configs/serverconfig.json');

const InventoryItem = include(`${constants.dataDir}/InventoryItem.js`);
const Player = include(`${constants.dataDir}/Player.js`);

const { ChannelType } = require('../node_modules/discord-api-types/v10');

module.exports.config = {
    name: "addplayer_moderator",
    description: "Adds a player to the game.",
    details: "Adds a player to the list of players for the current game. You can additionally specify a "
        + "non-default starting room and a list of non-default status effects. Note that if you specify "
        + "a list of non-default status effects, the default status effects will not be applied.",
    usage: `${settings.commandPrefix}addplayer @MolSno\n`
        + `${settings.commandPrefix}addplayer @MolSno kitchen\n`
        + `${settings.commandPrefix}addplayer @MolSno living-room warm, well rested, full\n`,
    usableBy: "Moderator",
    aliases: ["addplayer"]
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to mention a user to add. Usage:\n${exports.config.usage}`);

    const member = message.mentions.members.first();
    var location = null;
    var locationData = null;
    var status = null;
    var locationCheck = false;
    var statusCheck = 0;
    var spectateChannel = null;

    for (let i = 0; i < game.players.length; i++) {
        if (member.id === game.players[i].id)
            return message.reply("That user is already playing.");
    }

    if (args.length === 1) {
        location = playerdefaults.defaultLocation;
        status = playerdefaults.defaultStatusEffects.split(', ');
    }
    else if (args.length === 2) {
        location = args[1];
        status = playerdefaults.defaultStatusEffects.split(', ');
    }
    else if (args.length >= 3) {
        location = args[1];
        status = args.slice(2).join(' ').split(', ');
    }

    for (let i = 0; i < game.rooms.length; i++) {
        if (game.rooms[i].name === location) {
            locationCheck = true;
            locationData = game.rooms[i];
            break;
        }
    }
    for (let i = 0; i < game.statusEffects.length; i++) {
        if (status.includes(game.statusEffects[i].name)) {
            statusCheck++;
        }
        if (statusCheck === status.length) break;
    }

    if (!locationCheck)
        return game.messageHandler.addReply(message, `Room ${location} couldn't be found.`);
    if (statusCheck !== status.length)
        return game.messageHandler.addReply(message, `Not all given status effects could be found. Missing: ${status.length - statusCheck}.`);

    spectateChannel = game.guild.channels.cache.find(channel => channel.parent && channel.parentId === serverconfig.spectateCategory && channel.name === member.displayName.toLowerCase());
    const noSpectateChannels = game.guild.channels.cache.filter(channel => channel.parent && channel.parentId === serverconfig.spectateCategory).size;
    if (!spectateChannel && noSpectateChannels < 50) {
        spectateChannel = await game.guild.channels.create({
            name: member.displayName.toLowerCase(),
            type: ChannelType.GuildText,    
            parent: serverconfig.spectateCategory
        });
    }

    var player = new Player(
        member.id,
        member,
        member.displayName,
        member.displayName,
        "",
        "neutral",
        "an average voice",
        playerdefaults.defaultStats,
        true,
        location,
        "",
        [],
        playerdefaults.defaultDescription,
        new Array(),
        spectateChannel
    );

    game.players.push(player);
    game.players_alive.push(player);
    
    for (let i = 0; i < status.length; i++) {
        player.inflict(game, status[i], false, false, false, null, null)
    }
    locationData.addPlayer(game, player, null, null, true)

    // CURSED INVENTORY CREATION CODE BEGINS
    const indexPrefab = 0;
    const indexIdentifier = 1;
    const indexEquipmentSlot = 2;
    const indexContainer = 3;
    const indexQuantity = 4;
    const indexUses = 5;
    const indexDescription = 6;
    var playerInventory = structuredClone(playerdefaults.defaultInventory);
    for (let i = 0; i < playerInventory.length; i++) {
        for (let j = 0; j < playerInventory[i].length; j++) {
            if (playerInventory[i][j].includes('#'))
                playerInventory[i][j] = playerInventory[i][j].replace(/#/g, game.players.length + 1);
        }
    }
    // CURSED INVENTORY CREATION CODE ENDS

    member.roles.add(serverconfig.playerRole);

    message.channel.send(`<@${member.id}> added to game!`);

    return;
};
