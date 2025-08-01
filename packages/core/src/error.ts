import type { Tagged, Tag } from "./types";

export class AssertError extends Error implements Tagged<"AssertError"> {
  override readonly name = "AssertError";
  readonly _tag = "AssertError";

  constructor(
    message: string,
    readonly val: any,
  ) {
    super(message);
  }
}

export class YieldError extends Error implements Tagged<"YieldError"> {
  override readonly name = "YieldError";
  readonly _tag = "YieldError";

  constructor(on: Tagged<Tag>) {
    super(
      `Iterator fully consumed, but this iterator is designed to yield its error value and terminate further execution, on object tagged with ${on._tag.toString()}`,
    );
  }
}
