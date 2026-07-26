// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Interactable from "../Classes/Interactables/Interactable.ts";
import { MessageDisplayType } from "../Modules/enums.ts";
import { createDocument, parseDescription, stringify } from "../Modules/parser.ts";
import type Exit from "./Exit.ts";
import Fixture from "./Fixture.ts";
import type Game from "./Game.ts";
import GameConstruct from "./GameConstruct.ts";
import type GameEntity from "./GameEntity.ts";
import Player from "./Player.ts";
import Puzzle from "./Puzzle.ts";
import Room from "./Room.ts";
import RoomItem from "./RoomItem.ts";

/**
 * Represents a game entity's description.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/description.html
 */
export default class Description extends GameConstruct {
    /**
     * The game entity this description belongs to.
     */
    readonly #container: GameEntity;
    /**
     * The text of the description as loaded from the spreadsheet.
     */
    readonly text: string;
    /**
     * The description's text parsed into a document.
     */
    readonly document: Document;
    /**
     * An array of warnings for the parsed document.
     */
    readonly #warnings: string[];
    /**
     * An array of errors for the parsed document.
     */
    readonly #errors: string[];
    /**
     * The display type of the message to send for this description.
     */
    readonly messageDisplayType: MessageDisplayType;
    /**
     * A map of procedurals in this description and the set of possibilities contained within them.
     */
    readonly procedurals: Map<string, Set<string>>;

    /**
     * @param text - The text of the description.
     * @param container - The game entity this description belongs to.
     * @param game - The game this belongs to.
     */
    constructor(text: string, container: GameEntity, game: Game) {
        super(game);
        this.text = text;
        this.#container = container;
        const descriptionDocument = createDocument(text, container instanceof GameConstruct);
        this.document = descriptionDocument.document;
        this.#warnings = descriptionDocument.warnings;
        this.#errors = descriptionDocument.errors;
        this.messageDisplayType = descriptionDocument.messageDisplayType;
        this.procedurals = descriptionDocument.procedurals;
    }

    getContainer(): GameEntity {
        return this.#container;
    }

    getWarnings(): string[] {
        return this.#warnings;
    }

    getErrors(): string[] {
        return this.#errors;
    }

    override toString(): string {
        return stringify(this.document);
    }

    /**
     * Parses the description for the given player.
     */
    parseFor(player: Player, container: GameEntity = this.getContainer()): string {
        if (this.text === "") return "";
        return parseDescription(this, container, player);
    }

    /**
     * Gets all potential game entities in the given parsed description.
     *
     * @param parsedDescription - The parsed description that a player will receive.
     * @returns A list of strings in all uppercase letters that may be referring to game entities.
     */
    static getPotentialGameEntities(parsedDescription: string): string[] {
        let potentialGameEntities: Set<string> = new Set();
        const allCapsRegex = /((?:[A-Z]{2,}|[B-Z]+|(?<=an? )\d+)(?:[ _\-\.]?(?:[\d]+|[A-Z](?![a-z])+))+)/g;
        let match: string[];
        while (match = allCapsRegex.exec(parsedDescription))
            potentialGameEntities.add(match[0].trim());
        return Array.from(potentialGameEntities);
    }

