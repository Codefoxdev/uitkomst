import { describe, expect, expectTypeOf, test } from "vitest";
import { AsyncResult, Err, Ok, Result } from "../src/index";
// Seperate the static methods imports for clarity
// This space is needed for biome formatter's import organization

import {
  AssertError,
  all,
  assertErr,
  assertOk,
  errValues,
  flatten,
  partition,
  values,
} from "../src/index";

describe("all", () => {
  test("(sync) should return all Ok values, if there's no Err", () => {
    const res = all([Ok(1), Ok(2), Ok(3)]);

    expectTypeOf(res).toEqualTypeOf<Result<number[], never>>();
    expect(res).toBeInstanceOf(Result.Ok);
    expect(res._val).toEqual([1, 2, 3]);
  });

  test("(sync) should return a Err value, if there's one or more Err values", () => {
    const res = all([Ok(1), Err("Uh oh!"), Ok(3), Err("another error")]);

    expectTypeOf(res).toEqualTypeOf<Result<number[], string>>();
    expect(res).toBeInstanceOf(Result.Err);
    expect(res._val).toBe("Uh oh!");
  });

  test("(async) should return all Ok values, if there's no Err", async () => {
    const res = all([AsyncResult.Ok(1), AsyncResult.Ok(2), AsyncResult.Ok(3)]);
    expectTypeOf(res).toEqualTypeOf<AsyncResult<number[], never>>();
    expect(res).toBeInstanceOf(AsyncResult);

    const awaited = await res;
    expect(awaited).toBeInstanceOf(Result.Ok);
    expect(awaited._val).toEqual([1, 2, 3]);
  });

  test("(async) should return a Err value, if there's one or more Err values", async () => {
    const res = all([
      AsyncResult.Ok(1),
      AsyncResult.Err("Uh oh!"),
      AsyncResult.Ok(3),
      AsyncResult.Err("another error"),
    ]);
    expectTypeOf(res).toEqualTypeOf<AsyncResult<number[], string>>();
    expect(res).toBeInstanceOf(AsyncResult);

    const awaited = await res;
    expect(awaited).toBeInstanceOf(Result.Err);
    expect(awaited._val).toBe("Uh oh!");
  });

  test("(mixed) should handle mixed arrays", async () => {
    const res = all([Ok(1), AsyncResult.Err("Uh oh!"), Ok(3)]);
    expectTypeOf(res).toEqualTypeOf<AsyncResult<number[], string>>();
    expect(res).toBeInstanceOf(AsyncResult);

    const awaited = await res;
    expect(awaited).toBeInstanceOf(Result.Err);
    expect(awaited._val).toBe("Uh oh!");
  });
});

describe("assertErr", () => {
  test("(sync) should return the value, if it is an Err", () => {
    const res = assertErr(Err("Uh oh!"));
    expect(res).toBe("Uh oh!");
  });

  test("(sync) should throw an AssertError, if it is an Ok", () => {
    const cb = () => assertErr(Ok(42));
    expectTypeOf(cb).toEqualTypeOf<() => never>();
    expect(cb).toThrow(AssertError);
  });

  test("(async) should return the value, if it is an Err", async () => {
    const res = assertErr(AsyncResult.Err("Uh oh!"));
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expect(awaited).toBe("Uh oh!");
  });

  test("(async) should throw an AssertError, if it is an Ok", async () => {
    const asyncCb = () => assertErr(AsyncResult.Ok(42));
    expectTypeOf(asyncCb).toEqualTypeOf<() => Promise<never>>();
    await expect(asyncCb).rejects.toThrow(AssertError);
  });
});

describe("assertOk", () => {
  test("(sync) should return the value, if it is an Ok", () => {
    const res = assertOk(Ok(42));
    expect(res).toBe(42);
  });

  test("(sync) should throw an AssertError, if it is an Err", () => {
    const cb = () => assertOk(Err("Uh oh!"));
    expectTypeOf(cb).toEqualTypeOf<() => never>();
    expect(cb).toThrow(AssertError);
  });

  test("(async) should return the value, if it is an Ok", async () => {
    const res = assertOk(AsyncResult.Ok(42));
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expect(awaited).toBe(42);
  });

  test("(async) should throw an AssertError, if it is an Err", async () => {
    const asyncCb = () => assertOk(AsyncResult.Err("Uh oh!"));
    expectTypeOf(asyncCb).toEqualTypeOf<() => Promise<never>>();
    await expect(asyncCb).rejects.toThrow(AssertError);
  });
});

