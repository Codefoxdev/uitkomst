import type {
  Pair,
  Yields,
  Tagged,
  PromiseIf,
  MaybePromise,
  ResultLike,
} from "./types";
import { isPromise } from "./helper";
import { AsyncResult } from "./async";

export function Ok_(): Ok<void>;
export function Ok_<A>(val: A): Ok<A>;
export function Ok_<A>(val?: A) {
  if (val === undefined) return new Ok(undefined);
  return new Ok(val);
}

export function Err_(): Err<void>;
export function Err_<B>(val: B): Err<B>;
export function Err_<B>(val?: B) {
  if (val === undefined) return new Err(undefined);
  return new Err(val);
}

/**
 * The `Result` type represents a value that can be either a success (`Ok`) or a failure (`Err`).
 * This implementation is heavily inspired by Gleam's Result type, however it also contains some additional methods
 * and the properties are in camelCase instead of snake_case to follow JavaScript conventions.
 */
export type Result<A, B> = Ok<A> | Err<B>;
export type Ok_<A> = Result<A, never>;
export type Err_<B> = Result<never, B>;

abstract class Result_<A, B> implements Yields<A, B>, Tagged<"Result"> {
  readonly _tag = "Result";
  declare readonly _type: "Ok" | "Err" | "Async";
  declare readonly _val: A | B;
  abstract get ok(): boolean;
  abstract get err(): boolean;

  abstract lazyOr(callback: () => Result<A, B>): Result<A, B>;
  abstract lazyUnwrap(callback: () => A): A;

  /**
   * Returns a Result that updates the value held within the `Ok` with the result of the `callback` function.
   * The value that is returned from `callback` is used to update the value with.
   * If this is an `Err` rather than `Ok`, `callback` is not called and it returns this result.
   */
  abstract map<C>(callback: (val: Awaited<A>) => C): Result<PromiseIf<A, C>, B>;

  /**
   * Updates the value held within the `Err` of this result by calling `callback` with it.
   * The value that is returned from `callback` is used to replace the value with.
   * If this is an `Ok` rather than `Err`, `callback` is not called and it returns this result.
   */
  abstract mapErr<C>(
    callback: (val: Awaited<B>) => C,
  ): Result<A, PromiseIf<B, C>>;

  /**
   * Returns this value if it is `Ok`, otherwise returns the `fallback` argument.
   */
  abstract or(fallback: Result<A, B>): Result<A, B>;

  /**
   * Replaces the value held within the `Ok` of this result with the `val` argument.
   * If this is an `Err` rather than `Ok`, the value is not replaced and this `Result` stays the same.
   */
  abstract replace<C>(val: C): Result<C, B>;

  /**
   * Replaces the value held within the `Err` of this result with the `val` argument.
   * If this is an `Ok` rather than `Err`, the value is not replaced and this `Result` stays the same.
   */
  abstract replaceErr<C>(val: C): Result<A, C>;

  /**
   * 'Taps' into the result, calling `callback` with the value if this is an `Ok`.
   * This doesn't modify the result, if you want to modify the `Ok` value, use `map` instead.
   */
  abstract tap(callback: (val: Awaited<A>) => void): Result<A, B>;

  /**
   * 'Taps' into the result, calling `callback` with the value if this is an `Err`.
   * This doesn't modify the result, if you want to modify the `Err` value, use `mapErr` instead.
   */
  abstract tapErr(callback: (val: Awaited<B>) => void): Result<A, B>;

  /**
   * Returns an array of length 2, where the first element is the `Ok` value and the second element is the `Err` value.
   */
  abstract toPair(): Pair<A | null, B | null>;

  /**
   * Extracts the `Ok` value, returning the `fallback` argument if the result is an `Err`.
   */
  abstract unwrap(fallback: A): A;

  /**
   * Extracts the `Err` value, returning the `fallback` argument if the result is an `Ok`.
   */
  abstract unwrapErr(fallback: B): B;

  *[Symbol.iterator](this: Result<A, B>) {
    if (this.ok) return this.unwrap();

    yield this.unwrapErr();
    throw new Error(
      "Err value iterator fully consumed. This iterator is designed to yield its error value and then terminate execution flow.",
    );
  }

  protected get promise(): Promise<Awaited<this["_val"]>> {
    return Promise.resolve(this._val);
  }
}

export class Ok<A> extends Result_<A, never> {
  override readonly _type = "Ok";
  override readonly ok = true;
  override readonly err = false;

  constructor(override readonly _val: A) {
    super();
  }

  lazyOr(): Ok<A> {
    return this;
  }

  lazyUnwrap(): A {
    return this._val;
  }

  map<C>(callback: (val: Awaited<A>) => C): Ok<PromiseIf<A, C>> {
    if (isPromise(this._val))
      return new Ok(this.promise.then(callback) as PromiseIf<A, C>);
    else return new Ok(callback(this._val as Awaited<A>) as PromiseIf<A, C>);
  }

