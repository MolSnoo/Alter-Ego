import Room from '../Data/Room.ts';
import { registerRoomCategory, createCategory } from '../Modules/serverManager.ts';
import { ChannelType } from 'discord.js';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "setupdemo_moderator",
    description: "Sets up a demo game.",
    details: `Populates an empty spreadsheet with default game data as defined in the \`demodata.json\` config file. `
        + `This will create a game environment to demonstrate most of the basic game mechanics.\n\n`
        + `If the channels for the demo game's rooms don't exist, they will be created automatically. `
        + `This command will not create any players for you. Once the demo data has been saved to the spreadsheet, you `
        + `can use the \`startgame\` or \`addplayer\` commands to add players, or manually add them to the spreadsheet. `
        + `It is recommended that you have at least one other Discord account to use as a player. `
        + `Once the spreadsheet has been fully populated, you can use the \`load\` command with the arguments `
        + `\`all start\` to begin the demo.\n\n`
        + `**If there is already data on the spreadsheet, it will be overwritten. `
        + `Only use this command if the spreadsheet is currently blank.**`,
    usableBy: "Moderator",
    aliases: ["setupdemo"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}setupdemo`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    if (game.inProgress) return game.communicationHandler.reply(message, `You can't use this command while a game is in progress.`);

    try {
        const roomValues = await game.entitySaver.setupDemo();

        // Ensure that a room category exists.
        const roomCategories = game.guildContext.roomCategories;
        let roomCategory = null;
        if (roomCategories.length === 0 || roomCategories.length === 1 && roomCategories[0] === "") {
            try {
                roomCategory = await createCategory(game.guildContext.guild, "Rooms");
                await registerRoomCategory(game, roomCategory);
            }
            catch (err) {
                game.communicationHandler.sendToCommandChannel(String(err));
            }
        }
        else roomCategory = await game.guildContext.guild.channels.fetch(roomCategories[0].trim());

        // Create the room channels, if they don't already exist.
        if (roomCategory) {
            for (let i = 0; i < roomValues.length; i++) {
                const roomId = Room.generateValidId(roomValues[i][0]);
                if (roomId === "") continue;
                const channel = game.guildContext.guild.channels.cache.find(channel => channel.name === roomId);
                if (!channel) {
                    await game.guildContext.guild.channels.create({
                        name: roomId,
                        type: ChannelType.GuildText,
                        parent: roomCategory.id
                    });
                }
            }

            game.communicationHandler.sendToCommandChannel(
                `The spreadsheet has been populated with demo data. You can now populate the Players and `
                + `Inventory Items sheets. You can do this manually, or you can use one of two methods:\n\n`
                + `1. Add them directly with the \`${game.settings.commandPrefix}addplayer\` command.\n`
                + `2. Assign all desired players the `
                + `<@&${game.settings.debug ? game.guildContext.testerRole.id : game.guildContext.eligibleRole.id}> `
                + `role, then use the \`${game.settings.commandPrefix}startgame\` command, and let them add themselves `
                + `with the \`${game.settings.commandPrefix}play\` command.\n\n`
                + `Once all players have been added, you can manually tweak their descriptions to suit them and assign `
                + `their starting locations. Each dorm in the demo environment has a different set of clothing `
                + `available. You can assign players to each dorm based on which set of clothing they might prefer.\n\n`
                + "There are several `Moderator's note` comments spread throughout the demo data that you can search "
                + `for. The most important ones that require your immediate attention are on the Puzzles sheet.\n\n`
                + `Disclaimer: You are free to use any of the data included in the demo environment in your own games. `
                + `It has been provided for your benefit, so that you can study and build upon it.\n\n`
                + `When you are ready to begin the demo, send \`${game.settings.commandPrefix}load all start\`.`
            );
        }
        else return game.communicationHandler.sendToCommandChannel("The spreadsheet was populated with demo data, but there was an error finding a room category to contain the new room channels.");
    }
    catch (err) {
        console.log(err);
        game.communicationHandler.sendToCommandChannel("There was an error saving data to the spreadsheet. Error:\n```" + err + "```");
    }
}
