import { defineMain } from "@storybook/nextjs-vite/node";

/** Component workbench: every atom and molecule has a story, checked by the a11y add-on. */
export default defineMain({
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  staticDirs: ["../public"],
});
