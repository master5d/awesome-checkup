import { main } from './cli.js';

// No process.exit(): writes to a pipe are async, exiting right after write cuts the tail off.
main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((e) => {
    // 1 means "below --min-stage because of a miss"; an internal error must not look like a verdict
    console.error('awesome-checkup: internal error —', e);
    process.exitCode = 4;
  });
