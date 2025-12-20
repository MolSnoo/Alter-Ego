import { Collection } from "discord.js";
import PrettyPrinter from "../../Classes/PrettyPrinter.js";

describe("PrettyPrinter test", () => {
    beforeEach(() => {});

    const objectToPretty = {
        game: "<SHOULD BE TRUNCATED BY prettyObject>",
        guild: "<SHOULD BE TRUNCATED BY prettyObject>",
        member: "<SHOULD BE TRUNCATED BY prettyObject>",
        channel: "<SHOULD BE TRUNCATED BY prettyObject>",
        spectateChannel: "<SHOULD BE TRUNCATED BY prettyObject>",
        timer: "<SHOULD BE TRUNCATED BY prettyObject>",
        recursion: {
            recursion: {
                recursion: {
                    recursion: {
                        recursion: {
                            recursion: {
                                game: "<SHOULD NOT BE TRUNCATED BY prettyObject>",
                                guild: "<SHOULD NOT BE TRUNCATED BY prettyObject>",
                                member: "<SHOULD NOT BE TRUNCATED BY prettyObject>",
                                channel: "<SHOULD NOT BE TRUNCATED BY prettyObject>",
                                spectateChannel: "<SHOULD NOT BE TRUNCATED BY prettyObject>",
                                timer: "<SHOULD NOT BE TRUNCATED BY prettyObject>",
                            },
                        },
                    },
                },
            },
        },
        aStr: "Hello World!",
        aNum: 1337,
        anArray: ["Hello World!", 1337],
        aMap: new Map([["foo", "bar"]]),
        aCollection: new Collection([["foo", "bar"]]),
    };

    test("Expect No Exceptions", () => {
        const prettyPrinter = new PrettyPrinter();
        expect(() => prettyPrinter.prettyString(objectToPretty)).not.toThrow();
        expect(() => prettyPrinter.prettyObject(objectToPretty)).not.toThrow();
    });
});
