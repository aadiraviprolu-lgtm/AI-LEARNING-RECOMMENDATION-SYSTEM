// Client-side validation mirrors the backend rules (the backend remains the source of truth).
export const validateName = (v, label = 'Name') => (!v.trim() ? `${label} is required` : v.length > 150 ? `${label} must be at most 150 characters` : '');

export function validateRegister({ fullName, email, password }) {
  const e = {};
  if (fullName.trim().length < 2) e.fullName = 'Full name must be at least 2 characters';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address';
  if (password.length < 8) e.password = 'Password must be at least 8 characters';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) e.password = 'Password must contain a letter and a number';
  return e;
}
export function validateLogin({ email, password }) {
  const e = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address';
  if (!password) e.password = 'Password is required';
  return e;
}
export function validateProject(f) {
  const e = {};
  const n = validateName(f.name, 'Project name'); if (n) e.name = n;
  if (f.startDate && f.endDate && f.endDate < f.startDate) e.endDate = 'End date must be on or after start date';
  return e;
}
export function validateTask(f) {
  const e = {};
  const n = validateName(f.name, 'Task name'); if (n) e.name = n;
  return e;
}
