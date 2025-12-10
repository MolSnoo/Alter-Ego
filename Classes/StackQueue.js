/**
 * @class StackQueue
 * @classdesc Double-stack queue system for use in the priority queue, used by the message handler.
 * @constructor
 */
export default class StackQueue {
    /** 
     * Incoming stack for queued message entries. When messages are dequeued and the outStack is empty, this stack is flipped and emptied into the outStack.
     * @type {Array<MessageQueueEntry>}
     */
    inStack;
    /**
     * Outgoing stack for queued message entries. Messages are dequeued from this outgoing stack, drawing from inStack if necessary. 
     * @type {Array<MessageQueueEntry>}
     */
    outStack;

    constructor() {
        this.inStack = [];
        this.outStack = [];
    }

    /**
     * Pushes a MessageQueueEntry into the queue. O(1) operation.
     * @param {MessageQueueEntry} value
     */
    enqueue(value) {
        this.inStack.push(value);
    }

    /**
     * Pops a MessageQueueEntry from the queue. O(1) operation if outStack.length > 0, otherwise O(n).
     * @returns {MessageQueueEntry | undefined}
     */
    dequeue() {
        if (this.size() !== 0) {
            if (this.outStack.length === 0) {
                while (this.inStack.length > 0) {
                    this.outStack.push(this.inStack.pop());
                }
            }
            const out = this.outStack.pop();
            if (out) {
                return out;
            }
        }
    }

    /**
     * Clears the inStack and outStack of the StackQueue.
     */
    clear() {
        this.inStack.length = 0;
        this.outStack.length = 0;
    }

    /**
     * Size of the queue.
     * @returns {number}
    */
   size() {
        return this.inStack.length + this.outStack.length;
   }
}
