const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTEGER_RE = /^-?\d+$/;

export const AGE_MIN = 1;
export const AGE_MAX = 120;

/**
 * Pure, synchronous validation. Returns { field: message } for invalid fields only,
 * so `Object.keys(errors).length === 0` means the form is valid.
 */
export function validateForm({ name = '', email = '', age = '' }) {
  const errors = {};

  const trimmedName = name.trim();
  if (!trimmedName) errors.name = 'Vui lòng nhập tên';
  else if (trimmedName.length < 2) errors.name = 'Tên phải có ít nhất 2 ký tự';

  const trimmedEmail = email.trim();
  if (!trimmedEmail) errors.email = 'Vui lòng nhập email';
  else if (!EMAIL_RE.test(email)) errors.email = 'Email không hợp lệ';

  const trimmedAge = String(age).trim();
  if (!trimmedAge) errors.age = 'Vui lòng nhập tuổi';
  else if (!INTEGER_RE.test(trimmedAge)) errors.age = 'Tuổi phải là số nguyên';
  else {
    const n = Number(trimmedAge);
    if (n < AGE_MIN || n > AGE_MAX) errors.age = `Tuổi phải từ ${AGE_MIN} đến ${AGE_MAX}`;
  }

  return errors;
}
