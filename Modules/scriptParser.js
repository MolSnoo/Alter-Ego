import * as finder from './finder.js';
import * as helpers from './helpers.js';

import { parse as parseScript } from 'acorn';

/** @typedef {import('../Data/GameEntity.js').default} GameEntity */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {import('acorn').Options} */
const PARSER_OPTIONS = {
	sourceType: 'script',
	ecmaVersion: 2020
};

const SCRIPT_SCOPE_OPTIONS = {
	maxNodes: 20,
	allowCall: true,
	// Expose useful helpers by default.
	allowedGlobals: {
		Date,
		Number,
		isNaN,
		parseFloat,
		parseInt,
		Math,
		undefined,
		findRoom: finder.findRoom,
		findFixture: finder.findFixture,
		findObject: finder.findFixture,
		findPrefab: finder.findPrefab,
		findRoomItem: finder.findRoomItem,
		findItem: finder.findRoomItem,
		findPuzzle: finder.findPuzzle,
		findEvent: finder.findEvent,
		findStatusEffect: finder.findStatusEffect,
		findPlayer: finder.findPlayer,
		findLivingPlayer: finder.findLivingPlayer,
		findDeadPlayer: finder.findDeadPlayer,
		findInventoryItem: finder.findInventoryItem,
		findGesture: finder.findGesture,
		findFlag: finder.findFlag,
		findRooms: finder.findRooms,
		findFixtures: finder.findFixtures,
		findObjects: finder.findFixtures,
		findPrefabs: finder.findPrefabs,
		findRoomItems: finder.findRoomItems,
		findItems: finder.findRoomItems,
		findPuzzles: finder.findPuzzles,
		findEvents: finder.findEvents,
		findStatusEffects: finder.findStatusEffects,
		findLivingPlayers: finder.findLivingPlayers,
		findDeadPlayers: finder.findDeadPlayers,
		findInventoryItems: finder.findInventoryItems,
		findGestures: finder.findGestures,
		findFlags: finder.findFlags,
		getRandomString: helpers.getRandomString
	},
	allowedConstructors: {
		Date
	},
	blockedProperties: [
		'__proto__',
		'prototype',
		'constructor',
		'game',
		'guildContext',
		'botContext',
		'settings',
		'constants',
		'inProgress',
		'canJoin',
		'halfTimer',
		'endTimer',
		'editMode',
		'messageQueue',
		'dialogCache',
		'setBotContext',
		'channel',
		'addPlayer',
		'removePlayer',
		'joinChannel',
		'leaveChannel',
		'unlock',
		'lock',
		'recipeInterval',
		'setAccessible',
		'setInaccessible',
		'activate',
		'deactivate',
		'processRecipes',
		'stop',
		'findRecipe',
		'setPrefab',
		'initializeInventory',
		'decreaseUses',
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
		'directEquip',
		'unequip',
		'directUnequip',
		'craft',
		'uncraft',
		'attemptPuzzle',
		'gesture',
		'die',
		'removeFromWhispers',
		'sendDescription',
		'setDescription',
		'notify',
		'setOnline',
		'setOffline',
		'evaluate',
		'setValue',
		'clearValue'
	],
	blockedMutators: [
		'set',
		'delete',
		'clear',
		'push',
		'pop',
		'shift',
		'unshift',
		'splice',
		'sort',
		'reverse',
		'fill',
		'copyWithin'
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

/**
 * Safely evaluate a single JS-like expression string with restrictions.
 * @param {string} scriptText - The script to evaluate.
 * @param {GameEntity} container - The game entity this script is attached to.
 * @param {Player|PseudoPlayer} [player] - The player currently in scope.
 * @returns {string | number | boolean}
 */
export default function evaluate (scriptText, container, player) {
	/**
	 * Group together the container and player into a context object.
	 * @type {ScriptEvaluationContext}
	 */
	const context = {container, player};
	// Add the allowedGlobals to the context object.
	Object.keys(SCRIPT_SCOPE_OPTIONS.allowedGlobals).forEach(k => { if (!Object.hasOwn(context, k)) context[k] = SCRIPT_SCOPE_OPTIONS.allowedGlobals[k]; });

	let script;
	try {
		script = parseExpression(scriptText);
	}
	catch (err) { throw new Error(`Parse error: ${err.message}`); }

	const evaluatedValue = validateAndEval(script, context, 0);
	if (evaluatedValue !== null && typeof evaluatedValue !== "string" && typeof evaluatedValue !== "number" && typeof evaluatedValue !== "boolean")
		throw new Error(`Value of evaluated script is not a string, number, boolean, or null`);
	return evaluatedValue;
}

/**
 * Converts a script from plain text into an evaluatable expression.
 * @param {string} scriptText - The script to convert. 
 * @returns {import('acorn').Expression}
 */
function parseExpression(scriptText) {
	// Parse a single expression.
	const script = parseScript(scriptText, PARSER_OPTIONS);
	if (!script || !script.body || script.body.length !== 1 || script.body[0].type !== 'ExpressionStatement')
		throw new Error('Only single expressions are allowed');
	const expr = script.body[0].expression;
	replaceThisExpressions(expr);
	replaceFinderCallArguments(expr);
	return expr;
}

/**
 * Replace ThisExpression nodes with `container` Identifier nodes so that the `this` keyword is mapped to `container`.
 * @param {any} node
 */
function replaceThisExpressions(node) {
	if (!node || typeof node !== 'object') return;
	if (node.type === 'ThisExpression') {
		node.type = 'Identifier';
		node.name = 'container';
		delete node.object;
		delete node.property;
		delete node.callee;
		delete node.arguments;
		return;
	}
	for (const key of Object.keys(node)) {
		const child = node[key];
		if (Array.isArray(child)) {
			for (const c of child) replaceThisExpressions(c);
		} else if (child && typeof child === 'object') {
			replaceThisExpressions(child);
		}
	}
}

/**
 * Modify calls to finder functions to automatically insert the container into the function's arguments.
 * @param {any} node 
 */
function replaceFinderCallArguments(node) {
	if (!node || typeof node !== 'object') return;
	if (node.type === 'CallExpression') {
		const args = node.arguments ? node.arguments : [];
		const finderRegex = /find(Room(Item)s??|Fixtures?|Objects?|Prefabs?|Items?|Puzzles?|Events?|StatusEffects?|Player|LivingPlayers?|DeadPlayers?|InventoryItems?|Gestures?|Flags?)/;
		if (finderRegex.test(node.callee.name)) {
			if (!args || args.length === 0 || !(args[0].type === 'Identifier' && args[0].name === 'container')) {
				node.arguments.splice(0, 0, { type: 'Identifier', name: 'container' });
				return;
			}
		}
	}
	for (const key of Object.keys(node)) {
		const child = node[key];
		if (Array.isArray(child)) {
			for (const c of child) replaceFinderCallArguments(c);
		} else if (child && typeof child === 'object') {
			replaceFinderCallArguments(child);
		}
	}
}

/**
 * Returns true if the name of the property is blocked from being accessed.
 * @param {string} name - The name of the property. 
 */
function isBlockedProp(name) {
	if (!name || typeof name !== 'string') return false;
	// Ensure that sensitive properties cannot be accessed.
	return SCRIPT_SCOPE_OPTIONS.blockedProperties.includes(name);
}

const proxyCache = new WeakMap();
/**
 * Create read-only proxies for objects so script evaluation cannot modify them.
 * @param {import('acorn').Node} val 
 */
function makeReadOnly(val) {
	if (val === null) return null;
	if (typeof val !== 'object' && typeof val !== 'function') return val;
	if (proxyCache.has(val)) return proxyCache.get(val);

	/** @type {ScriptProxyHandler} */
	const handler = {
		get(targetObject, propKey, thisReceiver) {
			const prop = Reflect.get(targetObject, propKey, thisReceiver);
			if (typeof prop === 'function') {
				// Block known mutating methods by name to keep the proxy read-only.
				const methodName = typeof propKey === 'symbol' ? propKey.toString() : String(propKey);
				if (SCRIPT_SCOPE_OPTIONS.blockedMutators.includes(methodName)) {
					return function() { throw new Error('Mutation prohibited'); };
				}
				/** @param {any[]} args */
				return function(...args) {
					// Call original function with the original target as `this` so Maps and Collections work correctly.
					return prop.apply(targetObject, args);
				};
			}
			return makeReadOnly(prop);
		},
		set() { throw new Error('Mutation prohibited'); },
		deleteProperty() { throw new Error('Mutation prohibited'); },
		defineProperty() { throw new Error('Mutation prohibited'); },
		setPrototypeOf() { throw new Error('Mutation prohibited'); },
		// Expose basic Reflect traps.
		has(targetObject, propKey) { return Reflect.has(targetObject, propKey); },
		ownKeys(targetObject) { return Reflect.ownKeys(targetObject); },
		getOwnPropertyDescriptor(targetObject, propKey) { return Reflect.getOwnPropertyDescriptor(targetObject, propKey); },
		getPrototypeOf(targetObject) { return Reflect.getPrototypeOf(targetObject); }
	};

	const proxy = new Proxy(val, handler);
	proxyCache.set(val, proxy);
	// Allow handler get method to find the proxy for a given target.
	proxyCache.set(proxy, proxy);
	return proxy;
}

/**
 * Recursively validates and evaluates a script expression.
 * @param {any} node - The node to evaluate. 
 * @param {ScriptEvaluationContext} context - Variables in the script's context.
 * @param {number} nodeCount - The total number of nodes that have been traversed since we began evaluating.
 * @returns 
 */
function validateAndEval(node, context, nodeCount) {
	nodeCount++;
	if (nodeCount > SCRIPT_SCOPE_OPTIONS.maxNodes) throw new Error('Expression too complex');

	switch (node.type) {
		case 'Literal':
			return node.value;
		case 'Identifier':
				if (Object.hasOwn(context, node.name)) return makeReadOnly(context[node.name]);
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
			else if (objectNode.type === 'CallExpression' && Object.hasOwn(SCRIPT_SCOPE_OPTIONS.allowedGlobals, objectNode.callee.name)) {
				// Make an exception to allow the root to be an expression in allowedGlobals.
				current = validateAndEval(objectNode, context, nodeCount);
			}
			for (const prop of chain) {
				if (isBlockedProp(prop)) throw new Error('Access prohibited');
				if (current === null || current === undefined) return undefined;
				current = current[prop];
			}
				return makeReadOnly(current);
		}
		case 'NewExpression': {
			// Allow calling constructors from allowedConstructors.
			let callee = node.callee;
			let constructor;
			if (callee.type === 'Identifier') {
				if (!Object.hasOwn(SCRIPT_SCOPE_OPTIONS.allowedConstructors, callee.name)) throw new Error(`Unknown constructor ${callee.name}`);
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
			if (!SCRIPT_SCOPE_OPTIONS.allowCall) throw new Error('Function calls are disabled');
			// Only permit calls where the callee is a function available in allowedGlobals.
			// e.g., Math.floor(x) -> callee is MemberExpression with root Math in allowedGlobals.
			let callee = node.callee;
			let fn;
			let thisArg = null;
			if (callee.type === 'Identifier') {
				if (!Object.hasOwn(SCRIPT_SCOPE_OPTIONS.allowedGlobals, callee.name)) throw new Error(`Unknown function ${callee.name}`);
				fn = SCRIPT_SCOPE_OPTIONS.allowedGlobals[callee.name];
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
				else if (objectNode.type === 'CallExpression' && Object.hasOwn(SCRIPT_SCOPE_OPTIONS.allowedGlobals, objectNode.callee.name) ||
						objectNode.type === 'NewExpression' && Object.hasOwn(SCRIPT_SCOPE_OPTIONS.allowedConstructors, objectNode.callee.name)) {
					rootObj = validateAndEval(objectNode, context, nodeCount);
				}
				let owner = rootObj;
				let current = rootObj;
				for (let i = 0; i < chain.length; i++) {
					const prop = chain[i];
					if (isBlockedProp(prop)) throw new Error(`Access prohibited`);
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
			const result = fn.apply(thisArg, args);
			return makeReadOnly(result);
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
