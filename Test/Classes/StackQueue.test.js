import StackQueue from "../../Classes/StackQueue.js";

describe("StackQueue test", () => {
    beforeEach(() => {
        queue.clear();
    });

    /** @type {StackQueue<number>} */
    const queue = new StackQueue();

    test("Usage Test", () => {
        queue.enqueue(1);
        queue.enqueue(2);
        expect(queue.dequeue()).toStrictEqual(1);
        expect(queue.dequeue()).toStrictEqual(2);
    });

    test("Size Test", () => {
        for (let i = 0; i < 10; i++) {
            queue.enqueue(i);
        }
        expect(queue.size()).toStrictEqual(10);
        for (let i = 0; i < 3; i++) {
            queue.dequeue();
        }
        expect(queue.size()).toStrictEqual(7);
        for (let i = 10; i < 20; i++) {
            queue.enqueue(i);
        }
        expect(queue.size()).toStrictEqual(17);
        queue.clear();
        expect(queue.size()).toStrictEqual(0);
    });

    test("Empty Test", () => {
        const shouldBeUndefined = queue.dequeue();
        expect(shouldBeUndefined).toStrictEqual(undefined);
    });
});
