export const Ok = <A>(val: A): Ok<A> => new OkClass(val);
export const Err = <B>(val: B): Err<B> => new ErrClass(val);

/**
 * The `Result` type represents a value that can be either a success (`Ok`) or a failure (`Err`).
 * This implementation is heavily inspired by Gleam's Result type, however it also contains some additional methods
 * and the properties are in camelCase instead of snake_case to follow JavaScript conventions.
 */
export type Result<A, B> = Ok<A> | Err<B>;

interface BaseResult<A, B> {
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

  [Symbol.iterator](): Generator<Result<A, B>, A, A>;
}

export interface Ok<A> extends BaseResult<A, never> {
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
  try<C, B>(callback: (val: A) => Result<C, B>): Result<C, B>;
  replace<C>(val: C): Ok<C>;
  /**
   * @override Optionally provides `Err` type hints, so typescript simplifies to `Result<A, B>` instead of `Ok<A> | Err<B>`.
   */
  replace<C, B>(val: C): Result<C, B>;

  [Symbol.iterator](): Generator<Ok<A>, A, A>;
}

class OkClass<A> implements Ok<A> {
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

  try<C, B>(callback: (val: A) => Result<C, B>) {
    return callback(this.val);
  }

  replace<C>(val: C) {
    return new OkClass(val);
  }

  unwrapErr<B>(fallback: B) {
    return fallback;
  }

  [Symbol.iterator] = function* (this: OkClass<A>) {
    yield this;
    return this.val;
  };
}

export interface Err<B> extends BaseResult<never, B> {
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

  [Symbol.iterator](): Generator<Err<B>, never, unknown>;
}

class ErrClass<B> implements Err<B> {
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

  [Symbol.iterator] = function* (this: ErrClass<B>) {
    yield this;
    throw new Error(
      "Err value iterator fully consumed. This iterator is designed to yield its error value and then terminate execution flow.",
    );
  };
}

export interface StaticResult {
  /**
   * Combines an array of results into one.
   * If all results are `Ok`, returns an `Ok` containing an array of their values.
   * If any result is `Err`, returns the first `Err`.
   ```ts
   result.all([Ok(1), Ok(2), Ok(3)])
   // -> Ok([1, 2, 3])
   result.all([Err("first"), Ok(2), Err("second")])
   // -> Err("first")
   ```
   */
  all<A, B>(results: Result<A, B>[]): Result<A[], B>;
  /**
   * Flattens a nested result into a single result.
   ```ts
   result.flatten(Ok(Ok(1)))
   // -> Ok(1)
   result.flatten(Ok(Err("")))
   // -> Err("")
   result.flatten(Err(""))
   // -> Err("")
   ```
   */
  flatten<A, B>(result: Result<Result<A, B>, B>): Result<A, B>;
  /**
   * Given an array of results, returns an array containing all `Ok` values.
   * The length of the array is not necessarily equal to the length of the `results` array.
   ```ts
   result.values([Ok(1), Err("error"), Ok(3)])
   // -> [1, 3]
   ```
   */
  values<A, B>(results: Result<A, B>[]): A[];
  /**
   * This method is the same as getting the value of a result, using the `Result.val` property,
   * however this ensures type safety by required the type of the `Ok` value to be the same as the type of the `Err` value.
   ```ts
   result.values(Ok(1))
   // -> 1
   result.values(Err(2))
   // -> 2
   ```
   */
  unwrapBoth<A>(result: Result<A, A>): A;

  /**
   * Checks if the given value is a result, a.k.a. an {@link Ok} or {@link Err}.
   */
  isResult(result: unknown): result is Result<unknown, unknown>;
  isOk(result: unknown): result is Ok<unknown>;
  isErr(result: unknown): result is Err<unknown>;

  // instance methods
  //lazyOr<A, B>(result: Result<A, B>, callback: () => Result<A, B>): Result<A, B>;
}

export const result: StaticResult = {
  // 'static' methods
  all<A, B>(results: Result<A, B>[]) {
    const values: A[] = [];

    for (const result of results)
      if (result.ok) values.push(result.val);
      else return result;

    return new OkClass(values);
  },
  flatten<A, B>(result: Result<Result<A, B>, B>) {
    if (result.ok) return result.val;
    else return result;
  },
  values<A, B>(results: Result<A, B>[]): A[] {
    const values: A[] = [];

    for (const result of results) if (result.ok) values.push(result.val);

    return values;
  },
  unwrapBoth<A>(result: Result<A, A>): A {
    return result.val;
  },
  isResult(result: unknown): result is Result<unknown, unknown> {
    return this.isOk(result) || this.isErr(result);
  },
  isOk(result: unknown): result is Ok<unknown> {
    return result instanceof OkClass;
  },
  isErr(result: unknown): result is Err<unknown> {
    return result instanceof ErrClass;
  },
  // instance methods
};
