export type { ExtractErr, ExtractOk, ExtractValue, Pair } from "./types";
export type { Result } from "./result";
export { Ok, Err } from "./result";
export * from "./result/static";

// Export static methods as a namespace for convenience
import * as _result from "./result/static";

/**
 * Namespace containing static utility methods for working with Result objects.
 * These methods are also exported seperately.
 */
export const result = _result;
