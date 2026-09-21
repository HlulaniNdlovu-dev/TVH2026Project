// Runs async jobs one at a time. Stops two requests (or a request and the background tick)
// from creating the same incident twice while they wait on the database.
let tail = Promise.resolve();

export function runExclusive(fn) {
  const run = tail.then(fn, fn);
  tail = run.catch(() => {});
  return run;
}
