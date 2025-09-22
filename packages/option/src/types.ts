import type { AsyncOption } from "./async";
import type { Some } from "./option";

export type InferSome<T, A = never> = T extends Some<infer O>
  ? O
  : T extends AsyncOption<infer O>
    ? O
    : A;

export type InferValue<T> = InferSome<T>;
