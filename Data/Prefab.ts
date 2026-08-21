import { Collection } from "discord.js";
import Description from "./Description.ts";
import type Game from "./Game.ts";
import GameEntity from "./GameEntity.ts";
import type InventorySlot from "./InventorySlot.ts";
import type ItemInstance from "./ItemInstance.ts";
import type Status from "./Status.ts";
import type Player from "./Player.ts";

export type PrefabField = "id"|"names"|"possibleNames"|"containingPhrases"|"possibleContainingPhrases"|"discreet"|"size"|"weight"|"usable"|"useVerb"|"uses"|"inflicts"|"cures"|"nextStage"|"equippable"|"equipmentSlots"|"coveredEquipmentSlots"|"commandsString"|"inventorySlots"|"preposition"|"description"|"proceduralOptions";
export type PrefabPossibleNames = Collection<Map<string, string>, [string, string]>;

/**
 * Represents the concept of an item.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/prefab.html
 */
export default class Prefab extends GameEntity implements PersistentGameEntity<PrefabField> {
    /**
     * The unique identifier of the prefab.
     */
    readonly id: string;
    /**
     * A map of possible names. The key is a single procedural selection, and the value is the name and pluralName.
     */
    readonly possibleNames: PrefabPossibleNames;
    /**
     * A map of possible containing phrases. The key is a single procedural selection, and the value is the singleContainingPhrase and pluralContainingPhrase.
     */
    readonly possibleContainingPhrases: PrefabPossibleNames;
    /**
     * Whether interactions with instances of this prefab are narrated or not.
     */
    readonly discreet: boolean;
    /**
     * How large the prefab is. Does not correspond with any particular unit of measurement.
     */
    readonly size: number;
    /**
     * How much the prefab weighs in kilograms.
     */
    readonly weight: number;
    /**
     * Whether the instances of the prefab can be used by a player to inflict or cure one or more status effects.
     */
    readonly usable: boolean;
    /**
     * The verb that will be used when a player uses an inventory item instance of this prefab.
     *
     * @deprecated Use `thirdPersonVerb` or `secondPersonVerb` instead.
     */
    readonly verb: string;
    /**
     * The verb that will be used in narrations when a player uses an inventory item instance of this prefab.
     */
    readonly thirdPersonVerb: string;
    /**
     * The verb that will be used in second person notifications when a player uses an inventory item instance of this prefab.
     */
    readonly secondPersonVerb: string;
    /**
     * The number of uses the prefab has.
     */
    readonly uses: number;
    /**
     * A list of status effects that will be inflicted on the player when they use an inventory item instance of this prefab.
     */
    readonly effectsStrings: string[];
    /**
     * Status effects will be inflicted on the player when they use an inventory item instance of this prefab.
     */
    effects: Status[];
    /**
     * A list of status effects that the player will be cured of when they use an inventory item instance of this prefab.
     */
    readonly curesStrings: string[];
    /**
     * Status effects that the player will be cured of when they use an inventory item instance of this prefab.
     */
    cures: Status[];
    /**
     * The ID of the prefab that instances of this prefab will turn into once they have no uses left.
     */
    readonly nextStageId: string;
    /**
     * The prefab that instances of this prefab will turn into once they have no uses left.
     */
    nextStage: Prefab;
    /**
     * Whether inventory item instances of this prefab can be equipped by a player.
     */
    readonly equippable: boolean;
    /**
     * The IDs of equipment slots that inventory item instances of this prefab can be equipped to.
     */
    readonly equipmentSlots: string[];
    /**
     * The IDs of equipment slots that inventory item instances of this prefab will cover when equipped. This prevents any inventory items equipped to those equipment slots from appearing in the player's equipment description.
     */
    readonly coveredEquipmentSlots: string[];
    /**
     * Forward slash separated list of comma-separated bot commands to be executed when the an inventory item instance of this prefab is equipped or unequipped.
     */
    readonly commandsString: string;
    /**
     * The bot commands to be executed when an inventory item instance of this prefab is equipped by a player.
     */
    readonly equippedCommands: string[];
    /**
     * The bot commands to be executed when an inventory item instance of this prefab is unequipped by a player.
     */
    readonly unequippedCommands: string[];
    /**
     * {@link InventorySlot|Inventory slots} that instances of this prefab will have. The key is the inventory slot's ID.
     */
    readonly inventory: Collection<string, InventorySlot<ItemInstance>>;
    /**
     * The preposition that will be used when a player puts an item into an instance of this prefab.
     */
    readonly preposition: string;
    /**
     * The description of the prefab. Can contain multiple item lists named after its inventory slots.
     */
    readonly description: Description;
    /**
     * A map of procedurals in this prefab's description and the set of possibilities contained within them.
     */
    readonly proceduralOptions: Map<string, Set<string>>;

