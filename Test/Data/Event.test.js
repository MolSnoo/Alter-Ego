import Event from '../../Data/Event.js';
import { DateTime } from 'luxon';

beforeAll(() => {
	vi.useFakeTimers();
});

describe('trigger times', () => {
	/**
	 * @param {DateTime<true> | DateTime<false>} moment1
	 * @param {DateTime<true>} moment2
	 */
	function momentsEqual(moment1, moment2) {
		return moment1 && moment2 &&
		moment1.isValid && moment2.isValid &&
		moment1.month === moment2.month &&
		moment1.day === moment2.day &&
		moment1.weekday === moment2.weekday &&
		moment1.hour === moment2.hour &&
		moment1.minute === moment2.minute;
	}

	describe('2025-10-11 20:30:17.156', () => {
		beforeAll(() => {
			vi.setSystemTime(new Date('2025-10-11T20:30:17.156'));
		});

		const now = DateTime.fromISO('2025-10-11T20:30:17.156');

		test('test_trigger_times_0', () => {
			const event = Event.parseTriggerTime("8:30 PM").datetime;
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("8:31 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_1', () => {
			const event = Event.parseTriggerTime("8:30:00 PM").datetime;
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("8:31:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_2', () => {
			const event = Event.parseTriggerTime("20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("20:31").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_3', () => {
			const event = Event.parseTriggerTime("08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("08:31 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_4', () => {
			const event = Event.parseTriggerTime("Sat 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Sun 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_5', () => {
			const event = Event.parseTriggerTime("Sat 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Sun 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_6', () => {
			const event = Event.parseTriggerTime("Sat 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Sun 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_7', () => {
			const event = Event.parseTriggerTime("Sat 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Sun 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_8', () => {
			const event = Event.parseTriggerTime("Saturday 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Sunday 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_9', () => {
			const event = Event.parseTriggerTime("Saturday 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Sunday 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_10', () => {
			const event = Event.parseTriggerTime("Saturday 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Sunday 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_11', () => {
			const event = Event.parseTriggerTime("Saturday 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Sunday 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_12', () => {
			const event = Event.parseTriggerTime("11th 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("12th 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_13', () => {
			const event = Event.parseTriggerTime("11th 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("12th 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_14', () => {
			const event = Event.parseTriggerTime("11th 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("12th 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_15', () => {
			const event = Event.parseTriggerTime("11th 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("12th 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_16', () => {
			const event = Event.parseTriggerTime("11th Oct 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("12th Oct 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_17', () => {
			const event = Event.parseTriggerTime("11th Oct 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("11th Nov 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_18', () => {
			const event = Event.parseTriggerTime("11th Oct 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("11th May 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_19', () => {
			const event = Event.parseTriggerTime("11th Oct 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("11th Aug 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_20', () => {
			const event = Event.parseTriggerTime("11th October 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("11th Novermber 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_21', () => {
			const event = Event.parseTriggerTime("11th October 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("12th October 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_22', () => {
			const event = Event.parseTriggerTime("11th October 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("11th August 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_23', () => {
			const event = Event.parseTriggerTime("11th October 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("11th January 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_24', () => {
			const event = Event.parseTriggerTime("11 Oct 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("11 Jan 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_25', () => {
			const event = Event.parseTriggerTime("11 Oct 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("10 Oct 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_26', () => {
			const event = Event.parseTriggerTime("11 Oct 20:30").datetime;
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("10 Oct 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_27', () => {
			const event = Event.parseTriggerTime("11 Oct 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("4 Oct 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_28', () => {
			const event = Event.parseTriggerTime("11 October 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("04 October 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_29', () => {
			const event = Event.parseTriggerTime("11 October 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("11 January 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_30', () => {
			const event = Event.parseTriggerTime("11 October 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("12 December 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_31', () => {
			const event = Event.parseTriggerTime("11 October 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("1 October 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_32', () => {
			const event = Event.parseTriggerTime("Oct 11th 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Oct 10th 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_33', () => {
			const event = Event.parseTriggerTime("Oct 11th 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Oct 12th 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_34', () => {
			const event = Event.parseTriggerTime("Oct 11th 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Jan 11th 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_35', () => {
			const event = Event.parseTriggerTime("Oct 11th 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Jan 11th 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_36', () => {
			const event = Event.parseTriggerTime("October 11th 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("January 11th 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_37', () => {
			const event = Event.parseTriggerTime("October 11th 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("October 12th 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_38', () => {
			const event = Event.parseTriggerTime("October 11th 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("December 11th 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_39', () => {
			const event = Event.parseTriggerTime("October 11th 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("February 14th 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});
	});

	describe('2025-03-01 20:30:17.156', () => {
		beforeAll(() => {
			vi.setSystemTime(new Date('2025-03-01T20:30:17.156'));
		});

		const now = DateTime.fromISO('2025-03-01T20:30:17.156');

		test('test_trigger_times_40', () => {
			const event = Event.parseTriggerTime("Mar 1 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Feb 29 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_41', () => {
			const event = Event.parseTriggerTime("Mar 1 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Feb 29 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_42', () => {
			const event = Event.parseTriggerTime("Mar 1 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Feb 29 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_43', () => {
			const event = Event.parseTriggerTime("Mar 1 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("Feb 29 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_44', () => {
			const event = Event.parseTriggerTime("March 1 8:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("February 29 8:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_45', () => {
			const event = Event.parseTriggerTime("March 1 8:30:00 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("February 29 8:30:00 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_46', () => {
			const event = Event.parseTriggerTime("March 1 20:30").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("February 29 20:30").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_47', () => {
			const event = Event.parseTriggerTime("March 1 08:30 PM").datetime;	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = Event.parseTriggerTime("February 29 08:30 PM").datetime;
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});
	})
});