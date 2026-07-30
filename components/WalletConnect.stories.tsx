import type { Meta, StoryObj } from "@storybook/react";
import WalletConnect from "@/components/WalletConnect";

const meta: Meta<typeof WalletConnect> = {
  title: "UI/WalletConnect",
  component: WalletConnect,
};

export default meta;

type Story = StoryObj<typeof WalletConnect>;

export const Default: Story = {
  args: {
    onConnect: () => undefined,
  },
};

export const Loading: Story = {
  args: {
    onConnect: () => undefined,
  },
};

export const ErrorState: Story = {
  args: {
    onConnect: () => undefined,
  },
};
