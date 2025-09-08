import type {
  Function,
  InferErr,
  InferOk,
  InferValue,
  MaybePromise,
  Pair,
  ResultLike,
} from "./types";
import { Result } from ".";
import { AsyncResult, mapAsyncResult } from "./async";
import { AssertError } from "./error";
import { arrayAnyAreAsync, block } from "./helper";
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
export function all<C extends Result<any, any>>(
  results: C[],
): Result<InferOk<C>[], InferErr<C>>;
export function all<C extends ResultLike<any, any>>(
  results: C[],
): AsyncResult<InferOk<C>[], InferErr<C>>;
export function all<A, B>(results: ResultLike<A, B>[]) {
  if (results.length === 0) return new Ok([]);

  // Handle if any are async
  if (arrayAnyAreAsync(results))
    return new AsyncResult(async (resolve) => {
      const arr = await Promise.all(results);
      resolve(all(arr));
    });

  // All results are normal results
  let values: A[] = [];
  for (const res of results as Result<A, B>[])
    if (res.ok) values.push(res._val);
    else return res;

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
export function assertOk<C extends Result<any, any>>(result: C): InferOk<C>;
export function assertOk<C extends AsyncResult<any, any>>(
  result: C,
): Promise<InferOk<C>>;
export function assertOk<A, B>(result: ResultLike<A, B>) {
  if (AsyncResult.is(result))
    return result
      .unwrapPromise()
      .catch((res: Err<B>) =>
        Promise.reject(
          new AssertError("Expected Ok, but received Err instead.", res),
        ),
      );

  if (result.ok) return result.unwrap();
  else throw new AssertError("Expected Ok, but received Err instead.", result);
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
export function assertErr<C extends Result<any, any>>(result: C): InferErr<C>;
export function assertErr<C extends AsyncResult<any, any>>(
  result: C,
): Promise<InferErr<C>>;
export function assertErr<A, B>(result: ResultLike<A, B>) {
  if (AsyncResult.is(result))
    return result
      .swap()
      .unwrapPromise()
      .catch((res: Err<A>) =>
        Promise.reject(
          new AssertError("Expected Err, but received Ok instead.", res),
        ),
      );

  if (result.err) return result.unwrapErr();

  throw new AssertError("Expected Err, but received Ok instead.", result);
}

/**
 * Flattens a nested result into a single result.
 *
 * @see {@link flatten} the method that performs the flattening.
 *
 * @template C The nested result to flatten.
 * @returns The flattened result.
 */
export type FlattenResult<C extends ResultLike<ResultLike<any, any>, any>> =
  C extends Result<Result<any, any>, any>
    ? Result<InferOk<InferOk<C>>, InferErr<InferOk<C>> | InferErr<C>>
    : C extends Result<AsyncResult<any, any>, any>
      ? AsyncResult<InferOk<InferOk<C>>, InferErr<InferOk<C>> | InferErr<C>>
      : C extends AsyncResult<ResultLike<any, any>, any>
        ? AsyncResult<InferOk<InferOk<C>>, InferErr<InferOk<C>> | InferErr<C>>
        : never;

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
 *```
 */
export function flatten<C extends ResultLike<ResultLike<any, any>, any>>(
  result: C,
): FlattenResult<C>;
export function flatten<A, B>(result: ResultLike<ResultLike<A, B>, B>) {
  if (AsyncResult.is(result))
    return mapAsyncResult(result, (res) => (res.ok ? res.unwrap() : res));

  return result.ok ? result.unwrap() : result;
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
export function partition<C extends Result<any, any>>(
  results: C[],
): Pair<InferOk<C>[], InferErr<C>[]>;
export function partition<C extends ResultLike<any, any>>(
  results: C[],
): Promise<Pair<InferOk<C>[], InferErr<C>[]>>;
export function partition<A, B>(results: ResultLike<A, B>[]) {
  if (results.length === 0) return [[], []] as Pair<A[], B[]>;

  // Handle if any are async
  if (arrayAnyAreAsync(results))
    return block(async () => {
      const awaited = await Promise.all(results);
      return partition(awaited);
    });

  // All results are normal results
  const pair: Pair<A[], B[]> = [[], []];
  for (const res of results as Result<A, B>[])
    if (res.ok) pair[0].push(res.unwrap());
    else pair[1].push(res.unwrapErr());

  return pair;
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
export function unwrapBoth<C extends Result<any, any>>(
  result: C,
): InferValue<C>;
export function unwrapBoth<C extends AsyncResult<any, any>>(
  result: C,
): Promise<InferValue<C>>;
export function unwrapBoth(result: ResultLike<any, any>): MaybePromise<any> {
  return result._val;
}

/**
 * The same as {@link unwrapBoth}, but this one doesn't require the {@link Ok} and {@link Err} values to be of the same type.
 *
 * @param result The result to unwrap, also supports {@link AsyncResult}
 * @returns The inner value of the result
 * @deprecated Use {@link unwrapBoth} instead.
 */
export function unwrapBothUnsafe<C extends Result<any, any>>(
  result: C,
): InferValue<C>;
export function unwrapBothUnsafe<C extends AsyncResult<any, any>>(
  result: C,
): Promise<InferValue<C>>;
export function unwrapBothUnsafe<A, B>(
  result: Result<A, B> | AsyncResult<A, B>,
): MaybePromise<A | B> {
  return result._val;
}

/**
 * Given an array of results, returns an array containing all {@link Ok} values.
 * The length of the array is not necessarily equal to the length of the `results` array,
 * as all {@link Err} values are discarded, if you want to get all these values, use the {@link errValues} method instead.
 *
 * @param results The array of results, you want to get the values from.
 * @returns An array containing all {@link Ok} values from the results array.
 *
 * @example
 * ```ts
 * values([Ok(1), Err("error"), Ok(3)])
 * // -> [1, 3]
 * ```
 */
export function values<C extends Result<any, any>>(results: C[]): InferOk<C>[];
export function values<C extends ResultLike<any, any>>(
  results: C[],
): Promise<InferOk<C>[]>;
export function values<A, B>(results: ResultLike<A, B>[]) {
  // Handle if any are async
  if (arrayAnyAreAsync(results))
    return block(async () => {
      const awaited = await Promise.all(results);
      return values(awaited);
    });

  // All results are normal results
  const arr: A[] = [];
  for (const res of results as Result<A, B>[])
    if (res.ok) arr.push(res.unwrap());

  return arr;
}

/**
 * Given an array of results, returns an array containing all {@link Err} values.
 * The length of the array is not necessarily equal to the length of the `results` array,
 * as all {@link Ok} values are discarded, if you want to get all these values, use the {@link values} method instead.
 *
 * @param results The array of results, you want to get the values from.
 * @returns An array containing all {@link Err} values from the results array.
 *
 * @example
 * ```ts
 * errValues([Ok(1), Err("error"), Ok(3)])
 * // -> ["error"]
 * ```
 */
export function errValues<C extends Result<any, any>>(
  results: C[],
): InferErr<C>[];
export function errValues<C extends ResultLike<any, any>>(
  results: C[],
): Promise<InferErr<C>[]>;
export function errValues<A, B>(results: ResultLike<A, B>[]) {
  // Handle if any are async
  if (arrayAnyAreAsync(results))
    return block(async () => {
      const awaited = await Promise.all(results);
      return errValues(awaited);
    });

  // All results are normal results
  const arr: B[] = [];
  for (const res of results as Result<A, B>[])
    if (res.err) arr.push(res.unwrapErr());

  return arr;
}

/**
 * Determines the return type of a proxied function.
 * If the return type is already a result, it will be left unchanged.
 *
 * @see {@link proxy} the method that creates a proxied function.
 * @see {@link ProxyFunction} the type that creates the type signature of the proxied function.
 *
 * @template C The type of the function that should be proxied.
 * @template E The error that the function may throw, defaults to `unknown`, but can be specified for better type safety.
 */
export type ProxyFunctionReturn<
  C extends Function,
  E = unknown,
> = ReturnType<C> extends ResultLike<any, any>
  ? C
  : ReturnType<C> extends Promise<any>
    ? AsyncResult<Awaited<ReturnType<C>>, E>
    : Result<ReturnType<C>, E>;

/**
 * Proxies a function to catch any thrown errors and return a result.
 *
 * @see {@link proxy} the method that creates a proxied function.
 *
 * @template C The type of the function that should be proxied.
 * @template E The error that the function may throw, defaults to `unknown`, but can be specified for better type safety.
 * @returns A function that has the same parameters as `C`, but returns a result.
 */
export type ProxyFunction<C extends Function, E = unknown> = Function<
  Parameters<C>,
  ProxyFunctionReturn<C, E>
>;

/**
 * Proxies a function to catch any thrown errors and return a result.
 * This method is similar to {@link wrap}, but is usefull if you need to call and wrap the same function multiple times.
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
 * @template E The error that `callback` may throw, defaults to `unknown`, but can be specified for better type safety.
 * @template C The type of the callback function, should not have to be specified, as it should be inferred from the `callback` parameter.
 */
export function proxy<E = unknown, C extends Function = Function>(
  callback: C,
): ProxyFunction<C, E> {
  return (...args: Parameters<C>) =>
    wrap(() => callback(...args)) as ProxyFunctionReturn<C, E>;
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
 * @template E The error that the callback may throw, defaults to the generic `Error` type.
 * @template C The return type of the callback, this should be inferred automatically.
 */
export function wrap<E = unknown, C extends Function = Function>(
  callback: C,
): ProxyFunctionReturn<C, E> {
  try {
    const returned = callback();
    if (!(returned instanceof Promise))
      return new Ok(returned) as ProxyFunctionReturn<C, E>;

    return AsyncResult.from(
      new Promise((resolve) => {
        returned
          .then((val) => resolve(new Ok(val)))
          .catch((err) => resolve(new Err(err)));
      }),
    ) as ProxyFunctionReturn<C, E>;
  } catch (error) {
    return new Err(error) as ProxyFunctionReturn<C, E>;
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
