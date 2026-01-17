export function isPromisefn(callback: unknown): callback is () => Promise<any> {
  return callback?.constructor.name === "AsyncFunction";
}
