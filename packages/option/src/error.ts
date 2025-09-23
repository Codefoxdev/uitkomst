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
