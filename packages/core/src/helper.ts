export function isPromise(value: unknown): value is Promise<any> {
  return value instanceof Promise;
}
