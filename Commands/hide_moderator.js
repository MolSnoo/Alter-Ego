import * as messageHandler from '../Modules/messageHandler.js';

import Whisper from '../Data/Whisper.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "hide_moderator",
    description: "Hides a player in the given object.",
    details: `Forcibly hides a player in the specified object. They will be able to hide in the specified object `
        + `even if it is attached to a lock-type puzzle that is unsolved, and even if the hiding spot is beyond its `
        + `capacity. To force them out of hiding, use the unhide command.`,
    usableBy: "Moderator",
    aliases: ["hide", "unhide"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}hide nero beds\n`
        + `${settings.commandPrefix}hide cleo bleachers\n`
        + `${settings.commandPrefix}unhide scarlet`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].toLowerCase());
    if (player === undefined) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    if (player.statusCollection.has("hidden") && command === "unhide") {
        player.cure("hidden", true, false, true);
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully brought ${player.name} out of hiding.`);
    }
    else if (player.statusCollection.has("hidden"))
        return messageHandler.addReply(game, message, `${player.name} is already **hidden**. If you want ${player.originalPronouns.obj} to stop hiding, use "${game.settings.commandPrefix}unhide ${player.name}".`);
    else if (command === "unhide")
        return messageHandler.addReply(game, message, `${player.name} is not currently hidden.`);
    // Player is currently not hidden and the hide command is being used.
    else {
        if (args.length === 0)
            return messageHandler.addReply(game, message, `You need to specify a fixture. Usage:\n${usage(game.settings)}`);

        const input = args.join(" ");
        const parsedInput = input.toUpperCase().replace(/\'/g, "");

        // Check if the input is a fixture that the player can hide in.
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
        let fixture = null;
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput && fixtures[i].hidingSpotCapacity > 0) {
                fixture = fixtures[i];
                break;
            }
            else if (fixtures[i].name === parsedInput)
                return messageHandler.addReply(game, message, `${fixtures[i].name} is not a hiding spot.`);
        }
        if (fixture === null) return messageHandler.addReply(game, message, `Couldn't find fixture "${input}".`);

        // Check to see if the hiding spot is already taken.
        const hiddenPlayers = [];
        for (let i = 0; i < player.location.occupants.length; i++) {
            if (player.location.occupants[i].hidingSpot === fixture.name)
                hiddenPlayers.push(player.location.occupants[i]);
        }

        // Create a list string of players currently hiding in that hiding spot.
        hiddenPlayers.sort(function (a, b) {
            const nameA = a.displayName.toLowerCase();
            const nameB = b.displayName.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        if (player.hasBehaviorAttribute("no sight")) {
            if (hiddenPlayers.length === 1)
                player.notify(`When you hide in the ${fixture.name}, you find someone already there!`);
            else if (hiddenPlayers.length > 1)
                player.notify(`When you hide in the ${fixture.name}, you find multiple people already there!`);
        }
        else {
            let hiddenPlayersString = "";
            if (hiddenPlayers.length === 1) hiddenPlayersString = hiddenPlayers[0].displayName;
            else if (hiddenPlayers.length === 2)
                hiddenPlayersString += `${hiddenPlayers[0].displayName} and ${hiddenPlayers[1].displayName}`;
            else if (hiddenPlayers.length >= 3) {
                for (let i = 0; i < hiddenPlayers.length - 1; i++)
                    hiddenPlayersString += `${hiddenPlayers[i].displayName}, `;
                hiddenPlayersString += `and ${hiddenPlayers[hiddenPlayers.length - 1].displayName}`;
            }

            if (hiddenPlayers.length > 0) player.notify(`When you hide in the ${fixture.name}, you find ${hiddenPlayersString} already there!`);
        }
        for (let i = 0; i < hiddenPlayers.length; i++) {
            if (hiddenPlayers[i].hasBehaviorAttribute("no sight"))
                hiddenPlayers[i].notify(`Someone finds you! They hide with you.`);
            else
                hiddenPlayers[i].notify(`You're found by ${player.displayName}! ${player.pronouns.Sbj} hide` + (player.pronouns.plural ? '' : 's') + ` with you.`);
            hiddenPlayers[i].removeFromWhispers( "");
        }
        hiddenPlayers.push(player);
        player.hidingSpot = fixture.name;
        player.inflict("hidden", true, false, true);

        // Create a whisper.
        if (hiddenPlayers.length > 0) {
            const whisper = new Whisper(game, hiddenPlayers, player.location.id, player.location);
            await whisper.init();
            game.whispers.push(whisper);
        }

        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully hid ${player.name} in the ${fixture.name}.`);
        // Log message is sent when status is inflicted.
    }

    return;
}
