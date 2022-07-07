import typescript from "@rollup/plugin-typescript";

export default {
  input: "./src/index.ts",
  output: [
    // * cjs -> commonjs
    // * es -> esm
    {
      format: "commonjs",
      file: "lib/guide-mini-vue.cjs.js",
    },
    {
      format: "es",
      file: "lib/guide-mini-vue.esm.js",
    },
  ],
  plugins: [typescript()],
};
