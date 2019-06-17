const settings = require("../settings.json");

class Status {
    constructor(name, duration, fatal, cures, nextStage, curedCondition, rollModifier, modifiesSelf, attributes, row) {
        this.name = name;
        this.duration = duration;
        this.fatal = fatal;
        this.cures = cures;
        this.nextStage = nextStage;
        this.curedCondition = curedCondition;
        this.rollModifier = rollModifier;
        this.modifiesSelf = modifiesSelf;
        this.attributes = attributes;
        this.row = row;

        this.timer = null;
    }

    inflictedCell() {
        return settings.statusSheetInflictedColumn + this.row;
    }
    curedCell() {
        return settings.statusSheetCuredColumn + this.row;
    }
}

module.exports = Status;
