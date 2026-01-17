import type { ResultType } from "./types";
import { AsyncResult } from "./async";

export function isPromise(value: unknown): value is Promise<any> {
  return value instanceof Promise;
}

export function isPromisefn(callback: unknown): callback is () => Promise<any> {
  return callback?.constructor.name === "AsyncFunction";
}

export function block<C>(cb: () => Promise<C>): Promise<C> {
  return cb();
}

export function arrayAnyAreAsync(results: ResultType<any, any>[]): boolean {
  return results.reduce((is, res) => (!is ? AsyncResult.is(res) : true), false);
}
