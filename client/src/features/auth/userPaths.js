// Who is logged in is part of the URL: /citizen/U-1001/dashboard, /technician/T-101/tasks/JOB-1, /admin/A-001/grid.
// Nothing is saved in the browser, so a refresh keeps you on the same page as the same person, and different tabs
// can be different people (a citizen, a technician and the admin side by side).
const ROLE_PATH = /^\/(citizen|technician|admin)\/([^/]+)/;

// The logged-in user's id, read from the current address.
export const userIdFromPath = (pathname = window.location.pathname) => {
  const match = ROLE_PATH.exec(pathname);
  return match ? decodeURIComponent(match[2]) : null;
};

export const homeFor = (user) => (user ? `/${user.role}/${encodeURIComponent(user.id)}/dashboard` : '/login');

// Turns an app path such as '/citizen/report' into the current user's '/citizen/U-1001/report'.
export const withUser = (path) => {
  const id = userIdFromPath();
  return id ? path.replace(/^\/(citizen|technician|admin)(?=\/|$)/, `/$1/${encodeURIComponent(id)}`) : path;
};
