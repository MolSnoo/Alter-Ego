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
