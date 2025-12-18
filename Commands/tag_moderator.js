import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "tag_moderator",
    description: "Adds, removes, or lists a room's tags.",
    details: "-**add**/**addtag**: Adds a comma-separated list of tags to the given room. Events that affect rooms with that tag will immediately "
        + "apply to the given room, and any tags that give a room special behavior will immediately activate those functions.\n\n"
        + "-**remove**/**removetag**: Removes a comma-separated list of tags from the given room. Events that affect rooms with that tag will immediately "
        + "stop applying to the given room, and any tags that give a room special behavior will immediately stop functioning.\n\n"
        + "-**list**/**tags**: Displays the list of tags currently applied to the given room.",
    usableBy: "Moderator",
    aliases: ["tag", "addtag", "removetag", "tags"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}tag add kitchen video surveilled\n`
        + `${settings.commandPrefix}tag remove kitchen audio surveilled\n`
        + `${settings.commandPrefix}addtag vault soundproof\n`
        + `${settings.commandPrefix}removetag freezer cold\n`
        + `${settings.commandPrefix}addtag command-center video monitoring, audio monitoring\n`
        + `${settings.commandPrefix}removetag command-center video monitoring, audio monitoring\n`
        + `${settings.commandPrefix}tag list kitchen\n`
        + `${settings.commandPrefix}tags kitchen`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    var input = command + " " + args.join(" ");
    if (command === "tag") {
        if (args[0] === "add") command = "addtag";
        else if (args[0] === "remove") command = "removetag";
        else if (args[0] === "list") {
            command = "tags";
            if (!args[1])
                return messageHandler.addReply(game, message, `You need to specify a room. Usage:\n${usage(game.settings)}`);
        }
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }
    else input = args.join(" ");

    if (command !== "addtag" && command !== "removetag" && command !== "tags") return messageHandler.addReply(game, message, 'Invalid command given. Use "add", "remove", or "list".');
    if ((command === "addtag" || command === "removetag") && args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a room and at least one tag. Usage:\n${usage(game.settings)}`);

    input = args.join(" ");
    var parsedInput = input.replace(/ /g, "-").toLowerCase();

    var room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.startsWith(game.rooms[i].name + '-')) {
            room = game.rooms[i];
            break;
        }
        else if (command === "tags" && game.rooms[i].name === parsedInput) {
            room = game.rooms[i];
            break;
        }
    }
    if (room === null) return messageHandler.addReply(game, message, `Couldn't find room "${input}".`);

    if (command === "tags") {
        let tags = room.tags.join(", ");
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `__Tags in ${room.name}:__\n${tags}`);
    }
    else {
        input = input.substring(room.name.length).trim();
        if (input === "") return messageHandler.addReply(game, message, `You need to specify at least one tag.`);

        var tags = input.split(",");
        if (command === "addtag") {
            let addedTags = [];
            for (let i = 0; i < tags.length; i++) {
                if (room.tags.includes(tags[i].trim()) || tags[i].trim() === "")
                    continue;
                addedTags.push(tags[i].trim());
                room.tags.push(tags[i].trim());
            }
            if (addedTags.length === 0) return messageHandler.addReply(game, message, `${room.name} already has the given tag(s).`);
            let addedTagsString = addedTags.join(", ");
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully added the following tags to ${room.name}: ${addedTagsString}`);
        }
        else if (command === "removetag") {
            let removedTags = [];
            for (let i = 0; i < tags.length; i++) {
                if (tags[i].trim() === "")
                    continue;
                if (room.tags.includes(tags[i].trim())) {
                    removedTags.push(tags[i].trim());
                    room.tags.splice(room.tags.indexOf(tags[i].trim()), 1);
                }
            }
            if (removedTags.length === 0) return messageHandler.addReply(game, message, `${room.name} doesn't have the given tag(s).`);
            let removedTagsString = removedTags.join(", ");
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully removed the following tags from ${room.name}: ${removedTagsString}`);
        }
    }

    return;
}
