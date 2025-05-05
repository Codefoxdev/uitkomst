import type { Result, Err } from "./result";
import { result, Ok } from "./result";

/**
 * Utility type that extracts the `Err` type out of a result.
 */
type ResultError<R> = R extends Err<infer E> ? E : never;

export function use<A, B>(
  callback: () => Generator<B, A, unknown>,
): Result<A, ResultError<B>> {
  const gen = callback();

  while (true) {
    const res = gen.next();

    if (res.done) return Ok(res.value);
    else if (result.isErr(res.value)) return res.value as Err<ResultError<B>>;
  }
}
