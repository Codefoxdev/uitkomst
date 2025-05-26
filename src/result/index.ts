import type { Pair, Yields } from "../types";

export const Ok = <A>(val: A): Ok<A> => new OkClass(val);
export const Err = <B>(val: B): Err<B> => new ErrClass(val);

/**
 * The `Result` type represents a value that can be either a success (`Ok`) or a failure (`Err`).
 * This implementation is heavily inspired by Gleam's Result type, however it also contains some additional methods
 * and the properties are in camelCase instead of snake_case to follow JavaScript conventions.
 */
export type Result<A, B> = Ok<A> | Err<B>;

interface BaseResult<A, B> extends Yields<A, B> {
  readonly _tag: "Ok" | "Err";
  readonly val: A | B;
  readonly ok: boolean;
  readonly err: boolean;

  lazyOr(callback: () => Result<A, B>): Result<A, B>;
  lazyUnwrap(callback: () => A): A;
  /**
   * Returns a Result that updates the value held within the `Ok` with the result of the `callback` function.
   * The value that is returned from `callback` is used to update the value with.
   * If this is an `Err` rather than `Ok`, `callback` is not called and it returns this result.
   */
  map<C>(callback: (val: A) => C): Result<C, B>;
  /**
   * Updates the value held within the `Err` of this result by calling `callback` with it.
   * The value that is returned from `callback` is used to replace the value with.
   * If this is an `Ok` rather than `Err`, `callback` is not called and it returns this result.
   */
  mapErr<C>(callback: (val: B) => C): Result<A, C>;
  /**
   * Returns this value if it is `Ok`, otherwise returns the `fallback` argument.
   */
  or(fallback: Result<A, B>): Result<A, B>;
  /**
   * Replaces the value held within the `Ok` of this result with the `val` argument.
   * If this is an `Err` rather than `Ok`, the value is not replaced and this `Result` stays the same.
   */
  replace<C>(val: C): Result<C, B>;
  /**
   * Replaces the value held within the `Err` of this result with the `val` argument.
   * If this is an `Ok` rather than `Err`, the value is not replaced and this `Result` stays the same.
   */
  replaceErr<C>(val: C): Result<A, C>;
  /**
   * 'Taps' into the result, calling `callback` with the value if this is an `Ok`.
   * This doesn't modify the result, if you want to modify the `Ok` value, use `map` instead.
   */
  tap(callback: (val: A) => void): this;
  /**
   * 'Taps' into the result, calling `callback` with the value if this is an `Err`.
   * This doesn't modify the result, if you want to modify the `Err` value, use `mapErr` instead.
   */
  tapErr(callback: (val: B) => void): this;
  toPair(): Pair<A | null, B | null>;
  //toAsync(): AsyncResult<A, B>;
  /**
   * Updates this `Ok` result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the `Ok` with an `Err`.)
   * If this is an `Err` rather than an `Ok`, the function is not called and the original `Err` is returned.
   */
  try<C>(callback: (val: A) => Result<C, B>): Result<C, B>;
  /**
   * Updates this `Err` result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the `Err` with an `Ok`.)
   * If this is an `Ok` rather than an `Err`, the function is not called and the original `Ok` is returned.
   */
  tryRecover<C>(callback: (val: B) => Result<A, C>): Result<A, C>;
  /**
   * Extracts the `Ok` value, returning the `fallback` argument if the result is an `Err`.
   */
  unwrap(fallback: A): A;
  /**
   * Extracts the `Err` value, returning the `fallback` argument if the result is an `Ok`.
   */
  unwrapErr(fallback: B): B;
}

export interface Ok<A> extends BaseResult<A, never> {
  readonly _tag: "Ok";
  readonly val: A;
  readonly ok: true;
  readonly err: false;

  lazyOr(): this;
  or(): this;
  tapErr(): this;
  mapErr(): this;
  tryRecover(): this;
  replaceErr(): this;

