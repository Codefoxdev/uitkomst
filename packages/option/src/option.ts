import type { Result, ResultLike, Tagged, Yieldable, Yields } from "uitkomst";
import { AssertError, Err, Ok, YieldError } from "uitkomst";
import { MissingNoneError } from "./error";

export type Option<A> = Some<A> | None;

export abstract class AbstractOption<A>
  implements
    Yieldable<A, void>,
    Tagged<"Option">,
    ResultLike<A, MissingNoneError>
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

  //abstract lazyOr(callback: () => Option<A>): Option<A>;
  //abstract lazyUnwrap(callback: () => A): A;
  //abstract map<B>(callback: (val: A) => B): Option<B>;
  //abstract or(other: Option<A>): Option<A>;
  //abstract tap(callback: (val: Awaited<A>) => void): Option<A>;
  abstract toResult(): Result<A, MissingNoneError>;
  //abstract try<B>(callback: (val: A) => Option<B>): Option<B>;

  abstract unwrap(fallback: A): A;

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

  override toResult(): Ok<A> {
    return Ok(this._val);
  }

  override unwrap(): A {
    return this._val;
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

  override toResult(): Err<MissingNoneError> {
    return Err(new MissingNoneError());
  }

  override unwrap<A>(fallback: A): A {
    return fallback;
  }
}
