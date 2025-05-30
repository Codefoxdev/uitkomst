import type {
  MaybePromise,
  MaybeAsyncResult,
  Pair,
  AsyncYields,
} from "../types";
import type { Result } from "./index";
import { Ok, Err } from "./index";

export class AsyncResult<A, B> implements AsyncYields<A, B> {
  readonly val: Promise<A | B>;
  readonly ok: Promise<boolean>;
  readonly err: Promise<boolean>;

  private constructor(private _val: Promise<Result<A, B>>) {
    this.val = _val.then((res) => res.val);
    this.ok = _val.then((res) => res.ok);
    this.err = _val.then((res) => res.err);
  }

  //lazyOr(callback: () => MaybeAsyncResult<A, B>): AsyncResult<A, B>;
  //lazyUnwrap(callback: () => MaybePromise<A>): Promise<A>;

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
    this.toResult().then((res) => res.ok && callback(res.val));
    return this;
  }

  tapErr(callback: (val: B) => MaybePromise<void>): this {
    this.toResult().then((res) => res.err && callback(res.val));
    return this;
  }

  async toPair(): Promise<Pair<A | null, B | null>> {
    return this.toResult().then((result) => result.toPair());
  }

  async toResult(): Promise<Result<A, B>> {
    return this._val;
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
    return this.toResult().then((res) => (res.ok ? res.unwrap() : fallback));
  }

  async unwrapErr(fallback: MaybePromise<B>): Promise<B> {
    return this.toResult().then((res) =>
      res.err ? res.unwrapErr() : fallback,
    );
  }

  async *[Symbol.asyncIterator](
    this: AsyncResult<A, B>,
  ): AsyncGenerator<B, A, never> {
    const res = await this.toResult();
    if (res.ok) return res.unwrap();

    yield res.unwrapErr();
    throw new Error(
      "Err value iterator fully consumed. This iterator is designed to yield its error value and then terminate execution flow.",
    );
  }

  static ok<A>(val: A): AsyncResult<A, never> {
    return new AsyncResult<A, never>(Promise.resolve(Ok(val)));
  }

  static err<B>(val: B): AsyncResult<never, B> {
    return new AsyncResult<never, B>(Promise.resolve(Err(val)));
  }

  /**
   * Constructs an AsyncResult from a Result, a `Promise<Result>` or an existing AsyncResult.
   *
   * @param res The value to construct an AsyncResult from.
   * @returns The constructed AsyncResult.
   */
  static from<A, B>(res: MaybeAsyncResult<A, B>): AsyncResult<A, B> {
    if (res instanceof AsyncResult) return res;
    else
      return new AsyncResult(
        res instanceof Promise ? res : Promise.resolve(res),
      );
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
  const val = await res.val;
  if (res.ok) return Ok(val as Awaited<A>);
  else return Err(val as Awaited<B>);
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
    baseResult.toResult().then((res) => toPromiseResult(callback(res))),
  );
}

export function toPromiseResult<A, B>(
  res: MaybeAsyncResult<A, B>,
): Promise<Result<A, B>> {
  if (res instanceof AsyncResult) return res.toResult();
  else return Promise.resolve(res);
}
