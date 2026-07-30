import type { Meta, StoryObj } from "@storybook/react";
import StreamHistory, { type HistoryEntry } from "@/components/StreamHistory";

const meta: Meta<typeof StreamHistory> = {
  title: "UI/StreamHistory",
  component: StreamHistory,
};

export default meta;

type Story = StoryObj<typeof StreamHistory>;

const sampleEntries: HistoryEntry[] = [
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    type: "creation",
    amount: "10000000000",
    txHash: "0xabc123creation",
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    type: "withdrawal",
    amount: "2500000000",
    txHash: "0xdef456withdraw",
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    type: "top-up",
    amount: "5000000000",
    txHash: "0xghi789topup",
  },
];

export const Default: Story = {
  args: {
    entries: sampleEntries,
  },
};

export const Loading: Story = {
  args: {
    entries: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
};
