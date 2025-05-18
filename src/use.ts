import type { ExtractErr } from "./types";
import type { Result } from "./result";
import { result, Ok, Err } from "./result";

/**
 * The use method allows you to more easily work with result types, similar to Gleam's use statement.
 * @todo
 */
export function use<A, B>(
  callback: () => Generator<B, A, never>,
): Result<A, B> {
  const res = callback().next();
  if (res.done) return Ok(res.value);
  else return Err(res.value);
}
