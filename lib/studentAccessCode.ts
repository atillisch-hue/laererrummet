const STUDENT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const STUDENT_CODE_LENGTH = 8;

export function generateStudentAccessCode(): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure random generator is unavailable in this browser.");
  }

  const bytes = new Uint8Array(STUDENT_CODE_LENGTH);
  crypto.getRandomValues(bytes);

  // The alphabet has exactly 32 symbols, so masking to 5 bits is unbiased.
  return Array.from(bytes, (byte) => STUDENT_CODE_ALPHABET[byte & 31]).join("");
}
