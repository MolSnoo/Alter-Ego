// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { AnyNode, Super } from 'acorn';
import type GameEntity from '../Data/GameEntity.ts';
import type Player from '../Data/Player.ts';
import * as finder from './finder.js';
import * as helpers from './helpers.ts';
import { parse as parseScript } from 'acorn';
import type { Expression, Options } from 'acorn';

const PARSER_OPTIONS: Options = {
    sourceType: 'script',
    ecmaVersion: 2020
};

export const SCRIPT_SCOPE_OPTIONS = {
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
        // This is a temporary error, and will exist so long as we do not do strict null checks in TypeScript.
        // @ts-ignore-error
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
        findRecipes: finder.findRecipes,
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
        round: helpers.round,
        divide: helpers.divide,
        clamp: helpers.clamp,
        getRandomNumber: helpers.getRandomNumber,
        getRandomString: helpers.getRandomString,
        doWithChance: helpers.doWithChance,
        doWithChanceModifiedByPlayerStatus: helpers.doWithChanceModifiedByPlayerStatus,
        generateListString: helpers.generateListString,
        makeCopyable: helpers.makeCopyable,
        capitalizeFirstLetter: helpers.capitalizeFirstLetter,
        endsWithPunctuation: helpers.endsWithPunctuation
    },
    allowedConstructors: {
        Date
    },
    blockedProperties: [
        '__proto__',
        'prototype',
        'constructor',
        'getGame',
        'game',
        'guildContext',
        'clientContext',
        'settings',
        'constants',
        'inProgress',
        'canJoin',
        'halfTimer',
        'endTimer',
        'editMode',
        'communicationHandler',
        'entityLoader',
        'entitySaver',
        'logHandler',
        'errorMessageGenerator',
        'notificationGenerator',
        'narrationHandler',
        'movementHandler',
        'loadedEntitiesWithErrors',
        'messageQueue',
        'dialogCache',
        'moderators',
        'setClientContext',
        'channel',
        'addPlayer',
        'removePlayer',
        'joinChannel',
        'leaveChannel',
        'setOccupantsString',
        'unlock',
        'lock',
        'setDest',
        'setRecipeTag',
        'recipeInterval',
        'setAccessible',
        'setInaccessible',
        'setLocation',
        'setChildPuzzle',
        'instantiate',
        'instantiateProducts',
        'destroy',
        'destroyIngredients',
        'activate',
        'deactivate',
        'processRecipes',
        'processRecipe',
        '_clearProcess',
        'clearProcess',
        'stop',
        'findRecipe',
        'deleteWhisper',
        'setNextStage',
        'ingredientsMatch',
        'getIngredientItems',
        'getSatisfactoryProcessCount',
        'isIngredientAndProduct',
        'getIngredientVariableValues',
        'setPrefab',
        'setContainer',
        'setProceduralSelections',
        'setNames',
        'initializeInventory',
        'decreaseUses',
        'insertItem',
        'removeItem',
        'addWeight',
        'subtractWeight',
        'setRow',
        'setParentFixture',
        'checkRequirementsMet',
        'solve',
        'setOutcome',
        'decrementRequiredItemUses',
        'executeSolvedCommands',
        'unsolve',
        'clearOutcome',
        'executeUnsolvedCommands',
        'fail',
        'alreadySolved',
        'checkRequirementsMet',
        'requirementsNotMet',
        'setDuplicatedStatus',
        'setCuredCondition',
        'timer',
        'effectsTimer',
        'trigger',
        'executeTriggeredCommands',
        'end',
        'executeEndedCommands',
        'startTimer',
        'startEffectsTimer',
        'executeEquippedCommands',
        'executeUnequippedCommands',
        'member',
        'notificationChannel',
        'spectateChannel',
        'setPronouns',
        'setInventory',
        'moveTimer',
        'doAfterDelay',
        'stopMoving',
        'startFollowing',
        'stopFollowing',
        'calculateMoveTime',
        'setPos',
        'regenerateStamina',
        'restoreStamina',
        'createMoveAppendString',
        'inflict',
        'cure',
        'recalculateStats',
        'recalculateStat',
        'updateCarryWeight',
        'use',
        'take',
        'steal',
        'drop',
        'give',
        'stash',
        'unstash',
        'equip',
        'directEquip',
        'equipItem',
        'unequip',
        'directUnequip',
        'unequipItem',
        'craft',
        'uncraft',
        'attemptPuzzle',
        'gesture',
        'die',
        'removeFromWhispers',
        'sendDescription',
        'sendRoomDescription',
        'setDescription',
        'notify',
        'setOnline',
        'setOffline',
        'setPlayer',
        'revokeChannelAccess',
        'evaluate',
        'setValue',
        'clearValue',
        'setVariable',
        'parseAndSendTo',
        'setMessage',
        'getLatch',
        'setLatch',
        'clearLatch'
    ],
    blockedMutators: [
        'add',
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
    '==': (a: unknown, b: unknown) => a == b,
    '!=': (a: unknown, b: unknown) => a != b,
    '===': (a: unknown, b: unknown) => a === b,
    '!==': (a: unknown, b: unknown) => a !== b,
    '<': (a: unknown, b: unknown) => a < b,
    '<=': (a: unknown, b: unknown) => a <= b,
    '>': (a: unknown, b: unknown) => a > b,
    '>=': (a: unknown, b: unknown) => a >= b,
    '+': (a: any, b: any) => a + b,
    '-': <T extends number | bigint>(a: T, b: T) => a - b,
    '*': <T extends number | bigint>(a: T, b: T) => a * b,
    '/': <T extends number | bigint>(a: T, b: T) => a / b,
    '%': <T extends number | bigint>(a: T, b: T) => a % b,
    '**': (a: number, b: number) => Math.pow(a, b),
    'in': (a: string | number | symbol, b: object) => a in b
};

