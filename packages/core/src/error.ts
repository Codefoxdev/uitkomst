import type { Tag, Tagged } from "./types";

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

export class ExpectedResultError
  extends Error
  implements Tagged<"ExpectedResultError">
{
  override readonly name = "ExpectedResultError";
  readonly _tag = "ExpectedResultError";

  constructor(readonly val: any) {
    super(
      `Expected the received value to be a result${val._tag ? ", but received an object tagged with " + val._tag.toString() : ""}`,
    );
  }
}