describe("flatten", () => {
  test("(sync) should flatten Ok(Ok(value)) to Ok(value)", () => {
    const res = flatten(Ok(Ok(42)));

    expectTypeOf(res).toEqualTypeOf<Result<number, never>>();
    expect(res).toBeInstanceOf(Result.Ok);
    expect(res._val).toBe(42);
  });

  test("(sync) should flatten Ok(Err(error)) to Err(error)", () => {
    const res = flatten(Ok(Err("Uh oh!")));

    expectTypeOf(res).toEqualTypeOf<Result<never, string>>();
    expect(res).toBeInstanceOf(Result.Err);
    expect(res._val).toBe("Uh oh!");
  });

  test("(sync) should flatten Err(error) to Err(error)", () => {
    const res = flatten(Err("outer error"));

    expectTypeOf(res).toEqualTypeOf<Result<never, string>>();
    expect(res).toBeInstanceOf(Result.Err);
    expect(res._val).toBe("outer error");
  });

  test("(async) should flatten AsyncResult with Ok(Ok(value)) to Ok(value)", async () => {
    const res = flatten(AsyncResult.Ok(Ok(42)));
    expectTypeOf(res).toEqualTypeOf<AsyncResult<number, never>>();
    expect(res).toBeInstanceOf(AsyncResult);

    const awaited = await res;
    expect(awaited).toBeInstanceOf(Result.Ok);
    expect(awaited._val).toBe(42);
  });

  test("(async) should flatten AsyncResult with Ok(Err(error)) to Err(error)", async () => {
    const res = flatten(AsyncResult.Ok(Err("Uh oh!")));
    expectTypeOf(res).toEqualTypeOf<AsyncResult<never, string>>();
    expect(res).toBeInstanceOf(AsyncResult);

    const awaited = await res;
    expect(awaited).toBeInstanceOf(Result.Err);
    expect(awaited._val).toBe("Uh oh!");
  });

  test("(async) should flatten AsyncResult with Err(error) to Err(error)", async () => {
    const res = flatten(AsyncResult.Err("outer error"));
    expectTypeOf(res).toEqualTypeOf<AsyncResult<never, string>>();
    expect(res).toBeInstanceOf(AsyncResult);

    const awaited = await res;
    expect(awaited).toBeInstanceOf(Result.Err);
    expect(awaited._val).toBe("outer error");
  });
});

describe("partition", () => {
  test("(sync) should separate Ok and Err values into two arrays", () => {
    const res = partition([Ok(1), Err("error1"), Ok(2), Err("error2"), Ok(3)]);

    expectTypeOf(res).toEqualTypeOf<[number[], string[]]>();
    expect(res).toEqual([
      [1, 2, 3],
      ["error1", "error2"],
    ]);
  });

  test("(sync) should return empty Err array when all are Ok", () => {
    const res = partition([Ok(1), Ok(2), Ok(3)]);

    expectTypeOf(res).toEqualTypeOf<[number[], never[]]>();
    expect(res).toEqual([[1, 2, 3], []]);
  });

  test("(sync) should return empty Ok array when all are Err", () => {
    const res = partition([Err("error1"), Err("error2"), Err("error3")]);

    expectTypeOf(res).toEqualTypeOf<[never[], string[]]>();
    expect(res).toEqual([[], ["error1", "error2", "error3"]]);
  });

  test("(async) should separate Ok and Err values into two arrays", async () => {
    const res = partition([
      AsyncResult.Ok(1),
      AsyncResult.Err("error1"),
      AsyncResult.Ok(2),
      AsyncResult.Err("error2"),
      AsyncResult.Ok(3),
    ]);
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<[number[], string[]]>();
    expect(awaited).toEqual([
      [1, 2, 3],
      ["error1", "error2"],
    ]);
  });

  test("(async) should return empty Err array when all are Ok", async () => {
    const res = partition([
      AsyncResult.Ok(1),
      AsyncResult.Ok(2),
      AsyncResult.Ok(3),
    ]);
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<[number[], never[]]>();
    expect(awaited).toEqual([[1, 2, 3], []]);
  });

  test("(async) should return empty Ok array when all are Err", async () => {
    const res = partition([
      AsyncResult.Err("error1"),
      AsyncResult.Err("error2"),
      AsyncResult.Err("error3"),
    ]);
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<[never[], string[]]>();
    expect(awaited).toEqual([[], ["error1", "error2", "error3"]]);
  });

  test("(mixed) should handle mixed arrays", async () => {
    const res = partition([
      Ok(1),
      AsyncResult.Err("error1"),
      AsyncResult.Ok(2),
      Err("error2"),
    ]);
    expectTypeOf(res).toEqualTypeOf<Promise<[number[], string[]]>>();
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<[number[], string[]]>();
    expect(awaited).toEqual([
      [1, 2],
      ["error1", "error2"],
    ]);
  });
});

