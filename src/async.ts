import type {
  MaybePromise,
  MaybeAsyncResult,
  Pair,
  AsyncYields,
  Tagged,
} from "./types";
import type { Result } from "./result";
import { Ok, Err } from "./result";

export class AsyncResult<A, B>
  extends Promise<Result<A, B>>
  implements AsyncYields<A, B>, Tagged<"AsyncResult">
{
  readonly _tag = "AsyncResult";
  readonly _type = "Async";

  get _val(): Promise<A | B> {
    return super.then((res) => res._val);
  }

  get ok(): Promise<boolean> {
    return super.then((res) => res.ok);
  }

  get err(): Promise<boolean> {
    return super.then((res) => res.err);
  }

  lazyOr(callback: () => MaybeAsyncResult<A, B>): AsyncResult<A, B> {
    return createAsyncResultFrom(this, (res) =>
      res.ok ? res : toPromiseResult(callback()),
    );
  }

  async lazyUnwrap(callback: () => MaybePromise<A>): Promise<A> {
    return super.then((res) => res.lazyUnwrap(callback));
  }

  map<C>(callback: (val: A) => MaybePromise<C>): AsyncResult<C, B> {
    return createAsyncResultFrom(this, (res) =>
      flattenResultPromise(res.map(callback)),
    );
  }

  mapErr<C>(callback: (val: B) => MaybePromise<C>): AsyncResult<A, C> {
    return createAsyncResultFrom(this, (res) =>
      flattenResultPromise(res.mapErr(callback)),
    );
  }

  or(fallback: MaybeAsyncResult<A, B>): AsyncResult<A, B> {
    return createAsyncResultFrom(this, (res) =>
      res.ok ? res : toPromiseResult(fallback),
    );
  }

  replace<C>(val: MaybePromise<C>): AsyncResult<C, B> {
    return createAsyncResultFrom(this, (res) =>
      flattenResultPromise(res.replace(val)),
    );
  }

  replaceErr<C>(val: MaybePromise<C>): AsyncResult<A, C> {
    return createAsyncResultFrom(this, (res) =>
      flattenResultPromise(res.replaceErr(val)),
    );
  }

  tap(callback: (val: A) => MaybePromise<void>): this {
    super.then((res) => res.ok && callback(res._val));
    return this;
  }

  tapErr(callback: (val: B) => MaybePromise<void>): this {
    super.then((res) => res.err && callback(res._val));
    return this;
  }

  async toPair(): Promise<Pair<A | null, B | null>> {
    return super.then((result) => result.toPair());
  }

  toAsync(): this {
    return this;
  }

  try<C>(callback: (val: A) => MaybeAsyncResult<C, B>): AsyncResult<C, B> {
    return createAsyncResultFrom(this, async (res) => {
      if (res.err) return res;
      return toPromiseResult(await callback(res.unwrap()));
    });
  }

  tryRecover<C>(
    callback: (val: B) => MaybeAsyncResult<A, C>,
  ): AsyncResult<A, C> {
    return createAsyncResultFrom(this, async (res) => {
      if (res.ok) return res;
      return toPromiseResult(await callback(res.unwrapErr()));
    });
  }

  async unwrap(fallback: MaybePromise<A>): Promise<A> {
    return super.then((res) => (res.ok ? res.unwrap() : fallback));
  }

  async unwrapErr(fallback: MaybePromise<B>): Promise<B> {
    return super.then((res) => (res.err ? res.unwrapErr() : fallback));
  }

  async *[Symbol.asyncIterator](
    this: AsyncResult<A, B>,
  ): AsyncGenerator<B, A, never> {
    const res = await this;
    if (res.ok) return res.unwrap();

    yield res.unwrapErr();
    throw new Error(
      "Err value iterator fully consumed. This iterator is designed to yield its error value and then terminate execution flow.",
    );
  }

  static ok<A>(val: A | Promise<A>): AsyncResult<A, never> {
    return new AsyncResult<A, never>((resolve) =>
      Promise.resolve(val).then((v) => resolve(new Ok(v))),
    );
  }

  static err<B>(val: B | Promise<B>): AsyncResult<never, B> {
    return new AsyncResult<never, B>((resolve) =>
      Promise.resolve(val).then((v) => resolve(new Err(v))),
    );
  }

  /**
   * Constructs an AsyncResult from a Result, a `Promise<Result>` or an existing AsyncResult.
   *
   * @param res The value to construct an AsyncResult from.
   * @returns The constructed AsyncResult.
   */
  static from<A, B>(res: MaybeAsyncResult<A, B>): AsyncResult<A, B> {
    if (AsyncResult.is(res)) return res;
    else return new AsyncResult((resolve) => resolve(toPromiseResult(res)));
  }

  /**
   * Checks if the given value is an AsyncResult, or if it is an array containing only AsyncResults.
   *
   * @param res The value to check.
   * @returns A boolean indicating whether the value is an AsyncResult or an array containg only AsyncResults.
   */
  static is(
    res: unknown,
  ): res is AsyncResult<unknown, unknown> | AsyncResult<unknown, unknown>[] {
    if (res instanceof AsyncResult) return true;
    else
      return Array.isArray(res) && res.every((r) => r instanceof AsyncResult);
  }
}

// Helper methods

export async function flattenResultPromise<A, B>(
  res: Result<A, B>,
): Promise<Result<Awaited<A>, Awaited<B>>> {
  if (res.ok) return new Ok(res._val as Awaited<A>);
  else return new Err(res._val as Awaited<B>);
}

export function createAsyncResult<A, B>(
  callback: () => MaybeAsyncResult<A, B>,
): AsyncResult<A, B> {
  return AsyncResult.from(callback());
}

export function createAsyncResultFrom<A, B, C, D>(
  baseResult: AsyncResult<A, B>,
  callback: (res: Result<A, B>) => MaybeAsyncResult<C, D>,
): AsyncResult<C, D> {
  return AsyncResult.from(
    baseResult.then((res) => toPromiseResult(callback(res))),
  );
}

export function toPromiseResult<A, B>(
  res: MaybeAsyncResult<A, B>,
): Promise<Result<A, B>> {
  if (AsyncResult.is(res)) return res;
  else return Promise.resolve(res);
}
