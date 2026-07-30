import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import FlowRatePreview from '../FlowRatePreview';

vi.mock('@/components/FiatDisplay', () => ({
  default: () => null,
}));

describe('FlowRatePreview', () => {
  it('renders nothing when amount is empty', () => {
    const { container } = render(<FlowRatePreview amount="" durationSeconds={3600} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when duration is zero', () => {
    const { container } = render(<FlowRatePreview amount="100" durationSeconds={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when amount is invalid', () => {
    const { container } = render(<FlowRatePreview amount="invalid" durationSeconds={3600} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when amount is zero', () => {
    const { container } = render(<FlowRatePreview amount="0" durationSeconds={3600} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders flow rate preview with valid inputs', () => {
    render(<FlowRatePreview amount="100" durationSeconds={3600} />);

    expect(screen.getByText('Flow Rate Preview')).toBeInTheDocument();
    expect(screen.getByText(/Per second/)).toBeInTheDocument();
    expect(screen.getByText(/Per hour/)).toBeInTheDocument();
    expect(screen.getByText(/Per day/)).toBeInTheDocument();
    expect(screen.getByText(/Per month/)).toBeInTheDocument();
  });

  it('calculates per second correctly', () => {
    render(<FlowRatePreview amount="100" durationSeconds={3600} />);
    expect(screen.getByText('0.0277778 USDC')).toBeInTheDocument();
  });

  it('calculates per hour correctly', () => {
    render(<FlowRatePreview amount="100" durationSeconds={3600} />);
    expect(screen.getByText('100.0000000 USDC')).toBeInTheDocument();
  });
});
