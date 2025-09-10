import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { AsyncResult, Err, Ok, Result } from "../src/index";

describe("Result contructors", () => {
  describe("Ok contructor", () => {
    test("should create an Ok instance with the given value", () => {
      const res = Ok(42);

      expectTypeOf(res).toEqualTypeOf<Ok<number>>();
      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(42);
      expect(res.ok).toBe(true);
      expect(res.err).toBe(false);
    });

    test("should create an empty Ok<void> without parameters", () => {
      const res = Ok();

      expectTypeOf(res).toEqualTypeOf<Ok<void>>();
      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBeUndefined();
    });
  });

  describe("Err constructor", () => {
    test("should create an Err instance with the given value", () => {
      const res = Err("error");

      expectTypeOf(res).toEqualTypeOf<Err<string>>();
      expect(res).toBeInstanceOf(Result.Err);
      expect(res._val).toBe("error");
      expect(res.ok).toBe(false);
      expect(res.err).toBe(true);
    });

    test("should create an empty Err<void> without parameters", () => {
      const res = Err();

      expectTypeOf(res).toEqualTypeOf<Err<void>>();
      expect(res).toBeInstanceOf(Result.Err);
      expect(res._val).toBeUndefined();
    });
  });
});

describe("Result methods", () => {
  describe("Ok", () => {
    test("lazyOr, should return the same Ok instance and not call the callback", () => {
      const callback = vi.fn();
      // @ts-expect-error: should not be called
      const res = Ok(7).lazyOr(callback);

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(7);
      expect(callback).not.toHaveBeenCalled();
    });

    test("lazyUnwrap, should return the inner value and not call the callback", () => {
      const callback = vi.fn();

      // @ts-expect-error: should not be called
      expect(Ok(7).lazyUnwrap(callback)).toBe(7);
      expect(callback).not.toHaveBeenCalled();
    });

    describe("map", () => {
      test("should map the value to a new Ok instance", () => {
        const res = Ok(7).map((x) => x * 2);

        expect(res).toBeInstanceOf(Result.Ok);
        expect(res._val).toBe(14);
      });

      test("should map to a result promise when returning a promise in the callback method", async () => {
        const res = Ok(7).map(async (x) => x * 2);

        expect(res).toBeInstanceOf(Result.Ok);
        expect(res._val).toBeInstanceOf(Promise);
        expect(await res._val).toBe(14);
      });
    });

    test("mapErr, should not map on an Ok", () => {
      // @ts-expect-error: should not be called
      const res = Ok(7).mapErr((x) => x * 2);

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(7);
    });

    test("or, should return the same Ok instance", () => {
      // @ts-expect-error: should not be called
      const res = Ok(7).or(Err("error"));

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(7);
    });

    test("replace, should replace the value", () => {
      const res = Ok(7).replace(10);

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(10);
    });

    test("replaceErr, should not replace the value", () => {
      // @ts-expect-error: should not be called
      const res = Ok(7).replaceErr("error");

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(7);
    });

    test("swap, should swap the Ok and Err values", () => {
      const res = Ok(7).swap();

      expect(res).toBeInstanceOf(Result.Err);
      expect(res._val).toBe(7);
    });

    test("tap, should call the given callback", () => {
      const callback = vi.fn();
      const res = Ok(7).tap(callback);

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(7);
      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(7);
    });

    test("tapErr, should not call the given callback", () => {
      const callback = vi.fn();
      // @ts-expect-error: should not be called
      const res = Ok(7).tapErr(callback);

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(7);
      expect(callback).not.toHaveBeenCalled();
    });

    test("toPair, should return a pair", () => {
      const res = Ok(7).toPair();

      expect(res).toEqual([7, null]);
    });

    describe("try", () => {
      test("(sync) should return a Result from the callback", () => {
        const callback = vi.fn((x) => Ok(x * 2));
        const res = Ok(7).try(callback);

        expect(res).toBeInstanceOf(Result.Ok);
        expect(res._val).toBe(14);
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith(7);
      });

      test("(async) should return a Result from the callback", async () => {
        const callback = vi.fn(async (x) => Ok(x * 2));
        const res = Ok(7).try(callback);

        expect(res).toBeInstanceOf(AsyncResult);
        expect(res._val).toBeInstanceOf(Promise);

        const awaited = await res;
        expect(awaited._val).toBe(14);
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith(7);
      });
    });

    describe("tryRecover", () => {
      test("(sync) should return itself", () => {
        const callback = vi.fn(() => Ok(2));
        const res = Ok(7).tryRecover(callback);

        expect(res).toBeInstanceOf(Result.Ok);
        expect(res._val).toBe(7);
        expect(callback).not.toHaveBeenCalled();
      });

      test("(async) should return itself as Asyncresult", async () => {
        const mock = vi.fn(async () => Ok(2));
        const callback = async () => mock(); // This is needed as vi.fn doesn't set constructor name as `AsyncFunction`, which is required for this method.
        const res = Ok(7).tryRecover(callback);

        expect(res).toBeInstanceOf(AsyncResult);
        expect(res._val).toBeInstanceOf(Promise);

        const awaited = await res;
        expect(awaited._val).toBe(7);
        expect(mock).not.toHaveBeenCalled();
      });
    });

    test("unwrap, should return inner value", () => {
      // @ts-expect-error: should not be used
      expect(Ok(7).unwrap(14)).toBe(7);
    });

    test("unwrapErr, should return fallback value", () => {
      expect(Ok(7).unwrapErr("fallback")).toBe("fallback");
    });

    test("[Symbol.iterator], to return and not yield", () => {
      const res = Ok(7);
      const next = res[Symbol.iterator]().next();

      expect(next.value).toBe(7);
      expect(next.done).toBe(true);
    });
  });

  describe("Err", () => {
    test("lazyOr, should return the result from the callback", () => {
      const callback = vi.fn(() => Ok(42));
      const res = Err("error").lazyOr(callback);

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(42);
      expect(callback).toHaveBeenCalledOnce();
    });

    test("lazyUnwrap, should return the result from the callback", () => {
      const callback = vi.fn(() => 42);

      expect(Err("error").lazyUnwrap(callback)).toBe(42);
      expect(callback).toHaveBeenCalledOnce();
    });

    test("map, should not map on an Err", () => {
      // @ts-expect-error: should not be called
      const res = Err("error").map((x) => x * 2);

      expect(res).toBeInstanceOf(Result.Err);
      expect(res._val).toBe("error");
    });

    describe("mapErr", () => {
      test("should map the error to a new Err instance", () => {
        const res = Err("error").mapErr((x) => x + "!");

        expect(res).toBeInstanceOf(Result.Err);
        expect(res._val).toBe("error!");
      });

      test("should map to a result promise when returning a promise in the callback method", async () => {
        const res = Err("error").mapErr(async (x) => x + "!");

        expect(res).toBeInstanceOf(Result.Err);
        expect(res._val).toBeInstanceOf(Promise);
        expect(await res._val).toBe("error!");
      });
    });

    test("or, should return the provided result", () => {
      const res = Err("error").or(Ok(42));

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(42);
    });

    test("replace, should not replace the value", () => {
      // @ts-expect-error: should not be called
      const res = Err("error").replace(10);

      expect(res).toBeInstanceOf(Result.Err);
      expect(res._val).toBe("error");
    });

    test("replaceErr, should replace the error value", () => {
      const res = Err("error").replaceErr("new error");

      expect(res).toBeInstanceOf(Result.Err);
      expect(res._val).toBe("new error");
    });

    test("swap, should swap the Ok and Err values", () => {
      const res = Err(7).swap();

      expect(res).toBeInstanceOf(Result.Ok);
      expect(res._val).toBe(7);
    });

    test("tap, should not call the given callback", () => {
      const callback = vi.fn();
      // @ts-expect-error: should not be called
      const res = Err("error").tap(callback);

      expect(res).toBeInstanceOf(Result.Err);
      expect(res._val).toBe("error");
      expect(callback).not.toHaveBeenCalled();
    });

    test("tapErr, should call the given callback", () => {
      const callback = vi.fn();
      const res = Err("error").tapErr(callback);

      expect(res).toBeInstanceOf(Result.Err);
      expect(res._val).toBe("error");
      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith("error");
    });

    test("toPair, should return a pair", () => {
      const res = Err("error").toPair();

      expect(res).toEqual([null, "error"]);
    });

    describe("try", () => {
      test("(sync) should return itself", () => {
        const callback = vi.fn((x) => Ok(x + "!"));
        const res = Err("error").try(callback);

        expect(res).toBeInstanceOf(Result.Err);
        expect(res._val).toBe("error");
        expect(callback).not.toHaveBeenCalled();
      });

      test("(async) should return itself as AsyncResult", async () => {
        const mock = vi.fn(async (x) => Ok(x + "!"));
        const callback = async (x: any) => mock(x); // This is needed as vi.fn doesn't set constructor name as `AsyncFunction`, which is required for this method.
        const res = Err("error").try(callback);

        expect(res).toBeInstanceOf(AsyncResult);
        expect(res._val).toBeInstanceOf(Promise);

        const awaited = await res;
        expect(awaited._val).toBe("error");
        expect(mock).not.toHaveBeenCalled();
      });
    });

    describe("tryRecover", () => {
      test("(sync) should return a Result from the callback", () => {
        const callback = vi.fn((x) => Ok(x + "!"));
        const res = Err("error").tryRecover(callback);

        expect(res).toBeInstanceOf(Result.Ok);
        expect(res._val).toBe("error!");
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith("error");
      });

      test("(async) should return a Result from the callback", async () => {
        const callback = vi.fn(async (x) => Ok(x + "!"));
        const res = Err("error").tryRecover(callback);

        expect(res).toBeInstanceOf(AsyncResult);
        expect(res._val).toBeInstanceOf(Promise);

        const awaited = await res;
        expect(awaited._val).toBe("error!");
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith("error");
      });
    });

    test("unwrap, should return fallback value", () => {
      expect(Err("error").unwrap(14)).toBe(14);
    });

    test("unwrapErr, should return inner error value", () => {
      // @ts-expect-error: should not be used
      expect(Err("error").unwrapErr("fallback")).toBe("error");
    });

    test("[Symbol.iterator], should yield and not return and throw when calling again", () => {
      const res = Err("error");
      const gen = res[Symbol.iterator]();
      const next = gen.next();

      expect(next.value).toBe("error");
      expect(next.done).toBe(false);
      expect(gen.next).toThrow();
    });
  });
});
