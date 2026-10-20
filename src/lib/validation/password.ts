// PRD USR-002: at least 8 characters and not a common password.
const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyuiop",
  "qwerty123",
  "iloveyou",
  "admin123",
  "letmein1",
  "welcome1",
  "abc12345",
  "11111111",
  "00000000",
]);

/** A message describing why a new password is not acceptable, or null when it is fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 200) return "Use at most 200 characters.";
  if (COMMON.has(password.toLowerCase())) return "That password is too common. Choose another.";
  return null;
}
