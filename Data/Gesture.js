export default class Gesture {
    constructor(name, requires, disabledStatusesStrings, description, narration, row) {
        this.name = name;
        this.requires = requires;
        this.disabledStatusesStrings = disabledStatusesStrings;
        this.disabledStatuses = [...disabledStatusesStrings];
        this.description = description;
        this.narration = narration;
        this.row = row;

        this.targetType = "";
        this.target = null;
    }
}
