const constants = include('Configs/constants.json');
const parser = include(`${constants.modulesDir}/parser.js`);

var expected = new Map();
var actual = new Map();
var proceduralSelections = new Map();
const acceptableDeviation = 150;

function generateActual(text, proceduralSelections, player) {
	for (let i = 0; i < 10000; i++) {
		const generatedText = parser.generateProceduralOutput(text, proceduralSelections, player);
		if (actual.has(generatedText))
			actual.set(generatedText, actual.get(generatedText) + 1);
		else actual.set(generatedText, 1);
	}
}

afterEach(() => {
	expected.clear();
	actual.clear();
	proceduralSelections.clear();
});

describe('test procedural tags', () => {
	test('single unnamed chanceless procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single unnamed 100 chance procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="100"><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed NaN chance procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="aaaaaa"><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed empty chance procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance=""><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed -100 chance procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="-100"><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed 200 chance procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="200"><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed 50 chance procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="50"><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s></desc>`, 5000)

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('single unnamed 5 chance procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="5"><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 500);
		expected.set(`<desc><s>Sentence.</s></desc>`, 9500);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('single unnamed 0.5 chance procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="0.5"><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 50);
		expected.set(`<desc><s>Sentence.</s></desc>`, 9950);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('single unnamed 99.9 chance procedural', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="99.9"><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 9990);
		expected.set(`<desc><s>Sentence.</s></desc>`, 10);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('two unnamed 50-50 chance procedurals', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="50"><poss><s>Possibility 1.</s></poss></procedural> <procedural chance="50"><poss><s>Possibility 2.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 2.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s></desc>`, 2500);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual) {
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		}
	});
	
	test('two unnamed 75-25 chance procedurals', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="75"><poss><s>Possibility 1.</s></poss></procedural> <procedural chance="25"><poss><s>Possibility 2.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 2.</s></desc>`, 1875);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5625);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 625);
		expected.set(`<desc><s>Sentence.</s></desc>`, 1875);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('two unnamed 75-0 chance procedurals', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="75"><poss><s>Possibility 1.</s></poss></procedural> <procedural chance="0"><poss><s>Possibility 2.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 7500);
		expected.set(`<desc><s>Sentence.</s></desc>`, 2500);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('two unnamed 1-NaN chance procedurals', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="1"><poss><s>Possibility 1.</s></poss></procedural> <procedural chance="apple"><poss><s>Possibility 2.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 2.</s></desc>`, 100);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 9900);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('single chanceless procedural with two possibilities with selections lowercase', () => {
		const text = `<desc><s>Sentence.</s> <procedural name="p1"><poss name="a1"><s>Possibility 1.</s></poss><poss name="a2"><s>Possibility 2.</s></poss></procedural></desc>`;
		proceduralSelections = new Map([["p1", "a1"]]);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single chanceless procedural with two possibilities with selections uppercase', () => {
		const text = `<desc><s>Sentence.</s> <procedural name="P1"><poss name="A1"><s>Possibility 1.</s></poss><poss name="A2"><s>Possibility 2.</s></poss></procedural></desc>`;
		proceduralSelections = new Map([["p1", "a1"]]);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	describe('two identically named procedurals P1 with one shared possibility name A1 and one unique named possibility A2, A4', () => {
		const text = `<desc><s>Sentence.</s> <procedural name="P1"><poss name="A1"><s>Possibility 1.</s></poss><poss name="A2"><s>Possibility 2.</s></poss></procedural> <procedural name="P1"><poss name="A1"><s>Possibility 3.</s></poss><poss name="A4"><s>Possibility 4.</s></poss></procedural></desc>`;

		test('select P1 = A1', () => {
			proceduralSelections = new Map([["p1", "a1"]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 3.</s></desc>`, 10000);
			
			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});

		test('select P1 = A4', () => {
			proceduralSelections = new Map([["p1", "a4"]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 4.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s> <s>Possibility 4.</s></desc>`, 5000);
			
			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});
		
		test('multiple selections for P1', () => {
			proceduralSelections = new Map([["p1", "a1"], ["p1", "a4"]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 4.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s> <s>Possibility 4.</s></desc>`, 5000);
			
			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});
	});
});

