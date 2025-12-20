import { describe, test, expect } from "vitest";
import PriorityQueue from "../../Classes/PriorityQueue.js";

describe("PriorityQueue test", () => {
    beforeEach(() => {
        queue.clear();
    });

    const queue = new PriorityQueue();

    test("Usage Test", () => {
        for (const priority of queue.priorityOrder) {
            queue.enqueue(1, priority);
            expect(queue.queues.get(priority).inStack).toStrictEqual([1]);
            expect(queue.queues.get(priority).outStack).toStrictEqual([]);
            queue.enqueue(2, priority);
            queue.dequeue();
            expect(queue.queues.get(priority).inStack).toStrictEqual([]);
            expect(queue.queues.get(priority).outStack).toStrictEqual([2]);
            queue.dequeue();
        }
        for (const priority of queue.priorityOrder) {
            queue.enqueue(1, priority);
        }
        for (const priority of queue.priorityOrder) {
            expect(queue.queues.get(priority).inStack).toStrictEqual([1]);
            expect(queue.queues.get(priority).outStack).toStrictEqual([]);
        }
        for (let i = 0; i < queue.priorityOrder.length; i++) {
            queue.dequeue();
        }
        for (const priority of queue.priorityOrder) {
            expect(queue.queues.get(priority).inStack).toStrictEqual([]);
            expect(queue.queues.get(priority).outStack).toStrictEqual([]);
        }
    });

    test("Clear Test", () => {
        for (const priority of queue.priorityOrder) {
            for (let i = 0; i < 10; i++) {
                queue.enqueue(i, priority);
            }
        }
        for (const priority of queue.priorityOrder) {
            expect(queue.queues.get(priority).inStack).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(queue.queues.get(priority).outStack).toStrictEqual([]);
        }
        for (let i = 0; i < 3; i++) {
            queue.dequeue();
        }
        expect(queue.queues.get(queue.priorityOrder[0]).inStack).toStrictEqual([]);
        expect(queue.queues.get(queue.priorityOrder[0]).outStack).toStrictEqual([9, 8, 7, 6, 5, 4, 3]);
        for (let i = 1; i < queue.priorityOrder.length; i++) {
            expect(queue.queues.get(queue.priorityOrder[i]).inStack).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect(queue.queues.get(queue.priorityOrder[i]).outStack).toStrictEqual([]);
        }
        for (const priority of queue.priorityOrder) {
            for (let i = 10; i < 20; i++) {
                queue.enqueue(i, priority);
            }
        }
        expect(queue.queues.get(queue.priorityOrder[0]).inStack).toStrictEqual([
            10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        ]);
        expect(queue.queues.get(queue.priorityOrder[0]).outStack).toStrictEqual([9, 8, 7, 6, 5, 4, 3]);
        for (let i = 1; i < queue.priorityOrder.length; i++) {
            expect(queue.queues.get(queue.priorityOrder[i]).inStack).toStrictEqual([
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            ]);
            expect(queue.queues.get(queue.priorityOrder[i]).outStack).toStrictEqual([]);
        }
        queue.clear();
        for (const priority of queue.priorityOrder) {
            expect(queue.queues.get(priority).inStack).toStrictEqual([]);
            expect(queue.queues.get(priority).outStack).toStrictEqual([]);
        }
    });

    test("Size Test", () => {
        for (const priority of queue.priorityOrder) {
            for (let i = 0; i < 10; i++) {
                queue.enqueue(i, priority);
            }
        }
        expect(queue.size()).toStrictEqual(10 * queue.priorityOrder.length);
        for (let i = 0; i < 3; i++) {
            queue.dequeue();
        }
        expect(queue.size()).toStrictEqual(10 * queue.priorityOrder.length - 3);
        for (const priority of queue.priorityOrder) {
            for (let i = 10; i < 20; i++) {
                queue.enqueue(i, priority);
            }
        }
        expect(queue.size()).toStrictEqual(20 * queue.priorityOrder.length - 3);
        queue.clear();
        expect(queue.size()).toStrictEqual(0);
    });

    test("Empty Test", () => {
        const shouldBeUndefined = queue.dequeue();
        expect(shouldBeUndefined).toStrictEqual(undefined);
    });

    test("Wrong Priority Test", () => {
        queue.enqueue(1, "");
        expect(queue.size()).toStrictEqual(0);
    });
});
