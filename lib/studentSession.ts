export const STUDENT_SESSION_KEY = "klassevaerelset-student-session";
export const STUDENT_ID_KEY = "klassevaerelset-student-id";

export function getStudentSessionToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(STUDENT_SESSION_KEY) || "";
}

export function getStoredStudentId() {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(STUDENT_ID_KEY);
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function storeStudentSession(token: string, studentId: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STUDENT_SESSION_KEY, token);
  sessionStorage.setItem(STUDENT_ID_KEY, String(studentId));
  sessionStorage.removeItem("klassevaerelset-student-code");
}

export function clearStudentSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STUDENT_SESSION_KEY);
  sessionStorage.removeItem(STUDENT_ID_KEY);
  sessionStorage.removeItem("klassevaerelset-student-code");
}
