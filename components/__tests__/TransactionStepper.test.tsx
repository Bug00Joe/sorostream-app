import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TransactionStepper, { TxStage } from '../TransactionStepper';

describe('TransactionStepper', () => {
  it('renders all 5 stage labels', () => {
    render(<TransactionStepper currentStage={TxStage.Building} />);

    expect(screen.getByText('Building')).toBeInTheDocument();
    expect(screen.getByText('Signing')).toBeInTheDocument();
    expect(screen.getByText('Submitting')).toBeInTheDocument();
    expect(screen.getByText('Confirming')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('marks the active stage with aria-current="step"', () => {
    render(<TransactionStepper currentStage={TxStage.Signing} />);

    const activeEl = screen.getAllByRole('generic').find(
      (el) => el.getAttribute('aria-current') === 'step',
    );
    expect(activeEl).toBeDefined();
  });

  it('shows the current stage description in the description area', () => {
    render(<TransactionStepper currentStage={TxStage.Confirming} />);
    expect(
      screen.getByText(/Waiting for on-chain confirmation/i),
    ).toBeInTheDocument();
  });

  it('shows "Done" description when at Done stage', () => {
    render(<TransactionStepper currentStage={TxStage.Done} />);
    expect(
      screen.getByText(/Stream created successfully/i),
    ).toBeInTheDocument();
  });

  it('shows the failed stage in red with an error message', () => {
    render(
      <TransactionStepper
        currentStage={TxStage.Confirming}
        failedStage={TxStage.Confirming}
        errorMessage="Network timeout"
      />,
    );

    expect(screen.getByText(/Failed at: Confirming/i)).toBeInTheDocument();
    expect(screen.getByText(/Network timeout/i)).toBeInTheDocument();
  });

  it('does not show the description text when there is a failure', () => {
    render(
      <TransactionStepper
        currentStage={TxStage.Submitting}
        failedStage={TxStage.Submitting}
        errorMessage="Rejected by user"
      />,
    );

    // The stage description ("Broadcasting to the Soroban network…") should
    // NOT be shown when there is a failed stage — only the error message.
    expect(
      screen.queryByText(/Broadcasting to the Soroban network/i),
    ).not.toBeInTheDocument();
  });

  it('has an accessible label for the progress region', () => {
    render(<TransactionStepper currentStage={TxStage.Building} />);
    expect(
      screen.getByRole('generic', { name: 'Transaction progress' }),
    ).toBeInTheDocument();
  });
});
