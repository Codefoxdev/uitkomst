import type { Result } from ".";
import type { AsyncResult } from "./async";
import type { Err, Ok } from "./result";

/**
 * Represents a value that can be deferred with a yield* statement, to be turned into a result.
 * The implementation of the [Symbol.iterator] method is expected to return a generator
 * that yields its errors and returns its value.
 *
 * @param A The value that is expected to be returned; the {@link Ok} value.
 * @param B The error type that can be thrown; the {@link Err} value.
 *
 * @example This is the internal implementation of this interface on the Ok and Err types respectively
 * ```ts
 * // Implementation on the Ok type
 * [Symbol.iterator] = function* (this: Ok<A>) {
 *   return this.val;
 * };
 * // Implementation on the Err type
 * [Symbol.iterator] = function* (this: Err<B>) {
 *   yield this.val;
 * };
 * ```
 */
export interface Yieldable<A, B> {
  [Symbol.iterator](): Yields<A, B>;
}

export type Yields<A, B> = Generator<B, A, unknown>;

/**
 * An asynchronous version of {@link Yieldable}.
 */
export interface AsyncYieldable<A, B> {
  [Symbol.asyncIterator](): AsyncYields<A, B>;
}

export type AsyncYields<A, B> = AsyncGenerator<B, A, unknown>;

export type Tag = string | symbol;

export interface Tagged<T extends Tag> {
  readonly _tag: T;
}

export type PromiseIf<A, B> = A extends Promise<any> ? Promise<Awaited<B>> : B;
export type ResultLike<A, B> = Result<A, B> | AsyncResult<A, B>;

export type Pair<A, B> = [A, B];
export type MaybePromise<T> = Promise<T> | T;
export type MaybeAsyncResult<A, B> =
  | AsyncResult<A, B>
  | MaybePromise<Result<A, B>>;

export type Function<A extends Array<any> = any[], R = any> = (...args: A) => R;

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
export type InferOk<T> = T extends Ok<infer O>
  ? O
  : T extends AsyncResult<infer O, any>
    ? O
    : never;
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
export type InferErr<T> = T extends Err<infer E>
  ? E
  : T extends AsyncResult<any, infer E>
    ? E
    : never;
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
export type InferValue<T> = InferOk<T> | InferErr<T>;

export interface Trace {
  readonly id: Tag;
}
