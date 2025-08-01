import type {
  Pair,
  Yields,
  Tagged,
  PromiseIf,
  MaybePromise,
  ResultLike,
  Trace,
  Tag,
} from "./types";
import { AsyncResult } from "./async";
import { AssertError, YieldError } from "./error";
import { isPromise } from "./helper";

/**
 * Creates a new {@link Ok} object.
 */
export function Ok_(): Ok<void>;
export function Ok_<A>(val: A): Ok<A>;
export function Ok_<A>(val?: A) {
  if (val === undefined) return new Ok(undefined);
  return new Ok(val);
}

/**
 * Creates a new {@link Err} object.
 */
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

abstract class Result_<A, B> implements Yields<A, B>, Tagged<"Ok" | "Err"> {
  declare readonly _tag: "Ok" | "Err";
  declare readonly _val: A | B;
  readonly _stack: Trace[] = [];

  abstract get ok(): boolean;
  abstract get err(): boolean;

  /**
   * Asserts that this result is an {@link Ok}, and returns the unwrapped value.
   *
   * @param message Optionally provide a custom error message.
   * @returns The unwrapped {@link Ok} value.
   * @throws {AssertError} If the result is an {@link Err}.
   */
  abstract assertOk(message?: string): A;

  /**
   * Asserts that this result is an {@link Err}, and returns the unwrapped value.
   *
   * @param message Optionally provide a custom error message.
   * @returns The unwrapped {@link Err} value.
   * @throws {AssertError} If the result is an {@link Ok}.
   */
  abstract assertErr(message?: string): B;

  /**
   * Lazy version of the `or` method; the fallback value is lazily evaluated and will only be called if it is used.
   *
   * @param callback The callback function that will be called if the result is an {@link Err}, the result of which will be returned.
   * @returns The new Result.
   */
  abstract lazyOr(callback: () => Result<A, B>): Result<A, B>;

  /**
   * Lazy version of the `unwrap` method; the fallback value is lazily evaluated and will only be called if it is used.
   *
   * @param callback The callback function that will be called if the result is an {@link Err}, the result of which will be returned.
   * @returns The unwrapped {@link Ok} value or the fallback value returned from the callback method.
   */
  abstract lazyUnwrap(callback: () => A): A;

  /**
   * Returns a Result that updates the value held within the {@link Ok} with the result of the `callback` function.
   * The value that is returned from `callback` is used to update the value with.
   * If this is an {@link Err} rather than {@link Ok}, `callback` is not called and it returns this result.
   *
   * @param callback The method that is called with the inner value of the {@link Ok}.
   * @returns The new Result.
   */
  abstract map<C>(callback: (val: Awaited<A>) => C): Result<PromiseIf<A, C>, B>;

  /**
   * Updates the value held within the {@link Err} of this result by calling `callback` with it.
   * The value that is returned from `callback` is used to replace the value with.
   * If this is an {@link Ok} rather than {@link Err}, `callback` is not called and it returns this result.
   *
   * @param callback The method that is called with the inner value of the {@link Ok}.
   * @returns The new Result.
   */
  abstract mapErr<C>(
    callback: (val: Awaited<B>) => C,
  ): Result<A, PromiseIf<B, C>>;

  /**
   * Returns this value if it is {@link Ok}, otherwise returns the `fallback` argument.
   *
   * @param fallback The value that is returned if this is an {@link Err}.
   * @returns The new Result.
   */
  abstract or(fallback: Result<A, B>): Result<A, B>;

  /**
   * Pipes this result through a list of transformer callbacks.
   * The first callback is called with the inner {@link Ok} value of this result,
   * and each subsequent callback is called with the result of the previous callback.
   *
   * @param callback The list of transformer callbacks.
   * @returns The new Result.
   */
  abstract pipe(...callback: ((val: A) => Result<A, B>)[]): Result<A, B>;
  //abstract pipeAsync(...callback: ((val: Awaited<A>) => MaybePromise<A>)[]): AsyncResult<Awaited<A>, Awaited<B>>;

  /**
   * Replaces the value held within the {@link Ok} of this result with the `val` argument.
   * If this is an {@link Err} rather than {@link Ok}, the value is not replaced and this `Result` stays the same.
   *
   * @param val The value that is used to replace the {@link Ok} value.
   * @returns The new Result.
   */
  abstract replace<C>(val: C): Result<C, B>;

  /**
   * Replaces the value held within the {@link Err} of this result with the `val` argument.
   * If this is an {@link Ok} rather than {@link Err}, the value is not replaced and this `Result` stays the same.
   *
   * @param val The value that is used to replace the {@link Err} value.
   * @returns The new Result.
   */
  abstract replaceErr<C>(val: C): Result<A, C>;

