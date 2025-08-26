import type { Result as _Result } from "./result";
import { AsyncResult } from "./async";
import { Err, Ok } from "./result";
import * as _static from "./static";

/**
 * Namespace containing static utility methods for working with Result objects,
 * as well as the {@link Ok}, {@link Err} and {@link AsyncResult} classes.
 * These methods are also exported seperately.
 */
export const Result = {
  ..._static,
  Ok: Ok,
  Err: Err,
  AsyncResult: AsyncResult,
};

/**
 * @type
 * The result type
 */
export type Result<A, B> = _Result<A, B>;