    /**
     * Parses and sends the description to the given player with interactables.
     *
     * @param player - The player to send the parsed description to.
     * @param container - The container the description belongs to. Defaults to the description's actual container.
     */
    parseAndSendTo(player: Player, container: GameEntity = this.getContainer()): void {
        const parsedDescription = this.parseFor(player, container);
        let potentialGameEntities: string[] = [];
        let inspectableEntities: Inspectable[] = [];
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        if (container instanceof Room) {
            inspectableEntities = inspectableEntities.concat(container.getOccupantsExcluding(player));
            const occupantsString = this.getGame().notificationGenerator.generateRoomOccupantsNotification(player, container);
            let defaultDropFixtureString = "";
            const defaultDropFixture = this.getGame().entityFinder.getFixture(this.getGame().settings.defaultDropFixture, container.id);
            if (defaultDropFixture) {
                defaultDropFixtureString = defaultDropFixture.description.parseFor(player, defaultDropFixture);
                const potentialFloorEntities = Description.getPotentialGameEntities(defaultDropFixtureString);
                inspectableEntities.push(defaultDropFixture);
                inspectableEntities = inspectableEntities.concat(this.getGame().entityFinder.getSelectableInteractableGameEntities(potentialFloorEntities, defaultDropFixture, player)[0]);
            }
            defaultDropFixtureString = this.getGame().notificationGenerator.generateDefaultDropFixtureNotification(defaultDropFixtureString, defaultDropFixture, this.getGame().settings.defaultDropFixture);
            potentialGameEntities = potentialGameEntities.concat(Description.getPotentialGameEntities(parsedDescription));
            const selectableEntities = this.getGame().entityFinder.getSelectableInteractableGameEntities(potentialGameEntities, container, player);
            inspectableEntities = inspectableEntities.concat(selectableEntities[0]);
            const exits: Exit[] = [];
            for (const potentialGameEntity of potentialGameEntities)
                if (container.exits.has(potentialGameEntity)) exits.push(container.exits.get(potentialGameEntity));
            interactables = interactables.concat(interactableManager.createQueueMoveActionInteractables(exits, player));
            interactables = interactables.concat(interactableManager.createInspectActionInteractable(inspectableEntities, player));
            player.sendRoomDescription(container, parsedDescription, occupantsString, defaultDropFixtureString, interactables);
        }
        else {
            potentialGameEntities = potentialGameEntities.concat(Description.getPotentialGameEntities(parsedDescription));
            const selectableEntities = this.getGame().entityFinder.getSelectableInteractableGameEntities(potentialGameEntities, container, player);
            inspectableEntities = inspectableEntities.concat(selectableEntities[0]);
            interactables = interactables.concat(interactableManager.createInspectActionInteractable(inspectableEntities, player));
            if (container instanceof Fixture || container instanceof RoomItem || container instanceof Puzzle) {
                // If the puzzle's unsolved description is being sent, don't sent take or drop interactables.
                if (!(container instanceof Puzzle) || this !== container.unsolvedDescription) {
                    interactables = interactables.concat(interactableManager.getTakeInteractables(container, selectableEntities[1], player));
                    interactables = interactables.concat(interactableManager.getDropInteractables(container, player));
                }
                let puzzles = selectableEntities[2];
                if (container instanceof Fixture) {
                    interactables = interactables.concat(interactableManager.createHideActionInteractable(container, player));
                    interactables = interactables.concat(interactableManager.createEmergeActionInteractable(container, player));
                    interactables = interactables.concat(interactableManager.getActivateOrDeactivateInteractables(container, player));
                    puzzles = puzzles.filter(puzzle => (!puzzle.parentFixture || puzzle.parentFixture.row !== container.row) && puzzle.checkStaticRequirementsMet());
                    if (container.childPuzzle && container.childPuzzle.checkStaticRequirementsMet())
                        puzzles.unshift(container.childPuzzle);
                    interactables = interactables.concat(interactableManager.getAttemptInteractables(puzzles, player));
                }
                else if (container instanceof Puzzle) {
                    puzzles = puzzles.filter(puzzle => puzzle.row !== container.row || this === puzzle.incorrectDescription);
                    interactables = interactables.concat(interactableManager.getAttemptInteractables(puzzles, player));
                }
            }
            else if (container instanceof Player) {
                interactables = interactables.concat(interactableManager.getFollowInteractables(container, player));
                interactables = interactables.concat(interactableManager.getLeadInteractables(container, player));
            }
            player.sendDescription(parsedDescription, container, this.messageDisplayType ?? MessageDisplayType.PLAIN_TEXT, interactables);
        }
    }
}
