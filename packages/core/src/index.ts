export type {
  AssertErr,
  AssertOk,
  FlattenResult,
  ProxyFunction,
  Unwrap,
  UnwrapBoth,
  UnwrapErr,
  WrapFunction,
} from "./static";
export type {
  AsyncResultLike,
  AsyncYieldable,
  AsyncYields,
  InferErr,
  InferOk,
  InferValue,
  MaybePromise,
  Pair,
  ResultLike,
  ResultType,
  Tag,
  Tagged,
  Trace,
  Yieldable,
  Yields,
} from "./types";
export { AsyncResult } from "./async";
export { AssertError, ExpectedResultError, YieldError } from "./error";
export { Result } from "./namespace";
export { AbstractResult } from "./result";
export * from "./static";

import type { Err as _Err, Ok as _Ok } from "./result";
import { Result } from "./namespace";

export type Ok<A> = _Ok<A>;
export type Err<E> = _Err<E>;

export function Ok(): Ok<void>;
export function Ok<A>(value: A): Ok<A>;
export function Ok<A>(value?: A) {
  if (value === undefined) return new Result.Ok<void>(undefined);
  else return new Result.Ok<A>(value);
}

export function Err(): Err<void>;
export function Err<E>(error: E): Err<E>;
export function Err<E>(error?: E) {
  if (error === undefined) return new Result.Err<void>(undefined);
  else return new Result.Err<E>(error);
}
