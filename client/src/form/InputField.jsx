import { useId } from 'react';

export const InputField = ({ label, error, ...props }) => {
  // 1. Unique ID generation & error linking (slide 25)
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      {/* props spread first so the contract attributes below always win */}
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <span id={errorId} role="alert" className="field-error">
          {error}
        </span>
      )}
    </div>
  );
};
