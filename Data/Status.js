const settings = include('settings.json');

class Status {
    constructor(name, duration, fatal, cures, nextStage, duplicatedStatus, curedCondition, rollModifier, modifiesSelf, attributes, inflictedDescription, curedDescription, row) {
        this.name = name;
        this.duration = duration;
        this.fatal = fatal;
        this.cures = cures;
        this.nextStage = nextStage;
        this.duplicatedStatus = duplicatedStatus;
        this.curedCondition = curedCondition;
        this.rollModifier = rollModifier;
        this.modifiesSelf = modifiesSelf;
        this.attributes = attributes;
        this.inflictedDescription = inflictedDescription;
        this.curedDescription = curedDescription;
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
