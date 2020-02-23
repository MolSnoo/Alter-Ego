const settings = include('settings.json');

class Status {
    constructor(name, duration, fatal, visible, cures, nextStage, duplicatedStatus, curedCondition, statModifiers, attributes, inflictedDescription, curedDescription, row) {
        this.name = name;
        this.duration = duration;
        this.fatal = fatal;
        this.visible = visible;
        this.cures = cures;
        this.nextStage = nextStage;
        this.duplicatedStatus = duplicatedStatus;
        this.curedCondition = curedCondition;
        this.statModifiers = statModifiers;
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
