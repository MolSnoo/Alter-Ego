// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from 'discord.js';
import StackQueue from './StackQueue.ts';

/**
 * Represents a queue entry for a message waiting to be sent in one of the priority queue's stack queues.
 */
interface MessageQueueEntry {
    fire: () => Promise<void>;
    destination: string;
}

/**
 * Five-priority queue system for use by the message handler.
 */
export default class PriorityQueue<T extends string[]> {
	/** Order of queues given as an array of strings. */
	priorityOrder: T;
	/** Separate StackQueues to represent each different priority level. */
	queues: Collection<T[number], StackQueue<MessageQueueEntry>>;
	/** Separate StackQueues to represent each different destination. */
	channelQueues: Collection<string, StackQueue<MessageQueueEntry>>;
	/** Whether or not a channelQueue is "Firing", that is, whether or not it is being fully dequeued by the Message Handler. */
	channelFiring: Collection<string, boolean>;
	/** Whether or not the PriorityQueue is in manual mode, that is, whether or not `process()` must be explicitly called to process incoming queue entries. */
    manual: boolean;
    /** The error message to log to the console when the PriorityQueue fails processing. */
    errorMessage: string;

	constructor(errorMessage: string, priorities: T) {
        this.priorityOrder = priorities;
        this.errorMessage = errorMessage;
		this.channelQueues = new Collection();
		this.channelFiring = new Collection();
		this.queues = new Collection();
		this.manual = false;
		for (let i = 0; i < this.priorityOrder.length; i++) {
			this.queues.set(this.priorityOrder[i], new StackQueue());
		}
	}

	/**
	 * Enqueues a given MessageQueueEntry on a StackQueue of the given priority.
	 * If the given priority doesn't exist, this function will silently swallow MessageQueueEntry.
	 * O(1) operation.
	 */
	enqueue(message: MessageQueueEntry, priority: T[number]) {
		if (this.queues.has(priority)) {
			this.queues.get(priority).enqueue(message);
			if (!this.manual) this.process();
		}
	}

	/**
	 * Dequeues a MessageQueueEntry in order of priority. Operation is O(n) relative to the number of priorities to find a queue with a non-zero length,
	 * as well as O(n) relative to the number of messages in a given queue if the queue's outStack length is 0, and O(1) otherwise.
	 */
	dequeue(): MessageQueueEntry | undefined {
		if (this.size() > 0) {
			for (const priority of this.priorityOrder) {
				if (this.queues.get(priority).size() > 0) {
					return this.queues.get(priority).dequeue();
				}
			}
		}
	}

	/**
	 * Fully dequeues and fires every entry in the PriorityQueue.
	 */
	async process() {
		const priorityQueue = this;
		while (this.size() > 0) {
			const message = this.dequeue();
			if (!this.channelFiring.has(message.destination)) this.channelFiring.set(message.destination, false);
			if (!this.channelQueues.has(message.destination)) {
				this.channelQueues.set(message.destination, new StackQueue());
			}
			this.channelQueues.get(message.destination).enqueue(message);
		}
		const promises = [];
		for (const [key, queue] of this.channelQueues) {
			promises.push(
				(async (key: string) => {
					if (priorityQueue.channelFiring.get(key) === true) return;
					else priorityQueue.channelFiring.set(key, true);
					while (queue.size() > 0) {
						const message = queue.dequeue();
						try {
							await message.fire();
						} catch (error) {
							console.error(this.errorMessage, error);
						}
					}
					priorityQueue.channelFiring.set(key, false);
				})(key),
			);
		}
		await Promise.all(promises);
	}

	/**
	 * Reports the size of the PriorityQueue. O(n) operation relative to the number of priorities.
	 */
	size(): number {
		let size = 0;
		for (let i = 0; i < this.priorityOrder.length; i++) size += this.queues.get(this.priorityOrder[i]).size();
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
