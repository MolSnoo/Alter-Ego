class Status {
    constructor(name, duration, fatal, cure, nextStage, curedCondition, rollModifier, row) {
        this.name = name;
        this.duration = duration;
        this.fatal = fatal;
        this.cure = cure;
        this.nextStage = nextStage;
        this.curedCondition = curedCondition;
        this.rollModifier = rollModifier;
        this.row = row;

        this.timer;
    }

    inflictedCell() {
        return ("Status Effects!J" + this.row);
    }
    curedCell() {
        return ("Status Effects!K" + this.row);
    }
}

module.exports = Status;