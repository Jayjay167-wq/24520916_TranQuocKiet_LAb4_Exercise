import { useState } from 'react';
import { InputField } from '../form/InputField.jsx';

// Same rule as the server (client/server validation parity): both fields non-empty after trim.
export function validateMessage({ author, text }) {
  const errors = {};
  if (!author.trim()) errors.author = 'Vui lòng nhập tên';
  if (!text.trim()) errors.text = 'Vui lòng nhập nội dung';
  return errors;
}

export function MessageForm({ onSubmit }) {
  const [values, setValues] = useState({ author: '', text: '' });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Derived in render, like SimpleForm.
  const errors = validateMessage(values);
  const isValid = Object.keys(errors).length === 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!isValid || sending) return;

    setSending(true);
    setSubmitError(null);
    try {
      await onSubmit({ author: values.author.trim(), text: values.text.trim() });
      // Keep the author for the next message, clear only the text.
      setValues((prev) => ({ ...prev, text: '' }));
      setSubmitAttempted(false);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSending(false);
    }
  };

  const fieldError = (name) => (submitAttempted ? errors[name] : undefined);

  return (
    <form className="message-form" onSubmit={handleSubmit} noValidate>
      <InputField
        label="Tên"
        name="author"
        autoComplete="nickname"
        value={values.author}
        onChange={handleChange}
        error={fieldError('author')}
      />
      <InputField
        label="Nội dung"
        name="text"
        autoComplete="off"
        value={values.text}
        onChange={handleChange}
        error={fieldError('text')}
      />
      {submitError && (
        <p role="alert" className="form-error">
          Không gửi được: {submitError}
        </p>
      )}
      <button type="submit" disabled={sending}>
        {sending ? 'Đang gửi…' : 'Gửi tin'}
      </button>
    </form>
  );
}
