const settings = include('settings.json');
const discord = require('discord.js');

module.exports.config = {
    name: "gesture_player",
    description: "Performs a gesture.",
    details: `Performs one of a set of predefined gestures. Everybody in the room with you will see you do this gesture. `
        + `This allows you to communicate during times where you are unable to speak for some reason, though you can gesture at any time, with few exceptions. `
        + `Certain gestures may require a target to perform them. For example, a gesture might require you specify an Exit, an Object, another Player, etc. `
        + `A gesture can only be performed with one target at a time. Gestures can be made impossible if you are inflicted with certain Status Effects. `
        + `For example, if you are concealed, you cannot smile, frown, etc. as nobody would be able to see it. `
        + `To see a list of all possible gestures, send \`${settings.commandPrefix}gesture list\`.`,
    usage: `${settings.commandPrefix}gesture smile\n`
        + `${settings.commandPrefix}gesture point at door 1\n`
        + `${settings.commandPrefix}gesture wave johnny`,
    usableBy: "Player",
    aliases: ["gesture"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify a gesture. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable gesture");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

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
        message.author.send(embed).then(msg => {
            msg.react('⏪').then(() => {
                msg.react('⏩');

                const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
                const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

                const backwards = msg.createReactionCollector(backwardsFilter, { time: 300000 });
                const forwards = msg.createReactionCollector(forwardsFilter, { time: 300000 });

                backwards.on("collect", () => {
                    if (page === 0) return;
                    page--;
                    embed = createEmbed(game, page, pages);
                    msg.edit(embed);
                });

                forwards.on("collect", () => {
                    if (page === pages.length - 1) return;
                    page++;
                    embed = createEmbed(game, page, pages);
                    msg.edit(embed);
                });
            });
        });
    }
    else {
        var gesture = null;
        var targetType = "";
        var target = null;
        for (let i = 0; i < game.gestures.length; i++) {
            if (game.gestures[i].name.toLowerCase().replace(/\'/g, "") === input) {
                if (game.gestures[i].requires.length > 0)
                    return message.reply(`you need to specify a target for that gesture.`);
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
                                if (items[k].name.toLowerCase() === input2) {
                                    targetType = "Item";
                                    target = items[k];
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Player") {
                            for (let k = 0; k < player.location.occupants.length; k++) {
                                let occupant = player.location.occupants[k];
                                if (occupant.displayName.toLowerCase().replace(/\'/g, "") === input2 && !occupant.hasAttribute("hidden")) {
                                    // Player cannot gesture toward themselves.
                                    if (occupant.id === player.id) return message.reply("you can't gesture toward yourself.");
                                    targetType = "Player";
                                    target = occupant;
                                    break;
                                }
                            }
                        }
                        else if (gesture.requires[j] === "Inventory Item") {
                            for (let slot = 0; slot < player.inventory.length; slot++) {
                                if ((player.inventory[slot].name === "RIGHT HAND" || player.inventory[slot].name === "LEFT HAND")
                                    && player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name.toLowerCase() === input2) {
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
        if (gesture === null) return message.reply(`couldn't find gesture "${input}". For a list of gestures, send \`${settings.commandPrefix}gesture list\`.`);
        input = input.substring(gesture.name.toLowerCase().replace(/\'/g, "").length).trim();
        if (input !== "" && gesture.requires.length === 0)
            return message.reply(`that gesture doesn't take a target.`);
        if (target === null && gesture.requires.length > 0)
            return message.reply(`couldn't find target "${input}" in the room with you.`);
        for (let i = 0; i < gesture.disabledStatuses.length; i++) {
            if (player.statusString.includes(gesture.disabledStatuses[i].name))
                return message.reply(`You cannot do that gesture because you are **${gesture.disabledStatuses[i].name}**.`);
        }

        player.gesture(game, gesture, targetType, target);
        // Post log message. Message should vary based on target type.
        const time = new Date().toLocaleTimeString();
        if (targetType === "")
            game.logChannel.send(`${time} - ${player.name} did gesture ${gesture.name} in ${player.location.channel}`);
        else if (targetType === "Exit" || targetType === "Object" || targetType === "Player")
            game.logChannel.send(`${time} - ${player.name} did gesture ${gesture.name} to ${target.name} in ${player.location.channel}`);
        else if (targetType === "Item" || targetType === "Inventory Item")
            game.logChannel.send(`${time} - ${player.name} did gesture ${gesture.name} to ${target.identifier ? target.identifier : target.prefab.id} in ${player.location.channel}`);
    }

    return;
};

function createEmbed(game, page, pages) {
    let embed = new discord.RichEmbed()
        .setColor('1F8B4C')
        .setAuthor(`${game.guild.me.displayName} Help`, game.guild.iconURL)
        .setDescription(`These are the available gestures.\nFor more information on the gesture command, send \`${settings.commandPrefix}help gesture\`.`)
        .setFooter(`Page ${page + 1}/${pages.length}`);

    // Now add the fields of the first page.
    for (let i = 0; i < pages[page].length; i++)
        embed.addField(pages[page][i].name, pages[page][i].description);

    return embed;
}
