import type { MaybePromise, MaybeAsyncResult, Pair, Yields } from "../types";
import type { Result } from ".";
import { Ok, Err } from ".";

/* extends Yields<AsyncResult<A, B>, A> */
interface BaseAsyncResult<A, B> {
  readonly val: Promise<A | B>;
  readonly ok: Promise<boolean>;
  readonly err: Promise<boolean>;

  //lazyOr(callback: () => MaybeAsyncResult<A, B>): AsyncResult<A, B>;
  //lazyUnwrap(callback: () => MaybePromise<A>): Promise<A>;
  map<C>(callback: (val: A) => MaybePromise<C>): AsyncResult<C, B>;
  mapErr<C>(callback: (val: B) => MaybePromise<C>): AsyncResult<A, C>;
  //or(fallback: MaybeAsyncResult<A, B>): AsyncResult<A, B>;
  replace<C>(val: MaybePromise<C>): AsyncResult<C, B>;
  replaceErr<C>(val: MaybePromise<C>): AsyncResult<A, C>;
  tap(callback: (val: A) => MaybePromise<void>): this;
  tapErr(callback: (val: B) => MaybePromise<void>): this;
  toPair(): Promise<Pair<A | null, B | null>>;
  toResult(): Promise<Result<A, B>>;
  try<C>(callback: (val: A) => MaybeAsyncResult<C, B>): AsyncResult<C, B>;
  tryRecover<C>(
    callback: (val: B) => MaybeAsyncResult<A, C>,
  ): AsyncResult<A, C>;
  unwrap(fallback: MaybePromise<A>): Promise<A>;
  unwrapErr(fallback: MaybePromise<B>): Promise<B>;
}

export class AsyncResult<A, B> implements BaseAsyncResult<A, B> {
  readonly val: Promise<A | B>;
  readonly ok: Promise<boolean>;
  readonly err: Promise<boolean>;

  private constructor(private _val: Promise<Result<A, B>>) {
    this.val = _val.then((res) => res.val);
    this.ok = _val.then((res) => res.ok);
    this.err = _val.then((res) => res.err);
  }

  map<C>(callback: (val: A) => MaybePromise<C>): AsyncResult<C, B> {
    return this.from((res) => flattenResultPromise(res.map(callback)));
  }

  mapErr<C>(callback: (val: B) => MaybePromise<C>): AsyncResult<A, C> {
    return this.from((res) => flattenResultPromise(res.mapErr(callback)));
  }

  replace<C>(val: MaybePromise<C>): AsyncResult<C, B> {
    return this.from((res) => flattenResultPromise(res.replace(val)));
  }

  replaceErr<C>(val: MaybePromise<C>): AsyncResult<A, C> {
    return this.from((res) => flattenResultPromise(res.replaceErr(val)));
  }

  tap(callback: (val: A) => MaybePromise<void>): this {
    this.awaited((res) => res.ok && callback(res.val));
    return this;
  }

  tapErr(callback: (val: B) => MaybePromise<void>): this {
    this.awaited((res) => res.err && callback(res.val));
    return this;
  }

  async toPair(): Promise<Pair<A | null, B | null>> {
    return this.toResult().then((result) => result.toPair());
  }

  async toResult(): Promise<Result<A, B>> {
    return this._val;
  }

  try<C>(callback: (val: A) => MaybeAsyncResult<C, B>): AsyncResult<C, B> {
    return this.from(async (res) => {
      if (res.err) return res;
      return toPromiseResult(await callback(res.unwrap()));
    });
  }

  tryRecover<C>(
    callback: (val: B) => MaybeAsyncResult<A, C>,
  ): AsyncResult<A, C> {
    return this.from(async (res) => {
      if (res.ok) return res;
      return toPromiseResult(await callback(res.unwrapErr()));
    });
  }

  async unwrap(fallback: MaybePromise<A>): Promise<A> {
    return await this.toResult().then((result) => {
      if (result.ok) return result.unwrap();
      else return fallback;
    });
  }

  async unwrapErr(fallback: MaybePromise<B>): Promise<B> {
    return await this.toResult().then((result) => {
      if (result.err) return result.unwrapErr();
      else return fallback;
    });
  }

  private from<C, D>(
    callback: (res: Result<A, B>) => Promise<Result<C, D>>,
  ): AsyncResult<C, D> {
    return new AsyncResult(
      (async () => {
        const res = await this.toResult();
        return callback(res);
      })(),
    );
  }

  private async awaited(
    callback: (res: Result<A, B>) => unknown,
  ): Promise<void> {
    callback(await this.toResult());
  }

  static from<A, B>(res: Result<A, B>): AsyncResult<A, B> {
    return new AsyncResult(Promise.resolve(res));
  }
}

async function flattenResultPromise<A, B>(
  res: Result<A, B>,
): Promise<Result<Awaited<A>, Awaited<B>>> {
  const val = await res.val;
  if (res.ok) return Ok(val as Awaited<A>);
  else return Err(val as Awaited<B>);
}

function toPromiseResult<A, B>(
  res: MaybeAsyncResult<A, B>,
): Promise<Result<A, B>> {
  if (res instanceof AsyncResult) return res.toResult();
  else return ensurePromise(res);
}

async function ensurePromise<A>(val: MaybePromise<A>): Promise<A> {
  return await val;
}
