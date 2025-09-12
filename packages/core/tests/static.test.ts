import { describe, expect, expectTypeOf, test } from "vitest";
import { AssertError, AsyncResult, Err, Ok, Result } from "../src/index";
// Seperate the static methods imports for clarity
// This space is needed for biome formatter's import organization

import {
  all,
  assertErr,
  assertOk,
  errValues,
  flatten,
  partition,
  proxy,
  values,
  wrap,
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
    const res = all([
      Ok(1),
      AsyncResult.Err("Uh oh!"),
      AsyncResult.Ok(3),
      Err("another error"),
    ]);
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

describe("wrap", () => {
  const test1 = () => 42;
  const test2 = (): string => {
    throw new Error("This should be caugt");
  };

  test("(sync) should return an Ok when the function doesn't throw", () => {
    // First overload
    const res1 = wrap<Error>()(test1);

    expectTypeOf(res1).toEqualTypeOf<Result<number, Error>>();
    expect(res1).toBeInstanceOf(Result.Ok);
    expect(res1._val).toBe(42);

    // Second overload
    const res2 = wrap<Error, typeof test1>(test1);

    expectTypeOf(res2).toEqualTypeOf<Result<number, Error>>();
    expect(res2).toBeInstanceOf(Result.Ok);
    expect(res2._val).toBe(42);
  });

  test("(sync) should return an Err when the function throws", () => {
    expect(test2).toThrow();

    // First overload
    const res1 = wrap<Error>()(test2);

    expectTypeOf(res1).toEqualTypeOf<Result<string, Error>>();
    expect(res1).toBeInstanceOf(Result.Err);
    expect(res1._val).toBeInstanceOf(Error);

    // Second overload
    const res2 = wrap<Error, typeof test2>(test2);

    expectTypeOf(res2).toEqualTypeOf<Result<string, Error>>();
    expect(res2).toBeInstanceOf(Result.Err);
    expect(res2._val).toBeInstanceOf(Error);
  });

  const testAsync1 = async () => 42;
  const testAsync2 = async (): Promise<string> => {
    return Promise.reject(new Error("This should be caugt"));
  };

  test("(async) should return an Ok when the function doesn't throw", async () => {
    // First overload
    const res1 = wrap<Error>()(testAsync1);

    expectTypeOf(res1).toEqualTypeOf<AsyncResult<number, Error>>();
    expect(res1).toBeInstanceOf(AsyncResult);
    expect(await res1).toBeInstanceOf(Result.Ok);
    expect((await res1)._val).toBe(42);

    // Second overload
    const res2 = wrap<Error, typeof testAsync1>(testAsync1);

    expectTypeOf(res2).toEqualTypeOf<AsyncResult<number, Error>>();
    expect(res2).toBeInstanceOf(AsyncResult);
    expect(await res2).toBeInstanceOf(Result.Ok);
    expect((await res2)._val).toBe(42);
  });

  test("(async) should return an Err when the function throws", async () => {
    await expect(testAsync2).rejects.toThrow();

    // First overload
    const res1 = wrap<Error>()(testAsync2);

    expectTypeOf(res1).toEqualTypeOf<AsyncResult<string, Error>>();
    expect(res1).toBeInstanceOf(AsyncResult);
    expect(await res1).toBeInstanceOf(Result.Err);
    expect((await res1)._val).toBeInstanceOf(Error);

    // Second overload
    const res2 = wrap<Error, typeof testAsync2>(testAsync2);

    expectTypeOf(res2).toEqualTypeOf<AsyncResult<string, Error>>();
    expect(res2).toBeInstanceOf(AsyncResult);
    expect(await res2).toBeInstanceOf(Result.Err);
    expect((await res2)._val).toBeInstanceOf(Error);
  });
});

describe("proxy", () => {
  const test1 = () => 42;
  const test2 = (): string => {
    throw new Error("This should be caugt");
  };
  const test3 = (x: number, y: string, z: boolean) =>
    [x * 2, y + "!", !z] as [number, string, boolean];

  test("(sync) should return an Ok when the function doesn't throw", () => {
    // First overload
    const fn1 = proxy<Error>()(test1);
    const res1 = fn1();

    expectTypeOf(res1).toEqualTypeOf<Result<number, Error>>();
    expect(res1).toBeInstanceOf(Result.Ok);
    expect(res1._val).toBe(42);

    // Second overload
    const fn2 = proxy<Error, typeof test1>(test1);
    const res2 = fn2();

    expectTypeOf(res2).toEqualTypeOf<Result<number, Error>>();
    expect(res2).toBeInstanceOf(Result.Ok);
    expect(res2._val).toBe(42);
  });

  test("(sync) should return an Err when the function throws", () => {
    expect(test2).toThrow();

    // First overload
    const fn1 = proxy<Error>()(test2);
    const res1 = fn1();

    expectTypeOf(res1).toEqualTypeOf<Result<string, Error>>();
    expect(res1).toBeInstanceOf(Result.Err);
    expect(res1._val).toBeInstanceOf(Error);

    // Second overload
    const fn2 = proxy<Error, typeof test2>(test2);
    const res2 = fn2();

    expectTypeOf(res2).toEqualTypeOf<Result<string, Error>>();
    expect(res2).toBeInstanceOf(Result.Err);
    expect(res2._val).toBeInstanceOf(Error);
  });

  test("(sync) should correctly pass along the arguments", () => {
    const fn1 = proxy<never>()(test3);
    const res1 = fn1(21, "hello", false);

    expectTypeOf(res1).toEqualTypeOf<Ok<[number, string, boolean]>>();
    expect(res1).toBeInstanceOf(Result.Ok);
    expect(res1._val).toEqual([42, "hello!", true]);
  });

  const testAsync1 = async () => 42;
  const testAsync2 = async (): Promise<string> => {
    return Promise.reject(new Error("This should be caugt"));
  };
  const testAsync3 = async (x: number, y: string, z: boolean) =>
    Promise.resolve([x * 2, y + "!", !z] as [number, string, boolean]);

  test("(async) should return an Ok when the function doesn't throw", async () => {
    // First overload
    const fn1 = proxy<Error>()(testAsync1);
    const res1 = fn1();

    expectTypeOf(res1).toEqualTypeOf<AsyncResult<number, Error>>();
    expect(res1).toBeInstanceOf(AsyncResult);
    expect(await res1).toBeInstanceOf(Result.Ok);
    expect((await res1)._val).toBe(42);

    // Second overload
    const fn2 = proxy<Error, typeof testAsync1>(testAsync1);
    const res2 = fn2();

    expectTypeOf(res2).toEqualTypeOf<AsyncResult<number, Error>>();
    expect(res2).toBeInstanceOf(AsyncResult);
    expect(await res2).toBeInstanceOf(Result.Ok);
    expect((await res2)._val).toBe(42);
  });

  test("(async) should return an Err when the function throws", async () => {
    await expect(testAsync2).rejects.toThrow();

    // First overload
    const fn1 = proxy<Error>()(testAsync2);
    const res1 = fn1();

    expectTypeOf(res1).toEqualTypeOf<AsyncResult<string, Error>>();
    expect(res1).toBeInstanceOf(AsyncResult);
    expect(await res1).toBeInstanceOf(Result.Err);
    expect((await res1)._val).toBeInstanceOf(Error);

    // Second overload
    const fn2 = proxy<Error, typeof testAsync2>(testAsync2);
    const res2 = fn2();

    expectTypeOf(res2).toEqualTypeOf<AsyncResult<string, Error>>();
    expect(res2).toBeInstanceOf(AsyncResult);
    expect(await res2).toBeInstanceOf(Result.Err);
    expect((await res2)._val).toBeInstanceOf(Error);
  });

  test("(async) should correctly pass along the arguments", async () => {
    const fn1 = proxy<never>()(testAsync3);
    const res1 = fn1(21, "hello", false);

    expectTypeOf(res1).toEqualTypeOf<
      AsyncResult<[number, string, boolean], never>
    >();
    expect(res1).toBeInstanceOf(AsyncResult);
    expect(await res1).toBeInstanceOf(Result.Ok);
    expect((await res1)._val).toEqual([42, "hello!", true]);
  });
});
