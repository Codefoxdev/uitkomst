import type { MaybeAsyncResult, MaybePromise, Pair } from "../types";
import type { Result } from "./index";
import { AsyncResult, createAsyncResultFrom } from "./async";
import { Ok, Err, OkClass, ErrClass } from "./index";

/**
 * Combines an array of results into one.
 * If all results are {@link Ok}, returns an {@link Ok} containing an array of their values.
 * If any result is {@link Err}, returns the first {@link Err}.
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
export function all<A, B>(results: Result<A, B>[]): Result<A[], B>;
/**
 * @overload Asynchronous version of the {@link partition} method.
 */
export function all<A, B>(results: AsyncResult<A, B>[]): AsyncResult<A[], B>;
export function all<A, B>(
  results: Result<A, B>[] | AsyncResult<A, B>[],
): Result<A[], B> | AsyncResult<A[], B> {
  if (AsyncResult.is(results))
    return AsyncResult.from(
      Promise.all(results.map((res) => res.toResult())).then((arr) => all(arr)),
    );

  const values: A[] = [];

  for (const result of results)
    if (result.ok) values.push(result.val);
    else return result;

  return Ok(values);
}

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
export function flatten<A, B>(result: Result<Result<A, B>, B>): Result<A, B>;
/**
 * @overload Asynchronous version of the {@link partition} method.
 */
// biome-ignore format:
export function flatten<A, B>(result: AsyncResult<MaybeAsyncResult<A, B>, B>): AsyncResult<A, B>;
export function flatten<A, B>(
  result: Result<Result<A, B>, B> | AsyncResult<MaybeAsyncResult<A, B>, B>,
): Result<A, B> | AsyncResult<A, B> {
  if (isResult(result)) return result.ok ? result.val : result;

  return createAsyncResultFrom(result, (res) => (res.ok ? res.unwrap() : res));
}

/**
 * Checks if the given value is a result, a.k.a. an {@link Ok} or {@link Err}.
 * In the implementation, it just uses the {@link isOk} and {@link isErr} methods.
 *
 * @param result The value to check.
 * @returns A boolean indicating if the value is a {@link Result},
 */
export function isResult(result: unknown): result is Result<unknown, unknown> {
  return isOk(result) || isErr(result);
}

/**
 * Checks if the given value is an {@link Ok},
 *
 * @param result The value to check.
 * @returns A boolean indicating if the value is an {@link Ok}.
 */
export function isOk(result: unknown): result is Ok<unknown> {
  return result instanceof OkClass;
}

/**
 * Checks if the given value is an {@link Err}.
 *
 * @param result The value to check.
 * @returns A boolean indicating if the value is an {@link Err}.
 */
export function isErr(result: unknown): result is Err<unknown> {
  return result instanceof ErrClass;
}

/**
 * Given an array of results, returns a pair of arrays containing the {@link Ok} and {@link Err} values respectively.
 * The lengths of the arrays are not necessarily equal.
 * Note that this implementation is different from the one in Gleam, as that one returns the values in reverse order.
 *
 * @param results The array of results to partition.
 * @returns A pair of arrays containing the {@link Ok} and {@link Err} values respectively.
 *
 * @example
 * ```ts
 * result.partition([Ok(1), Error("a"), Error("b"), Ok(2)])
 * // -> [[1, 2], ["a", "b"]]
 * ```
 */
export function partition<A, B>(results: Result<A, B>[]): Pair<A[], B[]>;
/**
 * @overload Asynchronous version of the {@link partition} method.
 */
// biome-ignore format:
export function partition<A, B>(results: AsyncResult<A, B>[]): Promise<Pair<A[], B[]>>;
export function partition<A, B>(
  results: Result<A, B>[] | AsyncResult<A, B>[],
): Pair<A[], B[]> | Promise<Pair<A[], B[]>> {
  if (AsyncResult.is(results))
    // biome-ignore format:
    return Promise
      .all(results.map((result) => result.toResult()))
      .then((res) => partition(res));

  const ok = [];
  const err = [];

  for (const result of results)
    if (result.ok) ok.push(result.val);
    else err.push(result.val);

  return [ok, err];
}

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
export function proxy<C extends (...args: any[]) => any, B = Error>(
  callback: C,
): (...args: Parameters<C>) => Result<ReturnType<C>, B> {
  return (...args: Parameters<typeof callback>) =>
    wrap(() => callback(...args));
}

