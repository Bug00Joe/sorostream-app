/**
 * DurationPicker – edge-case test suite
 *
 * Covers the scenarios called out in the acceptance criteria:
 *   1. days=1, hours=0, minutes=0  → onChange(86 400)
 *   2. max days value (days=3650)  → onChange receives correct seconds
 *   3. Changing hours updates total without resetting days
 *   4. All-zero input              → onChange(0)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DurationPicker from '../DurationPicker';

describe('DurationPicker – edge cases', () => {
  it('days=1, hours=0, minutes=0 → onChange(86400)', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '1' } });

    // Only days set; hours and minutes are still at initial zero.
    expect(onChange).toHaveBeenLastCalledWith(86_400);
  });

  it('max days value (days=3650) → onChange receives correct seconds', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '3650' } });

    expect(onChange).toHaveBeenLastCalledWith(3650 * 86_400);
  });

  it('a value beyond the days max (e.g. 9999) is clamped to 3650', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '9999' } });

    // Component clamps to max=3650; seconds = 3650 * 86400
    expect(onChange).toHaveBeenLastCalledWith(3650 * 86_400);
  });

  it('changing hours updates the total without resetting days', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    // Set days first, then change hours – days must be preserved.
    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '5' } });

    // Expected: 2 days + 5 hours (minutes still 0)
    expect(onChange).toHaveBeenLastCalledWith(2 * 86_400 + 5 * 3_600);
  });

  it('changing minutes updates the total without resetting days or hours', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '30' } });

    expect(onChange).toHaveBeenLastCalledWith(1 * 86_400 + 2 * 3_600 + 30 * 60);
  });

  it('all-zero input → onChange(0)', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    // Set each field to a non-zero value first so a subsequent change to 0
    // is a real state transition that triggers onChange.
    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '15' } });

    // Now zero them all out — each change must fire onChange with the
    // combined total that includes the zeroed field.
    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(0 * 86_400 + 3 * 3_600 + 15 * 60);

    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(0 * 86_400 + 0 * 3_600 + 15 * 60);

    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('hours field is clamped at max 23 and minutes at max 59', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '24' } });
    // Clamped to 23
    expect(onChange).toHaveBeenLastCalledWith(23 * 3_600);

    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '60' } });
    // Clamped to 59; hours still at clamped 23
    expect(onChange).toHaveBeenLastCalledWith(23 * 3_600 + 59 * 60);
  });

  it('negative values are floored to zero', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '-1' } });
    expect(onChange).toHaveBeenLastCalledWith(0);

    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '-3' } });
    expect(onChange).toHaveBeenLastCalledWith(0);

    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '-10' } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});
