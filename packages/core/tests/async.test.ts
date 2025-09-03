import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { AsyncResult, Err, Ok, Result } from "../src/index";

describe("AsyncResult constructors", () => {
  describe("Ok constructor", () => {
    test("Should create an AsyncResult instance that resolves to an Ok result", async () => {
      const asyncOk = AsyncResult.Ok(42);
      expect(asyncOk).toBeInstanceOf(AsyncResult);

      const awaited = await asyncOk;
      expectTypeOf(awaited).toEqualTypeOf<Ok<number>>();
      expect(awaited).toBeInstanceOf(Result.Ok);
      expect(awaited.ok).toBe(true);
      expect(awaited._val).toBe(42);
    });
  });

  describe("Err constructor", () => {
    test("Should create an AsyncResult instance that resolves to an Err result", async () => {
      const asyncOk = AsyncResult.Err("Uh oh!");
      expect(asyncOk).toBeInstanceOf(AsyncResult);

      const awaited = await asyncOk;
      expectTypeOf(awaited).toEqualTypeOf<Err<string>>();
      expect(awaited).toBeInstanceOf(Result.Err);
      expect(awaited.err).toBe(true);
      expect(awaited._val).toBe("Uh oh!");
    });
  });
});
