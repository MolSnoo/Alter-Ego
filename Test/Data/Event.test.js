import { beforeAll, describe, test, expect, vi } from 'vitest';

var moment = require('moment');
moment().format();

beforeAll(() => {
	vi.useFakeTimers();
});

describe('trigger times', () => {
	const formats = [
	'LT',			'LTS',			'HH:mm',			'hh:mm a',
	'ddd LT',		'ddd LTS',		'ddd HH:mm',		'ddd hh:mm a',
	'dddd LT',		'dddd LTS',		'dddd HH:mm',		'dddd hh:mm a',
	'Do LT',		'Do LTS',		'Do HH:mm',			'Do hh:mm a',
	'Do MMM LT',	'Do MMM LTS',	'Do MMM HH:mm',		'Do MMM hh:mm a',
	'Do MMMM LT',	'Do MMMM LTS',	'Do MMMM HH:mm',	'Do MMMM hh:mm a',
	'D MMM LT',		'D MMM LTS',	'D MMM HH:mm',		'D MMM hh:mm a',
	'D MMMM LT',	'D MMMM LTS',	'D MMMM HH:mm',		'D MMMM hh:mm a',
	'MMM Do LT',	'MMM Do LTS',	'MMM Do HH:mm',		'MMM Do hh:mm a',
	'MMMM Do LT',	'MMMM Do LTS',	'MMMM Do HH:mm',	'MMMM Do hh:mm a',
	'MMM D LT',		'MMM D LTS',	'MMM D HH:mm',		'MMM D hh:mm a',
	'MMMM D LT',	'MMMM D LTS',	'MMMM D HH:mm',		'MMMM D hh:mm a'
	];

	function momentsEqual(moment1, moment2) {
		return moment1.month() === moment2.month() &&
		moment1.weekday() === moment2.weekday() &&
		moment1.date() === moment2.date() &&
		moment1.hour() === moment2.hour() &&
		moment1.minute() === moment2.minute();
	}

	describe('2025-10-11 20:30:17.156', () => {
		beforeAll(() => {
			vi.setSystemTime(new Date('2025-10-11T20:30:17.156'));
		});

		const now = moment('2025-10-11 20:30:17.156');

		test('test_trigger_times_0', () => {
			const event = moment("8:30 PM", formats);
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("8:31 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_1', () => {
			const event = moment("8:30:00 PM", formats);
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("8:31:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_2', () => {
			const event = moment("20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("20:31", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_3', () => {
			const event = moment("08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("08:31 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_4', () => {
			const event = moment("Sat 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Sun 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_5', () => {
			const event = moment("Sat 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Sun 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_6', () => {
			const event = moment("Sat 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Sun 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_7', () => {
			const event = moment("Sat 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Sun 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_8', () => {
			const event = moment("Saturday 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Sunday 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_9', () => {
			const event = moment("Saturday 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Sunday 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_10', () => {
			const event = moment("Saturday 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Sunday 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_11', () => {
			const event = moment("Saturday 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Sunday 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_12', () => {
			const event = moment("11th 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("12th 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_13', () => {
			const event = moment("11th 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("12th 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_14', () => {
			const event = moment("11th 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("12th 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_15', () => {
			const event = moment("11th 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("12th 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_16', () => {
			const event = moment("11th Oct 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("12th Oct 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_17', () => {
			const event = moment("11th Oct 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("11th Nov 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_18', () => {
			const event = moment("11th Oct 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("11th May 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_19', () => {
			const event = moment("11th Oct 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("11th Aug 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_20', () => {
			const event = moment("11th October 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("11th Novermber 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_21', () => {
			const event = moment("11th October 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("12th October 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_22', () => {
			const event = moment("11th October 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("11th August 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_23', () => {
			const event = moment("11th October 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("11th January 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_24', () => {
			const event = moment("11 Oct 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("11 Jan 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_25', () => {
			const event = moment("11 Oct 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("10 Oct 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_26', () => {
			const event = moment("11 Oct 20:30", formats);
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("10 Oct 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_27', () => {
			const event = moment("11 Oct 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("4 Oct 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_28', () => {
			const event = moment("11 October 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("04 October 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_29', () => {
			const event = moment("11 October 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("11 January 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_30', () => {
			const event = moment("11 October 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("12 December 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_31', () => {
			const event = moment("11 October 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("1 October 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_32', () => {
			const event = moment("Oct 11th 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Oct 10th 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_33', () => {
			const event = moment("Oct 11th 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Oct 12th 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_34', () => {
			const event = moment("Oct 11th 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Jan 11th 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_35', () => {
			const event = moment("Oct 11th 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Jan 11th 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_36', () => {
			const event = moment("October 11th 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("January 11th 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_37', () => {
			const event = moment("October 11th 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("October 12th 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_38', () => {
			const event = moment("October 11th 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("December 11th 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_39', () => {
			const event = moment("October 11th 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("February 14th 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});
	});

	describe('2025-03-01 20:30:17.156', () => {
		beforeAll(() => {
			vi.setSystemTime(new Date('2025-03-01T20:30:17.156'));
		});

		const now = moment('2025-03-01 20:30:17.156');

		test('test_trigger_times_40', () => {
			const event = moment("Mar 1 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Feb 29 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_41', () => {
			const event = moment("Mar 1 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Feb 29 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_42', () => {
			const event = moment("Mar 1 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Feb 29 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_43', () => {
			const event = moment("Mar 1 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("Feb 29 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_44', () => {
			const event = moment("March 1 8:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("February 29 8:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_45', () => {
			const event = moment("March 1 8:30:00 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("February 29 8:30:00 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_46', () => {
			const event = moment("March 1 20:30", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("February 29 20:30", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});

		test('test_trigger_times_47', () => {
			const event = moment("March 1 08:30 PM", formats);	
			expect(momentsEqual(now, event)).toBeTruthy();

			const badEvent = moment("February 29 08:30 PM", formats);
			expect(momentsEqual(now, badEvent)).not.toBeTruthy();
		});
	})
});