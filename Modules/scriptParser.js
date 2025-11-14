const finder = require('./finder.js');

const acorn = require('acorn');

const OPTIONS = {
	sourceType: 'script',
	ecmaVersion: 2020,

	maxNodes: 20,
	allowCall: true,
	// Expose Math, Date, and finder helpers by default, since those will be most useful.
	allowedGlobals: {
		Math,
		Date,
		finder,
		findRoom: finder.findRoom,
		findObject: finder.findObject,
		findPrefab: finder.findPrefab,
		findItem: finder.findItem,
		findPuzzle: finder.findPuzzle,
		findEvent: finder.findEvent,
		findStatusEffect: finder.findStatusEffect,
		findPlayer: finder.findPlayer,
		findLivingPlayer: finder.findLivingPlayer,
		findDeadPlayer: finder.findDeadPlayer,
		findInventoryItem: finder.findInventoryItem,
		findFlag: finder.findFlag
	},
	allowedConstructors: {
		Date
	},
	blockedProperties: [
		'__proto__',
		'prototype',
		'constructor',
		'addPlayer',
		'removePlayer',
		'joinChannel',
		'leaveChannel',
		'unlock',
		'lock',
		'setAccessible',
		'setInaccessible',
		'activate',
		'deactivate',
		'processRecipes',
		'findRecipe',
		'insertItem',
		'removeItem',
		'solve',
		'unsolve',
		'fail',
		'alreadySolved',
		'requirementsNotMet',
		'trigger',
		'end',
		'startTimer',
		'startEffectsTimer',
		'setPronouns',
		'queueMovement',
		'move',
		'calculateMoveTime',
		'regenerateStamina',
		'createMoveAppendString',
		'inflict',
		'cure',
		'recalculateStats',
		'recalculateStat',
		'use',
		'take',
		'steal',
		'drop',
		'give',
		'stash',
		'unstash',
		'equip',
		'fastEquip',
		'unequip',
		'fastUnequip',
		'craft',
		'uncraft',
		'attemptPuzzle',
		'gesture',
		'die',
		'removeFromWhispers',
		'sendDescription',
		'notify',
		'setOnline',
		'setOffline'
	]
};

const BINARY_OPS = {
	'==': (a, b) => a == b,
	'!=': (a, b) => a != b,
	'===': (a, b) => a === b,
	'!==': (a, b) => a !== b,
	'<': (a, b) => a < b,
	'<=': (a, b) => a <= b,
	'>': (a, b) => a > b,
	'>=': (a, b) => a >= b,
	'+': (a, b) => a + b,
	'-': (a, b) => a - b,
	'*': (a, b) => a * b,
	'/': (a, b) => a / b,
	'%': (a, b) => a % b,
	'**': (a, b) => Math.pow(a, b),
	'in': (a, b) => a in b
};

const UNARY_OPS = {
	'+': a => +a,
	'-': a => -a,
	'!': a => !a
};

// Safely evaluate a single JS-like expression string with restrictions.
module.exports.evaluate = function (scriptText, container, player) {
	// Group together the container and player into a context object.
	const context = {container, player};
	// Add the allowedGlobals to the context object.
	Object.keys(OPTIONS.allowedGlobals).forEach(k => { if (!Object.hasOwn(context, k)) context[k] = OPTIONS.allowedGlobals[k]; });

	let script;
	try {
		script = parseExpression(scriptText.replace(/this/g, "container"));
	}
	catch (err) { throw new Error(`Parse error: ${err.message}`); }

	const evaluatedValue = validateAndEval(script, context, 0);
	if (evaluatedValue !== null && typeof evaluatedValue !== "string" && typeof evaluatedValue !== "number" && typeof evaluatedValue !== "boolean")
		throw new Error(`Value of evaluated script is not a string, number, boolean, or null`);
	return evaluatedValue;
};

