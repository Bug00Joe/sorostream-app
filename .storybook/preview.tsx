import type { Preview } from "@storybook/react";
import "@/src/app/globals.css";
import { SettingsProvider } from "@/src/context/SettingsContext";
import { WalletProvider } from "@/src/context/WalletContext";
import { ThemeProvider } from "@/src/lib/theme";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on.*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0f172a" },
        { name: "light", value: "#f8fafc" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <SettingsProvider>
          <WalletProvider>
            <div className="min-h-screen bg-gray-950 text-white p-6">
              <Story />
            </div>
          </WalletProvider>
        </SettingsProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;
