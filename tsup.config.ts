import { defineConfig } from "tsup";

export default defineConfig({
    format: ["esm"],
    entry: ["./server.ts", "./worker.ts"],
    dts: false,
    shims: true,
    skipNodeModulesBundle: true,
    clean: true,
    outDir: "dist",
    splitting: false,
    sourcemap: true,
});
