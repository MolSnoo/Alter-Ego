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
		const text = `<s>Sentence.</s> <procedural><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single unnamed 100 chance procedural', () => {
		const text = `<s>Sentence.</s> <procedural chance="100"><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed NaN chance procedural', () => {
		const text = `<s>Sentence.</s> <procedural chance="aaaaaa"><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed empty chance procedural', () => {
		const text = `<s>Sentence.</s> <procedural chance=""><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed -100 chance procedural', () => {
		const text = `<s>Sentence.</s> <procedural chance="-100"><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed 200 chance procedural', () => {
		const text = `<s>Sentence.</s> <procedural chance="200"><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single unnamed 50 chance procedural', () => {
		const text = `<s>Sentence.</s> <procedural chance="50"><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 5000);
		expected.set(`<s>Sentence.</s>`, 5000)

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('single unnamed 5 chance procedural', () => {
		const text = `<s>Sentence.</s> <procedural chance="5"><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 500);
		expected.set(`<s>Sentence.</s>`, 9500);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('single unnamed 0.5 chance procedural', () => {
		const text = `<s>Sentence.</s> <procedural chance="0.5"><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 50);
		expected.set(`<s>Sentence.</s>`, 9950);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('single unnamed 99.9 chance procedural', () => {
		const text = `<s>Sentence.</s> <procedural chance="99.9"><poss><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 9990);
		expected.set(`<s>Sentence.</s>`, 10);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('two unnamed 50-50 chance procedurals', () => {
		const text = `<s>Sentence.</s> <procedural chance="50"><poss><s>Possibility 1.</s></poss></procedural> <procedural chance="50"><poss><s>Possibility 2.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 2.</s>`, 2500);
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 2500);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 2500);
		expected.set(`<s>Sentence.</s>`, 2500);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('two unnamed 75-25 chance procedurals', () => {
		const text = `<s>Sentence.</s> <procedural chance="75"><poss><s>Possibility 1.</s></poss></procedural> <procedural chance="25"><poss><s>Possibility 2.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 2.</s>`, 1875);
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 5625);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 625);
		expected.set(`<s>Sentence.</s>`, 1875);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('two unnamed 75-0 chance procedurals', () => {
		const text = `<s>Sentence.</s> <procedural chance="75"><poss><s>Possibility 1.</s></poss></procedural> <procedural chance="0"><poss><s>Possibility 2.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 7500);
		expected.set(`<s>Sentence.</s>`, 2500);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('two unnamed 1-NaN chance procedurals', () => {
		const text = `<s>Sentence.</s> <procedural chance="1"><poss><s>Possibility 1.</s></poss></procedural> <procedural chance="apple"><poss><s>Possibility 2.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 2.</s>`, 100);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 9900);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});
	
	test('single chanceless procedural with two possibilities with selections lowercase', () => {
		const text = `<s>Sentence.</s> <procedural name="p1"><poss name="a1"><s>Possibility 1.</s></poss><poss name="a2"><s>Possibility 2.</s></poss></procedural>`;
		proceduralSelections = new Map([["p1", "a1"]]);
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	test('single chanceless procedural with two possibilities with selections uppercase', () => {
		const text = `<s>Sentence.</s> <procedural name="P1"><poss name="A1"><s>Possibility 1.</s></poss><poss name="A2"><s>Possibility 2.</s></poss></procedural>`;
		proceduralSelections = new Map([["p1", "a1"]]);
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);
		
		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
	
	describe('two identically named procedurals P1 with one shared possibility name A1 and one unique named possibility A2, A4', () => {
		const text = `<s>Sentence.</s> <procedural name="P1"><poss name="A1"><s>Possibility 1.</s></poss><poss name="A2"><s>Possibility 2.</s></poss></procedural> <procedural name="P1"><poss name="A1"><s>Possibility 3.</s></poss><poss name="A4"><s>Possibility 4.</s></poss></procedural>`;

		test('select P1 = A1', () => {
			proceduralSelections = new Map([["p1", "a1"]]);
			expected.set(`<s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 3.</s>`, 10000);
			
			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBe(expected.get(text));
		});

		test('select P1 = A4', () => {
			proceduralSelections = new Map([["p1", "a4"]]);
			expected.set(`<s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 4.</s>`, 5000);
			expected.set(`<s>Sentence.</s> <s>Possibility 2.</s> <s>Possibility 4.</s>`, 5000);
			
			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});
		
		test('multiple selections for P1', () => {
			proceduralSelections = new Map([["p1", "a1"], ["p1", "a4"]]);
			expected.set(`<s>Sentence.</s> <s>Possibility 1.</s> <s>Possibility 4.</s>`, 5000);
			expected.set(`<s>Sentence.</s> <s>Possibility 2.</s> <s>Possibility 4.</s>`, 5000);
			
			generateActual(text, proceduralSelections);
			expect(actual).toHaveSize(expected.size);
			for (const [text, count] of actual)
				expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
		});
	});
});

describe('test poss tags', () => {
	test('single 100 chance poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="100"><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single NaN chance poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="aaaa"><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single empty chance poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance=""><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single -100 chance poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="-100"><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single 200 chance poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="200"><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single 0 chance poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="0"><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});

	test('single unnamed 50 chance poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 5000);
		expected.set(`<s>Sentence.</s>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('two unnamed 50-chanceless poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss><s>Possibility 2.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 5000);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 5000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed 50-chanceless-chanceless poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 5000);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 2500);
		expected.set(`<s>Sentence.</s> <s>Possibility 3.</s>`, 2500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed 50-25-25 chance poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss chance="25"><s>Possibility 2.</s></poss><poss chance="25"><s>Possibility 3.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 5000);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 2500);
		expected.set(`<s>Sentence.</s> <s>Possibility 3.</s>`, 2500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed 50-25-12.5 chance poss (sum under 100)', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss chance="25"><s>Possibility 2.</s></poss><poss chance="12.5"><s>Possibility 3.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 5000);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 2500);
		expected.set(`<s>Sentence.</s> <s>Possibility 3.</s>`, 1250);
		expected.set(`<s>Sentence.</s>`, 1250);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('four unnamed 50-25-12.5-6.25 chance poss (sum under 100)', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="50"><s>Possibility 1.</s></poss><poss chance="25"><s>Possibility 2.</s></poss><poss chance="12.5"><s>Possibility 3.</s></poss><poss chance="6.25"><s>Possibility 4.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 5000);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 2500);
		expected.set(`<s>Sentence.</s> <s>Possibility 3.</s>`, 1250);
		expected.set(`<s>Sentence.</s> <s>Possibility 4.</s>`, 625);
		expected.set(`<s>Sentence.</s>`, 625);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('four unnamed 10-5 chance with one -1 chance and one chanceless poss (sum under 100)', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="10"><s>Possibility 1.</s></poss><poss chance="-1"><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss><poss chance="5"><s>Possibility 4.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 1000);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 4250);
		expected.set(`<s>Sentence.</s> <s>Possibility 3.</s>`, 4250);
		expected.set(`<s>Sentence.</s> <s>Possibility 4.</s>`, 500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('one 33 chance poss with three chanceless poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="33"><s>Possibility 1.</s></poss><poss><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss><poss><s>Possibility 4.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 3300);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 2233);
		expected.set(`<s>Sentence.</s> <s>Possibility 3.</s>`, 2233);
		expected.set(`<s>Sentence.</s> <s>Possibility 4.</s>`, 2233);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed chanceless poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss><s>Possibility 1.</s></poss><poss><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 3333);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 3333);
		expected.set(`<s>Sentence.</s> <s>Possibility 3.</s>`, 3333);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('three unnamed 66-27.75-6.25 chance poss', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="66"><s>Possibility 1.</s></poss><poss chance="27.75"><s>Possibility 2.</s></poss><poss chance="6.25"><s>Possibility 3.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 6600);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 2775);
		expected.set(`<s>Sentence.</s> <s>Possibility 3.</s>`, 625);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('two unnamed 90-20 poss (sum over 100)', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="90"><s>Possibility 1.</s></poss><poss chance="20"><s>Possibility 2.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 9000);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 1000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('two 90-95 chance poss with one chanceless poss (sum over 100)', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="90"><s>Possibility 1.</s></poss><poss chance="95"><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 500);
		expected.set(`<s>Sentence.</s> <s>Possibility 2.</s>`, 9500);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBeWithinRange(expected.get(text) - acceptableDeviation, expected.get(text) + acceptableDeviation);
	});

	test('two 100-100 chance poss with one chanceless poss (sum over 100)', () => {
		const text = `<s>Sentence.</s> <procedural><poss chance="100"><s>Possibility 1.</s></poss><poss chance="100"><s>Possibility 2.</s></poss><poss><s>Possibility 3.</s></poss></procedural>`;
		expected.set(`<s>Sentence.</s> <s>Possibility 1.</s>`, 10000);

		generateActual(text, proceduralSelections);
		expect(actual).toHaveSize(expected.size);
		for (const [text, count] of actual)
			expect(count).toBe(expected.get(text));
	});
});
