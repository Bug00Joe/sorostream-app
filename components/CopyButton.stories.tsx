import type { Meta, StoryObj } from "@storybook/react";
import CopyButton from "@/components/CopyButton";

const meta: Meta<typeof CopyButton> = {
  title: "UI/CopyButton",
  component: CopyButton,
};

export default meta;

type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {
  args: {
    value: "GBAMK6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5",
    label: "Copy address",
  },
};

export const Copied: Story = {
  args: {
    value: "GBAMK6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5",
    label: "Copy address",
  },
};
