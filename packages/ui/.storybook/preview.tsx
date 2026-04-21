import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";

import { ToastProvider } from "../src/components/toast";
import "../src/styles/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Fullscreen so Storybook does not paint a separate light "canvas" around centered
    // stories; the themed wrapper below uses design-token bg-background for both modes.
    layout: "fullscreen",
    backgrounds: { disable: true },
  },
  decorators: [
    withThemeByClassName({
      defaultTheme: "light",
      parentSelector: "html",
      themes: {
        dark: "dark",
        light: "",
      },
    }),
    (Story) => (
      <ToastProvider>
        <div className="box-border flex w-full items-center justify-center bg-background p-8 text-foreground">
          <Story />
        </div>
      </ToastProvider>
    ),
  ],
};

export default preview;
