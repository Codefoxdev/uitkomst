import type { ExtractErr } from "./types";
import type { Result, Err } from "./result";
import { result, Ok } from "./result";

export function use<A, B>(
  callback: () => Generator<B, A, unknown>,
): Result<A, ExtractErr<B>> {
  const gen = callback();

  while (true) {
    const res = gen.next();

    if (res.done) return Ok(res.value);
    else if (result.isErr(res.value)) return res.value as Err<ExtractErr<B>>;
  }
}
