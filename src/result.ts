import { AsyncResult } from "./async";
import { isPromise } from "./helper";
import type {
  Pair,
  Yields,
  Tagged,
  PromiseIf,
  DistributePromiseResult,
  MaybePromise,
  ExtractOk,
  ExtractErr,
  EnsurePromise,
} from "./types";

export const Ok = <A>(val: A): Ok<A> => new OkClass(val);
export const Err = <B>(val: B): Err<B> => new ErrClass(val);

/**
 * The `Result` type represents a value that can be either a success (`Ok`) or a failure (`Err`).
 * This implementation is heavily inspired by Gleam's Result type, however it also contains some additional methods
 * and the properties are in camelCase instead of snake_case to follow JavaScript conventions.
 */
export type Result<A, B> = Ok<A> | Err<B>;

abstract class Result_<A, B> implements Yields<A, B>, Tagged<"Result"> {
  readonly _tag = "Result";
  declare readonly _val: A | B;
  declare readonly ok: boolean;
  declare readonly err: boolean;

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
  abstract tap(callback: (val: Awaited<A>) => void): this;
  /**
   * 'Taps' into the result, calling `callback` with the value if this is an `Err`.
   * This doesn't modify the result, if you want to modify the `Err` value, use `mapErr` instead.
   */
  abstract tapErr(callback: (val: Awaited<B>) => void): this;
  /**
   * Returns an array of length 2, where the first element is the `Ok` value and the second element is the `Err` value.
   */
  abstract toPair(): Pair<A | null, B | null>;
  //abstract toAsync(): AsyncResult<A, B>;
  /**
   * Updates this `Ok` result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the `Ok` with an `Err`.)
   * If this is an `Err` rather than an `Ok`, the function is not called and the original `Err` is returned.
   */
  abstract try<C extends MaybePromise<Result<any, MaybePromise<B>>>>(
    callback: (val: Awaited<A>) => C,
  ): C extends Promise<infer R>
    ? Result<EnsurePromise<ExtractOk<R>>, Promise<B>>
    : A extends Promise<any>
      ? Result<EnsurePromise<ExtractOk<C>>, EnsurePromise<ExtractErr<C>>>
      : Result<ExtractOk<C>, ExtractErr<C>>;
  /**
   * Updates this `Err` result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the `Err` with an `Ok`.)
   * If this is an `Ok` rather than an `Err`, the function is not called and the original `Ok` is returned.
   */
  abstract tryRecover<C>(
    callback: (val: Awaited<B>) => Result<A, C>,
  ): Result<A, C>;
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

export type Ok<A> = Ok_<A>;

export class Ok_<A> extends Result_<A, never> {
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
      return new Ok_(this.promise.then(callback) as PromiseIf<A, C>);
    else return new Ok_(callback(this._val as Awaited<A>) as PromiseIf<A, C>);
  }

  mapErr(): Ok<A> {
    return this;
  }

  or(): Ok<A> {
    return this;
  }

  replace<C>(val: C): Ok<C> {
    return new Ok_(val);
  }

  replaceErr(): Ok<A> {
    return this;
  }

  tap(callback: (val: Awaited<A>) => void): this {
    this.promise.then(callback);
    return this;
  }

  tapErr(): this {
    return this;
  }

  toPair(): Pair<A | null, null> {
    return [this._val, null];
  }

  // try<C extends MaybePromise<Result<any, MaybePromise<B>>>, B>(
  //   callback: (val: Awaited<A>) => C,
  // ): C extends Promise<infer R>
  //   ? Result<EnsurePromise<ExtractOk<R>>, Promise<B>>
  //   : A extends Promise<any>
  //     ? Result<EnsurePromise<ExtractOk<C>>, EnsurePromise<ExtractErr<C>>>
  //     : Result<ExtractOk<C>, ExtractErr<C>>;

  unwrap(): A {
    return this._val;
  }

  unwrapErr<B>(fallback: B): B {
    return fallback;
  }
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

  toAsync(): AsyncResult<A, never> {
    return AsyncResult.from<A, never>(this);
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
}

export interface Err<B> extends Result_<never, B> {
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
  toAsync(): AsyncResult<never, B>;
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

  toAsync(): AsyncResult<never, B> {
    return AsyncResult.from<never, B>(this);
  }
}
