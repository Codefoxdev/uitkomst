export function isPromise(value: unknown): value is Promise<any> {
  return value instanceof Promise;
}

export function isPromisefn(callback: unknown): callback is () => Promise<any> {
  return callback?.constructor.name === "AsyncFunction";
}
