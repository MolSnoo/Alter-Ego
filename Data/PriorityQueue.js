const constants = include('Configs/constants.json');
const StackQueue = include(`${constants.dataDir}/StackQueue.js`);

class PriorityQueue {
    constructor() {
        this.queues = {
            mod: new StackQueue(),
            tell: new StackQueue(), 
            mechanic: new StackQueue(),
            log: new StackQueue(),
            spectator: new StackQueue()
        };
        this.priorityOrder = ['mod', 'tell', 'mechanic', 'log', 'spectator'];
    }

    enqueue(message, priority) {
        if (this.queues[priority]) {
            this.queues[priority].enqueue(message);
        }
    }

    dequeue() {
        for (const priority of this.priorityOrder) {
            if (this.queues[priority].length > 0) {
                return this.queues[priority].dequeue();
            }
        }
        return null;
    }

    size() {
        return this.priorityOrder.reduce((total, priority) => total + this.queues[priority].length, 0);
    }
}

module.exports = PriorityQueue;
