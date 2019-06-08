const settings = require("../settings.json");

class Status {
    constructor(name, duration, fatal, cure, nextStage, curedCondition, rollModifier, attributes, row) {
        this.name = name;
        this.duration = duration;
        this.fatal = fatal;
        this.cure = cure;
        this.nextStage = nextStage;
        this.curedCondition = curedCondition;
        this.rollModifier = rollModifier;
        this.attributes = attributes;
        this.row = row;

        this.timer;
    }

    inflict(player, game, notify, updateSheet) {
        if (player.status.includes(this)) return "Specified player already has that status effect.";

        if (notify === null || notify === undefined) notify = true;
        if (updateSheet === null || updateSheet === undefined) updateSheet = true;

        if (this.attributes.includes("no channel")) player.location.leaveChannel(player);
    }

    inflictedCell() {
        return settings.statusSheetInflictedColumn + this.row;
    }
    curedCell() {
        return settings.statusSheetCuredColumn + this.row;
    }
}

module.exports = Status;
