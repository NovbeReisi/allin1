// Shared auth helpers used across every page.
// Password hash (SHA-256) is stored here instead of the plaintext password.
const AUTH_HASH = "f77e87dcc91389eceebea68e1bbf452a365823979d4a03ceae10a87c2aa1db46";
const AUTH_KEY = "m11a_authed";

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

// Call this at the top of every protected page (hub, part1-4, exam).
// If not authed, redirect back to the password gate.
function requireAuth() {
  if (!isAuthed()) {
    window.location.href = "index.html";
  }
}
