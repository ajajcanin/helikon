import "../styles/globals.css";
import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import messages from "../messages/bs.json";

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    layout: "fullscreen",
    a11y: { test: "error" },
    viewport: {
      options: {
        mobile: { name: "Telefon 375", styles: { width: "375px", height: "812px" } },
        tablet: { name: "Tablet 768", styles: { width: "768px", height: "1024px" } },
      },
    },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="bs" messages={messages} timeZone="Europe/Sarajevo">
        <div className="min-h-dvh bg-[var(--bg-page)] p-6 font-body text-[var(--text-display)]">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