function parseExpression(scriptText) {
	// Parse a single expression.
	const script = acorn.parse(scriptText, OPTIONS);
	if (!script || !script.body || script.body.length !== 1 || script.body[0].type !== 'ExpressionStatement')
		throw new Error('Only single expressions are allowed');
	return script.body[0].expression;
}

function isBlockedProp(name) {
	if (!name || typeof name !== 'string') return false;
	// Ensure that sensitive properties cannot be accessed.
	return OPTIONS.blockedProperties.includes(name);
}

function validateAndEval(node, context, nodeCount) {
	nodeCount++;
	if (nodeCount > OPTIONS.maxNodes) throw new Error('Expression too complex');

	switch (node.type) {
		case 'Literal':
			return node.value;
		case 'Identifier':
			if (Object.hasOwn(context, node.name)) return context[node.name];
			throw new Error(`Unknown identifier: ${node.name}`);
		case 'UnaryExpression': {
			if (!UNARY_OPS[node.operator]) throw new Error(`Unsupported unary operator ${node.operator}`);
			const val = validateAndEval(node.argument, context, nodeCount);
			return UNARY_OPS[node.operator](val);
		}
		case 'BinaryExpression': {
			if (!BINARY_OPS[node.operator]) throw new Error(`Unsupported binary operator ${node.operator}`);
			const left = validateAndEval(node.left, context, nodeCount);
			const right = validateAndEval(node.right, context, nodeCount);
			return BINARY_OPS[node.operator](left, right);
		}
		case 'LogicalExpression': {
			if (node.operator === '||') {
				const l = validateAndEval(node.left, context, nodeCount);
				return l ? l : validateAndEval(node.right, context, nodeCount);
			}
			else if (node.operator === '&&') {
				const l = validateAndEval(node.left, context, nodeCount);
				return l ? validateAndEval(node.right, context, nodeCount) : l;
			}
			throw new Error(`Unsupported logical operator ${node.operator}`);
		}
		case 'ConditionalExpression': {
			const test = validateAndEval(node.test, context, nodeCount);
			return test ? validateAndEval(node.consequent, context, nodeCount) : validateAndEval(node.alternate, context, nodeCount);
		}
		case 'MemberExpression': {
			// Only allow access to member properties rooted in a top-level identifier present in context.
			// Don't allow access to blocked property names.
			// Resolve property chain step-by-step.
			let objectNode = node;
			const chain = [];
			// Unwind the chain to get base identifier and property list.
			while (objectNode.type === 'MemberExpression') {
				if (objectNode.computed) {
					// Evaluate the property expression but only allow literals/identifiers.
					const prop = objectNode.property;
					if (prop.type === 'Literal') chain.unshift(prop.value);
					else if (prop.type === 'Identifier') chain.unshift(prop.name);
					else throw new Error('Computed properties must be simple');
				}
				else {
					if (objectNode.property.type !== 'Identifier') throw new Error('Property must be identifier');
					chain.unshift(objectNode.property.name);
				}
				objectNode = objectNode.object;
			}
			let current;
			if (objectNode.type === 'Identifier') {
				const rootName = objectNode.name;
				if (!Object.hasOwn(context, rootName)) throw new Error(`Unknown root identifier: ${rootName}`);
				current = context[rootName];
			}
			else if (objectNode.type === 'CallExpression' && Object.hasOwn(OPTIONS.allowedGlobals, objectNode.callee.name)) {
				// Make an exception to allow the root to be an expression in allowedGlobals.
				current = validateAndEval(objectNode, context, nodeCount);
			}
			for (const prop of chain) {
				if (isBlockedProp(prop)) throw new Error('Access to prototype/constructor is prohibited');
				if (current === null || current === undefined) return undefined;
				current = current[prop];
			}
			return current;
		}
		case 'NewExpression': {
			// Allow calling constructors from allowedConstructors.
			let callee = node.callee;
			let constructor;
			if (callee.type === 'Identifier') {
				if (!Object.hasOwn(OPTIONS.allowedConstructors, callee.name)) throw new Error(`Unknown constructor ${callee.name}`);
				constructor = context[callee.name];
			}
			else {
				throw new Error('Unsupported constructor type');
			}
			if (typeof constructor !== 'function') throw new Error('Constructor is not a function');
			const args = node.arguments.map(arg => validateAndEval(arg, context, nodeCount));
			// Use Reflect.construct to call constructor with args
			return Reflect.construct(constructor, args);
		}
		case 'CallExpression': {
			if (!OPTIONS.allowCall) throw new Error('Function calls are disabled');
			// Only permit calls where the callee is a function available in allowedGlobals.
			// e.g., Math.floor(x) -> callee is MemberExpression with root Math in allowedGlobals.
			let callee = node.callee;
			let fn;
			let thisArg = null;
			if (callee.type === 'Identifier') {
				if (!Object.hasOwn(OPTIONS.allowedGlobals, callee.name)) throw new Error(`Unknown function ${callee.name}`);
				fn = OPTIONS.allowedGlobals[callee.name];
				thisArg = null;
			}
			else if (callee.type === 'MemberExpression') {
				// Resolve member expression but ensure root is in allowedGlobals.
				let objectNode = callee;
				const chain = [];
				// Unwind the chain to get base identifier and property list.
				while (objectNode.type === 'MemberExpression') {
					if (objectNode.computed) {
						// Evaluate the property expression but only allow literals/identifiers.
						const prop = objectNode.property;
						if (prop.type === 'Literal') chain.unshift(prop.value);
						else if (prop.type === 'Identifier') chain.unshift(prop.name);
						else throw new Error('Computed properties must be simple');
					}
					else {
						if (objectNode.property.type !== 'Identifier') throw new Error('Property must be identifier');
						chain.unshift(objectNode.property.name);
					}
					objectNode = objectNode.object;
				}
				// Identify root object for use in `this` references.
				let rootObj;
				if (objectNode.type === 'Identifier') {
					const rootName = objectNode.name;
					if (!Object.hasOwn(context, rootName)) throw new Error(`Unknown root identifier: ${rootName}`);
					rootObj = context[rootName];
				}
				// Allow function calls if the root object is in allowedGlobals or allowedConstructors.
				else if (objectNode.type === 'CallExpression' && Object.hasOwn(OPTIONS.allowedGlobals, objectNode.callee.name) ||
						objectNode.type === 'NewExpression' && Object.hasOwn(OPTIONS.allowedConstructors, objectNode.callee.name)) {
					rootObj = validateAndEval(objectNode, context, nodeCount);
				}
				let owner = rootObj;
				let current = rootObj;
				for (let i = 0; i < chain.length; i++) {
					const prop = chain[i];
					if (isBlockedProp(prop)) throw new Error(`Access to property ${prop} is prohibited`);
					if (current === null || current === undefined) { current = undefined; owner = current; break; }
					owner = current;
					current = current[prop];
				}
				fn = current;
				thisArg = owner;
			}
			else {
				throw new Error('Unsupported callee type');
			}
			if (typeof fn !== 'function') throw new Error('Callee is not a function');
			// Evaluate args before calling the function.
			const args = node.arguments.map(arg => validateAndEval(arg, context, nodeCount));
			// Call with owner as thisArg so instance methods work.
			return fn.apply(thisArg, args);
		}
		case 'ArrayExpression':
			return node.elements.map(el => validateAndEval(el, context, nodeCount));
		case 'ObjectExpression': {
			const obj = {};
			for (const prop of node.properties) {
				if (prop.key.type !== 'Identifier' && prop.key.type !== 'Literal') throw new Error('Object keys must be literal/identifier');
				const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
				obj[key] = validateAndEval(prop.value, context, nodeCount);
			}
			return obj;
		}
		default:
			throw new Error(`Unsupported node type: ${node.type}`);
	}
}
