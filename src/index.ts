export type { ExtractErr, ExtractOk, ExtractValue, Pair } from "./types";
export type { Result } from "./result";
export { Ok_ as Ok, Err_ as Err } from "./result";
export { AsyncResult } from "./async";
export * from "./static";

// Export static methods as a namespace for convenience
import * as _result from "./static";

/**
 * Namespace containing static utility methods for working with Result objects.
 * These methods are also exported seperately.
 */
export const result = _result;
