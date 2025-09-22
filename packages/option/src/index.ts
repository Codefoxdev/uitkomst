export { MissingNoneError } from "./error";
export { AbstractOption } from "./option";

import { None as _None, Some as _Some } from "./option";

export type Some<A> = _Some<A>;
export type None = _None;

export function Some(): Some<void>;
export function Some<A>(value: A): Some<A>;
export function Some<A>(value?: A) {
  if (value === undefined) return new _Some<void>(undefined);
  else return new _Some<A>(value);
}

export const None = new _None();