    /**
     * @param id - The unique identifier of the prefab.
     * @param possibleNames - A map of possible names. The key is a single procedural selection, and the value is the name and pluralName.
     * @param possibleContainingPhrases - A map of possible containing phrases. The key is a single procedural selection, and the value is the singleContainingPhrase and pluralContainingPhrase.
     * @param discreet - Whether interactions with instances of this prefab are narrated or not.
     * @param size - How large the prefab is. Does not correspond with any particular unit of measurement.
     * @param weight - How much the prefab weighs in kilograms.
     * @param usable - Whether the instances of the prefab can be used by a player to inflict or cure one or more status effects.
     * @param thirdPersonVerb - The verb that will be used in narrations when a player uses an inventory item instance of this prefab.
     * @param secondPersonVerb - TThe verb that will be used in second person notifications when a player uses an inventory item instance of this prefab.
     * @param uses - The number of uses the prefab has.
     * @param effectsStrings - A list of status effects that will be inflicted on the player when they use an inventory item instance of this prefab.
     * @param curesStrings - A list of status effects that the player will be cured of when they use an inventory item instance of this prefab.
     * @param nextStageId - The ID of the prefab that instances of this prefab will turn into once they have no uses left.
     * @param equippable - Whether inventory item instances of this prefab can be equipped by a player.
     * @param equipmentSlots - The IDs of equipment slots that inventory item instances of this prefab can be equipped to.
     * @param coveredEquipmentSlots - The IDs of equipment slots that inventory item instances of this prefab will cover when equipped. This prevents any inventory items equipped to those equipment slots from appearing in the player's equipment description.
     * @param commandsString - Forward slash separated list of comma-separated bot commands to be executed when the an inventory item instance of this prefab is equipped or unequipped.
     * @param equippedCommands - The bot commands to be executed when an inventory item instance of this prefab is equipped by a player.
     * @param unequippedCommands - The bot commands to be executed when an inventory item instance of this prefab is unequipped by a player.
     * @param inventory - {@link InventorySlot|Inventory slots} that instances of this prefab will have.
     * @param preposition - The preposition that will be used when a player puts an item into an instance of this prefab.
     * @param description - The description of the prefab. Can contain multiple item lists named after its inventory slots.
     * @param row - The row number of the prefab in the sheet.
     * @param game - The game this belongs to.
     */
    constructor(id: string, possibleNames: PrefabPossibleNames, possibleContainingPhrases: PrefabPossibleNames,
        discreet: boolean, size: number, weight: number, usable: boolean,
        thirdPersonVerb: string, secondPersonVerb: string, uses: number, effectsStrings: string[],
        curesStrings: string[], nextStageId: string, equippable: boolean, equipmentSlots: string[],
        coveredEquipmentSlots: string[], commandsString: string, equippedCommands: string[],
        unequippedCommands: string[], inventory: Collection<string, InventorySlot<ItemInstance>>, preposition: string,
        description: string, row: number, game: Game) {
        super(game, row);
        this.id = id;
        this.possibleNames = possibleNames;
        this.possibleContainingPhrases = possibleContainingPhrases;
        this.discreet = discreet;
        this.size = size;
        this.weight = weight;
        this.usable = usable;
        this.verb = thirdPersonVerb;
        this.thirdPersonVerb = thirdPersonVerb;
        this.secondPersonVerb = secondPersonVerb;
        this.uses = uses;
        this.effectsStrings = effectsStrings;
        this.effects = new Array(this.effectsStrings.length);
        this.curesStrings = curesStrings;
        this.cures = new Array(this.curesStrings.length);
        this.nextStageId = nextStageId;
        this.nextStage = null;
        this.equippable = equippable;
        this.equipmentSlots = equipmentSlots;
        this.coveredEquipmentSlots = coveredEquipmentSlots;
        this.commandsString = commandsString;
        this.equippedCommands = equippedCommands;
        this.unequippedCommands = unequippedCommands;
        this.inventory = inventory;
        this.preposition = preposition;
        this.description = new Description(description, this, game);
        this.proceduralOptions = this.description.procedurals;
    }

    /**
     * The first possible name of the prefab.
     */
    get name(): string {
        return this.possibleNames.first()[0];
    }

    /**
     * The first possible plural name of the prefab.
     */
    get pluralName(): string {
        return this.possibleNames.first()[1];
    }

    /**
     * The first possible single containing phrase of the prefab.
     */
    get singleContainingPhrase(): string {
        return this.possibleContainingPhrases.first()[0];
    }

