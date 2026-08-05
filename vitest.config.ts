import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        coverage: {
            provider: "v8",
            enabled: false,
            reportOnFailure: true,
            include: ["Classes/*.{js,ts}", "Commands/*.{js,ts}", "Data/*.{js,ts}", "Data/Actions/*.{js,ts}", "Modules/*.{js,ts}"],
        },
        setupFiles: "Test/setup.js",
        typecheck: {
            enabled: true,
        },
        testTimeout: 10000
    },
});
