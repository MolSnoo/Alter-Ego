const discord = require("discord.js");
const settings = require("../settings.json");

//>roll OR >roll [player] OR >roll [attacker] [defender]

module.exports.run = async (bot, config, message, args) => {
    // User must be a moderator.
    if (message.member.roles.find(role => role.name === config.role_needed)) {
        if (!settings.devMode) {
            if (!config.game) return message.reply("There is no game currently running");
        }
        let usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}roll OR ${settings.prefix}roll [player] OR ${settings.prefix}roll [attacker] [defender]`);

        if (args.length === 0) {
            const result = exports.rollDie();
            message.channel.send(result.message);
        }
        else if (args.length === 1) {
            // Determine if specified player exists.
            var isPlayer = false;
            var currentPlayer;
            for (var i = 0; i < config.players_alive.length; i++) {
                if (args[0].toLowerCase() === config.players_alive[i].name.toLowerCase()) {
                    isPlayer = true;
                    currentPlayer = config.players_alive[i];
                    break;
                }
            }

            if (isPlayer) {
                const result = exports.rollDie(currentPlayer);
                message.channel.send(result.message);
            }
        }
        else if (args.length === 2) {
            // Determine if specified player exists.
            var attackerIsPlayer = false;
            var defenderIsPlayer = false;
            var attacker;
            var defender;
            for (var i = 0; i < config.players_alive.length; i++) {
                if (args[0].toLowerCase() === config.players_alive[i].name.toLowerCase()) {
                    attackerIsPlayer = true;
                    attacker = config.players_alive[i];
                }
                else if (args[1].toLowerCase() === config.players_alive[i].name.toLowerCase()) {
                    defenderIsPlayer = true;
                    defender = config.players_alive[i];
                }
            }

            if (attackerIsPlayer && defenderIsPlayer) {
                const result = exports.rollDie(attacker, defender);
                message.channel.send(result.message);
            }
        }
    }
};

module.exports.rollDie = function (attacker, defender) {
    var baseRoll;
    if (attacker && attacker.talent === "Ultimate Anarchist") {
        baseRoll = Math.floor(Math.random() * 2);   // Get 0 or 1.
        baseRoll = baseRoll * 5;                    // Make it 0 or 5.
        baseRoll += 1;                              // Make it 1 or 6.
    }
    else baseRoll = getBaseRoll();
    var modifier = 0;
    var modifierList = "";
    if (attacker && defender) {
        if (attacker.talent === "Ultimate Decider") {
            var hasCoin = false;
            for (var i = 0; i < attacker.inventory.length; i++) {
                if (attacker.inventory[i].name === "COIN") {
                    hasCoin = true;
                    break;
                }
            }
            if (hasCoin) {
                const coinModifier = Math.floor(Math.random() * 2);
                if (coinModifier === 1) {
                    modifier += coinModifier;
                    modifierList = "+" + coinModifier + " (coin flip)";
                }
            }
        }

        // Get attacker's modifiers.
        for (var i = 0; i < attacker.status.length; i++) {
            if (attacker.status[i].rollModifier > 0 && attacker.status[i].rollModifier < 10) {
                modifier += attacker.status[i].rollModifier;
                if (modifierList === "") modifierList = "+" + attacker.status[i].rollModifier + " (" + attacker.status[i].name + ")";
                else modifierList += ", +" + attacker.status[i].rollModifier + " (" + attacker.status[i].name + ")";
            }
            else if (attacker.status[i].rollModifier < 0 && attacker.status[i].rollModifier > -10) {
                modifier += attacker.status[i].rollModifier;
                if (modifierList === "") modifierList = attacker.status[i].rollModifier + " (" + attacker.status[i].name + ")";
                else modifierList += ", " + attacker.status[i].rollModifier + " (" + attacker.status[i].name + ")";
            }
        }
        // Get defender's modifiers that affect the attacker's roll.
        for (var i = 0; i < defender.status.length; i++) {
            if (defender.status[i].rollModifier > 10) {
                modifier += (defender.status[i].rollModifier - 10);
                if (modifierList === "") modifierList = "+" + (defender.status[i].rollModifier - 10) + " (**" + defender.name + "** " + defender.status[i].name + ")";
                else modifierList += ", +" + (defender.status[i].rollModifier - 10) + " (**" + defender.name + "** " + defender.status[i].name + ")";
            }
            else if (defender.status[i].rollModifier < -10) {
                modifier += (defender.status[i].rollModifier + 10);
                if (modifierList === "") modifierList = (defender.status[i].rollModifier + 10) + " (**" + defender.name + "** " + defender.status[i].name + ")";
                else modifierList += ", " + (defender.status[i].rollModifier + 10) + " (**" + defender.name + "** " + defender.status[i].name + ")";
            }
        }
    }
    else if (attacker) {
        if (attacker.talent === "Ultimate Decider") {
            var hasCoin = false;
            for (var i = 0; i < attacker.inventory.length; i++) {
                if (attacker.inventory[i].name === "COIN") {
                    hasCoin = true;
                    break;
                }
            }
            if (hasCoin) {
                const coinModifier = Math.floor(Math.random() * 2);
                if (coinModifier === 1) {
                    modifier += coinModifier;
                    modifierList = "+" + coinModifier + " (coin flip)";
                }
            }
        }

        for (var i = 0; i < attacker.status.length; i++) {
            if (attacker.status[i].rollModifier > 0 && attacker.status[i].rollModifier < 10) {
                modifier += attacker.status[i].rollModifier;
                if (modifierList === "") modifierList = "+" + attacker.status[i].rollModifier + " (" + attacker.status[i].name + ")";
                else modifierList += ", +" + attacker.status[i].rollModifier + " (" + attacker.status[i].name + ")";
            }
            else if (attacker.status[i].rollModifier < 0 && attacker.status[i].rollModifier > -10) {
                modifier += attacker.status[i].rollModifier;
                if (modifierList === "") modifierList = attacker.status[i].rollModifier + " (" + attacker.status[i].name + ")";
                else modifierList += ", " + attacker.status[i].rollModifier + " (" + attacker.status[i].name + ")";
            }
        }
    }

    if (modifierList === "") return { number: baseRoll, message: "Rolled a **" + baseRoll + "** with no modifiers." };
    else return { number: baseRoll + modifier, message: "Rolled a **" + (baseRoll + modifier) + "** with modifiers " + modifierList + "." };
}

function getBaseRoll() {
    min = 1;
    max = 6;
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

module.exports.help = {
    name: "roll"
};