/**
 * @class StackQueue
 * @classdesc Double-stack queue system for use by the priority queue, used by the message handler.
 * @constructor
 */
export default class StackQueue {
    /** 
     * Incoming stack for queued message entries.
     * @type {Array<MessageQueueEntry>}
     */
    inStack;
    /**
     * Outgoing stack for queued message entries.
     * @type {Array<MessageQueueEntry>}
     */
    outstack;
    /**
     * Length of StackQueue
     * @type {number}
     */
    length;

    constructor() {
        this.inStack = [];
        this.outStack = [];
        this.length = 0;
    }

    /**
     * @param {MessageQueueEntry} value
     */
    enqueue(value) {
        this.inStack.push(value);
        this.length++;
    }

    /**
     * @returns {MessageQueueEntry | undefined}
     */
    dequeue() {
        if (this.length === 0) {
            if (this.outStack.length === 0) {
                while (this.inStack.length > 0) {
                    this.outStack.push(this.inStack.pop());
                }
            }
            const out = this.outStack.pop();
            if (out) {
                this.length--;
                return out;
            }
        }
    }
}