  mapErr(): Ok<A> {
    return this;
  }

  or(): Ok<A> {
    return this;
  }

  replace<C>(val: C): Ok<C> {
    return new Ok(val);
  }

  replaceErr(): Ok<A> {
    return this;
  }

  tap(callback: (val: Awaited<A>) => void): this {
    if (isPromise(this._val)) this.promise.then(callback);
    else callback(this._val as Awaited<A>);

    return this;
  }

  tapErr(): this {
    return this;
  }

  toPair(): Pair<A | null, null> {
    return [this._val, null];
  }

  /**
   * Updates this `Ok` result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the `Ok` with an `Err`.)
   * If this is an `Err` rather than an `Ok`, the function is not called and the original `Err` is returned.
   * Use `tryAsync` when dealing with async values.
   */
  try<R extends Result<any, any>>(callback: (val: A) => R): R {
    return callback(this._val);
  }

  /**
   * Async version of `try`.
   */
  tryAsync<R extends MaybePromise<Tagged<"Result">>>(
    callback: (val: Awaited<A>) => R,
  ): R extends MaybePromise<ResultLike<infer Ok, infer Err>>
    ? AsyncResult<Ok, Err>
    : never {
    const res = AsyncResult.from(
      this.promise.then(callback) as Promise<Result<any, any>>,
    );

    return res as R extends MaybePromise<ResultLike<infer Ok, infer Err>>
      ? AsyncResult<Ok, Err>
      : never;
  }

  /**
   * Updates this `Err` result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the `Err` with an `Ok`.)
   * If this is an `Ok` rather than an `Err`, the function is not called and the original `Ok` is returned.
   * Use `TryRecoverAsync` when dealing with async values.
   */
  tryRecover(): Ok<A> {
    return this;
  }

  /**
   * Async version of `tryRecover`.
   */
  tryRecoverAsync(): AsyncResult<Awaited<A>, never> {
    return AsyncResult.ok(this._val as Awaited<A>);
  }

  unwrap(): A {
    return this._val;
  }

  unwrapErr<B>(fallback: B): B {
    return fallback;
  }
}

export class Err<B> extends Result_<never, B> {
  override readonly _type = "Err";
  override readonly ok = false;
  override readonly err = true;

  constructor(override readonly _val: B) {
    super();
  }

  lazyOr<A>(callback: () => Result<A, B>): Result<A, B> {
    return callback();
  }

  lazyUnwrap<A>(callback: () => A): A {
    return callback();
  }

  map(): Err<B> {
    return this;
  }

  mapErr<C>(callback: (val: Awaited<B>) => C): Err<PromiseIf<B, C>> {
    if (isPromise(this._val))
      return new Err(this.promise.then(callback) as PromiseIf<B, C>);
    else return new Err(callback(this._val as Awaited<B>) as PromiseIf<B, C>);
  }

  or<A>(fallback: Result<A, B>): Result<A, B> {
    return fallback;
  }

  replace(): Err<B> {
    return this;
  }

  replaceErr<C>(val: C): Err<C> {
    return new Err(val);
  }

  tap(): Err<B> {
    return this;
  }

  tapErr(callback: (val: Awaited<B>) => void): Err<B> {
    if (isPromise(this._val)) this.promise.then(callback);
    else callback(this._val as Awaited<B>);

    return this;
  }

  toPair(): Pair<null, B | null> {
    return [null, this._val];
  }

  /**
   * Updates this `Ok` result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the `Ok` with an `Err`.)
   * If this is an `Err` rather than an `Ok`, the function is not called and the original `Err` is returned.
   * Use `tryAsync` when dealing with async values.
   */
  try(): Err<B> {
    return this;
  }

  /**
   * Async version of `try`.
   */
  tryAsync(): AsyncResult<never, Awaited<B>> {
    return AsyncResult.err(this._val as Awaited<B>);
  }

  /**
   * Updates this `Err` result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the `Err` with an `Ok`.)
   * If this is an `Ok` rather than an `Err`, the function is not called and the original `Ok` is returned.
   * Use `TryRecoverAsync` when dealing with async values.
   */
  tryRecover<R extends Result<any, any>>(callback: (val: B) => R): R {
    return callback(this._val);
  }

  /**
   * Async version of `tryRecover`.
   */
  tryRecoverAsync<R extends MaybePromise<Tagged<"Result">>>(
    callback: (val: Awaited<B>) => R,
  ): R extends MaybePromise<ResultLike<infer Ok, infer Err>>
    ? AsyncResult<Ok, Err>
    : never {
    const res = AsyncResult.from(
      this.promise.then(callback) as Promise<Result<any, any>>,
    );

    return res as R extends MaybePromise<ResultLike<infer Ok, infer Err>>
      ? AsyncResult<Ok, Err>
      : never;
  }

  unwrap<A>(fallback: A): A {
    return fallback;
  }

  unwrapErr(): B {
    return this._val;
  }
}
