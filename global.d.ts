import type {Guild, Message, TextChannel} from "discord.js";
import type Player from "./Data/Player";
import type Room from "./Data/Room";
import type Object from "./Data/Object";
import type Event from "./Data/Event";
import type Whisper from "./Data/Whisper";
import type Status from "./Data/Status";
import type Item from "./Data/Item";
import type InventoryItem from "./Data/InventoryItem";
import type Gesture from "./Data/Gesture";
import type Recipe from "./Data/Recipe";
import type Prefab from "./Data/Prefab";
import type Puzzle from "./Data/Puzzle";
import type messageHandler from "./Modules/messageHandler.js";
import type {Duration} from "moment";

declare global {
    interface Game {
        guild: Guild;
        commandChannel: TextChannel;
        logChannel: TextChannel;
        inProgress: boolean;
        canJoin: boolean;
        halfTimer?: NodeJS.Timeout;
        endTimer?: NodeJS.Timeout;
        heated: boolean;
        editMode: boolean;
        players: Player[];
        players_alive: Player[];
        players_dead: Player[];
        rooms: Room[];
        objects: Object[];
        prefabs: Prefab[];
        recipes: Recipe[];
        items: Item[];
        puzzles: Puzzle[];
        events: Event[];
        whispers: Whisper[];
        statusEffects: Status[];
        inventoryItems: InventoryItem[];
        gestures: Gesture[];
        messageHandler: typeof messageHandler;
    }

    /**
     * Represents a 3D position.
     *
     * @property x - X coordinate
     * @property y - Y coordinate
     * @property z - Z coordinate
     */
    interface Pos {

        x: number;
        y: number;
        z: number;
    }

    /**
     * Pronouns of the player.
     *
     * @property sbj - The subject pronoun
     * @property Sbj - The subject pronoun with first letter capitalized
     * @property obj - The object pronoun
     * @property Obj - The object pronoun with first letter capitalized
     * @property dpos - The dependent possessive pronoun
     * @property Dpos - The dependent possessive pronoun with first letter capitalized
     * @property ipos - The independent possessive pronoun
     * @property Ipos - The independent possessive pronoun with first letter capitalized
     * @property ref - The reflexive pronoun
     * @property Ref - The reflexive pronoun with first letter capitalized
     * @property plural - Whether the pronoun is plural or singular
     */
    interface Pronouns {

        sbj?: string;
        Sbj?: string;
        obj?: string;
        Obj?: string;
        dpos?: string;
        Dpos?: string;
        ipos?: string;
        Ipos?: string;
        ref?: string;
        Ref?: string;
        plural?: boolean;
    }

    /**
     * Represents a player's stats
     *
     * @property strength - Strength
     * @property intelligence - Intelligence
     * @property dexterity - Dexterity
     * @property speed - Speed
     * @property stamina - Stamina
     */
    interface Stats {
        strength: number;
        intelligence: number;
        dexterity: number;
        speed: number;
        stamina: number;
    }

    /**
     * @property command - The command alias that was used
     * @property input - The combined arguments of the command
     * @property message - The message that triggered the command
     * @property targetPlayer - The player targeted by the command
     */
    interface Misc {
        command: string;
        input: string;
        message?: Message;
        targetPlayer?: Player;
    }

    /**
     * @property name - The name of the slot.
     * @property capacity - Maximum sum of sizes that can be stored in the slot.
     * @property takenSpace - The current sum of sizes stored in the slot.
     * @property weight - The combined weight of all items stored in the slot.
     * @property item - The items stored in the slot.
     */
    interface InventorySlot {
        name: string;
        capacity: number;
        takenSpace: number;
        weight: number;
        item: Array<Item | InventoryItem>;
    }

    /**
     * @property outcomes - Strings indicating which puzzle solutions that will execute the commands in this command set.
     * @property solvedCommands - Bot commands that will be executed when the puzzle is solved.
     * @property unsolvedCommands - Bot commands that will be executed when the puzzle is unsolved.
     */
    interface PuzzleCommandSet {
        outcomes: string[];
        solvedCommands: string[];
        unsolvedCommands: string[];
    }

    /**
     * @property recipe - The recipe being processed.
     * @property ingredients - The ingredients used in the recipe.
     * @property duration - The duration of the recipe.
     * @property timer - The timer used to track the duration of the recipe.
     */
    interface Process {
        recipe?: Recipe;
        ingredients: Item[];
        duration?: Duration;
        timer?: any;
    }
}
