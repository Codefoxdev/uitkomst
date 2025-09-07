import { AsyncResult } from "./async";
import { Err, Ok } from "./result";
import * as _static from "./static";

/**
 * @namespace
 * Namespace containing static utility methods for working with Result objects,
 * as well as the {@link Ok}, {@link Err} and {@link AsyncResult} classes.
 * These methods are also exported seperately.
 */
export const Result = {
  ..._static,
  /**
   * The {@link Ok} class, instead of this being exported directly,
   * a method with the same name is exported that acts as a constructor,
   * which enhances type-safety as well as convenience when not having to specify the `new` keyword.
   */
  Ok: Ok,
  /**
   * The {@link Err} class, instead of this being exported directly,
   * a method with the same name is exported that acts as a constructor,
   * which enhances type-safety as well as convenience when not having to specify the `new` keyword.
   */
  Err: Err,
  /**
   * The {@link AsyncResult} class, which is also exported directly.
   * See the class documentation for more information.
   */
  AsyncResult: AsyncResult,
};

/**
 * The `Result` type represents a value that can be either a success (`Ok`) or a failure (`Err`).
 * This implementation is heavily inspired by Gleam's Result type, however it also contains some additional methods
 * and the properties are in camelCase instead of snake_case to follow JavaScript conventions.
 */
export type Result<A, B> = Ok<A> | Err<B>;

/**
 * Ensures that the type of the inner value of the {@link Ok} is not `never`.
 * See {@link ResultGaurd}, for an explanation of why this type exists.
 * @package
 */
export type OkGuard<A> = [A] extends [never] ? never : Ok<A>;

/**
 * Ensures that the type of the inner value of the {@link Err} is not `never`.
 * See {@link ResultGaurd}, for an explanation of why this type exists.
 * @package
 */
export type ErrGuard<B> = [B] extends [never] ? never : Err<B>;

/**
 * Ensures that the {@link Result} never contains `never` as either the inner {@link Ok} or {@link Err} type.
 * As when using the normal result type as shown in the example, it will not narrow down the types correctly.
 * The reason why this isn't just used internally everywhere, is because it requires casting the types everytime a Result is created
 * and is generally a hassle to use.
 * It is used in the {@link AsyncResult} class, as the only time you will likely encounter this issue, is when awaiting an {@link AsyncResult}.
 *
 * @example
 * ```ts
 * // Although this doesn't break anything, it doesn't give proper types.
 * // For example, res.ok will still be just a boolean, instead of true.
 * type res = Result<number, never>;
 * // -> Ok<number> | Err<never>
 *
 * // When using the ResultGuard type, it will properly narrow down the types.
 * type res = ResultGaurd<number, never>;
 * // -> Ok<number>
 * ```
 * @package
 */
export type ResultGuard<A, B> = [A] extends [never]
  ? [B] extends [never]
    ? never
    : Err<B>
  : [B] extends [never]
    ? Ok<A>
    : Result<A, B>;