/**
 * This method is the same as getting the value of a result, using the `Result.val` property,
 * however this ensures type safety by required the type of the {@link Ok} value to be the same as the type of the {@link Err} value.
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
export function unwrapBoth<A>(result: Result<A, A>): A;
export function unwrapBoth<A>(result: AsyncResult<A, A>): Promise<A>;
export function unwrapBoth<A>(
  result: Result<A, A> | AsyncResult<A, A>,
): MaybePromise<A> {
  return result.val;
}

/**
 * The same as `result.unwrapBoth`, but this one doesn't require the {@link Ok} and {@link Err} values to be of the same type.
 *
 * @param result The result to unwrap, also supports {@link AsyncResult}
 * @returns The inner value of the result
 */
export function unwrapBothUnsafe<A, B>(result: Result<A, B>): A | B;
export function unwrapBothUnsafe<A, B>(
  result: AsyncResult<A, B>,
): Promise<A | B>;
export function unwrapBothUnsafe<A, B>(
  result: Result<A, B> | AsyncResult<A, B>,
): MaybePromise<A | B> {
  return result.val;
}

/**
 * The use method allows you to more easily work with result types, similar to Gleam's use statement.
 * It makes use of a generator function with `yield*` expressions to extract {@link Ok} values out of results.
 * Everytime you delegate a result, using `yield*`, the {@link Ok} value is returned
 * and if it is an {@link Err}, the function stops execution and the error is returned.
 * Although it has the same behaviour as when using result chaining, it may sometimes be more convenient to use.
 * The `yield*` expression can delegate more than a result, in fact anything that implements the {@link Yields} interface can be used.
 *
 * @example
 * ```ts
 * // Add two numbers that are both wrapped in a Result type.
 * const num1: Result<number, Error>;
 * const num2: Result<number, Error>;
 *
 * // With result chaining
 * const res1: Result<number, Error> = result
 *   .all([num1, num2])
 *   .map((arr) => arr[0] + arr[1]);
 *
 * // With use
 * const res: Result<number, Error> = use(function* () {
 *   return (yield* num1) + (yield* num2);
 * });
 * ```
 */
export function use<A, B>(callback: () => Generator<B, A, never>): Result<A, B>;
/**
 * @overload Use method with async support.
 */
export function use<A, B>(
  callback: () => AsyncGenerator<B, A, never>,
): AsyncResult<A, B>;
export function use<A, B>(
  callback: () => Generator<B, A, never> | AsyncGenerator<B, A, never>,
): Result<A, B> | AsyncResult<A, B> {
  const res = callback().next();
  if (!(res instanceof Promise))
    return res.done ? Ok(res.value) : Err(res.value);

  return AsyncResult.from(
    res.then((awaited) =>
      awaited.done ? Ok(awaited.value) : Err(awaited.value),
    ),
  );
}

/**
 * Given an array of results, returns an array containing all {@link Ok} values.
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
export function values<A, B>(results: Result<A, B>[]): A[];
export function values<A, B>(results: AsyncResult<A, B>[]): Promise<A[]>;
export function values<A, B>(
  results: Result<A, B>[] | AsyncResult<A, B>[],
): MaybePromise<A[]> {
  if (AsyncResult.is(results))
    return Promise.all(results.map((res) => res.toResult())).then((arr) =>
      values(arr),
    );

  const val: A[] = [];
  for (const result of results) if (result.ok) val.push(result.val);
  return val;
}

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
export function wrap<A, E = Error>(
  callback: () => A,
): Result<A, E> {
  try {
    const res = callback();
    return Ok(res);
  } catch (error) {
    return Err(error as E);
  }
}

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
export async function wrapAsync<A, E = Error>(
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
}
