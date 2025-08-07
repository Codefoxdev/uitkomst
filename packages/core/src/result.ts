import type {
  InferErr,
  InferOk,
  MaybePromise,
  Pair,
  PromiseIf,
  ResultLike,
  Tag,
  Tagged,
  Trace,
  Yieldable,
  Yields,
} from "./types";
import { AsyncResult } from "./async";
import { AssertError, ExpectedResultError, YieldError } from "./error";
import { isPromise } from "./helper";
import { isResult } from "./static";

/**
 * The `Result` type represents a value that can be either a success (`Ok`) or a failure (`Err`).
 * This implementation is heavily inspired by Gleam's Result type, however it also contains some additional methods
 * and the properties are in camelCase instead of snake_case to follow JavaScript conventions.
 */
export type Result<A, B> = Ok<A> | Err<B>;

/**
 * The abstract result class on which the {@link Ok} and {@link Err} classes are based.
 *
 * @template A The `Ok` value of this result.
 * @template B The `Err` value of this result.
 *
 * @package This is an internal class and should not be used directly.
 */
export abstract class AbstractResult<A, B>
  implements Yieldable<A, B>, Tagged<"Result">
{
  declare readonly _val: A | B;
  readonly _tag = "Result";
  readonly _stack: Trace[] = [];

  declare readonly ok: boolean;
  declare readonly err: boolean;

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
   * Adds tracing information to the result, if it is an {@link Err}.
   *
   * @param id the identifier to use for tracing, this can be a string or a symbol.
   * @returns This result with the added tracing information.
   */
  abstract trace(id: Tag): Result<A, B>;

  /**
   * Updates this {@link Ok} result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the {@link Ok} with an {@link Err}.)
   * If this is an {@link Err} rather than an {@link Ok}, the function is not called and the original {@link Err} is returned.
   *
   * @param callback The transformer function that is called with the {@link Ok} value.
   * @returns The updated result.
   */
  try<C extends Tagged<"Result"> | Promise<Tagged<"Result">>>(
    callback: (val: Awaited<A>) => C,
  ): C extends Promise<infer P>
    ? P extends AbstractResult<infer _Ok, infer _Err>
      ? AsyncResult<InferOk<P>, InferErr<P> | B>
      : never
    : C extends AbstractResult<infer _Ok, infer _Err>
      ? [A] extends [never]
        ? Result<InferOk<C>, InferErr<C> | B>
        : [A] extends [Promise<any>]
          ? AsyncResult<InferOk<C>, InferErr<C> | B>
          : Result<InferOk<C>, InferErr<C> | B>
      : never {
    return (() => {
      if (this.err) return this;

      const validate = (res: any) => {
        if (isResult(res)) return res;
        throw new ExpectedResultError(res);
      };

      if (isPromise(this._val)) {
        const val = this._promise as Promise<Awaited<A>>;
        return AsyncResult.from(val.then(callback).then(validate));
      }

      const res = callback(this._val as Awaited<A>);
      if (AsyncResult.is(res)) return res;
      else if (isPromise(res)) return AsyncResult.from(res.then(validate));
      else if (isResult(res)) return res;

      throw new ExpectedResultError(res);
    })() as C extends Promise<infer P>
      ? P extends AbstractResult<infer _Ok, infer _Err>
        ? AsyncResult<InferOk<P>, InferErr<P> | B>
        : never
      : C extends AbstractResult<infer _Ok, infer _Err>
        ? [A] extends [never]
          ? Result<InferOk<C>, InferErr<C> | B>
          : [A] extends [Promise<any>]
            ? AsyncResult<InferOk<C>, InferErr<C> | B>
            : Result<InferOk<C>, InferErr<C> | B>
        : never;
  }

  /**
   * Updates this {@link Err} result by passing its value to a function that returns a `Result`, and returning the updated result. (This may replace the {@link Err} with an {@link Ok}.)
   * If this is an {@link Ok} rather than an {@link Err}, the function is not called and the original {@link Ok} is returned.
   *
   * @param callback The transformer function that is called with the {@link Err} value.
   * @returns The updated result.
   */
  tryRecover<C extends Tagged<"Result"> | Promise<Tagged<"Result">>>(
    callback: (val: Awaited<B>) => C,
  ): C extends Promise<infer P>
    ? P extends AbstractResult<infer _Ok, infer _Err>
      ? AsyncResult<InferOk<P> | A, InferErr<P>>
      : never
    : C extends AbstractResult<infer _Ok, infer _Err>
      ? [B] extends [never]
        ? Result<InferOk<C> | A, InferErr<C>>
        : [B] extends [Promise<any>]
          ? AsyncResult<InferOk<C> | A, InferErr<C>>
          : Result<InferOk<C> | A, InferErr<C>>
      : never {
    return (() => {
      if (this.ok) return this;

      const validate = (res: any) => {
        if (isResult(res)) return res;
        throw new ExpectedResultError(res);
      };

      if (isPromise(this._val)) {
        const val = this._promise as Promise<Awaited<B>>;
        return AsyncResult.from(val.then(callback).then(validate));
      }

      const res = callback(this._val as Awaited<B>);
      if (AsyncResult.is(res)) return res;
      else if (isPromise(res)) return AsyncResult.from(res.then(validate));
      else if (isResult(res)) return res;

      throw new ExpectedResultError(res);
    })() as C extends Promise<infer P>
      ? P extends AbstractResult<infer _Ok, infer _Err>
        ? AsyncResult<InferOk<P> | A, InferErr<P>>
        : never
      : C extends AbstractResult<infer _Ok, infer _Err>
        ? [B] extends [never]
          ? Result<InferOk<C> | A, InferErr<C>>
          : [B] extends [Promise<any>]
            ? AsyncResult<InferOk<C> | A, InferErr<C>>
            : Result<InferOk<C> | A, InferErr<C>>
        : never;
  }

  /**
   * Extracts the {@link Ok} value, returning the `fallback` argument if the result is an {@link Err}.
   *
   * @param fallback the value to return if the result is an {@link Err}.
   * @returns The inner {@link Ok} value or the `fallback` argument.
   */
  abstract unwrap(fallback: A): A;
  /**
   * Extracts the inner value, regardless if it is an {@link Ok} or and {@link} Err.
   *
   * @returns The inner value
   */
  abstract unwrapBoth(): A | B;
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
  *[Symbol.iterator](this: Result<A, B>): Yields<A, B> {
    if (this.ok) return this.unwrap();

    yield this.unwrapErr();
    throw new YieldError(this);
  }

  /** @private */
  protected get _promise(): Promise<Awaited<A | B>> {
    return Promise.resolve(this._val);
  }

  /** @private */
  abstract _inheritStack(stack: Trace[]): this;
}