const UNARY_OPS = {
    '+': (a: number) => +a,
    '-': (a: number) => -a,
    '!': (a: any) => !a
};

/**
 * Safely evaluate a single JS-like expression string with restrictions.
 * @param scriptText - The script to evaluate.
 * @param container - The game entity this script is attached to.
 * @param player - The player currently in scope.
 */
export default function evaluate(scriptText: string, container: GameEntity, player?: Player): null | string | number | boolean {
    /**
     * Group together the container and player into a context object.
     */
    const context: ScriptEvaluationContext = { container, player };
    // Add the allowedGlobals to the context object.
    Object.keys(SCRIPT_SCOPE_OPTIONS.allowedGlobals).forEach(k => {
        if (!helpers.objectHasKey(context, k)) {
            // @ts-expect-error
            context[k] = SCRIPT_SCOPE_OPTIONS.allowedGlobals[k];
        }
    });

    let script: Expression;
    try {
        script = parseExpression(scriptText);
    }
    catch (err) {
        throw new Error(`Parse error: ${helpers.getErrorMessage(err)}`);
    }

    const evaluatedValue = validateAndEval(script, context, 0);
    if (evaluatedValue === null || typeof evaluatedValue === "string" || typeof evaluatedValue === "number" || typeof evaluatedValue === "boolean")
        // TODO: when strict null checks are enabled, this type assertion can be removed.
        // without the type assertion here, the null check will explode the narrowed type of evaluatedValue back to unknown.
        return evaluatedValue as null | string | number | boolean;
    throw new Error(`Value of evaluated script is not a string, number, boolean, or null`);
}

/**
 * Converts a script from plain text into an evaluatable expression.
 * @param scriptText - The script to convert.
 */
function parseExpression(scriptText: string): Expression {
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
 * @param node
 */
function replaceThisExpressions(node: any) {
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
        const child = node[key as keyof typeof node];
        if (Array.isArray(child)) {
            for (const c of child) replaceThisExpressions(c);
        } else if (child && typeof child === 'object') {
            replaceThisExpressions(child);
        }
    }
}