describe('test poss tags', () => {
	test('single 100 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="100"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single NaN chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="aaaa"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single empty chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance=""><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single -100 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="-100"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single 200 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="200"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single 0 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="0"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single unnamed 50 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s></desc>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('two unnamed 50-chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss><s>Possibility 2.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed 50-chanceless-chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 2500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed 50-25-25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss chance="25"><s>Possibility 2.</s></poss><poss chance="25"><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 2500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed 50-25-12.5 chance poss (sum under 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss chance="25"><s>Possibility 2.</s></poss><poss chance="12.5"><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s></desc>`, 1250);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('four unnamed 50-25-12.5-6.25 chance poss (sum under 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss chance="25"><s>Possibility 2.</s></poss><poss chance="12.5"><s>Possibility 3.</s></poss><poss chance="6.25"><s>Possibility 4.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 4.</s></desc>`, 625);
		expected.set(`<desc><s>Sentence.</s></desc>`, 625);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('four unnamed 10-5 chance with one -1 chance and one chanceless poss (sum under 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="10"><s>Possibility 1.</s></poss><poss chance="-1"><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss><poss chance="5"><s>Possibility 4.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 1000);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 4250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 4250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 4.</s></desc>`, 500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('one 33 chance poss with three chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="33"><s>Possibility 1.</s></poss><poss><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss><poss><s>Possibility 4.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 3300);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 2233);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 2233);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 4.</s></desc>`, 2233);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss><s>Possibility 1.</s></poss><poss><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 3333);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 3333);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 3333);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed 66-27.75-6.25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="66"><s>Possibility 1.</s></poss><poss chance="27.75"><s>Possibility 2.</s></poss><poss chance="6.25"><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 6600);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 2775);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 625);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('two unnamed 90-20 poss (sum over 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="90"><s>Possibility 1.</s></poss><poss chance="20"><s>Possibility 2.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 9000);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 1000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('two 90-95 chance poss with one chanceless poss (sum over 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="90"><s>Possibility 1.</s></poss><poss chance="95"><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 9500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('two 100-100 chance poss with one chanceless poss (sum over 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss chance="100"><s>Possibility 1.</s></poss><poss chance="100"><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
});

describe('test combined tags', () => {
	test('single unnamed chanceless procedural with single unnamed chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural><poss><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single unnamed NaN chance procedural with single unnamed NaN chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance=" "><poss chance="aaaaaaa"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single unnamed 100 chance procedural with single unnamed 100 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="100"><poss chance="100"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single 100 chance procedural with single 50 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="100"><poss chance="50"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s></desc>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('single 50 chance procedural with single 50 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="50"><poss chance="50"><s>Possibility 1.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s></desc>`, 7500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('single 50 chance procedural with one 50 chance poss and two chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="50"><poss chance="50"><s>Possibility 1.</s></poss><poss><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s></desc>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('single 50 chance procedural with three 50-25-12.5 chance poss (sum under 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="50"><poss chance="50"><s>Possibility 1.</s></poss><poss chance="25"><s>Possibility 2.</s></poss><poss chance="12.5"><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 625);
		expected.set(`<desc><s>Sentence.</s></desc>`, 5625);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('single 50 chance procedural with three 50-25-12.5 chance poss and two chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="50"><poss chance="50"><s>Possibility 1.</s></poss><poss chance="25"><s>Possibility 2.</s></poss><poss chance="12.5"><s>Possibility 3.</s></poss><poss><s>Possibility 4.</s></poss><poss><s>Possibility 5.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 3.</s></desc>`, 625);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 4.</s></desc>`, 313);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 5.</s></desc>`, 312);
		expected.set(`<desc><s>Sentence.</s></desc>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('single 50 chance procedural with three 90-95-12.5 chance poss (sum over 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="50"><poss chance="90"><s>Possibility 1.</s></poss><poss chance="95"><s>Possibility 2.</s></poss><poss chance="12.5"><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 4750);
		expected.set(`<desc><s>Sentence.</s></desc>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('single 50 chance procedural with three 100-95-110 chance poss (sum over 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="50"><poss chance="100"><s>Possibility 1.</s></poss><poss chance="95"><s>Possibility 2.</s></poss><poss chance="110"><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s></desc>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('single 25 chance procedural with three 99-95-110 chance poss (sum over 100)', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="25"><poss chance="99"><s>Possibility 1.</s></poss><poss chance="95"><s>Possibility 2.</s></poss><poss chance="110"><s>Possibility 3.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 1.</s></desc>`, 2475);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility 2.</s></desc>`, 25);
		expected.set(`<desc><s>Sentence.</s></desc>`, 7500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('two unnamed 50 chance procedurals each with two unnamed 50 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <procedural chance="50"><poss chance="50"><s>Possibility A1.</s></poss><poss chance="50"><s>Possibility A2.</s></poss></procedural> <procedural chance="50"><poss chance="50"><s>Possibility B1.</s></poss><poss chance="50"><s>Possibility B2.</s></poss></procedural></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B1.</s></desc>`, 625);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B2.</s></desc>`, 625);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B1.</s></desc>`, 625);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B2.</s></desc>`, 625);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility B1.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s> <s>Possibility B2.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s></desc>`, 2500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	describe('two named 50 chance procedurals P1 and P2 each with 50 chance poss A1 and A2, and B1 and B2', () => {
		const text = `<desc><s>Sentence.</s> <procedural name="p1" chance="50"><poss name="a1" chance="50"><s>Possibility A1.</s></poss><poss name="a2" chance="50"><s>Possibility A2.</s></poss></procedural> <procedural name="p2" chance="50"><poss name="b1" chance="50"><s>Possibility B1.</s></poss><poss name="b2" chance="50"><s>Possibility B2.</s></poss></procedural></desc>`;

		test('select P1 = unassigned, P2 = unassigned', () => {
			proceduralSelections = new Map([["p1", ""], ["p2", ""]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B1.</s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B2.</s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B1.</s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B2.</s></desc>`, 2500);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P1 = A1, P2 = unassigned', () => {
			proceduralSelections = new Map([["p1", "a1"], ["p2", ""]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B1.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B2.</s></desc>`, 5000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P1 = A2, P2 = unassigned', () => {
			proceduralSelections = new Map([["p1", "a2"], ["p2", ""]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B1.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B2.</s></desc>`, 5000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P1 = unassigned, P2 = B1', () => {
			proceduralSelections = new Map([["p1", ""], ["p2", "b1"]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B1.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B1.</s></desc>`, 5000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P1 = unassigned, P2 = B2', () => {
			proceduralSelections = new Map([["p1", ""], ["p2", "b2"]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B2.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B2.</s></desc>`, 5000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P1 = A1, P2 = B1', () => {
			proceduralSelections = new Map([["p1", "a1"], ["p2", "b1"]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B1.</s></desc>`, 10000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});

		test('select P1 = A2, P2 = B1', () => {
			proceduralSelections = new Map([["p1", "a2"], ["p2", "b1"]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B1.</s></desc>`, 10000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});

		test('select P1 = A1, P2 = B2', () => {
			proceduralSelections = new Map([["p1", "a1"], ["p2", "b2"]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A1.</s> <s>Possibility B2.</s></desc>`, 10000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});

		test('select P1 = A2, P2 = B2', () => {
			proceduralSelections = new Map([["p1", "a2"], ["p2", "b2"]]);
			expected.set(`<desc><s>Sentence.</s> <s>Possibility A2.</s> <s>Possibility B2.</s></desc>`, 10000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});
	});
});

describe('test stat procedurals', () => {
	test('all stats = 5, unassigned stat procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat=""><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 5, dexterity: 5, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Worst.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Bad.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 2500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('strength = 10, strength procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="strength"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 10, intelligence: 5, dexterity: 5, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('strength = 10, str procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="str"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 10, intelligence: 5, dexterity: 5, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('intelligence = 10, intelligence procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="intelligence"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 10, dexterity: 5, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('intelligence = 10, int procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="int"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 10, dexterity: 5, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('dexterity = 10, dexterity procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="dexterity"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 5, dexterity: 10, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('dexterity = 10, dex procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="dex"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 5, dexterity: 10, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('speed = 10, speed procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="speed"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 5, dexterity: 5, speed: 10, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('speed = 10, spd procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="spd"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 5, dexterity: 5, speed: 10, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('stamina = 10, stamina procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="stamina"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 5, dexterity: 5, speed: 5, stamina: 10 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('stamina = 10, sta procedural with three 25 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="sta"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 5, dexterity: 5, speed: 5, stamina: 10 };
		expected.set(`<desc><s>Sentence.</s> <s>Good.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7500);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('strength = 10 & dexterity = 0, one str procedural with two chanceless poss and one dex procedural with two chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="str"><poss>Bad.</poss><poss>Good.</poss></procedural> <procedural stat="dex"><poss>Bad.</poss><poss>Good.</poss></procedural></s></desc>`;
		const player = { strength: 10, intelligence: 5, dexterity: 0, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good. Bad.</s></desc>`, 10000);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('strength = 10 & dexterity = 0, one str procedural with two chanceless poss and one sped procedural with two chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="str"><poss>Bad.</poss><poss>Good.</poss></procedural> <procedural stat="spd"><poss>Bad.</poss><poss>Good.</poss></procedural></s></desc>`;
		const player = { strength: 10, intelligence: 5, dexterity: 0, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Good. Bad.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>Good. Good.</s></desc>`, 5000);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	describe('two str procedurals with four 25 chance poss and two 50 chance poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="str"><poss chance="25">Worst.</poss><poss chance="25">Bad.</poss><poss chance="25">Good.</poss><poss chance="25">Best.</poss></procedural> <procedural stat="str"><poss chance="50">Bad.</poss><poss chance="50">Good.</poss></procedural></s></desc>`;

		test('strength = 10 & dexterity = 0', () => {
			const player = { strength: 10, intelligence: 5, dexterity: 0, speed: 5, stamina: 5 };
			expected.set(`<desc><s>Sentence.</s> <s>Best. Good.</s></desc>`, 7500);
			expected.set(`<desc><s>Sentence.</s> <s>Good. Good.</s></desc>`, 2500);

			generateActual(text, proceduralSelections, player);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('strength = 8 & dexterity = 0', () => {
			const player = { strength: 8, intelligence: 5, dexterity: 0, speed: 5, stamina: 5 };
			expected.set(`<desc><s>Sentence.</s> <s>Best. Good.</s></desc>`, 4400);
			expected.set(`<desc><s>Sentence.</s> <s>Best. Bad.</s></desc>`, 1100);
			expected.set(`<desc><s>Sentence.</s> <s>Good. Good.</s></desc>`, 2800);
			expected.set(`<desc><s>Sentence.</s> <s>Good. Bad.</s></desc>`, 700);
			expected.set(`<desc><s>Sentence.</s> <s>Bad. Good.</s></desc>`, 800);
			expected.set(`<desc><s>Sentence.</s> <s>Bad. Bad.</s></desc>`, 200);

			generateActual(text, proceduralSelections, player);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});
	});

	describe('one int procedural with three 50-25-20 chance poss (sum under 100)', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural stat="int"><poss chance="50">Worst.</poss><poss chance="25">Ok.</poss><poss chance="20">Best.</poss></procedural></s></desc>`;

		test('intelligence = 5', () => {
			const player = { strength: 5, intelligence: 5, dexterity: 5, speed: 5, stamina: 5 };
			expected.set(`<desc><s>Sentence.</s> <s>Worst.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>Ok.</s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 2000);
			expected.set(`<desc><s>Sentence.</s></desc>`, 500);

			generateActual(text, proceduralSelections, player);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('intelligence = 1', () => {
			const player = { strength: 5, intelligence: 1, dexterity: 5, speed: 5, stamina: 5 };
			expected.set(`<desc><s>Sentence.</s> <s>Worst.</s></desc>`, 9000);
			expected.set(`<desc><s>Sentence.</s> <s>Ok.</s></desc>`, 1000);

			generateActual(text, proceduralSelections, player);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('intelligence = 3', () => {
			const player = { strength: 5, intelligence: 3, dexterity: 5, speed: 5, stamina: 5 };
			expected.set(`<desc><s>Sentence.</s> <s>Worst.</s></desc>`, 7000);
			expected.set(`<desc><s>Sentence.</s> <s>Ok.</s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s></desc>`, 500);

			generateActual(text, proceduralSelections, player);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('intelligence = 7', () => {
			const player = { strength: 5, intelligence: 7, dexterity: 5, speed: 5, stamina: 5 };
			expected.set(`<desc><s>Sentence.</s> <s>Worst.</s></desc>`, 3000);
			expected.set(`<desc><s>Sentence.</s> <s>Ok.</s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 4000);
			expected.set(`<desc><s>Sentence.</s></desc>`, 500);

			generateActual(text, proceduralSelections, player);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('intelligence = 10', () => {
			const player = { strength: 5, intelligence: 10, dexterity: 5, speed: 5, stamina: 5 };
			expected.set(`<desc><s>Sentence.</s> <s>Ok.</s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>Best.</s></desc>`, 7000);
			expected.set(`<desc><s>Sentence.</s></desc>`, 500);

			generateActual(text, proceduralSelections, player);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});
	});

	test('all stats = 5, two named str procedurals P1 and P2, respectively with four 25 chance poss and two 50 chance poss, select P1 = worst', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural name="p1" stat="str"><poss name="worst" chance="25">Worst.</poss><poss name="bad" chance="25">Bad.</poss><poss name="good" chance="25">Good.</poss><poss name="best" chance="25">Best.</poss></procedural> <procedural name="p2" stat="str"><poss name="bad" chance="50">Bad.</poss><poss name="good" chance="50">Good.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 5, dexterity: 5, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Worst. Bad.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>Worst. Good.</s></desc>`, 5000);
		proceduralSelections = new Map([["p1", "worst"]]);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('all stats = 5, two named str procedurals P1 and P2, respectively with four 25 chance poss and two 50 chance poss, select P1 = worst & P2 = good', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural name="p1" stat="str"><poss name="worst" chance="25">Worst.</poss><poss name="bad" chance="25">Bad.</poss><poss name="good" chance="25">Good.</poss><poss name="best" chance="25">Best.</poss></procedural> <procedural name="p2" stat="str"><poss name="bad" chance="50">Bad.</poss><poss name="good" chance="50">Good.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 5, dexterity: 5, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Worst. Good.</s></desc>`, 10000);
		proceduralSelections = new Map([["p1", "worst"], ["p2", "good"]]);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('intelligence = 10, two named str and int procedurals P1 and P2, respectively with four 25 chance poss and two 50 chance poss, select P1 = worst', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural name="p1" stat="str"><poss name="worst" chance="25">Worst.</poss><poss name="bad" chance="25">Bad.</poss><poss name="good" chance="25">Good.</poss><poss name="best" chance="25">Best.</poss></procedural> <procedural name="p2" stat="int"><poss name="bad" chance="50">Bad.</poss><poss name="good" chance="50">Good.</poss></procedural></s></desc>`;
		const player = { strength: 5, intelligence: 10, dexterity: 5, speed: 5, stamina: 5 };
		expected.set(`<desc><s>Sentence.</s> <s>Worst. Good.</s></desc>`, 10000);
		proceduralSelections = new Map([["p1", "worst"]]);

		generateActual(text, proceduralSelections, player);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
});

describe('test nested procedurals', () => {
	test('procedural P1 with one chanceless poss and nested procedural P2 with two chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural name="p1"><poss name="a1">A1.</poss> <procedural name="p2"><poss name="b1">B1.</poss><poss name="b2">B2.</poss></procedural></procedural></s></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>A1. B1.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>A1. B2.</s></desc>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('procedural P1 with two chanceless poss and nested procedural P2 with two chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural name="p1"><poss name="a1">A1.</poss><poss name="a2">A2.</poss> <procedural name="p2"><poss name="b1">B1.</poss><poss name="b2">B2.</poss></procedural></procedural></s></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>A1. B1.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>A1. B2.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>A2. B1.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>A2. B2.</s></desc>`, 2500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('50 chance procedural P1 with one chanceless poss and nested 50 chance procedural P2 with two chanceless poss', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural name="p1" chance="50"><poss name="a1">A1.</poss> <procedural name="p2" chance="50"><poss name="b1">B1.</poss><poss name="b2">B2.</poss></procedural></procedural></s></desc>`;
		expected.set(`<desc><s>Sentence.</s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>A1. </s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>A1. B1.</s></desc>`, 1250);
		expected.set(`<desc><s>Sentence.</s> <s>A1. B2.</s></desc>`, 1250);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('50 chance procedural P1 with one chanceless poss and 50 chance procedural P2 with two chanceless poss, select P1 = A1', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural name="p1" chance="50"><poss name="a1">A1.</poss> <procedural name="p2" chance="50"><poss name="b1">B1.</poss><poss name="b2">B2.</poss></procedural></procedural></s></desc>`;
		expected.set(`<desc><s>Sentence.</s> <s>A1. </s></desc>`, 5000);
		expected.set(`<desc><s>Sentence.</s> <s>A1. B1.</s></desc>`, 2500);
		expected.set(`<desc><s>Sentence.</s> <s>A1. B2.</s></desc>`, 2500);
		proceduralSelections = new Map([["p1", "a1"]]);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	describe('50 chance procedural P1 with nested 50 chance procedural P2 with nested 50 chance procedural P3', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural name="p1" chance="50"><poss name="a1">P1.</poss> <procedural name="p2" chance="50"><poss name="a2">P2.</poss> <procedural name="p3" chance="50"><poss name="a3">P3.</poss></procedural></procedural></procedural></s></desc>`;

		test('no selections', () => {
			expected.set(`<desc><s>Sentence.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>P1. </s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>P1. P2. </s></desc>`, 1250);
			expected.set(`<desc><s>Sentence.</s> <s>P1. P2. P3.</s></desc>`, 1250);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P1 = A1', () => {
			proceduralSelections = new Map([["p1", "a1"]]);
			expected.set(`<desc><s>Sentence.</s> <s>P1. </s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>P1. P2. </s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>P1. P2. P3.</s></desc>`, 2500);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P2 = A2', () => {
			proceduralSelections = new Map([["p2", "a2"]]);
			expected.set(`<desc><s>Sentence.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>P1. P2. </s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>P1. P2. P3.</s></desc>`, 2500);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P3 = A3', () => {
			proceduralSelections = new Map([["p3", "a3"]]);
			expected.set(`<desc><s>Sentence.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>P1. </s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>P1. P2. P3.</s></desc>`, 2500);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P2 = A2 & P3 = A3', () => {
			proceduralSelections = new Map([["p2", "a2"], ["p3", "a3"]]);
			expected.set(`<desc><s>Sentence.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>P1. P2. P3.</s></desc>`, 5000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P1 = A1 & P3 = A3', () => {
			proceduralSelections = new Map([["p1", "a1"], ["p3", "a3"]]);
			expected.set(`<desc><s>Sentence.</s> <s>P1. </s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>P1. P2. P3.</s></desc>`, 5000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});
	});

	describe('50 chance procedural P1 with poss A1 and A2, with 50 chance procedural P2 containing poss B1 and B2 nested inside A1', () => {
		const text = `<desc><s>Sentence.</s> <s><procedural name="p1" chance="50"><poss name="a1">A1.<procedural name="p2" chance="50"><poss name="b1"> B1.</poss><poss name="b2"> B2.</poss></procedural></poss><poss name="a2">A2.</poss></procedural></s></desc>`;

		test('no selections', () => {
			expected.set(`<desc><s>Sentence.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>A1.</s></desc>`, 1250);
			expected.set(`<desc><s>Sentence.</s> <s>A1. B1.</s></desc>`, 625);
			expected.set(`<desc><s>Sentence.</s> <s>A1. B2.</s></desc>`, 625);
			expected.set(`<desc><s>Sentence.</s> <s>A2.</s></desc>`, 2500);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P2 = B1', () => {
			proceduralSelections = new Map([["p2","b1"]]);
			expected.set(`<desc><s>Sentence.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>A1. B1.</s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>A2.</s></desc>`, 2500);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P1 = A2 & P2 = B1', () => {
			proceduralSelections = new Map([["p1", "a2"], ["p2","b1"]]);
			expected.set(`<desc><s>Sentence.</s> <s>A2.</s></desc>`, 10000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});

		test('select P1 = A1', () => {
			proceduralSelections = new Map([["p1", "a1"]]);
			expected.set(`<desc><s>Sentence.</s> <s>A1.</s></desc>`, 5000);
			expected.set(`<desc><s>Sentence.</s> <s>A1. B1.</s></desc>`, 2500);
			expected.set(`<desc><s>Sentence.</s> <s>A1. B2.</s></desc>`, 2500);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});

		test('select P1 = A1 & P2 = B2', () => {
			proceduralSelections = new Map([["p1", "a1"], ["p2", "b2"]]);
			expected.set(`<desc><s>Sentence.</s> <s>A1. B2.</s></desc>`, 10000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});
	});

	describe('photo with multiple procedurals and poss', () => {
		const text = `<desc><s>This is a <procedural name="finish"><poss name="glossy" chance="0">glossy</poss><poss name="matte" chance="0">matte</poss><poss name="blank" chance="100">blank</poss></procedural> photo.</s> <procedural name="description" chance="0"><poss name="true"><s>It shows <procedural name="subject"><poss name="vivian">Vivian</poss><poss name="kyra">Kyra</poss></procedural> striking a <procedural name="pose"><poss name="serious">serious</poss><poss name="silly">silly</poss></procedural> pose in front of a <procedural name="background"><poss name="green">green</poss><poss name="blue">blue</poss></procedural> background.</s></poss></procedural></desc>`;

		test('no selections', () => {
			expected.set(`<desc><s>This is a blank photo.</s></desc>`, 10000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});

		test('select finish = glossy & subject = kyra (description is not set)', () => {
			proceduralSelections = new Map([["finish", "glossy"], ["subject", "kyra"]]);
			expected.set(`<desc><s>This is a glossy photo.</s></desc>`, 10000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});

		test('select finish = glossy & description = true & subject = kyra & pose = silly & background = blue', () => {
			proceduralSelections = new Map([["finish", "glossy"], ["description", "true"], ["subject", "kyra"], ["pose", "silly"], ["background", "blue"]]);
			expected.set(`<desc><s>This is a glossy photo.</s> <s>It shows Kyra striking a silly pose in front of a blue background.</s></desc>`, 10000);

			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});
	});
});