  /**
   * 'Taps' into the result, calling `callback` with the value if this is an {@link Ok}.
   * This doesn't modify the result, if you want to modify the {@link Ok} value, use `map` instead.
   *
   * @param callback the method that is called with the inner value of the {@link Ok}.
   * @returns This result.
   */
  abstract tap(callback: (val: Awaited<A>) => void): Result<A, B>;

  /**
   * 'Taps' into the result, calling `callback` with the value if this is an {@link Err}.
   * This doesn't modify the result, if you want to modify the {@link Err} value, use `mapErr` instead.
   *
   * @param callback the method that is called with the inner value of the {@link Err}.
   * @returns This result.
   */
  abstract tapErr(callback: (val: Awaited<B>) => void): Result<A, B>;

  /**
   * Returns an array of length 2, where the first element is the {@link Ok} value and the second element is the {@link Err} value.
   *
   * @returns A pair containing the {@link Ok} value as the first element and the {@link Err} value as the second element.
   */
  abstract toPair(): Pair<A | null, B | null>;

  /**
   * Extracts the {@link Ok} value, returning the `fallback` argument if the result is an {@link Err}.
   *
   * @param fallback the value to return if the result is an {@link Err}.
   * @returns The inner {@link Ok} value or the `fallback` argument.
   */
  abstract unwrap(fallback: A): A;

  /**
   * Extracts the {@link Err} value, returning the `fallback` argument if the result is an {@link Ok}.
   *
   * @param fallback the value to return if the result is an {@link Ok}.
   * @returns The inner {@link Err} value or the `fallback` argument.
   */
  abstract unwrapErr(fallback: B): B;

  /**
   * See documentation on the `use` method, for how to use this method.
   * @package
   */
  *[Symbol.iterator](this: Result<A, B>): Generator<B, A, unknown> {
    if (this.ok) return this.unwrap();

    yield this.unwrapErr();
    throw new YieldError({ _tag: "Result" });
  }

  protected get promise(): Promise<Awaited<this["_val"]>> {
    return Promise.resolve(this._val);
  }

  /**
   * Adds tracing information to the result, if it is an {@link Err}.
   *
   * @param id the identifier to use for tracing, this can be a string or a symbol.
   * @returns This result with the added tracing information.
   */
  abstract trace(id: Tag): this;

  /**
   * @package
   */
  abstract _inheritStack(stack: Trace[]): this;
}

export class Ok<A> extends Result_<A, never> {
  override readonly _tag = "Ok";
  override readonly ok = true;
  override readonly err = false;

  constructor(override readonly _val: A) {
    super();
  }

  /**
   * @inheritdoc
   */
  assertOk(): A {
    return this._val;
  }

  /**
   * @inheritdoc
   */
  assertErr(message?: string): never {
    throw new AssertError(
      message ?? "Expected Err, but received Ok instead.",
      this,
    );
  }

  /**
   * @inheritdoc
   */
  lazyOr(): Ok<A> {
    return this;
  }

  /**
   * @inheritdoc
   */
  lazyUnwrap(): A {
    return this._val;
  }

  /**
   * @inheritdoc
   */
  map<C>(callback: (val: Awaited<A>) => C): Ok<PromiseIf<A, C>> {
    if (isPromise(this._val))
      return new Ok(this.promise.then(callback) as PromiseIf<A, C>);
    else return new Ok(callback(this._val as Awaited<A>) as PromiseIf<A, C>);
  }

  /**
   * @inheritdoc
   */
  mapErr(): Ok<A> {
    return this;
  }

  /**
   * @inheritdoc
   */
  or(): Ok<A> {
    return this;
  }

  /**
   * @inheritdoc
   */
  pipe<C>(...callback: ((val: A) => Result<A, C>)[]): Result<A, C> {
    if (callback.length === 0) return this;

    const fn = callback.shift()!;
    const res = fn(this._val);
    return res.pipe(...callback);
  }

  /**
   * @inheritdoc
   */
  replace<C>(val: C): Ok<C> {
    return new Ok(val);
  }

  /**
   * @inheritdoc
   */
  replaceErr(): Ok<A> {
    return this;
  }

  /**
   * @inheritdoc
   */
  tap(callback: (val: Awaited<A>) => void): this {
    if (isPromise(this._val)) this.promise.then(callback);
    else callback(this._val as Awaited<A>);

    return this;
  }

  /**
   * @inheritdoc
   */
  tapErr(): this {
    return this;
  }

  /**
   * @inheritdoc
   */
  toPair(): Pair<A | null, null> {
    return [this._val, null];
  }

