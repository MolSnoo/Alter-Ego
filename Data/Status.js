import constants from '../Configs/constants.json' with { type: 'json' };

export default class Status {
    constructor(name, duration, fatal, visible, overriders, cures, nextStage, duplicatedStatus, curedCondition, statModifiers, attributes, inflictedDescription, curedDescription, row) {
        this.name = name;
        this.duration = duration;
        this.remaining = null;
        this.fatal = fatal;
        this.visible = visible;
        this.overriders = overriders;
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
        return constants.statusSheetInflictedColumn + this.row;
    }
    curedCell() {
        return constants.statusSheetCuredColumn + this.row;
    }
}
