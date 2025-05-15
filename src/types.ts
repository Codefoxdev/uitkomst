import type { Result, Ok, Err } from "./result";
import type { AsyncResult } from "./result/async";

export interface Yields<T, R> {
  [Symbol.iterator](): Generator<T, R, never>;
}

export type Pair<A, B> = [A, B];
export type MaybePromise<T> = Promise<T> | T;
export type MaybeAsyncResult<A, B> =
  | AsyncResult<A, B>
  | MaybePromise<Result<A, B>>;

/**
 * Extracts the {@link Ok} value out of a result type.
 *
 * @example
 * ```ts
 * type OkType = ExtractOk<Result<string, Error>>
 * // -> string
 * type OkType = ExtractOk<Ok<number>>
 * // -> number
 * type OkType = ExtractOk<Err<Error>>
 * // -> never
 * ```
 */
export type ExtractOk<T> = T extends Ok<infer O> ? O : never;
/**
 * Extracts the {@link Err} value out of a result type.
 *
 * @example
 * ```ts
 * type ErrType = ExtractErr<Result<string, Error>>
 * // -> Error
 * type ErrType = ExtractErr<Ok<number>>
 * // -> never
 * type ErrType = ExtractErr<Err<Error>>
 * // -> Error
 * ```
 */
export type ExtractErr<T> = T extends Err<infer E> ? E : never;
/**
 * Extracts the value out of a result type, a.k.a. the type that the result.val property would have.
 * This type just use the {@link ExtractOk} and {@link ExtractErr} types under the hood.
 *
 * @example
 * ```ts
 * type ResultType = ExtractValue<Result<string, Error>>
 * // -> string | Error
 * type ResultType = ExtractValue<Ok<number>>
 * // -> number
 * type ResultType = ExtractValue<Err<Error>>
 * // -> Error
 * ```
 */
export type ExtractValue<T> = ExtractOk<T> | ExtractErr<T>;
