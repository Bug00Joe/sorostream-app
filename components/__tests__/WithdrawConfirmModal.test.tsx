import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WithdrawConfirmModal from '../WithdrawConfirmModal';

const AMOUNT = '1,234.5600000';

function renderModal(overrides?: Partial<React.ComponentProps<typeof WithdrawConfirmModal>>) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <WithdrawConfirmModal
      amount={AMOUNT}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe('WithdrawConfirmModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the amount in the description', () => {
    renderModal();
    const matches = screen.getAllByText(AMOUNT, { exact: false });
    expect(matches.length).toBeGreaterThan(0);
  });

  it('Confirm button is disabled initially', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /confirm withdrawal/i })).toBeDisabled();
  });

  it('Confirm button stays disabled when typed value does not match', () => {
    renderModal();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '999' } });
    expect(screen.getByRole('button', { name: /confirm withdrawal/i })).toBeDisabled();
  });

  it('shows mismatch error when typed value is non-empty and wrong', () => {
    renderModal();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'wrong' } });
    expect(screen.getByText(/amount doesn't match/i)).toBeInTheDocument();
  });

  it('Confirm button is enabled when typed value matches exactly', () => {
    renderModal();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: AMOUNT } });
    expect(screen.getByRole('button', { name: /confirm withdrawal/i })).not.toBeDisabled();
  });

  it('calls onConfirm when Confirm is clicked after correct input', () => {
    const { onConfirm } = renderModal();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: AMOUNT } });
    fireEvent.click(screen.getByRole('button', { name: /confirm withdrawal/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const { onCancel } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', () => {
    const { onCancel } = renderModal();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not show error when input is empty', () => {
    renderModal();
    expect(screen.queryByText(/amount doesn't match/i)).not.toBeInTheDocument();
  });

  it('has the correct dialog role and aria-modal', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
