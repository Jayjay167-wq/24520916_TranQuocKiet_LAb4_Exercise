import { validateForm } from './validateForm.js';

const valid = { name: 'Ada Lovelace', email: 'ada@example.com', age: '36' };

describe('validateForm', () => {
  it('returns an empty object for valid values', () => {
    expect(validateForm(valid)).toEqual({});
  });

  it('is pure: same input gives same output and input is not mutated', () => {
    const input = { ...valid, name: '' };
    const snapshot = { ...input };
    expect(validateForm(input)).toEqual(validateForm(input));
    expect(input).toEqual(snapshot);
  });

  describe('name', () => {
    it.each([
      ['', 'Vui lòng nhập tên'],
      ['   ', 'Vui lòng nhập tên'],
      ['A', 'Tên phải có ít nhất 2 ký tự'],
      [' A ', 'Tên phải có ít nhất 2 ký tự'],
    ])('%j → %s', (name, message) => {
      expect(validateForm({ ...valid, name })).toEqual({ name: message });
    });

    it('accepts a trimmed name of 2+ characters', () => {
      expect(validateForm({ ...valid, name: '  Al  ' })).toEqual({});
    });
  });

  describe('email', () => {
    it.each([
      ['', 'Vui lòng nhập email'],
      ['ada', 'Email không hợp lệ'],
      ['ada@', 'Email không hợp lệ'],
      ['ada@example', 'Email không hợp lệ'],
      ['ada @example.com', 'Email không hợp lệ'],
    ])('%j → %s', (email, message) => {
      expect(validateForm({ ...valid, email })).toEqual({ email: message });
    });
  });

  describe('age', () => {
    it.each([
      ['', 'Vui lòng nhập tuổi'],
      ['abc', 'Tuổi phải là số nguyên'],
      ['12.5', 'Tuổi phải là số nguyên'],
      ['0', 'Tuổi phải từ 1 đến 120'],
      ['121', 'Tuổi phải từ 1 đến 120'],
      ['-3', 'Tuổi phải từ 1 đến 120'],
    ])('%j → %s', (age, message) => {
      expect(validateForm({ ...valid, age })).toEqual({ age: message });
    });

    it.each(['1', '120', ' 42 '])('accepts %j', (age) => {
      expect(validateForm({ ...valid, age })).toEqual({});
    });
  });

  it('reports every invalid field at once', () => {
    expect(Object.keys(validateForm({ name: '', email: 'x', age: '' })).sort()).toEqual([
      'age',
      'email',
      'name',
    ]);
  });
});
