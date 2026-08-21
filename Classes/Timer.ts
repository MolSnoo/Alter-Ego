// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Duration } from 'luxon';
import type { DurationLikeObject, DurationUnit } from 'luxon';

interface TimerAttributes {
    loop: boolean;
    start: boolean;
}

/**
 * API-compatible replacement for moment.js, adapted to day.js.
 */
export default class Timer {
    /** Timer duration in milliseconds. */
    timerDuration: number;
    /** Timer attributes. */
    attributes: TimerAttributes;
    /** Timer callback function. */
    callback: Function;
    /** Whether or not the timer is running. */
    started: boolean;
    /** Whether or not the timer is stopped. */
    stopped: boolean;
    /** Internal timer object. */
    timer: NodeJS.Timeout | null;
    /** Start tick. */
    startTick: number | null;
    /** End tick. */
    endTick: number | null;

    /**
     * @param duration - Timer duration in milliseconds.
     * @param attributes - Timer attributes.
     * @param callback - Timer callback function.
     */
    constructor(duration: number | Duration, attributes: TimerAttributes, callback?: Function) {
        if (Duration.isDuration(duration))
            this.timerDuration = duration.as('milliseconds');
        else
            this.timerDuration = duration;
        this.attributes = { ...{ loop: false, start: false }, ...attributes };
        this.callback = callback;
        this.started = false;
        this.stopped = false;
        this.timer = null;
        this.startTick = null;
        this.endTick = null;
        if (this.attributes.start) {
            this.start();
        }
    }

    /**
     * Starts the timer.
     * @returns Success status.
     */
    start(): boolean {
        if (this.started || !this.callback) return false;

        if (this.stopped) {
            const remaining = this.getRemainingDuration();
            setTimeout(() => {
                if (this.callback) this.callback();
                this.start();
            }, remaining);

            this.stopped = false;
            return true;
        }

        this.#handleTimerStart();
        this.updateStartEndTickFromDuration(this.timerDuration);
        this.started = true;

        return true;
    }

    /**
     * Stops the timer.
     * @returns Success status.
     */
    stop(): boolean {
        if (!this.started) return false;

        this.clearTimer();
        this.updateStartEndTickFromDuration(this.getRemainingDuration());
        this.started = false;
        this.stopped = true;

        return true;
    }

    /**
     * Clears the internal timer.
     * @returns Success status.
     */
    clearTimer(): boolean {
        if (this.timer) {
            if (this.attributes.loop) {
                clearInterval(this.timer);
            } else {
                clearTimeout(this.timer);
            }
            this.timer = null;
            return true;
        }
        return false;
    }

    /**
     * Update start and end ticks based on duration.
     * @param duration - Duration in milliseconds.
     * @returns Success status.
     */
    updateStartEndTickFromDuration(duration: number): boolean {
        this.startTick = Date.now();
        this.endTick = this.startTick + duration;
        return true;
    }

    /**
     * Set or get the timer duration.
     * @param duration - New duration.
     * @param unit - Time unit if duration is a number.
     * @returns Returns true if setting, nothing if getting.
     */
    duration(duration: number | Duration | undefined = undefined, unit: DurationUnit | undefined = undefined): boolean | void {
        if (arguments.length > 0) {
            let ms: number | Duration;

            if (typeof duration === "number") {
                // Convert based on unit if provided.
                if (unit) {
                    let durationInput: DurationLikeObject = {}
                    durationInput[unit] = duration;
                    ms = Duration.fromObject(durationInput).as('milliseconds');
                } else {
                    ms = duration;
                }
            } else if (duration && Duration.isDuration(duration)) {
                // Luxon duration object.
                ms = duration.as('milliseconds');
            } else {
                throw new Error("Invalid duration parameter");
            }

            this.timerDuration = ms;
            this.#handleRunningDurationChange();
            return true;
        }
    }

    /**
     * Get the current duration.
     * @returns Duration in milliseconds.
     */
    getDuration(): number {
        return this.timerDuration;
    }

    /**
     * Get the remaining duration.
     * @returns Remaining time in milliseconds.
     */
    getRemainingDuration(): number {
        if (this.startTick && this.endTick) {
            return this.stopped ? this.endTick - this.startTick : this.endTick - Date.now();
        }
        return 0;
    }

    /**
     * Check if timer is stopped.
     * @returns True if stopped.
     */
    isStopped(): boolean {
        return this.stopped;
    }

    /**
     * Check if timer is started.
     * @returns True if started.
     */
    isStarted(): boolean {
        return this.started;
    }

    /** Internal method to handle timer start. */
    #handleTimerStart() {
        if (!this.callback) return;

        if (this.attributes.loop) {
            this.timer = setInterval(() => {
                this.updateStartEndTickFromDuration(this.timerDuration);
                this.callback();
            }, this.timerDuration);
        } else {
            this.timer = setTimeout(() => {
                this.started = false;
                this.callback();
            }, this.timerDuration);
        }
    }

    /** Internal method to handle duration changes while running. */
    #handleRunningDurationChange() {
        if (this.started) {
            setTimeout(() => {
                if (this.started) {
                    this.clearTimer();
                    this.#handleTimerStart();
                }
            }, this.getRemainingDuration());
        }
    }
}