  /**
   * Updates this {@link Ok} result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the {@link Ok} with an {@link Err}.)
   * If this is an {@link Err} rather than an {@link Ok}, the function is not called and the original {@link Err} is returned.
   * Use `tryAsync` when dealing with async values.
   */
  try<R extends Result<any, any>>(callback: (val: A) => R): R {
    return callback(this._val);
  }

  /**
   * Async version of `try`.
   */
  tryAsync<R extends MaybePromise<Tagged<"Ok" | "Err">>>(
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
   * Updates this {@link Err} result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the {@link Err} with an {@link Ok}.)
   * If this is an {@link Ok} rather than an {@link Err}, the function is not called and the original {@link Ok} is returned.
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

  /**
   * @inheritdoc
   */
  unwrap(): A {
    return this._val;
  }

  /**
   * @inheritdoc
   */
  unwrapErr<B>(fallback: B): B {
    return fallback;
  }

  /**
   * @inheritdoc
   */
  trace(): this {
    return this;
  }

  /**
   * @package
   */
  _inheritStack(): this {
    return this;
  }
}

export class Err<B> extends Result_<never, B> {
  override readonly _tag = "Err";
  override readonly ok = false;
  override readonly err = true;

  constructor(
    override readonly _val: B,
    override readonly _stack: Trace[] = [],
  ) {
    super();
  }

  /**
   * @inheritdoc
   */
  assertOk(message?: string): never {
    throw new AssertError(
      message ?? "Expected Ok, but received Err instead.",
      this,
    );
  }

  /**
   * @inheritdoc
   */
  assertErr(): B {
    return this._val;
  }

  /**
   * @inheritdoc
   */
  lazyOr<A>(callback: () => Result<A, B>): Result<A, B> {
    return callback();
  }

  /**
   * @inheritdoc
   */
  lazyUnwrap<A>(callback: () => A): A {
    return callback();
  }

  /**
   * @inheritdoc
   */
  map(): Err<B> {
    return this;
  }

  /**
   * @inheritdoc
   */
  mapErr<C>(callback: (val: Awaited<B>) => C): Err<PromiseIf<B, C>> {
    if (isPromise(this._val))
      return new Err(
        this.promise.then(callback) as PromiseIf<B, C>,
        this._stack,
      );
    else
      return new Err(
        callback(this._val as Awaited<B>) as PromiseIf<B, C>,
        this._stack,
      );
  }

  /**
   * @inheritdoc
   */
  or<A>(fallback: Result<A, B>): Result<A, B> {
    return fallback;
  }

  /**
   * @inheritdoc
   */
  pipe(): Err<B> {
    return this;
  }

  /**
   * @inheritdoc
   */
  replace(): Err<B> {
    return this;
  }

  /**
   * @inheritdoc
   */
  replaceErr<C>(val: C): Err<C> {
    return new Err(val);
  }

  /**
   * @inheritdoc
   */
  tap(): Err<B> {
    return this;
  }

  /**
   * @inheritdoc
   */
  tapErr(callback: (val: Awaited<B>) => void): Err<B> {
    if (isPromise(this._val)) this.promise.then(callback);
    else callback(this._val as Awaited<B>);

    return this;
  }

  /**
   * @inheritdoc
   */
  toPair(): Pair<null, B | null> {
    return [null, this._val];
  }

  /**
   * Updates this {@link Ok} result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the {@link Ok} with an {@link Err}.)
   * If this is an {@link Err} rather than an {@link Ok}, the function is not called and the original {@link Err} is returned.
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
   * Updates this {@link Err} result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the {@link Err} with an {@link Ok}.)
   * If this is an {@link Ok} rather than an {@link Err}, the function is not called and the original {@link Ok} is returned.
   * Use `TryRecoverAsync` when dealing with async values.
   */
  tryRecover<R extends Result<any, any>>(callback: (val: B) => R): R {
    return callback(this._val)._inheritStack(this._stack) as R;
  }

  /**
   * Async version of `tryRecover`.
   */
  tryRecoverAsync<R extends MaybePromise<Tagged<"Ok" | "Err">>>(
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

  /**
   * @inheritdoc
   */
  unwrap<A>(fallback: A): A {
    return fallback;
  }

  /**
   * @inheritdoc
   */
  unwrapErr(): B {
    return this._val;
  }

  /**
   * @inheritdoc
   */
  trace(id: Tag): this {
    const trace: Trace = { id };
    this._stack.push(trace);
    return this;
  }

  /**
   * @package
   */
  _inheritStack(stack: Trace[]): this {
    this._stack.unshift(...stack);
    return this;
  }
}
