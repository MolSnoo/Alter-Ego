import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";
import Whisper from '../Data/Whisper.js';

/** @type {CommandConfig} */
export const config = {
    name: "hide_player",
    description: "Hides you in an object.",
    details: `Allows you to use an object in a room as a hiding spot. When hidden, you will be removed from that room's channel so that `
        + `when other players enter the room, they won't see you on the user list. When players speak in the room that you're hiding in, `
        + `you will hear what they say. Under normal circumstances, a whisper channel will be created for you to speak in. Most players `
        + `will be unable to hear what you say in this channel. However, if you want to speak so that everyone can hear you (while having `
        + `your identity remain a secret), use the say command. If someone hides in the same hiding spot as you, ` 
        + `you will be placed in a whisper channel together. If someone inspects or tries to hide in the object you're hiding in, `
        + `your position will be revealed. If you wish to come out of hiding on your own, use the unhide command.`,
    usableBy: "Player",
    aliases: ["hide", "unhide"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}hide desk\n`
        + `${settings.commandPrefix}hide cabinet\n`
        + `${settings.commandPrefix}unhide`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable hide");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    if (player.statusString.includes("hidden") && command === "unhide") {
        let fixture = null;
        for (let i = 0; i < game.fixtures.length; i++) {
            if (game.fixtures[i].location.id === player.location.id && game.fixtures[i].name === player.hidingSpot) {
                fixture = game.fixtures[i];
                break;
            }
        }
        if (fixture !== null && (!fixture.accessible || fixture.childPuzzle !== null && fixture.childPuzzle.type.endsWith("lock") && !fixture.childPuzzle.solved))
            return messageHandler.addReply(game, message, `You cannot come out of hiding right now.`);
        else player.cure("hidden", true, false, true);
    }
    else if (player.statusString.includes("hidden"))
        return messageHandler.addReply(game, message, `You are already **hidden**. If you wish to stop hiding, use "${game.settings.commandPrefix}unhide".`);
    else if (command === "unhide")
        return messageHandler.addReply(game, message, "You are not currently hidden.");
    // Player is currently not hidden and is using the hide command.
    else {
        if (args.length === 0)
            return messageHandler.addReply(game, message, `You need to specify a fixture. Usage:\n${usage(game.settings)}`);

        var input = args.join(" ");
        var parsedInput = input.toUpperCase().replace(/\'/g, "");

        // Check if the input is a fixture that the player can hide in.
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
        var fixture = null;
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput && fixtures[i].hidingSpotCapacity > 0) {
                fixture = fixtures[i];
                break;
            }
            else if (fixtures[i].name === parsedInput)
                return messageHandler.addReply(game, message, `${fixtures[i].name} is not a hiding spot.`);
        }
        if (fixture === null) return messageHandler.addReply(game, message, `Couldn't find fixture "${input}".`);

        // Make sure the fixture isn't locked.
        if (fixture.childPuzzle !== null && fixture.childPuzzle.type.endsWith("lock") && !fixture.childPuzzle.solved)
            return messageHandler.addReply(game, message, `You cannot hide in ${fixture.name} right now.`);

        // Check to see if the hiding spot is already taken.
        var hiddenPlayers = [];
        for (let i = 0; i < player.location.occupants.length; i++) {
            if (player.location.occupants[i].hidingSpot === fixture.name)
                hiddenPlayers.push(player.location.occupants[i]);
        }

        // Create a list string of players currently hiding in that hiding spot.
        hiddenPlayers.sort(function (a, b) {
            let nameA = a.displayName.toLowerCase();
            let nameB = b.displayName.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        if (player.hasAttribute("no sight")) {
            let hiddenPlayersString = hiddenPlayers.length > 1 ? "multiple people" : "someone";
            if (hiddenPlayers.length + 1 > fixture.hidingSpotCapacity) {
                player.notify(`You attempt to hide in the ${fixture.name}, but you find ${hiddenPlayersString} already there! There doesn't seem to be enough room for you.`);
                for (let i = 0; i < hiddenPlayers.length; i++) {
                    if (hiddenPlayers[i].hasAttribute("no sight"))
                        hiddenPlayers[i].notify(`Someone finds you! They try to hide with you, but there isn't enough room.`);
                    else
                        hiddenPlayers[i].notify(`You're found by ${player.displayName}! ${player.pronouns.Sbj} try to hide with you, but there isn't enough room.`);
                }
            }
            else {
                player.notify(`When you hide in the ${fixture.name}, you find ${hiddenPlayersString} already there!`);

                hiddenPlayers.push(player);
                player.hidingSpot = fixture.name;
                player.inflict("hidden", true, false, true);

                // Create a whisper.
                if (hiddenPlayers.length > 0) {
                    var whisper = new Whisper(game, hiddenPlayers, player.location.id, player.location);
                    await whisper.init();
                    game.whispers.push(whisper);
                }

                // Log message is sent when status is inflicted.
            }
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

            if (hiddenPlayers.length + 1 > fixture.hidingSpotCapacity) {
                player.notify(`You attempt to hide in the ${fixture.name}, but you find ${hiddenPlayersString} already there! There doesn't seem to be enough room for you.`);
                for (let i = 0; i < hiddenPlayers.length; i++) {
                    if (hiddenPlayers[i].hasAttribute("no sight"))
                        hiddenPlayers[i].notify(`Someone finds you! They try to hide with you, but there isn't enough room.`);
                    else
                        hiddenPlayers[i].notify(`You're found by ${player.displayName}! ${player.pronouns.Sbj} try to hide with you, but there isn't enough room.`);
                }
            }
            else {
                if (hiddenPlayers.length > 0) player.notify(`When you hide in the ${fixture.name}, you find ${hiddenPlayersString} already there!`);
                for (let i = 0; i < hiddenPlayers.length; i++) {
                    if (hiddenPlayers[i].hasAttribute("no sight"))
                        hiddenPlayers[i].notify(`Someone finds you! They hide with you.`);
                    else
                        hiddenPlayers[i].notify(`You're found by ${player.displayName}! ${player.pronouns.Sbj} hide` + (player.pronouns.plural ? '' : 's') + ` with you.`);
                    hiddenPlayers[i].removeFromWhispers("");
                }
                hiddenPlayers.push(player);
                player.hidingSpot = fixture.name;
                player.inflict("hidden", true, false, true);

                // Create a whisper.
                if (hiddenPlayers.length > 0) {
                    var whisper = new Whisper(game, hiddenPlayers, player.location.id, player.location);
                    await whisper.init();
                    game.whispers.push(whisper);
                }

                // Log message is sent when status is inflicted.
            }
        }
    }

    return;
}
