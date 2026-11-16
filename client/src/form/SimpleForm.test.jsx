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

describe('SimpleForm – fields are InputField with aria wiring', () => {
  it('marks invalid fields after submit and clears aria-invalid as soon as the value is fixed', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    const name = screen.getByLabelText('Tên');
    expect(name).toHaveAttribute('aria-invalid', 'false');

    await user.click(screen.getByRole('button', { name: 'Gửi' }));
    for (const label of ['Tên', 'Email', 'Tuổi']) {
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
    }
    expect(name).toHaveAccessibleDescription('Vui lòng nhập tên');
    expect(screen.getAllByRole('alert')).toHaveLength(3);

    await user.type(name, 'Ada');
    expect(name).toHaveAttribute('aria-invalid', 'false');
    expect(name).not.toHaveAttribute('aria-describedby');
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });
});

describe('SimpleForm – ShowData on submit', () => {
  const inspector = () => document.querySelector('dl.json-inspector');

  async function fill(user, { name, email, age }) {
    for (const [label, value] of [['Tên', name], ['Email', email], ['Tuổi', age]]) {
      const input = screen.getByLabelText(label);
      await user.clear(input);
      if (value) await user.type(input, value);
    }
  }

  it('does not show the inspector before any submit', () => {
    render(<SimpleForm />);
    expect(inspector()).toBeNull();
  });

  it('does not show the inspector when submit is invalid', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    await fill(user, { name: 'Ada', email: 'not-an-email', age: '36' });
    await user.click(screen.getByRole('button', { name: 'Gửi' }));
    expect(inspector()).toBeNull();
  });

  it('shows the submitted data (trimmed, age as number) after a valid submit', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    await fill(user, { name: '  Ada Lovelace ', email: 'ada@example.com', age: '36' });
    await user.click(screen.getByRole('button', { name: 'Gửi' }));

    const dl = inspector();
    expect(dl).not.toBeNull();
    const defs = [...dl.querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(defs).toEqual(['Ada Lovelace', 'ada@example.com', '36']);
    expect(screen.getByRole('heading', { name: 'Dữ liệu đã gửi' })).toBeInTheDocument();
  });

  it('keeps showing the last submitted snapshot while the user edits, until the next submit', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    await fill(user, { name: 'Ada', email: 'ada@example.com', age: '36' });
    await user.click(screen.getByRole('button', { name: 'Gửi' }));

    await user.type(screen.getByLabelText('Tên'), 'X');
    expect(inspector().querySelector('dd').textContent).toBe('Ada');
  });

  it('hides the inspector again when a later submit is invalid', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    await fill(user, { name: 'Ada', email: 'ada@example.com', age: '36' });
    await user.click(screen.getByRole('button', { name: 'Gửi' }));
    expect(inspector()).not.toBeNull();

    await user.clear(screen.getByLabelText('Email'));
    await user.click(screen.getByRole('button', { name: 'Gửi' }));
    expect(inspector()).toBeNull();
  });
});