  lazyUnwrap(): A;
  unwrap(): A;
  unwrapErr<B>(fallback: B): B;
  map<C>(callback: (val: A) => C): Ok<C>;
  /**
   * @override Optionally provides `Err` type hints, so typescript simplifies to `Result<A, B>` instead of `Ok<A> | Err<B>`.
   */
  map<C, B>(callback: (val: A) => C): Result<C, B>;
  toPair(): Pair<A, null>;
  try<C, B>(callback: (val: A) => Result<C, B>): Result<C, B>;
  replace<C>(val: C): Ok<C>;
  /**
   * @override Optionally provides `Err` type hints, so typescript simplifies to `Result<A, B>` instead of `Ok<A> | Err<B>`.
   */
  replace<C, B>(val: C): Result<C, B>;
}

export class OkClass<A> implements Ok<A> {
  readonly _tag = "Ok";
  readonly ok = true;
  readonly err = false;

  constructor(readonly val: A) {}

  lazyOr = () => this;
  or = () => this;
  tapErr = () => this;
  mapErr = () => this;
  tryRecover = () => this;
  replaceErr = () => this;

  lazyUnwrap = () => this.val;
  unwrap = () => this.val;

  tap(callback: (val: A) => void) {
    callback(this.val);
    return this;
  }

  map<C extends A>(callback: (val: A) => C): Ok<C> {
    return new OkClass(callback(this.val));
  }

  toPair(): Pair<A, null> {
    return [this.val, null];
  }

  try<C, B>(callback: (val: A) => Result<C, B>) {
    return callback(this.val);
  }

  replace<C>(val: C) {
    return new OkClass(val);
  }

  unwrapErr<B>(fallback: B) {
    return fallback;
  }

  [Symbol.iterator] = function* (this: Ok<A>) {
    return this.val;
  };
}

export interface Err<B> extends BaseResult<never, B> {
  readonly _tag: "Err";
  readonly val: B;
  readonly ok: false;
  readonly err: true;

  tap(): this;
  map(): this;
  try(): this;
  replace(): this;

  unwrapErr(): B;

  lazyUnwrap<A>(callback: () => A): A;
  unwrap<A>(fallback: A): A;
  lazyOr<A>(callback: () => Result<A, B>): Result<A, B>;
  or<A>(fallback: Result<A, B>): Result<A, B>;
  replaceErr<C>(val: C): Err<C>;
  /**
   * @override Optionally provides `Ok` type hints, so typescript simplifies to `Result<A, B>` instead of `Ok<A> | Err<B>`.
   */
  replaceErr<A, C>(val: C): Result<A, C>;
  toPair(): Pair<null, B>;
}

export class ErrClass<B> implements Err<B> {
  readonly _tag = "Err";
  readonly ok = false;
  readonly err = true;

  constructor(readonly val: B) {}

  tap = () => this;
  map = () => this;
  try = () => this;
  replace = () => this;

  unwrapErr = () => this.val;

  lazyUnwrap<A>(callback: () => A) {
    return callback();
  }

  unwrap<A>(fallback: A): A {
    return fallback;
  }

  lazyOr<A>(callback: () => Result<A, B>) {
    return callback();
  }

  or<A>(fallback: Result<A, B>) {
    return fallback;
  }

  tapErr(callback: (val: B) => void) {
    callback(this.val);
    return this;
  }

  mapErr<C>(callback: (val: B) => C) {
    return new ErrClass(callback(this.val));
  }

  tryRecover<A, C>(callback: (val: B) => Result<A, C>): Result<A, C> {
    return callback(this.val);
  }

  replaceErr<C>(val: C) {
    return new ErrClass(val);
  }

  toPair(): Pair<null, B> {
    return [null, this.val];
  }

  [Symbol.iterator] = function* (this: Err<B>) {
    yield this.val;
    throw new Error(
      "Err value iterator fully consumed. This iterator is designed to yield its error value and then terminate execution flow.",
    );
  };
}
