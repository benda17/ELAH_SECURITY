/**
 * Allows tsx seed scripts to import Next.js server modules that use
 * `import "server-only"`.
 */
const Module = require("node:module");
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.apply(this, arguments);
};
