import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        coverage: {
            provider: "v8",
            enabled: true,
            include: ["Classes/*.js", "Commands/*.js", "Data/*.js", "Modules/*.js"],
        },
        setupFiles: "Test/setup.js",
    },
});
