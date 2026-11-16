import { useId, useState } from 'react';
import { FormContext, useFormContext } from './FormContext.js';
import { validateForm } from './validateForm.js';
import { InputField } from './InputField.jsx';
import { ShowData } from './ShowData.jsx';
import './SimpleForm.css';

const initial = { name: '', email: '', age: '' };

// Normalised payload for a valid form: trimmed strings, age as a number.
const toSubmission = ({ name, email, age }) => ({
  name: name.trim(),
  email: email.trim(),
  age: Number(age),
});

const FIELDS = [
  { name: 'name', label: 'Tên', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'age', label: 'Tuổi', type: 'number', inputMode: 'numeric', min: 1, max: 120 },
];

export const SimpleForm = () => {
  const [values, setValues] = useState(initial);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  // Snapshot of the last valid submit; null = nothing to inspect.
  const [submitted, setSubmitted] = useState(null);
  const inspectorHeadingId = useId();

  // Synchronous derived validation in the render pass — no useEffect.
  const errors = validateForm(values);
  const isValid = Object.keys(errors).length === 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    // isValid comes from this render's derived errors — no extra pass needed.
    setSubmitted(isValid ? toSubmission(values) : null);
  };

  return (
    <FormContext.Provider value={{ values, errors, isValid, submitAttempted, handleChange }}>
      <form className="simple-form" onSubmit={handleSubmit} noValidate>
        <FormUI />
        <button type="submit">Gửi</button>
      </form>
      {/* Live region exists before content appears so screen readers announce the result. */}
      <div aria-live="polite">
        {submitted && (
          <section className="inspector" aria-labelledby={inspectorHeadingId}>
            <h2 id={inspectorHeadingId}>Dữ liệu đã gửi</h2>
            <ShowData data={submitted} />
          </section>
        )}
      </div>
    </FormContext.Provider>
  );
};

function FormUI() {
  const { values, errors, submitAttempted, handleChange } = useFormContext();
  return FIELDS.map(({ name, label, ...inputProps }) => (
    <InputField
      key={name}
      label={label}
      name={name}
      value={values[name]}
      onChange={handleChange}
      error={submitAttempted ? errors[name] : undefined}
      {...inputProps}
    />
  ));
}
