import { render, screen, fireEvent } from '@testing-library/react';
import DurationPicker from '../DurationPicker';

describe('DurationPicker', () => {
  it('renders three input fields for days, hours, and minutes', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    expect(screen.getByLabelText('Days')).toBeInTheDocument();
    expect(screen.getByLabelText('Hours')).toBeInTheDocument();
    expect(screen.getByLabelText('Minutes')).toBeInTheDocument();
  });

  it('calls onChange with correct seconds when days change', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    const daysInput = screen.getByLabelText('Days');
    fireEvent.change(daysInput, { target: { value: '2' } });

    expect(onChange).toHaveBeenCalledWith(2 * 86_400);
  });

  it('calls onChange with correct seconds when hours change', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    const hoursInput = screen.getByLabelText('Hours');
    fireEvent.change(hoursInput, { target: { value: '3' } });

    expect(onChange).toHaveBeenCalledWith(3 * 3_600);
  });

  it('calls onChange with correct seconds when minutes change', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    const minutesInput = screen.getByLabelText('Minutes');
    fireEvent.change(minutesInput, { target: { value: '30' } });

    expect(onChange).toHaveBeenCalledWith(30 * 60);
  });

  it('calculates total seconds correctly with all fields', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Days'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Hours'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '30' } });

    expect(onChange).toHaveBeenLastCalledWith(1 * 86_400 + 2 * 3_600 + 30 * 60);
  });

  it('clamps values to max limits', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    const hoursInput = screen.getByLabelText('Hours');
    fireEvent.change(hoursInput, { target: { value: '25' } });

    expect(onChange).toHaveBeenCalledWith(23 * 3_600);
  });

  it('prevents negative values', () => {
    const onChange = vi.fn();
    render(<DurationPicker onChange={onChange} />);

    const minutesInput = screen.getByLabelText('Minutes');
    fireEvent.change(minutesInput, { target: { value: '-5' } });

    expect(onChange).toHaveBeenCalledWith(0);
  });
});
