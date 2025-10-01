import { describe, expect, expectTypeOf, test } from "vitest";
import { None, Option, Some } from "../src/index";

describe("Option constructors", () => {
  describe("Some constructor", () => {
    test("should create an Some instance with the given value", () => {
      const res = Some(42);

      expectTypeOf(res).toEqualTypeOf<Some<number>>();
      expect(res).toBeInstanceOf(Option.Some);
      expect(res._val).toBe(42);
      expect(res.some).toBe(true);
      expect(res.none).toBe(false);
    });

    test("should create an empty Some<void> without parameters", () => {
      const res = Some();

      expectTypeOf(res).toEqualTypeOf<Some<void>>();
      expect(res).toBeInstanceOf(Option.Some);
      expect(res._val).toBeUndefined();
    });
  });

  test("None constructor", () => {
    const none = None;

    expectTypeOf(none).toEqualTypeOf<None>();
    expect(none).toBeInstanceOf(Option.None);
    expect(none._val).toBeUndefined();
    expect(none.some).toBe(false);
    expect(none.none).toBe(true);
  });
});
