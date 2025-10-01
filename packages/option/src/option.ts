import type { Result, ResultLike, Tagged, Yieldable, Yields } from "uitkomst";
import type { Option } from "./namespace";
import { AssertError, Err, Ok, Uitkomst, YieldError } from "uitkomst";
import { AsyncOption } from "./async";
import { ExpectedOptionError } from "./error";
import { isPromisefn } from "./helper";

export abstract class AbstractOption<A>
  implements Yieldable<A, void>, Tagged<"Option">, ResultLike<A, void>
{
  declare readonly _val: A;
  readonly _tag = "Option";

  declare readonly some: boolean;
  declare readonly none: boolean;

  /**
   * Asserts that this option is a {@link Some}, and returns the unwrapped value.
   *
   * @param message Optionally provide a custom error message.
   * @returns The unwrapped {@link Some} value.
   * @throws {AssertError} If the option is an {@link None}.
   */
  abstract assertSome(message?: string): A;

  /**
   * Asserts that this option is a {@link None}.
   *
   * @param message Optionally provide a custom error message.
   * @throws {AssertError} If the option is an {@link Some}.
   */
  abstract assertNone(message?: string): void;

  abstract lazyOr(callback: () => Option<A>): Option<A>;
  abstract lazyUnwrap(callback: () => A): A;
  abstract map<B>(callback: (val: Awaited<A>) => B): Option<B>;
  abstract or(other: Option<A>): Option<A>;
  abstract tap(callback: (val: Awaited<A>) => void): Option<A>;
  abstract toResult<B>(fallback: B): Result<A, B>;
  // TODO: Add async support
  try<C extends Tagged<"Option"> | Promise<Tagged<"Option">>>(
    callback: (val: A) => C,
  ): C extends Promise<infer P>
    ? P extends AbstractOption<infer B>
      ? AsyncOption<B>
      : never
    : C extends AbstractOption<infer B>
      ? A extends Promise<any>
        ? AsyncOption<B>
        : Option<B>
      : never {
    return (() => {
      if (this.none)
        if (isPromisefn(callback)) return AsyncOption.None;
        else return this;

      const validate = (val: any): Option<any> => {
        if (val instanceof AbstractOption) return val as Option<any>;
        throw new ExpectedOptionError(val);
      };

      if (this._val instanceof Promise)
        return AsyncOption.from(this._val.then(callback).then(validate));

      const res = callback(this._val);
      if (res instanceof AsyncOption) return res;
      else if (res instanceof Promise)
        return AsyncOption.from(res.then(validate));
      else if (res instanceof AbstractOption) return res;

      throw new ExpectedOptionError(res);
    })() as C extends Promise<infer P>
      ? P extends AbstractOption<infer B>
        ? AsyncOption<B>
        : never
      : C extends AbstractOption<infer B>
        ? A extends Promise<any>
          ? AsyncOption<B>
          : Option<B>
        : never;
  }

  abstract unwrap(fallback: A): A;

  abstract [Uitkomst.toResultSymbol](): Result<A, void>;

  *[Symbol.iterator](this: Option<A>): Yields<A, void> {
    if (this.some) return this.unwrap();

    yield undefined;
    throw new YieldError(this);
  }
}

export class Some<A> extends AbstractOption<A> {
  override readonly some = true;
  override readonly none = false;

  constructor(override readonly _val: A) {
    super();
  }

  override assertSome(): A {
    return this._val;
  }

  override assertNone(message?: string): never {
    throw new AssertError(
      message ?? "Expected None, but received Some instead.",
      this,
    );
  }

  override lazyOr(): Some<A> {
    return this;
  }

  override lazyUnwrap(): A {
    return this.unwrap();
  }

  override map<B>(callback: (val: Awaited<A>) => B): Option<B> {
    if (this._val instanceof Promise)
      return new Some(this._val.then((v) => callback(v))) as Option<B>;

    const val = callback(this._val as Awaited<A>);
    return new Some(val);
  }

  override or(): Some<A> {
    return this;
  }

  override tap(callback: (val: Awaited<A>) => void): Some<A> {
    if (this._val instanceof Promise) this._val.then(callback);
    else callback(this._val as Awaited<A>);

    return this;
  }

  override toResult(): Ok<A> {
    return Ok(this._val);
  }

  override unwrap(): A {
    return this._val;
  }

  [Uitkomst.toResultSymbol](): Ok<A> {
    return Ok(this.unwrap());
  }
}

export class None extends AbstractOption<never> {
  override readonly _val = undefined as never;
  override readonly some = false;
  override readonly none = true;

  override assertSome(message?: string): never {
    throw new AssertError(
      message ?? "Expected Some, but received None instead.",
      this,
    );
  }

  override assertNone(): void {
    return undefined;
  }

  override lazyOr<A>(callback: () => Option<A>): Option<A> {
    return callback();
  }

  override lazyUnwrap<A>(callback: () => A): A {
    return callback();
  }

  override map(): None {
    return this;
  }

  override or<A>(other: Option<A>): Option<A> {
    return other;
  }

  override tap(): None {
    return this;
  }

  override toResult<B>(fallback: B): Err<B> {
    return Err(fallback);
  }

  override unwrap<A>(fallback: A): A {
    return fallback;
  }

  [Uitkomst.toResultSymbol](): Err<void> {
    return Err();
  }
}
