class QueuedMessage {
    constructor(sendAction, priority) {
        this.sendAction = sendAction;
        this.priority = priority;
    }
}

module.exports = QueuedMessage;