export class Ok<A> extends AbstractResult<A, never> {
  override readonly ok = true;
  override readonly err = false;

  constructor(override readonly _val: A) {
    super();
  }

  assertOk(): A {
    return this._val;
  }

  assertErr(message?: string): never {
    throw new AssertError(
      message ?? "Expected Err, but received Ok instead.",
      this,
    );
  }

  lazyOr(): Ok<A> {
    return this;
  }

  lazyUnwrap(): A {
    return this._val;
  }

  map<C>(callback: (val: Awaited<A>) => C): Ok<PromiseIf<A, C>> {
    if (isPromise(this._val))
      return new Ok(this._promise.then(callback) as PromiseIf<A, C>);
    else return new Ok(callback(this._val as Awaited<A>) as PromiseIf<A, C>);
  }

  mapErr(): Ok<A> {
    return this;
  }

  or(): Ok<A> {
    return this;
  }

  // pipe<C>(...callback: ((val: A) => Result<A, C>)[]): Result<A, C> {
  //   if (callback.length === 0) return this;

  //   const fn = callback.shift()!;
  //   const res = fn(this._val);
  //   return res.pipe(...callback);
  // }

  replace<C>(val: C): Ok<C> {
    return new Ok(val);
  }

  replaceErr(): Ok<A> {
    return this;
  }

  tap(callback: (val: Awaited<A>) => void): this {
    if (isPromise(this._val)) this._promise.then(callback);
    else callback(this._val as Awaited<A>);

    return this;
  }

  tapErr(): this {
    return this;
  }

  toPair(): Pair<A | null, null> {
    return [this._val, null];
  }

  unwrap(): A {
    return this._val;
  }

  unwrapBoth(): A {
    return this._val;
  }

  unwrapErr<B>(fallback: B): B {
    return fallback;
  }

  trace(): this {
    return this;
  }

  _inheritStack(): this {
    return this;
  }
}

export class Err<B> extends AbstractResult<never, B> {
  override readonly ok = false;
  override readonly err = true;

  constructor(
    override readonly _val: B,
    override readonly _stack: Trace[] = [],
  ) {
    super();
  }

  assertOk(message?: string): never {
    throw new AssertError(
      message ?? "Expected Ok, but received Err instead.",
      this,
    );
  }

  assertErr(): B {
    return this._val;
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
      return new Err(
        this._promise.then(callback) as PromiseIf<B, C>,
        this._stack,
      );
    else
      return new Err(
        callback(this._val as Awaited<B>) as PromiseIf<B, C>,
        this._stack,
      );
  }

  or<A>(fallback: Result<A, B>): Result<A, B> {
    return fallback;
  }

  // pipe(): Err<B> {
  //   return this;
  // }

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
    if (isPromise(this._val)) this._promise.then(callback);
    else callback(this._val as Awaited<B>);

    return this;
  }

  toPair(): Pair<null, B | null> {
    return [null, this._val];
  }

  trace(id: Tag): Err<B> {
    const trace: Trace = { id };
    return new Err(this._val, [...this._stack, trace]);
  }

  unwrap<A>(fallback: A): A {
    return fallback;
  }

  unwrapBoth(): B {
    return this._val;
  }

  unwrapErr(): B {
    return this._val;
  }

  _inheritStack(stack: Trace[]): this {
    this._stack.unshift(...stack);
    return this;
  }
}