describe("values", () => {
  test("(sync) should return an array of all Ok values", () => {
    const res = values([Ok(1), Err("Uh oh!"), Ok(2), Err("another Err")]);

    expectTypeOf(res).toEqualTypeOf<number[]>();
    expect(res).toEqual([1, 2]);
  });

  test("(sync) should return an empty array, if no Ok values present", () => {
    const res = values([
      Err("Uh oh!"),
      Err("another Err"),
      Err("even more!??"),
    ]);

    expectTypeOf(res).toEqualTypeOf<never[]>();
    expect(res).toEqual([]);
  });

  test("(async) should return an array of all Ok values", async () => {
    const res = values([
      AsyncResult.Ok(1),
      AsyncResult.Err("Uh oh!"),
      AsyncResult.Ok(2),
      AsyncResult.Err("another Err"),
    ]);
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<number[]>();
    expect(awaited).toEqual([1, 2]);
  });

  test("(async) should return an empty array, if no Ok values present", async () => {
    const res = values([
      AsyncResult.Err("Uh oh!"),
      AsyncResult.Err("another Err"),
      AsyncResult.Err("even more!??"),
    ]);
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<never[]>();
    expect(awaited).toEqual([]);
  });

  test("(mixed) should handle mixed arrays", async () => {
    const res = values([
      Ok(1),
      AsyncResult.Err("Uh oh!"),
      AsyncResult.Ok(2),
      Err("another Err"),
    ]);
    expectTypeOf(res).toEqualTypeOf<Promise<number[]>>();
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<number[]>();
    expect(awaited).toEqual([1, 2]);
  });
});

describe("errValues", () => {
  test("(sync) should return an array of all Err values", () => {
    const res = errValues([Ok(1), Err("Uh oh!"), Ok(2), Err("another Err")]);

    expectTypeOf(res).toEqualTypeOf<string[]>();
    expect(res).toEqual(["Uh oh!", "another Err"]);
  });

  test("(sync) should return an empty array, if no Err values present", () => {
    const res = errValues([Ok(1), Ok(2), Ok(3)]);

    expectTypeOf(res).toEqualTypeOf<never[]>();
    expect(res).toEqual([]);
  });

  test("(async) should return an array of all Err values", async () => {
    const res = errValues([
      AsyncResult.Ok(1),
      AsyncResult.Err("Uh oh!"),
      AsyncResult.Ok(2),
      AsyncResult.Err("another Err"),
    ]);
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<string[]>();
    expect(awaited).toEqual(["Uh oh!", "another Err"]);
  });

  test("(async) should return an empty array, if no Err values present", async () => {
    const res = errValues([
      AsyncResult.Ok(1),
      AsyncResult.Ok(2),
      AsyncResult.Ok(3),
    ]);
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<never[]>();
    expect(awaited).toEqual([]);
  });

  test("(mixed) should handle mixed arrays", async () => {
    const res = errValues([
      Ok(1),
      AsyncResult.Err("Uh oh!"),
      AsyncResult.Ok(2),
      Err("another Err"),
    ]);
    expectTypeOf(res).toEqualTypeOf<Promise<string[]>>();
    expect(res).toBeInstanceOf(Promise);

    const awaited = await res;
    expectTypeOf(awaited).toEqualTypeOf<string[]>();
    expect(awaited).toEqual(["Uh oh!", "another Err"]);
  });
});