/**
 * Modify calls to finder functions to automatically insert the container into the function's arguments.
 * @param node
 */
function replaceFinderCallArguments(node: any) {
    if (!node || typeof node !== 'object')
        return;
    if (node.type === 'CallExpression') {
        const args = node.arguments ? node.arguments : [];
        const finderRegex = /find(Room(Item)?s?|Fixtures?|Objects?|Prefabs?|Recipes|Items?|Puzzles?|Events?|StatusEffects?|Player|LivingPlayers?|DeadPlayers?|InventoryItems?|Gestures?|Flags?)/;
        if (finderRegex.test(node.callee.name)) {
            if (!args || args.length === 0 || !(args[0].type === 'Identifier' && args[0].name === 'container')) {
                node.arguments.unshift({ type: 'Identifier', name: 'container' });
                return;
            }
        }
    }
    for (const key of Object.keys(node)) {
        const child = node[key];
        if (Array.isArray(child))
            for (const c of child) replaceFinderCallArguments(c);
        else if (child && typeof child === 'object')
            replaceFinderCallArguments(child);
    }
}

/**
 * Returns true if the name of the property is blocked from being accessed.
 * @param name - The name of the property.
 */
function isBlockedProp(name: string) {
    if (!name || typeof name !== 'string')
        return false;
    // Ensure that sensitive properties cannot be accessed.
    return SCRIPT_SCOPE_OPTIONS.blockedProperties.includes(name);
}

const proxyCache = new WeakMap();
/**
 * Create read-only proxies for objects so script evaluation cannot modify them.
 * @param val
 */
function makeReadOnly(val: unknown) {
    if (val === null)
        return null;
    if (typeof val !== 'object' && typeof val !== 'function')
        return val;
    if (proxyCache.has(val))
        return proxyCache.get(val);

    const handler: ScriptProxyHandler = {
        get(targetObject, propKey, thisReceiver) {
            const prop = Reflect.get(targetObject, propKey, thisReceiver);
            if (typeof prop === 'function') {
                // Block known mutating methods by name to keep the proxy read-only.
                const methodName = typeof propKey === 'symbol' ? propKey.toString() : String(propKey);
                if (SCRIPT_SCOPE_OPTIONS.blockedMutators.includes(methodName))
                    return function() {
                        throw new Error('Mutation prohibited');
                    };
                return function (...args: any[]) {
                    // Call original function with the original target as `this` so Maps and Collections work correctly.
                    return prop.apply(targetObject, args);
                };
            }
            return makeReadOnly(prop);
        },
        set() {
            throw new Error('Mutation prohibited');
        },
        deleteProperty() {
            throw new Error('Mutation prohibited');
        },
        defineProperty() {
            throw new Error('Mutation prohibited');
        },
        setPrototypeOf() {
            throw new Error('Mutation prohibited');
        },
        // Expose basic Reflect traps.
        has(targetObject, propKey) {
            return Reflect.has(targetObject, propKey);
        },
        ownKeys(targetObject) {
            return Reflect.ownKeys(targetObject);
        },
        getOwnPropertyDescriptor(targetObject, propKey) {
            return Reflect.getOwnPropertyDescriptor(targetObject, propKey);
        },
        getPrototypeOf(targetObject) {
            return Reflect.getPrototypeOf(targetObject);
        }
    };

    const proxy = new Proxy(val, handler);
    proxyCache.set(val, proxy);
    // Allow handler get method to find the proxy for a given target.
    proxyCache.set(proxy, proxy);
    return proxy;
}

/**
 * Recursively validates and evaluates a script expression.
 * @param node - The node to evaluate.
 * @param context - Variables in the script's context.
 * @param nodeCount - The total number of nodes that have been traversed since we began evaluating.
 * @returns
 */
