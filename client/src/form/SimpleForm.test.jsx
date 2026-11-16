import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimpleForm } from './SimpleForm.jsx';
import { useFormContext } from './FormContext.js';

describe('SimpleForm', () => {
  it('renders the 3 labelled fields: tên, email, tuổi', () => {
    render(<SimpleForm />);
    expect(screen.getByLabelText('Tên')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Tuổi')).toHaveAttribute('type', 'number');
  });

  it('hides errors until the first submit, then shows every invalid field', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    expect(screen.queryByText('Vui lòng nhập tên')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Gửi' }));
    expect(screen.getByText('Vui lòng nhập tên')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập email')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập tuổi')).toBeInTheDocument();
  });

  it('recomputes errors in the same render as the keystroke (no effect lag)', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    await user.click(screen.getByRole('button', { name: 'Gửi' }));

    const email = screen.getByLabelText('Email');
    await user.type(email, 'ada');
    expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();

    await user.type(email, '@example.com');
    expect(screen.queryByText('Email không hợp lệ')).not.toBeInTheDocument();
    expect(screen.queryByText('Vui lòng nhập email')).not.toBeInTheDocument();
  });
});

describe('useFormContext', () => {
  it('throws a clear error when used outside SimpleForm', () => {
    function Orphan() {
      useFormContext();
      return null;
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/useFormContext must be used inside <SimpleForm>/);
    spy.mockRestore();
  });
});
