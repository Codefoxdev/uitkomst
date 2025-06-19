import type { Tagged } from "./types";

export class AssertError extends Error implements Tagged<"AssertError"> {
  override readonly name = "AssertError";
  readonly _tag = 'AssertError';

  constructor(message: string, readonly val: any) {
    super(message);
  }
}
