import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputField } from './InputField.jsx';

describe('InputField – aria contract (slide 25)', () => {
  it('binds <label> to the input via a useId-generated id', () => {
    render(<InputField label="Email" name="email" />);
    const input = screen.getByLabelText('Email');
    expect(input.id).toBeTruthy();
    expect(screen.getByText('Email')).toHaveAttribute('for', input.id);
  });

  it('gives each instance its own id (no collisions between fields)', () => {
    render(
      <>
        <InputField label="A" />
        <InputField label="B" />
      </>
    );
    expect(screen.getByLabelText('A').id).not.toBe(screen.getByLabelText('B').id);
  });

  it('without error: aria-invalid="false", no aria-describedby, no alert', () => {
    render(<InputField label="Tên" />);
    const input = screen.getByLabelText('Tên');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('with error: aria-invalid="true" and aria-describedby → `${id}-error` alert', () => {
    render(<InputField label="Tên" error="Vui lòng nhập tên" />);
    const input = screen.getByLabelText('Tên');
    const alert = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(alert).toHaveTextContent('Vui lòng nhập tên');
    expect(alert.id).toBe(`${input.id}-error`);
    expect(input).toHaveAttribute('aria-describedby', alert.id);
    expect(input).toHaveAccessibleDescription('Vui lòng nhập tên');
  });

  it('drops aria-describedby and the alert when the error clears', () => {
    const { rerender } = render(<InputField label="Tên" error="Sai" />);
    rerender(<InputField label="Tên" error="" />);
    const input = screen.getByLabelText('Tên');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('forwards input props (name, type, value, onChange)', async () => {
    const onChange = vi.fn();
    render(<InputField label="Tuổi" name="age" type="number" value="" onChange={onChange} />);
    const input = screen.getByLabelText('Tuổi');
    expect(input).toHaveAttribute('name', 'age');
    expect(input).toHaveAttribute('type', 'number');
    await userEvent.type(input, '4');
    expect(onChange).toHaveBeenCalled();
  });

  it('props cannot override the contract attributes (id / aria-*)', () => {
    render(
      <InputField label="Tên" error="Sai" id="hijack" aria-invalid={false} aria-describedby="nope" />
    );
    const input = screen.getByLabelText('Tên');
    expect(input.id).not.toBe('hijack');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', `${input.id}-error`);
  });
});
