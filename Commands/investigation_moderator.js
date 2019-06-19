const settings = include('settings.json');

module.exports.config = {
    name: "investigation_moderator",
    description: "Deals with investigations.",
    details: 'Deals with investigations.\n'
        + `-**start**:  Begins an investigation. Until this is done, players cannot inspect clues. `
        + 'Once an investigation is started, any objects with the same name as a clue in the room cannot be inspected.\n'
        + `-**trial**: Begins a Class Trial and gives all players the ${settings.classTrialStatus} status effect.\n`
        + `-end: Ends an investigation. This should be used at the very end of the Class Trial. `
        + `This removes the ${settings.classTrialStatus} status effect from all players so that they can leave the trial grounds. `
        + `Once an investigation is ended, clues can no longer be inspected.`,
    usage: `${settings.commandPrefix}investigation start\n`
        + `${settings.commandPrefix}investigation trial\n`
        + `${settings.commandPrefix}investigation end`,
    usableBy: "Moderator",
    aliases: ["investigation"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0) {
        message.reply("you need to specify whether to start or end an investigation. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    if (args[0] === "start") {
        game.investigation = true;
        message.channel.send("Investigation started.");
    }
    else if (args[0] === "trial") {
        if (settings.classTrialStatus !== "") {
            for (let i = 0; i < game.players_alive.length; i++)
                game.players_alive[i].inflict(game, settings.classTrialStatus, true, true, false);
            message.channel.send(`All players have been given **${settings.classTrialStatus}** status effect.`);
        }
        else return message.channel.send("There is no status effect set in settings, so the trial argument does nothing.");
    }
    else if (args[0] === "end") {
        game.investigation = false;
        if (settings.classTrialStatus !== "") {
            for (let i = 0; i < game.players_alive.length; i++)
                game.players_alive[i].cure(game, settings.classTrialStatus, true, false, true, false);
        }
        message.channel.send("Investigation ended.");
    }

    return;
};
