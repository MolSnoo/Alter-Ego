// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

'use strict';

import { readFileSync } from 'fs';
import { loadDotEnv } from "./Modules/envLoader.ts";
import ClientContext from "./Classes/ClientContext.ts";

function sendStartupLog() {
    let imageTag = process.env.IMAGE_TAG;
    let imageCommit = process.env.IMAGE_COMMIT;
    if (imageTag && imageCommit) {
        console.log(`Alter Ego ${imageTag.split(":")[1]} (${imageCommit})`);
    } else if (imageTag) {
        console.log(`Alter Ego Dev (commit ${imageCommit})`);
    } else {
        console.log(`Alter Ego ${JSON.parse(readFileSync("./package.json").toString()).version}`);
    }
    console.log("Starting Alter Ego...");
}

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

loadDotEnv();
if (process.env.STACK_TRACE_LIMIT && Number.isInteger(parseInt(process.env.STACK_TRACE_LIMIT))) {
    Error.stackTraceLimit = Math.min(Math.max(10, Math.round(parseInt(process.env.STACK_TRACE_LIMIT))), 200);
}
sendStartupLog();
ClientContext.login();