    /**
     * The first possible plural containing phrase of the prefab.
     */
    get pluralContainingPhrase(): string {
        return this.possibleContainingPhrases.first()[1];
    }

    /**
     * The possible names of the prefab as they would appear in the sheet.
     */
    get possibleNamesString(): string {
        return this.getPossibleNameString("possibleNames");
    }

    /**
     * The possible containing phrases of the prefab as they would appear in the sheet.
     */
    get possibleContainingPhrasesString(): string {
        return this.getPossibleNameString("possibleContainingPhrases");
    }

    /**
     * Generates a string representation of the prefab's possible names or containing phrases as they would appear in the sheet.
     * @param possibleNames - The key of the possible names property to generate the string for.
     */
    private getPossibleNameString(possibleNames: "possibleNames"|"possibleContainingPhrases"): string {
        const possibleNamesStrings: string[] = [];
        this[possibleNames].forEach((namePair, proceduralSelection) => {
            const proceduralKey = proceduralSelection.keys().next().value as string;
            const proceduralValue = proceduralSelection.values().next().value as string;
            const name = namePair[0];
            const pluralName = namePair[1];
            const namesString = `${pluralName ? `${name}, ${pluralName}` : name}`;
            if (proceduralKey && proceduralValue)
                possibleNamesStrings.push(`[${proceduralKey}=${proceduralValue}: ${namesString}]`);
            else possibleNamesStrings.push(namesString);
        });
        return possibleNamesStrings.join(", ");
    }

    /**
     * The prefab's procedural options represented as a string.
     */
    private get proceduralOptionsString(): string {
        const optionsStrings: string[] = [];
        this.proceduralOptions.forEach((options, key) => optionsStrings.push(`(${key} = ${Array.from(options).join("|")})`));
        return optionsStrings.join(", ");
    }

    /**
     * Gets the prefab's name for the given procedural selections. If there isn't one, returns its default name.
     * @param proceduralSelections - A map of procedural selections.
     */
    getNameFor(proceduralSelections: Map<string, string>): string {
        return this.getPossibleNamesFor("possibleNames", proceduralSelections)?.[0] ?? this.name;
    }

    /**
     * Gets the prefab's plural name for the given procedural selections. If there isn't one, returns its default plural name.
     * @param proceduralSelections - A map of procedural selections.
     */
    getPluralNameFor(proceduralSelections: Map<string, string>): string {
        return this.getPossibleNamesFor("possibleNames", proceduralSelections)?.[1] ?? this.pluralName;
    }

    /**
     * Gets the prefab's single containing phrase for the given procedural selections. If there isn't one, returns its default single containing phrase.
     * @param proceduralSelections - A map of procedural selections.
     */
    getSingleContainingPhraseFor(proceduralSelections: Map<string, string>): string {
        return this.getPossibleNamesFor("possibleContainingPhrases", proceduralSelections)?.[0] ?? this.singleContainingPhrase;
    }

    /**
     * Gets the prefab's plural containing phrase for the given procedural selections. If there isn't one, returns its default plural containing phrase.
     * @param proceduralSelections - A map of procedural selections.
     */
    getPluralContainingPhraseFor(proceduralSelections: Map<string, string>): string {
        return this.getPossibleNamesFor("possibleContainingPhrases", proceduralSelections)?.[1] ?? this.pluralContainingPhrase;
    }

    /**
     * Gets the names of the prefab based on the given procedural selections. If there are no procedural selections, or if the procedural selections do not match any of the prefab's possible names, returns undefined.
     * @param possibleNames - The key of the possible names property to get the name for.
     * @param proceduralSelections - A map of procedural selections to determine the prefab's name.
     */
    private getPossibleNamesFor(possibleNames: "possibleNames"|"possibleContainingPhrases", proceduralSelections: Map<string, string>): [string, string] {
        for (const [[...proceduralOption], names] of this[possibleNames].entries()) {
            const proceduralName = proceduralOption[0][0];
            const possibilityName = proceduralOption[0][1];
            if (!proceduralSelections.has(proceduralName)) continue;
            if (proceduralSelections.get(proceduralName) === possibilityName) return names;
        }
        return undefined;
    }

    /**
     * Prefabs themselves cannot have procedural selections, so this will always return false.
     * This is only used for item instances that have prefabs with procedural selections, and is not used for prefabs directly.
     */
    hasProceduralSelection(proceduralOption: [string, string]): boolean {
        return false;
    }

    /**
     * Sets the next stage.
     */
    setNextStage(nextStage: Prefab): void {
        this.nextStage = nextStage;
    }

