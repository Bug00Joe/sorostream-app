import { render, screen, fireEvent, act } from '@testing-library/react';
import CopyButton from '../CopyButton';

const mockWriteText = vi.fn();

beforeAll(() => {
  Object.assign(navigator, {
    clipboard: { writeText: mockWriteText },
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CopyButton', () => {
  it('renders a copy button with default aria-label', () => {
    render(<CopyButton value="GBAM...BOEP" />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('renders a copy button with custom aria-label', () => {
    render(<CopyButton value="GBAM...BOEP" label="Copy address" />);
    expect(screen.getByRole('button', { name: 'Copy address' })).toBeInTheDocument();
  });

  it('copies the value to clipboard on click', async () => {
    mockWriteText.mockResolvedValueOnce(undefined);
    render(<CopyButton value="GBAMK6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5" />);

    const button = screen.getByRole('button', { name: 'Copy' });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockWriteText).toHaveBeenCalledWith('GBAMK6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5');
  });

  it('shows copied state after clicking and reverts after 2 seconds', async () => {
    vi.useFakeTimers();
    mockWriteText.mockResolvedValueOnce(undefined);
    render(<CopyButton value="GBAM...BOEP" />);

    const button = screen.getByRole('button', { name: 'Copy' });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();

    vi.useRealTimers();
  });
});
