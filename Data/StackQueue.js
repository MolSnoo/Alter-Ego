class StackQueue {
    constructor() {
        this.inStack = [];
        this.outStack = [];
        this.length = 0;
    }

    enqueue(value) {
        this.inStack.push(value);
        this.length++;
    }

    dequeue() {
        if (this.length === 0) return null;
        if (this.outStack.length === 0) {
            while (this.inStack.length > 0) {
                this.outStack.push(this.inStack.pop());
            }
        }
        this.length--;
        return this.outStack.pop();
    }
}

module.exports = StackQueue;