    /**
	 * Outputs a string to insert into an item list in a description.
	 * If the given quantity is 1, returns the prefab's single containing phrase.
	 * If the quantity is not 1, returns the prefab's quantity followed by its plural containing phrase.
	 * If the quantity is infinite, returns only the prefab's plural containing phrase.
     * @param proceduralSelections - A map of procedural selections to determine the prefab's containing phrase.
	 */
	toSingleOrPluralContainingPhrase(quantity: number, proceduralSelections: Map<string, string> = new Map()): string {
		if (isNaN(quantity)) return this.getPluralContainingPhraseFor(proceduralSelections);
		else if (quantity !== 1) return `${quantity} ${this.getPluralContainingPhraseFor(proceduralSelections)}`;
		else return this.getSingleContainingPhraseFor(proceduralSelections);
	}

    /**
     * Returns true if the owner of this item instance is the given player. For prefabs, always returns false.
     * @param player - The player to check ownership against.
     */
    ownerIs(player: Player): boolean {
        return false;
    }

    /**
     * Returns true if the prefab contains no items.
     */
    containsNoItems(): boolean {
        return true;
    }

    /**
     * Returns true if this entity contains an item with the given identifier or prefab ID.
     * @param identifier - The identifier or prefab ID to search for.
     */
    containsItem(identifier: string): boolean {
        return false;
    }

    /**
     * Gets the combined weight of all the items this entity contains.
     */
    getContainedItemsWeight(): number {
        return 0;
    }

    descriptionCell(): string {
        return this.getGame().constants.prefabSheetDescriptionColumn + this.row;
    }

    getEntityID(): string {
        return this.id;
    }

    getLabel(field: PrefabField): string {
        switch (field) {
            case "id": return "Prefab ID";
            case "names": return "Prefab Name";
            case "possibleNames": return "Possible Names";
            case "containingPhrases": return "Containing Phrases";
            case "possibleContainingPhrases": return "Possible Containing Phrases";
            case "discreet": return "Discreet?";
            case "size": return "Size";
            case "weight": return "Weight";
            case "usable": return "Usable?";
            case "useVerb": return "Use Verb";
            case "uses": return "Uses";
            case "inflicts": return "Gives Status Effect(s)";
            case "cures": return "Cures Status Effect(s)";
            case "nextStage": return "Turns Into";
            case "equippable": return "Equippable?";
            case "equipmentSlots": return "Restrict to Equip. Slots";
            case "coveredEquipmentSlots": return "Covers Equip. Slots";
            case "commandsString": return "When Equipped / Unequipped";
            case "inventorySlots": return "Contains Inventory Slots";
            case "preposition": return "Preposition";
            case "description": return "Description";
            case "proceduralOptions": return "Procedural Options";
        }
    }

    getValue(field: PrefabField): string {
        switch (field) {
            case "id": return this.id;
            case "names": return this.possibleNames.size > 1 ? "(Variable)" : this.pluralName ? [this.name, this.pluralName].join(", ") : this.name;
            case "possibleNames": return this.possibleNamesString;
            case "containingPhrases": return this.possibleContainingPhrases.size > 1 ? "(Variable)" : this.pluralContainingPhrase ? [this.singleContainingPhrase, this.pluralContainingPhrase].join(", ") : this.singleContainingPhrase;
            case "possibleContainingPhrases": return this.possibleContainingPhrasesString;
            case "discreet": return this.discreet ? "TRUE" : "FALSE";
            case "size": return String(this.size);
            case "weight": return String(this.weight);
            case "usable": return this.usable ? "TRUE" : "FALSE";
            case "useVerb": return this.secondPersonVerb ? [this.thirdPersonVerb, this.secondPersonVerb].join(", ") : this.thirdPersonVerb;
            case "uses": return isNaN(this.uses) && this.usable ? "Infinity" : isNaN(this.uses) ? "" : String(this.uses);
            case "inflicts": return this.effectsStrings.join(", ");
            case "cures": return this.curesStrings.join(", ");
            case "nextStage": return this.nextStageId;
            case "equippable": return this.equippable ? "TRUE" : "FALSE";
            case "equipmentSlots": return this.equipmentSlots.join(", ");
            case "coveredEquipmentSlots": return this.coveredEquipmentSlots.join(", ");
            case "commandsString": return this.commandsString;
            case "inventorySlots": return this.inventory.map(inventorySlot => inventorySlot.toString()).join(", ");
            case "preposition": return this.preposition;
            case "description": return this.description.text;
            case "proceduralOptions": return this.proceduralOptionsString;
        }
    }

    getViewField(field: PrefabField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): "Prefab" {
        return "Prefab";
    }
}
