import StackQueue from './StackQueue.js';

/**
 * @class PriorityQueue
 * @classdesc Five-priority queue system for use by the message handler.
 * @constructor
 */
export default class PriorityQueue {
    /** 
     * Separate StackQueues to represent each different priority level.
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
     * Enqueues a given MessageQueueEntry on a StackQueue of the given priority. If the given priority doesn't exist, this function will silently swallow MessageQueueEntry. O(1) operation.
     * @param {MessageQueueEntry} message
     * @param {string} priority
     */
    enqueue(message, priority) {
        if (this.queues[priority]) {
            this.queues[priority].enqueue(message);
        }
    }

    /**
     * Dequeues a MessageQueueEntry in order of priority. Operation is O(n) relative to the number of priorities to find a queue with a non-zero length,
     * as well as O(n) relative to the number of messages in a given queue if the queue's outStack length is 0, and O(1) otherwise.
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
     * Reports the size of the PriorityQueue. O(n) operation relative to the number of priorities.
     * @returns {number}
     */
    size() {
        return this.priorityOrder.reduce((total, priority) => total + this.queues[priority].length, 0);
    }
}
