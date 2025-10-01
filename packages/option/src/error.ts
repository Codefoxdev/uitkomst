import type { Tagged } from "uitkomst";

// TODO: Better, more descriptive error name
export class MissingNoneError
  extends Error
  implements Tagged<"MissingNoneError">
{
  override readonly name = "MissingNoneError";
  readonly _tag = "MissingNoneError";

  constructor() {
    super(
      "Option converted to a Result, but no value was provided for the Err case",
    );
  }
}

export class ExpectedOptionError
  extends Error
  implements Tagged<"ExpectedOptionError">
{
  override readonly name = "ExpectedOptionError";
  readonly _tag = "ExpectedOptionError";

  constructor(readonly val: any) {
    super(
      `Expected the received value to be a option${val?._tag ? ", but received an object tagged with " + val._tag.toString() : ""}`,
    );
  }
}
