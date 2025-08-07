export type { Result } from "./result";
export type {
  AsyncYields,
  InferErr,
  InferOk,
  InferValue,
  Pair,
  ResultLike,
  Tag,
  Tagged,
  Yields,
} from "./types";
export { AsyncResult } from "./async";
export { AssertError } from "./error";
export { AbstractResult, Err, Ok } from "./result";
export * from "./static";

// Export static methods as a namespace for convenience
import * as _result from "./static";

/**
 * Namespace containing static utility methods for working with Result objects.
 * These methods are also exported seperately.
 */
export const result = _result;
