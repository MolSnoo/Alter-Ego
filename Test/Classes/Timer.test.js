import Timer from "../../Classes/Timer.js";
import { Duration } from "luxon";

describe("Timer Test Suite", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    describe("Usage Tests", () => {
        test("Callback and Duration Test", () => {
            const callback = vi.fn();
            const timer = new Timer(1000, { start: false, loop: false }, callback);

            timer.start();
            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(999);
            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("Loop Test", () => {
            const callback = vi.fn();
            const timer = new Timer(1000, { start: false, loop: true }, callback);

            timer.start();

            vi.advanceTimersByTime(3000);

            expect(callback).toHaveBeenCalledTimes(3);
        });
    });

    describe("State Management Tests", () => {
        test("Auto-Start Test", () => {
            const callback = vi.fn();
            const timer = new Timer(1000, { start: true, loop: false }, callback);

            vi.advanceTimersByTime(1000);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("Tracks Start/Stop Correctly", () => {
            const timer = new Timer(1000, { loop: false, start: false }, vi.fn());

            expect(timer.isStarted()).toBe(false);
            expect(timer.isStopped()).toBe(false);

            timer.start();
            expect(timer.isStarted()).toBe(true);
            expect(timer.isStopped()).toBe(false);

            timer.stop();
            expect(timer.isStarted()).toBe(false);
            expect(timer.isStopped()).toBe(true);
        });

        test("Prevents Multiple Starts Test", () => {
            const callback = vi.fn();
            const timer = new Timer(1000, { loop: false, start: false }, callback);

            const start1 = timer.start();
            const start2 = timer.start();

            expect(start1).toBe(true);
            expect(start2).toBe(false);
        });
    });

    describe("Duration Management Tests", () => {
        test("Luxon Duration Test", () => {
            const duration = Duration.fromObject({ seconds: 5 });
            const callback = vi.fn();
            const timer = new Timer(duration, { loop: false, start: false }, callback);

            expect(timer.getDuration()).toBe(5000);
        });

        test("Mutable Duration After Start Test", () => {
            const callback = vi.fn();
            const timer = new Timer(2000, { loop: false, start: false }, callback);

            timer.start();

            vi.advanceTimersByTime(1000);
            timer.duration(3000);

            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(2000);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("Mutable Duration With Unit After Start Test", () => {
            const callback = vi.fn();
            const timer = new Timer(2000, { loop: false, start: false }, callback);

            timer.start();

            vi.advanceTimersByTime(1000);

            timer.duration(5, "seconds");

            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(5000);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("Mutable Duration With Luxon Duration After Start Test", () => {
            const callback = vi.fn();
            const timer = new Timer(2000, { loop: false, start: false }, callback);

            timer.start();

            vi.advanceTimersByTime(1000);

            timer.duration(Duration.fromMillis(5000));

            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(5000);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("Mutable Duration Handles Invalid Values After Start Test", () => {
            const callback = vi.fn();
            const timer = new Timer(2000, { loop: false, start: false }, callback);

            timer.start();

            vi.advanceTimersByTime(1000);
            expect(() => {
                // @ts-ignore
                timer.duration("Deliberately Invalid Duration");
            }).toThrow();

            expect(callback).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1000);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("Duration Calculation Test", () => {
            const timer = new Timer(5000, { start: false, loop: false }, vi.fn());

            timer.start();

            vi.advanceTimersByTime(2000);
            expect(timer.getRemainingDuration()).toBeCloseTo(3000, -2);

            timer.stop();
            const remainingAfterStop = timer.getRemainingDuration();

            vi.advanceTimersByTime(1000);
            expect(timer.getRemainingDuration()).toBe(remainingAfterStop);
        });
    });

    describe("Miscellaneous Tests", () => {
        test("Resume Test", () => {
            const callback = vi.fn();
            const timer = new Timer(5000, { loop: false, start: false }, callback);

            timer.start();
            vi.advanceTimersByTime(2000);
            timer.stop();

            const remaining = timer.getRemainingDuration();
            expect(remaining).toBeCloseTo(3000, -2);

            timer.start();
            vi.advanceTimersByTime(3000);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("Stopped Timer Clear Test", () => {
            const callback = vi.fn();
            const timer = new Timer(5000, { loop: false, start: false }, callback);

            timer.start();
            vi.advanceTimersByTime(1000);
            timer.stop();
            timer.clearTimer();

            expect(timer.clearTimer()).toBeFalsy();
        });

        test("Loop Stop Test", () => {
            const callback = vi.fn();
            const timer = new Timer(1000, { loop: true, start: false }, callback);

            timer.start();
            vi.advanceTimersByTime(2500);

            timer.stop();
            expect(callback).toHaveBeenCalledTimes(2);

            vi.advanceTimersByTime(2000);
            expect(callback).toHaveBeenCalledTimes(2);
        });

        test("Expect getRemainingDuration To Be Zero Without Start", () => {
            const callback = vi.fn();
            const timer = new Timer(1000, { loop: true, start: false }, callback);

            expect(timer.getRemainingDuration()).toStrictEqual(0);
        });
    });
});
