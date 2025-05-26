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

class OkClass<A> implements Ok<A> {
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

class ErrClass<B> implements Err<B> {
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

/**
 * A static result object containing all methods that cannot be defined on the instance.
 */
export const result = {
  /**
   * Combines an array of results into one.
   * If all results are `Ok`, returns an `Ok` containing an array of their values.
   * If any result is `Err`, returns the first `Err`.
   *
   * @param results The array of results to combine.
   * @returns A result containing an array of all the {@link Ok} values, or first error in the results array.
   *
   * @example
   * ```ts
   * result.all([Ok(1), Ok(2), Ok(3)])
   * // -> Ok([1, 2, 3])
   * result.all([Err("first"), Ok(2), Err("second")])
   * // -> Err("first")
   * ```
   */
  all<A, B>(results: Result<A, B>[]): Result<A[], B> {
    const values: A[] = [];

    for (const result of results)
      if (result.ok) values.push(result.val);
      else return result;

    return new OkClass(values);
  },
  /**
   * Flattens a nested result into a single result.
   *
   * @param result The nested result to flatten.
   * @returns The flattened result.
   *
   * @example
   * ```ts
   * result.flatten(Ok(Ok(1)))
   * // -> Ok(1)
   * result.flatten(Ok(Err("")))
   * // -> Err("")
   * result.flatten(Err(""))
   * // -> Err("")
   ```
   */
  flatten<A, B>(result: Result<Result<A, B>, B>): Result<A, B> {
    if (result.ok) return result.val;
    else return result;
  },
  /**
   * Checks if the given value is a result, a.k.a. an {@link Ok} or {@link Err}.
   * In the implementation, it just uses the `isOk` and `isErr` methods.
   *
   * @param result The value to check.
   * @returns A boolean indicating if the value is a {@link Result},
   */
  isResult(result: unknown): result is Result<unknown, unknown> {
    return this.isOk(result) || this.isErr(result);
  },
  /**
   * Checks if the given value is an {@link Ok},
   *
   * @param result The value to check.
   * @returns A boolean indicating if the value is an {@link Ok}.
   */
  isOk(result: unknown): result is Ok<unknown> {
    return result instanceof OkClass;
  },
  /**
   * Checks if the given value is an {@link Err}.
   *
   * @param result The value to check.
   * @returns A boolean indicating if the value is an {@link Err}.
   */
  isErr(result: unknown): result is Err<unknown> {
    return result instanceof ErrClass;
  },
  /**
   * Given an array of results, returns a pair of arrays containing the `Ok` and `Err` values respectively.
   * The lengths of the arrays are not necessarily equal.
   * Note that this implementation is different from the one in Gleam, as that one returns the values in reverse order.
   *
   * @param results The array of results to partition.
   * @returns A pair of arrays containing the `Ok` and `Err` values respectively.
   *
   * @example
   * ```ts
   * result.partition([Ok(1), Error("a"), Error("b"), Ok(2)])
   * // -> [[1, 2], ["a", "b"]]
   * ```
   */
  partition<A, B>(results: Result<A, B>[]): Pair<A[], B[]> {
    const ok = [];
    const err = [];

    for (const result of results)
      if (result.ok) ok.push(result.val);
      else err.push(result.val);

    return [ok, err];
  },
  /**
   * Proxies a function to catch any thrown errors and return a result.
   * This method is similar to `result.wrap`, but is usefull if you need to call and wrap the same function multiple times.
   *
   * @param callback The function that should be proxied.
   * @returns A result containing either the result of the callback function as an {@link Ok}, or the thrown error as an {@link Err}.
   *
   * @example
   * ```ts
   * const fn = result.proxy(fs.writeFileSync)
   * fn("file.txt", "Data to write to file", "utf-8")
   * // -> Result<undefined, Error>
   *
   * // Optionally: the error type can be specified as the second generic parameter, due to typescript limitations the first parameter also has to be specified and should be typeof <the function you are proxying> as follows.
   * const typedFn = result.proxy<typeof someMethodThatThrows, TypeError>(someMethodThatThrows)
   * typedFn(someMethodArgs)
   * // -> Result<someReturnType, TypeError>
   * ```
   */
  // biome-ignore lint/suspicious/noExplicitAny: Doesn't matter, as it gets replaced by actual types when used.
  proxy<C extends (...args: any[]) => any, B = Error>(
    callback: C,
  ): (...args: Parameters<C>) => Result<ReturnType<C>, B> {
    return (...args: Parameters<typeof callback>) =>
      result.wrap(() => callback(...args));
  },
  /**
   * This method is the same as getting the value of a result, using the `Result.val` property,
   * however this ensures type safety by required the type of the `Ok` value to be the same as the type of the `Err` value.
   *
   * @param result The result to unwrap, also supports {@link AsyncResult}
   * @returns The inner value of the result
   *
   * @example
   * ```ts
   * result.values(Ok(1))
   * // -> 1
   * result.values(Err(2))
   * // -> 2
   * ```
   */
  unwrapBoth<A>(result: Result<A, A>): A {
    return result.val;
  },
  /**
   * The same as `result.unwrapBoth`, but this one doesn't require the {@link Ok} and {@link Err} values to be of the same type.
   *
   * @param result The result to unwrap, also supports {@link AsyncResult}
   * @returns The inner value of the result
   */
  unwrapBothUnsafe<A, B>(result: Result<A, B>): A | B {
    return result.val;
  },
  /**
   * Given an array of results, returns an array containing all `Ok` values.
   * The length of the array is not necessarily equal to the length of the `results` array.
   *
   * @param results The array of results, you want to get the values from.
   * @returns An array containing all {@link Ok} values from the results array, this array isn't guaranteed to be the same length as the results parameter. As it doesn't return {@link Err} values.
   *
   * @example
   * ```ts
   * result.values([Ok(1), Err("error"), Ok(3)])
   * // -> [1, 3]
   * ```
   */
  values<A, B>(results: Result<A, B>[]): A[] {
    const values: A[] = [];

    for (const result of results) if (result.ok) values.push(result.val);

    return values;
  },
  /**
   * Wraps a function that may throw an error, into a result.
   * If you know what the error type is, you can specify it as the second generic parameter, by default it is the default `Error` type.
   *
   * @param callback The function that should be wrapped.
   * @returns A result containing either they result of the callback function as an {@link Ok}, or the thrown error as an {@link Err}.
   *
   * @example
   * ```ts
   * result.wrap(() => 1)
   * // -> Ok(1)
   * result.wrap(() => { throw new Error('error') })
   * // -> Err(Error('error'))
   * ```
   */
  wrap<A, E = Error>(callback: () => A): Result<A, E> {
    try {
      return Ok(callback());
    } catch (error) {
      return Err(error as E);
    }
  },
  /**
   * An async version of `result.wrap`.
   *
   * @param callback The function that should be wrapped.
   * @returns A result containing either they result of the callback function as an {@link Ok}, or the thrown error as an {@link Err}.
   *
   * @example
   * ```ts
   * result.wrapAsync(() => Promise.resolve(1))
   * // -> Promise<Ok(1)>
   * result.wrapAsync(() => Promise.reject(new Error('error')))
   * // -> Promise<Err(Error('error'))>
   * result.wrapAsync(() => { throw new Error('error') })
   * // -> Promise<Err(Error('error'))>
   * `
   */
  async wrapAsync<A, E = Error>(
    callback: () => Promise<A>,
  ): Promise<Result<A, E>> {
    try {
      return new Promise((resolve) => {
        callback().then(
          (v) => resolve(Ok(v)),
          (e) => resolve(Err(e)),
        );
      });
    } catch (error) {
      return Err(error as E);
    }
  },

  // instance methods

  // lazyOr
  // lazyUnwrap
  // map
  // mapErr
  // or
  // replace
  // replaceErr
  // tap
  // tapErr
  // toPair
  // toAsync
  // try
  // tryRecover
  // unwrap
  // unwrapErr
};
