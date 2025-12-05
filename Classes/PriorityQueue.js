import StackQueue from './StackQueue.js';

/**
 * @class PriorityQueue
 * @classdesc Five-priority queue system for use by the message handler.
 * @constructor
 */
export default class PriorityQueue {
    /** 
     * Incoming stack for queued message entries.
     * @type {{ mod: StackQueue, tell: StackQueue, mechanic: StackQueue, log: StackQueue, spectator: StackQueue }}
     */
    queues;
    /**
     * Order of queues given as an array of strings.
     * @type {Array<string>}
     */
    priorityOrder;

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

    /**
     * @param {MessageQueueEntry} message
     * @param {string} priority
     */
    enqueue(message, priority) {
        if (this.queues[priority]) {
            this.queues[priority].enqueue(message);
        }
    }

    /**
     * @returns {MessageQueueEntry | undefined}
     */
    dequeue() {
        if (this.size() > 0) {
            for (const priority of this.priorityOrder) {
                if (this.queues[priority].length > 0) {
                    return this.queues[priority].dequeue();
                }
            }
        }
    }

    /**
     * @returns {number}
     */
    size() {
        return this.priorityOrder.reduce((total, priority) => total + this.queues[priority].length, 0);
    }
}
