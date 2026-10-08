import { main } from './cli.js';

// No process.exit(): writes to a pipe are async, exiting right after write cuts the tail off.
main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
