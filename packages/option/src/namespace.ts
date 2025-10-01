import { AsyncOption } from "./async";
import { None, Some } from "./option";

class _Option {
  private constructor() {}

  static readonly Some = Some;
  static readonly None = None;
  static readonly AsyncOption = AsyncOption;
}

export const Option = _Option;

export type Option<A> = Some<A> | None;
