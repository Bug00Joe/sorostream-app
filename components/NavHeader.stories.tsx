import type { Meta, StoryObj } from "@storybook/react";
import NavHeader from "@/components/NavHeader";

const meta: Meta<typeof NavHeader> = {
  title: "UI/NavHeader",
  component: NavHeader,
};

export default meta;

type Story = StoryObj<typeof NavHeader>;

export const Default: Story = {};
