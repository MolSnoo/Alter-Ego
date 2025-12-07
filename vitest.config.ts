import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        coverage: {
            provider: "v8",
            enabled: true,
            include: ["Commands/*.js", "Data/*.js", "Modules/*.js", "Classes/*.js"],
        },
        setupFiles: "Test/setup.js",
    },
});
