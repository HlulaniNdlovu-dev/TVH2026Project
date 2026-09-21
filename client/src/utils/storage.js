// Session info lives in localStorage. Every access is wrapped because storage can be blocked or full.
const USER_KEY = 'powerlink_user';

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable: the session just will not survive a refresh */
  }
}

export function clearStoredUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* nothing to clear */
  }
}