function validateAndEval(node: AnyNode, context: ScriptEvaluationContext, nodeCount: number): unknown {
    if (++nodeCount > SCRIPT_SCOPE_OPTIONS.maxNodes)
        throw new Error('Expression too complex');

    switch (node.type) {
        case 'Literal':
            return node.value;
        case 'Identifier':
            if (helpers.objectHasKey(context, node.name))
                return makeReadOnly(context[node.name]);
            throw new Error(`Unknown identifier: ${node.name}`);
        case 'UnaryExpression': {
            if (!UNARY_OPS[node.operator as keyof typeof UNARY_OPS]) throw new Error(`Unsupported unary operator ${node.operator}`);
            const val = validateAndEval(node.argument, context, nodeCount);
            // @ts-expect-error
            return UNARY_OPS[node.operator as keyof typeof UNARY_OPS](val);
        }
        case 'BinaryExpression': {
            if (!BINARY_OPS[node.operator as keyof typeof BINARY_OPS]) throw new Error(`Unsupported binary operator ${node.operator}`);
            const left = validateAndEval(node.left, context, nodeCount);
            const right = validateAndEval(node.right, context, nodeCount);
            return BINARY_OPS[node.operator as keyof typeof BINARY_OPS](left, right);
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
            let objectNode: Super | Expression = node;
            const chain: (string | number | bigint | boolean | RegExp)[] = [];
            // Unwind the chain to get base identifier and property list.
            while (objectNode.type === 'MemberExpression') {
                if (objectNode.computed) {
                    // Evaluate the property expression but only allow literals/identifiers.
                    const prop = objectNode.property;
                    if (prop.type === 'Literal')
                        chain.unshift(prop.value);
                    else if (prop.type === 'Identifier')
                        chain.unshift(prop.name);
                    else
                        throw new Error('Computed properties must be simple');
                }
                else {
                    if (objectNode.property.type !== 'Identifier')
                        throw new Error('Property must be identifier');
                    chain.unshift(objectNode.property.name);
                }
                objectNode = objectNode.object;
            }
            let current;
            if (objectNode.type === 'Identifier') {
                const rootName = objectNode.name;
                if (!helpers.objectHasKey(context, rootName))
                    throw new Error(`Unknown root identifier: ${rootName}`);
                current = context[rootName as keyof ScriptEvaluationContext];
            }
            // @ts-expect-error
            else if (objectNode.type === 'CallExpression'  && helpers.objectHasKey(SCRIPT_SCOPE_OPTIONS.allowedGlobals, objectNode.callee.name))
                // Make an exception to allow the root to be an expression in allowedGlobals.
                current = validateAndEval(objectNode, context, nodeCount);
            for (const prop of chain) {
                if (isBlockedProp(String(prop)))
                    throw new Error('Access prohibited');
                if (current === null || current === undefined)
                    return undefined;
                // @ts-expect-error
                current = current[prop];
            }
            return makeReadOnly(current);
        }
        case 'NewExpression': {
            // Allow calling constructors from allowedConstructors.
            let callee = node.callee;
            let constructor;
            if (callee.type === 'Identifier') {
                if (!helpers.objectHasKey(SCRIPT_SCOPE_OPTIONS.allowedConstructors, callee.name))
                    throw new Error(`Unknown constructor ${callee.name}`);
                constructor = context[callee.name as keyof ScriptEvaluationContext];
            }
            else
                throw new Error('Unsupported constructor type');
            if (typeof constructor !== 'function')
                throw new Error('Constructor is not a function');
            const args = node.arguments.map((arg: any) => validateAndEval(arg, context, nodeCount));
            // Use Reflect.construct to call constructor with args
            return Reflect.construct(constructor, args);
        }
        case 'CallExpression': {
            if (!SCRIPT_SCOPE_OPTIONS.allowCall)
                throw new Error('Function calls are disabled');
            // Only permit calls where the callee is a function available in allowedGlobals.
            // e.g., Math.floor(x) -> callee is MemberExpression with root Math in allowedGlobals.
            let callee = node.callee;
            let fn;
            let thisArg = null;
            if (callee.type === 'Identifier') {
                if (!helpers.objectHasKey(SCRIPT_SCOPE_OPTIONS.allowedGlobals, callee.name))
                    throw new Error(`Unknown function ${callee.name}`);
                fn = SCRIPT_SCOPE_OPTIONS.allowedGlobals[callee.name];
                thisArg = null;
            }
            else if (callee.type === 'MemberExpression') {
                // Resolve member expression but ensure root is in allowedGlobals.
                let objectNode: Super | Expression = callee;
                const chain = [];
                // Unwind the chain to get base identifier and property list.
                while (objectNode.type === 'MemberExpression') {
                    if (objectNode.computed) {
                        // Evaluate the property expression but only allow literals/identifiers.
                        const prop = objectNode.property;
                        if (prop.type === 'Literal')
                            chain.unshift(prop.value);
                        else if (prop.type === 'Identifier')
                            chain.unshift(prop.name);
                        else
                            throw new Error('Computed properties must be simple');
                    }
                    else {
                        if (objectNode.property.type !== 'Identifier')
                            throw new Error('Property must be identifier');
                        chain.unshift(objectNode.property.name);
                    }
                    objectNode = objectNode.object;
                }
                // Identify root object for use in `this` references.
                let rootObj;
                if (objectNode.type === 'Identifier') {
                    const rootName = objectNode.name;
                    if (!helpers.objectHasKey(context, rootName))
                        throw new Error(`Unknown root identifier: ${rootName}`);
                    rootObj = context[rootName as keyof ScriptEvaluationContext];
                }
                // Allow function calls if the root object is in allowedGlobals or allowedConstructors.
                // @ts-expect-error
                else if (objectNode.type === 'CallExpression' && helpers.objectHasKey(SCRIPT_SCOPE_OPTIONS.allowedGlobals, objectNode.callee?.name) || objectNode.type === 'NewExpression' && helpers.objectHasKey(SCRIPT_SCOPE_OPTIONS.allowedConstructors, objectNode.callee?.name))
                    rootObj = validateAndEval(objectNode, context, nodeCount);
                let owner = rootObj;
                let current = rootObj;
                for (let i = 0; i < chain.length; i++) {
                    const prop = chain[i];
                    if (isBlockedProp(String(prop)))
                        throw new Error(`Access prohibited`);
                    if (current === null || current === undefined) {
                        current = undefined;
                        owner = current; break;
                    }
                    owner = current;
                    // @ts-expect-error
                    current = current[prop];
                }
                fn = current;
                thisArg = owner;
            }
            else
                throw new Error('Unsupported callee type');
            if (typeof fn !== 'function')
                throw new Error('Callee is not a function');
            // Evaluate args before calling the function.
            const args = node.arguments.map((arg: any) => validateAndEval(arg, context, nodeCount));
            const result = fn.apply(thisArg, args);
            return makeReadOnly(result);
        }
        case 'ArrayExpression':
            return node.elements.map((el: any) => validateAndEval(el, context, nodeCount));
        case 'ObjectExpression': {
            const obj: any = {};
            for (const prop of node.properties) {
                if (prop.type === "SpreadElement")
                    throw new Error('Objects must not have a spread element')
                if (prop.key.type !== 'Identifier' && prop.key.type !== 'Literal')
                    throw new Error('Object keys must be literal/identifier');
                let key: string | number;
                if (prop.key.type === 'Identifier')
                    key = prop.key.name;
                else if (prop.key.value instanceof RegExp)
                    key = String(prop.key.value);
                else if (typeof prop.key.value === "bigint")
                    key = Number(prop.key.value);
                else if (typeof prop.key.value === "boolean")
                    key = String(prop.key.value);
                else
                    key = prop.key.value;
                obj[key] = validateAndEval(prop.value, context, nodeCount);
            }
            return obj;
        }
        default:
            throw new Error(`Unsupported node type: ${node.type}`);
    }
}
