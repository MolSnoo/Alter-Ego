const settings = require('../Configs/settings.json');
const discord = require('discord.js');

module.exports.config = {
    name: "gesture_moderator",
    description: "Performs a gesture for the given player.",
    details: `Makes the given player perform one of a set of predefined gestures. Everybody in the room with them will see them do this gesture. `
        + `Certain gestures may require a target to perform them. For example, a gesture might require you specify an Exit, an Object, another Player, etc. `
        + `A gesture can only be performed with one target at a time. Gestures can be made impossible if the given player is inflicted with certain Status Effects. `
        + `For example, if they are concealed, they cannot smile, frown, etc. as nobody would be able to see it. `
        + `To see a list of all possible gestures, send \`${settings.commandPrefix}gesture list\`.`,
    usage: `${settings.commandPrefix}gesture astrid smile\n`
        + `${settings.commandPrefix}gesture akira point at door 1\n`
        + `${settings.commandPrefix}gesture holly wave johnny`,
    usableBy: "Moderator",
    aliases: ["gesture"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    var input = args.join(" ").toLowerCase().replace(/\'/g, "");

    if (input === "list") {
        var fields = [];
        var pages = [];
        var page = 0;

        for (let i = 0; i < game.gestures.length; i++)
            fields.push(game.gestures[i]);

        // Divide the fields into pages.
        for (let i = 0, pageNo = 0; i < fields.length; i++) {
            // Divide the menu into groups of 10.
            if (i % 15 === 0) {
                pages.push([]);
                if (i !== 0) pageNo++;
            }
            pages[pageNo].push(fields[i]);
        }

        let embed = createEmbed(game, page, pages);
        message.channel.send({ embeds: [embed] }).then(msg => {
            msg.react('⏪').then(() => {
                msg.react('⏩');

                const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
                const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

                const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 300000 });
                const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 300000 });

                backwards.on("collect", () => {
                    const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏪');
                    if (reaction) reaction.users.cache.forEach(user => { if (user.id !== bot.user.id) reaction.users.remove(user.id); });
                    if (page === 0) return;
                    page--;
                    embed = createEmbed(game, page, pages);
                    msg.edit({ embeds: [embed] });
                });

                forwards.on("collect", () => {
                    const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏩');
                    if (reaction) reaction.users.cache.forEach(user => { if (user.id !== bot.user.id) reaction.users.remove(user.id); });
                    if (page === pages.length - 1) return;
                    page++;
                    embed = createEmbed(game, page, pages);
                    msg.edit({ embeds: [embed] });
                });
            });
        });
    }
    else {
        if (args.length < 2)
            return game.messageHandler.addReply(message, `You need to specify a player and a gesture. Usage:\n${exports.config.usage}`);

        var player = null;
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
                player = game.players_alive[i];
                args.splice(0, 1);
                input = args.join(" ").toLowerCase().replace(/\'/g, "");
                break;
            }
        }
        if (player === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

        var gesture = null;
        var targetType = "";
        var target = null;
        for (let i = 0; i < game.gestures.length; i++) {
            if (game.gestures[i].name.toLowerCase().replace(/\'/g, "") === input) {
                if (game.gestures[i].requires.length > 0)
                    return game.messageHandler.addReply(message, `You need to specify a target for that gesture.`);
                gesture = game.gestures[i];
                break;
            }
            else if (input.startsWith(game.gestures[i].name.toLowerCase().replace(/\'/g, "") + ' ')) {
                gesture = game.gestures[i];
                let input2 = input.substring(game.gestures[i].name.toLowerCase().replace(/\'/g, "").length).trim();

                if (input2 !== "") {
                    for (let j = 0; j < gesture.requires.length; j++) {
                        if (gesture.requires[j] === "Exit") {
                            for (let k = 0; k < player.location.exit.length; k++) {
                                if (player.location.exit[k].name.toLowerCase() === input2) {
                                    targetType = "Exit";
                                    target = player.location.exit[k];
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Object") {
                            const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
                            for (let k = 0; k < objects.length; k++) {
                                if (objects[k].name.toLowerCase() === input2) {
                                    targetType = "Object";
                                    target = objects[k];
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Item") {
                            const items = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
                            for (let k = 0; k < items.length; k++) {
                                if (items[k].prefab.id.toLowerCase() === input2 || items[k].name.toLowerCase() === input2) {
                                    targetType = "Item";
                                    target = items[k];
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Player") {
                            const hiddenStatus = player.getAttributeStatusEffects("hidden");
                            for (let k = 0; k < player.location.occupants.length; k++) {
                                let occupant = player.location.occupants[k];
                                if (occupant.name.toLowerCase().replace(/\'/g, "") === input2 && (hiddenStatus.length === 0 && !occupant.hasAttribute("hidden") || occupant.hidingSpot === player.hidingSpot)) {
                                    // Player cannot gesture toward themselves.
                                    if (occupant.name === player.name) return game.messageHandler.addReply(message, `${player.name} can't gesture toward ${player.originalPronouns.ref}.`);
                                    targetType = "Player";
                                    target = occupant;
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Inventory Item") {
                            for (let slot = 0; slot < player.inventory.length; slot++) {
                                if ((player.inventory[slot].name === "RIGHT HAND" || player.inventory[slot].name === "LEFT HAND")
                                    && player.inventory[slot].equippedItem !== null
									&& (player.inventory[slot].equippedItem.prefab.id.toLowerCase() === input2 || player.inventory[slot].equippedItem.name.toLowerCase() === input2)) {
                                    targetType = "Inventory Item";
                                    target = player.inventory[slot].equippedItem;
                                    break;
                                }
                            }
                        }
                        if (target !== null) break;
                    }
                    if (gesture !== null && target !== null)
                        break;
                }
            }
        }
        if (gesture === null) return game.messageHandler.addReply(message, `Couldn't find gesture "${input}". For a list of gestures, send \`${settings.commandPrefix}gesture list\`.`);
        input = input.substring(gesture.name.toLowerCase().replace(/\'/g, "").length).trim();
        if (input !== "" && gesture.requires.length === 0)
            return game.messageHandler.addReply(message, `That gesture doesn't take a target.`);
        if (target === null && gesture.requires.length > 0)
            return game.messageHandler.addReply(message, `Couldn't find target "${input}" in the room with ${player.name}.`);
        for (let i = 0; i < gesture.disabledStatuses.length; i++) {
            if (player.statusString.includes(gesture.disabledStatuses[i].name))
                return game.messageHandler.addReply(message, `${player.name} cannot do that gesture because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? "are" : "is") + ` **${gesture.disabledStatuses[i].name}**.`);
        }

        player.gesture(game, gesture, targetType, target);
        // Post log message. Message should vary based on target type.
        const time = new Date().toLocaleTimeString();
        if (targetType === "")
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly did gesture ${gesture.name} in ${player.location.channel}`);
        else if (targetType === "Exit" || targetType === "Object" || targetType === "Player")
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly did gesture ${gesture.name} to ${target.name} in ${player.location.channel}`);
        else if (targetType === "Item" || targetType === "Inventory Item")
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly did gesture ${gesture.name} to ${target.identifier ? target.identifier : target.prefab.id} in ${player.location.channel}`);
    }

    return;
};

function createEmbed(game, page, pages) {
    let embed = new discord.EmbedBuilder()
        .setColor('1F8B4C')
        .setAuthor({ name: `Gestures List`, iconURL: game.guild.iconURL() })
        .setDescription(`These are the available gestures.\nFor more information on the gesture command, send \`${settings.commandPrefix}help gesture\`.`)
        .setFooter({ text: `Page ${page + 1}/${pages.length}` });

    let fields = [];
    // Now add the fields of the first page.
    for (let i = 0; i < pages[page].length; i++)
        fields.push({ name: pages[page][i].name, value: pages[page][i].description })
    embed.addFields(fields);

    return embed;
}
