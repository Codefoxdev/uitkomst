import type {
  AsyncResultLike,
  AsyncYieldable,
  AsyncYields,
  MaybePromise,
  Tagged,
} from "uitkomst";
import type { InferSome, OptionGuard } from "./index";
import type { Option } from "./option";
import { AsyncResult, Err, Ok, Uitkomst, YieldError } from "uitkomst";
import { None, Some } from "./index";

export class AsyncOption<A>
  extends Promise<OptionGuard<A>>
  implements
    AsyncYieldable<A, void>,
    Tagged<"AsyncOption">,
    AsyncResultLike<A, void>
{
  readonly _tag = "AsyncOption";

  get _val(): Promise<A | void> {
    return super.then((opt) => opt._val);
  }

  get some(): Promise<boolean> {
    return super.then((opt) => opt.some);
  }

  get none(): Promise<boolean> {
    return super.then((opt) => opt.none);
  }

  lazyOr(
    callback: () => AsyncOption<A> | MaybePromise<Option<A>>,
  ): AsyncOption<Awaited<A>> {
    return this._map(async (opt) => {
      if (opt.some) return Some(await opt.unwrap());
      else return toOption(callback());
    });
  }

  async lazyUnwrap(callback: () => MaybePromise<A>): Promise<A> {
    const opt = (await this) as Option<A>;
    if (opt.some) return opt.unwrap();
    else return callback();
  }

  map<B>(callback: (val: A) => B): AsyncOption<Awaited<B>> {
    return this._map(async (opt) => {
      if (opt.some) return Some(await callback(opt.unwrap()));
      else return None;
    });
  }

  or(other: AsyncOption<A> | MaybePromise<Option<A>>): AsyncOption<Awaited<A>> {
    return this._map(async (opt) => {
      if (opt.some) return Some(await opt.unwrap());
      else return toOption(other);
    });
  }

  tap(callback: (val: A) => void): this {
    super.then((opt) => opt.some && callback(opt.unwrap()));
    return this;
  }

  toResult<B>(fallback: MaybePromise<B>): AsyncResult<A, B> {
    return AsyncResult.from(
      super.then(async (opt) => {
        if (opt.some) return Ok(opt.unwrap());
        else return Err(await fallback);
      }),
    );
  }

  try<B>(
    callback: (val: A) => AsyncOption<B> | MaybePromise<Option<B>>,
  ): AsyncOption<B> {
    return this._map(async (opt) => {
      if (opt.some) return toOption(callback(opt.unwrap()));
      else return None;
    });
  }

  async unwrap(fallback: MaybePromise<A>): Promise<A> {
    return (await this).unwrap(await fallback);
  }

  [Uitkomst.toResultSymbol](): AsyncResult<A, void> {
    return this.toResult<void>(undefined);
  }

  async *[Symbol.asyncIterator](this: AsyncOption<A>): AsyncYields<A, void> {
    const opt = await this;
    if (opt.some) return opt.unwrap();

    yield undefined;
    throw new YieldError(this);
  }

  protected _map<B>(
    callback: (opt: OptionGuard<A>) => Promise<Option<B>>,
  ): AsyncOption<Awaited<B>> {
    return AsyncOption.from(super.then(callback));
  }

  static Some<A>(val: A): AsyncOption<Awaited<A>> {
    return AsyncOption.from(Promise.resolve(val).then((val) => Some(val)));
  }

  static get None(): AsyncOption<never> {
    return AsyncOption.from(Promise.resolve(None));
  }

  static from<C extends AsyncOption<any> | MaybePromise<Option<any>>>(
    opt: C,
  ): AsyncOption<InferSome<Awaited<C>>> {
    if (opt instanceof AsyncOption) return opt;

    return new AsyncOption(async (resolve) => {
      resolve(opt as MaybePromise<OptionGuard<InferSome<Awaited<C>>>>);
    });
  }
}

async function toOption<A>(
  opt: AsyncOption<A> | MaybePromise<Option<A>>,
): Promise<Option<Awaited<A>>> {
  const awaited = await opt;
  return awaited.some ? Some(await awaited.unwrap()) : None;
}
