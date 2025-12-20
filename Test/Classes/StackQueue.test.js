import { describe, test, expect } from "vitest";
import StackQueue from "../../Classes/StackQueue.js";

describe("StackQueue test", () => {
    beforeEach(() => {
        queue.clear();
    });

    const queue = new StackQueue();

    test("Usage Test", () => {
        queue.enqueue(1);
        expect(queue.inStack).toStrictEqual([1]);
        expect(queue.outStack).toStrictEqual([]);
        queue.enqueue(2);
        queue.dequeue();
        expect(queue.inStack).toStrictEqual([]);
        expect(queue.outStack).toStrictEqual([2]);
    });

    test("Clear Test", () => {
        for (let i = 0; i < 10; i++) {
            queue.enqueue(i);
        }
        expect(queue.inStack).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(queue.outStack).toStrictEqual([]);
        for (let i = 0; i < 3; i++) {
            queue.dequeue();
        }
        expect(queue.inStack).toStrictEqual([]);
        expect(queue.outStack).toStrictEqual([9, 8, 7, 6, 5, 4, 3]);
        for (let i = 10; i < 20; i++) {
            queue.enqueue(i);
        }
        expect(queue.inStack).toStrictEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
        expect(queue.outStack).toStrictEqual([9, 8, 7, 6, 5, 4, 3]);
        queue.clear();
        expect(queue.inStack).toStrictEqual([]);
        expect(queue.outStack).toStrictEqual([]);
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
