import PriorityQueue from "../../Classes/PriorityQueue.js";

describe("PriorityQueue test", () => {
    beforeEach(() => {
        queue.clear();
    });

    const queue = new PriorityQueue();
    const queueEntry = {fire: vi.fn()}

    test("Usage Test", () => {
        for (const priority of queue.priorityOrder) {
            queue.enqueue(queueEntry, priority);
            queue.enqueue(queueEntry, priority);
            expect(queue.dequeue()).toStrictEqual(queueEntry);
            expect(queue.dequeue()).toStrictEqual(queueEntry);
            expect(queue.dequeue()).toStrictEqual(undefined);
        }
        for (const priority of queue.priorityOrder) {
            queue.enqueue(queueEntry, priority);
        }
        for (let i = 0; i < queue.priorityOrder.length; i++) {
            expect(queue.dequeue()).toStrictEqual(queueEntry);
        }
        expect(queue.dequeue()).toStrictEqual(undefined);
    });

    test("Size Test", () => {
        for (const priority of queue.priorityOrder) {
            for (let i = 0; i < 10; i++) {
                queue.enqueue(queueEntry, priority);
            }
        }
        expect(queue.size()).toStrictEqual(10 * queue.priorityOrder.length);
        for (let i = 0; i < 3; i++) {
            queue.dequeue();
        }
        expect(queue.size()).toStrictEqual(10 * queue.priorityOrder.length - 3);
        for (const priority of queue.priorityOrder) {
            for (let i = 10; i < 20; i++) {
                queue.enqueue(queueEntry, priority);
            }
        }
        expect(queue.size()).toStrictEqual(20 * queue.priorityOrder.length - 3);
        queue.clear();
        expect(queue.size()).toStrictEqual(0);
    });

    test("Wrong Priority Test", () => {
        // @ts-expect-error
        queue.enqueue(queueEntry, "");
        expect(queue.size()).toStrictEqual(0);
    });
});
