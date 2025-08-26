import type { Result } from ".";
import type { MaybeAsyncResult, MaybePromise, Pair, ResultLike } from "./types";
import { AsyncResult, createAsyncResultFrom } from "./async";
import { AssertError } from "./error";
import { Err, Ok } from "./result";

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
 * all([Ok(1), Ok(2), Ok(3)])
 * // -> Ok([1, 2, 3])
 * all([Err("first"), Ok(2), Err("second")])
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
    return AsyncResult.from(Promise.all(results).then((arr) => all(arr)));

  const values: A[] = [];

  for (const result of results)
    if (result.ok) values.push(result.unwrap());
    else return result;

  return new Ok(values);
}

/**
 * Asserts that a result is an {@link Ok}, and returns the unwrapped value.
 *
 * @param result The result to assert.
 * @returns The unwrapped {@link Ok} value.
 * @throws {AssertError} If the result is an {@link Err}.
 *
 * @example
 * ```ts
 * let result: Result<string, Error>;
 * let okVal = assertOk(result); // <- May throw if the result is an Err.
 * // -> string
 * ```
 */
export function assertOk<A, B>(result: Result<A, B>): A;
export function assertOk<A, B>(result: AsyncResult<A, B>): Promise<A>;
export function assertOk<A, B>(result: ResultLike<A, B>) {
  if (AsyncResult.is(result))
    return result.then((res) => {
      if (res.ok) return Promise.resolve(res.unwrap());

      return Promise.reject(
        new AssertError("Expected Ok, but received Err instead.", res),
      );
    });

  if (result.ok) return result.unwrap();

  throw new AssertError("Expected Ok, but received Err instead.", result);
}

/**
 * Asserts that a result is an {@link Err}, and returns the unwrapped value.
 *
 * @param result The result to assert.
 * @returns The unwrapped {@link Err} value.
 * @throws {AssertError} If the result is an {@link Ok}.
 *
 * @example
 * ```ts
 * let result: Result<string, Error>;
 * let errVal = assertErr(result); // <- May throw if the result is an Ok.
 * // -> Error
 * ```
 */
export function assertErr<A, B>(result: Result<A, B>): B;
export function assertErr<A, B>(result: AsyncResult<A, B>): Promise<B>;
export function assertErr<A, B>(result: ResultLike<A, B>) {
  if (AsyncResult.is(result))
    return result.then((res) => {
      if (res.err) return Promise.resolve(res.unwrapErr());

      return Promise.reject(
        new AssertError("Expected Err, but received Ok instead.", res),
      );
    });

  if (result.err) return result.unwrapErr();

  throw new AssertError("Expected Err, but received Ok instead.", result);
}

/**
 * Flattens a nested result into a single result.
 *
 * @param result The nested result to flatten.
 * @returns The flattened result.
 *
 * @example
 * ```ts
 * flatten(Ok(Ok(1)))
 * // -> Ok(1)
 * flatten(Ok(Err("")))
 * // -> Err("")
 * flatten(Err(""))
 * // -> Err("")
 ```
 */
export function flatten<A, B>(result: Result<Result<A, B>, B>): Result<A, B>;
/**
 * @overload Asynchronous version of the {@link partition} method.
 */
export function flatten<A, B>(
  result: AsyncResult<MaybeAsyncResult<A, B>, B>,
): AsyncResult<A, B>;
export function flatten<A, B>(
  result: Result<Result<A, B>, B> | AsyncResult<MaybeAsyncResult<A, B>, B>,
): Result<A, B> | AsyncResult<A, B> {
  if (isResult(result)) return result.ok ? result.unwrap() : result;

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
  return result instanceof Ok;
}

/**
 * Checks if the given value is an {@link Err}.
 *
 * @param result The value to check.
 * @returns A boolean indicating if the value is an {@link Err}.
 */
