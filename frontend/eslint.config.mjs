import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    // custom rules
    "vue/multi-word-component-names": "off",
  },
});
