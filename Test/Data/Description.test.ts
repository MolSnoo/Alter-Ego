// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Description from "../../Data/Description.ts";

describe('Description test', () => {
    describe('getPotentialGameEntities test', () => {
        test('getPotentialGameEntities test 1', () => {
            const parsedDescription = `You enter through the DOOR into what seems to be a storage room. `
                + `Much of the room is taken up by rows of SHELVES. The edges of the room to your left are lined with RACKS. `
                + `On the right side of the room is a collection of FURNITURE. There are three POSTERS on the back wall, `
                + `as well as a TRASH CAN in the corner. On the wall next to you is a strange SLOT. On the ceiling `
                + `in the middle of the room is a CAMERA and mounted on the wall above the door you just came from is a MONITOR.`;
            const expectedEntities = ["DOOR", "SHELVES", "RACKS", "FURNITURE", "POSTERS", "TRASH CAN", "SLOT", "CAMERA", "MONITOR"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 2', () => {
            const parsedDescription = `You look through the shelves. There are several rows of them, but they mostly contain `
                + `cardboard boxes with nothing interesting inside them. Each shelf has a different category, though, and `
                + `some of them stand out: a CHEMICAL SHELF, a TOOL SHELF, an ELECTRONICS SHELF, and a MISCELLANEOUS SHELF.`;
            const expectedEntities = ["CHEMICAL SHELF", "TOOL SHELF", "ELECTRONICS SHELF", "MISCELLANEOUS SHELF"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 3', () => {
            const parsedDescription = `You look through the cabinets over the counters. They're quite spacious. `
                + `Inside, you find a GLASS, 16 PLATES, 16 BOWLS, 16 SPOONS, 16 FORKS, 4 LADLES, 4 SPATULAS, `
                + `4 pairs of TONGS, 4 WHISKS, 4 MEASURING CUPS, and 8 RAGS.`;
            const expectedEntities = ["GLASS", "PLATES", "BOWLS", "SPOONS", "FORKS", "LADLES", "SPATULAS", "TONGS", "WHISKS", "MEASURING CUPS", "RAGS"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 4', () => {
            const parsedDescription = `This computer yellow in color. The desktop has two things on it: FOLDER 5 and a program called E PRIME.`;
            const expectedEntities = ["FOLDER 5", "E PRIME"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 5', () => {
            const parsedDescription = `This computer red in color. The desktop has two things on it: FOLDER 2 and a program called CLIP STUDIO PAINT.`;
            const expectedEntities = ["FOLDER 2", "CLIP STUDIO PAINT"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 6', () => {
            const parsedDescription = `You open the CRISPR Data folder. It contains hundreds of files which open in the CRISPR PROGRAMMER program. `
                + `You don't understand most of them, but each one has a note explaining what they do, a DNA sequence to seek, and occasionally, `
                + `a template DNA sequence to insert into the Cas9 protein for a process called homology directed repair. Sounds like a bunch of nonsense. `
                + `Most of the files seem to be for plants, with notes suggesting that they improve the plant's growing speed or its growability `
                + `under certain soil conditions. There are a few files for animals as well, most notably KILLIAN.CRISPR and VIOLET.CRISPR.`;
            const expectedEntities = ["CRISPR", "CRISPR PROGRAMMER", "DNA", "KILLIAN.CRISPR", "VIOLET.CRISPR"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 7', () => {
            const parsedDescription = `It's a wide table with a chair pushed into it that's meant for working on clothing. Much of it is covered `
                + `with a cutting mat. A SEWING MACHINE, SERGER, and an EMBROIDERY MACHINE sit upon it. Also scattered about on the work station `
                + `are a pair of CRAFT SCISSORS, a pair of PAPER SCISSORS, a pair of SEWING SHEARS, and a SEWING KIT.`;
            const expectedEntities = ["SEWING MACHINE", "SERGER", "EMBROIDERY MACHINE", "CRAFT SCISSORS", "PAPER SCISSORS", "SEWING SHEARS", "SEWING KIT"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 8', () => {
            const parsedDescription = `You look inside the top drawer. In it, you find AIPAD 9 and LOCKER KEY NINE.`;
            const expectedEntities = ["AIPAD 9", "LOCKER KEY NINE"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 9', () => {
            const parsedDescription = `You open the Protected folder. Inside, you find three files: INSTRUCTIONS.TXT, AISHA_BACKGROUND.TXT, and SSH.`;
            const expectedEntities = ["INSTRUCTIONS.TXT", "AISHA_BACKGROUND.TXT", "SSH"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 10', () => {
            const parsedDescription = `You see PANEL 9, PANEL 10, PANEL 11, PANEL 12, PANEL 13, PANEL 14, PANEL 15, PANEL 16, and PANEL A.`;
            const expectedEntities = ["PANEL 9", "PANEL 10", "PANEL 11", "PANEL 12", "PANEL 13", "PANEL 14", "PANEL 15", "PANEL 16", "PANEL A"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });

        test('getPotentialGameEntities test 11', () => {
            const parsedDescription = `The base is metallic and painted to look like wood. It looks like a pretty ordinary pool table. On it are 2 POOL STICKS, a TRIANGLE, POOL CHALK, a CUE BALL, an 8 BALL, a 9 BALL, a 10 BALL, and an 11 BALL.`;
            const expectedEntities = ["POOL STICKS", "TRIANGLE", "POOL CHALK", "CUE BALL", "8 BALL", "9 BALL", "10 BALL", "11 BALL"];
            const actualEntities = Description.getPotentialGameEntities(parsedDescription);
            expect(actualEntities).toStrictEqual(expectedEntities);
        });
    });
});