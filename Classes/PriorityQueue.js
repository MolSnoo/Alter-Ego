import StackQueue from './StackQueue.js';

/**
 * @class PriorityQueue
 * @classdesc Five-priority queue system for use by the message handler.
 * @constructor
 */
export default class PriorityQueue {
    /**
     * Order of queues given as an array of strings.
     * @type {Array<string>}
     */
    priorityOrder;
    /** 
     * Separate StackQueues to represent each different priority level.
     * @type {Map<string, StackQueue>}
     */
    queues;

    constructor() {
        this.priorityOrder = ['mod', 'tell', 'mechanic', 'log', 'spectator'];
        this.queues = new Map();
        for (let i = 0; i < this.priorityOrder.length; i++) {
            this.queues.set(this.priorityOrder[i], new StackQueue());
        }
    }

    /**
     * Enqueues a given MessageQueueEntry on a StackQueue of the given priority. If the given priority doesn't exist, this function will silently swallow MessageQueueEntry. O(1) operation.
     * @param {MessageQueueEntry} message
     * @param {string} priority
     */
    enqueue(message, priority) {
        if (this.queues.has(priority)) {
            this.queues.get(priority).enqueue(message);
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
                if (this.queues.get(priority).length > 0) {
                    return this.queues.get(priority).dequeue();
                }
            }
        }
    }

    /**
     * Reports the size of the PriorityQueue. O(n) operation relative to the number of priorities.
     * @returns {number}
     */
    size() {
        let size = 0;
        for (let i = 0; i < this.priorityOrder.length; i++)
            size += this.queues.get(this.priorityOrder[i]).length;
        return size;
    }

    /**
     * Clears the inStack and outStack of each StackQueue managed by the PriorityQueue.
     */
    clear() {
        for (let i = 0; i < this.priorityOrder.length; i++) {
            this.queues.get(this.priorityOrder[i]).clear();
        }
    }
}
