import { useState } from 'react';
import { FormContext, useFormContext } from './FormContext.js';
import { validateForm } from './validateForm.js';
import { InputField } from './InputField.jsx';
import './SimpleForm.css';

const initial = { name: '', email: '', age: '' };

const FIELDS = [
  { name: 'name', label: 'Tên', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'age', label: 'Tuổi', type: 'number', inputMode: 'numeric', min: 1, max: 120 },
];

export const SimpleForm = () => {
  const [values, setValues] = useState(initial);
  const [submitAttempted, setSubmitAttempted] = useState(false);

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
  };

  return (
    <FormContext.Provider value={{ values, errors, isValid, submitAttempted, handleChange }}>
      <form className="simple-form" onSubmit={handleSubmit} noValidate>
        <FormUI />
        <button type="submit">Gửi</button>
      </form>
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
