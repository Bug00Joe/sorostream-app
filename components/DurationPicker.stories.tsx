import type { Meta, StoryObj } from "@storybook/react";
import DurationPicker from "@/components/DurationPicker";

const meta: Meta<typeof DurationPicker> = {
  title: "UI/DurationPicker",
  component: DurationPicker,
};

export default meta;

type Story = StoryObj<typeof DurationPicker>;

export const Default: Story = {
  args: {
    onChange: (value) => console.log("duration", value),
  },
};

export const ErrorState: Story = {
  args: {
    onChange: (value) => console.log("duration", value),
    error: "Duration must be set before continuing.",
  },
};
