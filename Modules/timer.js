let $djs

/**
 * @class Timer
 * @classdesc API-compatible replacement for moment.js, adapted to day.js.
 * @constructor
 */
class Timer {
    /**
     * Timer duration in milliseconds.
     * @type {number}
     */
    timerDuration;
    /**
     * Timer attributes.
     * @type {TimerAttributes}
     */
    attributes;
    /**
     * Timer callback function.
     * @type {Function}
     */
    callback;
    /**
     * Whether or not the timer is running.
     * @type {boolean}
     */
    started;
    /**
     * Whether or not the timer is stopped.
     * @type {boolean}
     */
    stopped;
    /**
     * Internal timer object.
     * @type {NodeJS.Timeout|null}
     */
    timer;
    /**
     * Start tick.
     * @type {number|null}
     */
    startTick;
    /**
     * End tick.
     * @type {number|null}
     */
    endTick;
    /**
     * @param {number} duration - Timer duration in milliseconds.
     * @param {TimerAttributes} attributes - Timer attributes.
     * @param {Function} [callback] - Timer callback function.
     */
    constructor(duration, attributes, callback) {
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
     * @returns {boolean} Success status
     */
    start() {
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

        this._handleTimerStart();
        this.updateStartEndTickFromDuration(this.timerDuration);
        this.started = true;

        return true;
    }

    /**
     * Stops the timer.
     * @returns {boolean} Success status
     */
    stop() {
        if (!this.started) return false;

        this.clearTimer();
        this.updateStartEndTickFromDuration(this.getRemainingDuration());
        this.started = false;
        this.stopped = true;

        return true;
    }

    /**
     * Clears the internal timer.
     * @returns {boolean} Success status
     */
    clearTimer() {
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
     * @param {number} duration - Duration in milliseconds
     * @returns {boolean} Success status
     */
    updateStartEndTickFromDuration(duration) {
        this.startTick = Date.now();
        this.endTick = this.startTick + duration;
        return true;
    }

    /**
     * Set or get the timer duration.
     * @param {number|import('dayjs/plugin/duration.js').Duration} [duration] - New duration
     * @param {string} [unit] - Time unit if duration is a number
     * @returns {boolean|void} Returns true if setting, nothing if getting
     */
    duration(duration, unit) {
        if (arguments.length > 0) {
            let ms;

            if (typeof duration === "number") {
                // Convert based on unit if provided
                if (unit && $djs && $djs.duration) {
                    ms = $djs.duration(duration, unit).asMilliseconds();
                } else {
                    ms = duration;
                }
            } else if (duration && typeof duration.asMilliseconds === "function") {
                // Dayjs duration object
                ms = duration.asMilliseconds();
            } else {
                throw new Error("Invalid duration parameter");
            }

            this.timerDuration = ms;
            this._handleRunningDurationChange();
            return true;
        }
    }

    /**
     * Get the current duration.
     * @returns {number} Duration in milliseconds
     */
    getDuration() {
        return this.timerDuration;
    }

    /**
     * Get the remaining duration.
     * @returns {number} Remaining time in milliseconds
     */
    getRemainingDuration() {
        if (this.startTick && this.endTick) {
            return this.stopped ? this.endTick - this.startTick : this.endTick - Date.now();
        }
        return 0;
    }

    /**
     * Check if timer is stopped.
     * @returns {boolean} True if stopped
     */
    isStopped() {
        return this.stopped;
    }

    /**
     * Check if timer is started.
     * @returns {boolean} True if started
     */
    isStarted() {
        return this.started;
    }

    /**
     * Internal method to handle timer start.
     * @private
     */
    _handleTimerStart() {
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

    /**
     * Internal method to handle duration changes while running.
     * @private
     */
    _handleRunningDurationChange() {
        if (this.started) {
            setTimeout(() => {
                if (this.started) {
                    this.clearTimer();
                    this._handleTimerStart();
                }
            }, this.getRemainingDuration());
        }
    }
}