export function isErr(result: unknown): result is Err<unknown> {
  return result instanceof Err;
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
 * partition([Ok(1), Error("a"), Error("b"), Ok(2)])
 * // -> [[1, 2], ["a", "b"]]
 * ```
 */
export function partition<A, B>(results: Result<A, B>[]): Pair<A[], B[]>;
/**
 * @overload Asynchronous version of the {@link partition} method.
 */
export function partition<A, B>(
  results: AsyncResult<A, B>[],
): Promise<Pair<A[], B[]>>;
export function partition<A, B>(
  results: Result<A, B>[] | AsyncResult<A, B>[],
): Pair<A[], B[]> | Promise<Pair<A[], B[]>> {
  if (AsyncResult.is(results))
    return Promise.all(results).then((res) => partition(res));

  const ok = [];
  const err = [];

  for (const result of results)
    if (result.ok) ok.push(result.unwrap());
    else err.push(result.unwrapErr());

  return [ok, err];
}

type Callback<A extends Array<any> = any[], R = any> = (...args: A) => R;
type AutoDetermineResult<A, B> = A extends Promise<infer P>
  ? AsyncResult<P, B>
  : Result<A, B>;

/**
 * Proxies a function to catch any thrown errors and return a result.
 * This method is similar to `result.wrap`, but is usefull if you need to call and wrap the same function multiple times.
 *
 * @param callback The function that should be proxied.
 * @returns A result containing either the result of the callback function as an {@link Ok}, or the thrown error as an {@link Err}. If the callback returns a promise, it will return an {@link AsyncResult} instead.
 *
 * @example
 * ```ts
 * const fn = proxy(fs.writeFileSync)
 * fn("file.txt", "Data to write to file", "utf-8")
 * // -> Result<undefined, Error>
 *
 * // Optionally: the error type can be specified as the first generic parameter.
 * const typedFn = proxy<TypeError>(someMethodThatThrows)
 * typedFn(someMethodArgs)
 * // -> Result<someReturnType, TypeError>
 * ```
 *
 * @template B The error that `callback` may throw, defaults to the generic `Error` type.
 * @template C The type of the callback function, should not have to be specified, as it should be inferred from the `callback` parameter.
 */
export function proxy<B = Error, C extends Callback = Callback>(
  callback: C,
): (...args: Parameters<C>) => AutoDetermineResult<ReturnType<C>, B> {
  return (...args: Parameters<C>) =>
    wrap(() => callback(...args)) as AutoDetermineResult<ReturnType<C>, B>;
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
 * unwrapBoth(Ok(1))
 * // -> 1
 * unwrapBoth(Err(2))
 * // -> 2
 * ```
 */
export function unwrapBoth<A>(result: Result<A, A>): A;
export function unwrapBoth<A>(result: AsyncResult<A, A>): Promise<A>;
export function unwrapBoth<A>(
  result: Result<A, A> | AsyncResult<A, A>,
): MaybePromise<A> {
  return result._val;
}

/**
 * The same as {@link unwrapBoth}, but this one doesn't require the {@link Ok} and {@link Err} values to be of the same type.
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
  return result._val;
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
 * const res1: Result<number, Error> =
 *   all([num1, num2])
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
    return res.done ? new Ok(res.value) : new Err(res.value);

  return AsyncResult.from(
    res.then((awaited) =>
      awaited.done ? new Ok(awaited.value) : new Err(awaited.value),
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
 * values([Ok(1), Err("error"), Ok(3)])
 * // -> [1, 3]
 * ```
 */
export function values<A, B>(results: Result<A, B>[]): A[];
export function values<A, B>(results: AsyncResult<A, B>[]): Promise<A[]>;
export function values<A, B>(
  results: Result<A, B>[] | AsyncResult<A, B>[],
): MaybePromise<A[]> {
  if (AsyncResult.is(results))
    return Promise.all(results).then((arr) => values(arr));

  const val: A[] = [];
  for (const result of results) if (result.ok) val.push(result.unwrap());
  return val;
}

/**
 * Wraps a function that may throw an error, into a result.
 * If you know what the error type is, you can specify it as the first generic parameter, by default it is the default `Error` type.
 *
 * @param callback The function that should be wrapped.
 * @returns A result containing either they result of the callback function as an {@link Ok}, or the thrown error as an {@link Err}. If the callback returns a promise, it will return an {@link AsyncResult} instead.
 *
 * @example
 * ```ts
 * wrap(() => 1)
 * // -> Ok(1)
 * wrap(() => { throw new Error('error') })
 * // -> Err(Error('error'))
 * ```
 *
 * @template B The error that the callback may throw, defaults to the generic `Error` type.
 * @template A The return type of the callback, this should be inferred automatically.
 */
export function wrap<B = Error, A = any>(
  callback: () => A,
): AutoDetermineResult<A, B> {
  // The assertions are needed, as typescript can't infer correctly without them.
  try {
    const returned = callback();
    if (!(returned instanceof Promise))
      return new Ok(returned) as AutoDetermineResult<A, B>;

    return AsyncResult.from(
      new Promise((resolve) => {
        returned
          .then((val) => resolve(new Ok(val)))
          .catch((err) => resolve(new Err(err)));
      }),
    ) as AutoDetermineResult<A, B>;
  } catch (error) {
    return new Err(error) as AutoDetermineResult<A, B>;
  }
}

/**
 * @deprecated Use {@link wrap} instead.
 */
export async function wrapAsync<A, E = Error>(
  callback: () => Promise<A>,
): Promise<Result<A, E>> {
  try {
    return new Promise((resolve) => {
      callback().then(
        (v) => resolve(new Ok(v)),
        (e) => resolve(new Err(e)),
      );
    });
  } catch (error) {
    return new Err(error as E);
  }
}
