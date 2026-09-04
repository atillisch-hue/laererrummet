const STUDENT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const STUDENT_CODE_LENGTH = 12;

export function generateStudentAccessCode(): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure random generator is unavailable in this browser.");
  }

  const bytes = new Uint8Array(STUDENT_CODE_LENGTH);
  crypto.getRandomValues(bytes);

  // The alphabet has exactly 32 symbols, so masking to 5 bits is unbiased.
  // 12 symbols gives 60 bits of entropy; the plaintext code is shown only when issued.
  return Array.from(bytes, (byte) => STUDENT_CODE_ALPHABET[byte & 31]).join("");
}
