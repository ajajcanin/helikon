/**
 * Remembers in this browser that someone here uses the admin, so the shop can offer a way back to it. Only a
 * convenience: the shop's pages are the same for everyone, and the admin itself still asks for a login.
 */
const KEY = "helikon-staff";

export function markStaff() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
}

export function forgetStaff() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function isStaff() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
