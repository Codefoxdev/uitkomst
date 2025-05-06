export interface Yields<T, R> {
  [Symbol.iterator](): Generator<T, R, never>;
}
