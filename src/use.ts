import type { ExtractErr } from "./types";
import type { Result } from "./result";
import { result, Ok, Err } from "./result";

/**
 * The use method allows you to more easily work with result types, similar to Gleam's use statement.
 * It makes use of a generator function with `yield*` expressions to extract `Ok` values out of results.
 * Everytime you delegate a result, using `yield*`, the {@link Ok} value is returned
 * and if it is an {@link Err}, the function stops execution and the error is returned.
 * Although it has the same behaviour as when using result chaining, it may sometimes be more convenient to use.
 *
 * @example
 * ```ts
 * // Add two numbers that are both wrapped in a Result type.
 * const num1: Result<number, Error>;
 * const num2: Result<number, Error>;
 *
 * // With result chaining
 * const res1: Result<number, Error> = result
 *   .all([num1, num2])
 *   .map((arr) => arr[0] + arr[1]);
 *
 * // With use
 * const res: Result<number, Error> = use(function* () {
 *   return (yield* num1) + (yield* num2);
 * });
 * ```
 */
export function use<A, B>(
  callback: () => Generator<B, A, never>,
): Result<A, B> {
  const res = callback().next();
  if (res.done) return Ok(res.value);
  else return Err(res.value);
}
