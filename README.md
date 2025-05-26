# Uitkomst
Uitkomst (Dutch word for "outcome" or "result") is library that simplifies and improves error handling, with full type-safety.

## Table of contents
- [Getting started](#getting-started)
- [Usage](#usage)
- [Why use a Result type](#Why-use-a-Result-type)
- [Comparison to gleam/result](#comparison-to-gleamresult)

## Getting started
To get started, simply install Uitkomst from JSR using your favorite package manager
```ts
pnpm i jsr:@uitkomst/core
```

### Requirements
In order for the Result type to function properly with Typescript, you have to enable `strict` or `strictNullChecks` in the `compilerOptions` field in your `tsconfig.json`.
```json
{
	"compilerOptions": {
		"strict": true,
		// or at least
		"strictNullChecks": true
	}
}
```
The core Uitkomst library doesn't have any dependencies and works on all platforms.

## Usage
The library exports a couple of methods, the most important methods to know are the `Ok()` and `Err()` methods. These methods are the building blocks for creating a `Result`. 

The library also exports a couple of static methods that are useful for handling result types, but are not able to be implemented on the Result instances, these methods are also exported under the `result` object if you prefer that.

Along with the `Result` type, the library also exports some helper types which could be useful for handling result types.

For an overview of all the exported Symbols, as well as their documentation, check the generated documentation on the JSR page: [@uitkomst/core](https://jsr.io/@uitkomst/core).

## Why use a Result type
There are a lot of ways your JavaScript code can break in production, one of the most frustrating ways is that methods can throw errors that you weren't expecting. Handling these errors is frustrating, and it is often unclear if a method can throw an error, let alone knowing what type of error it is.

This can be improved upon, by using a error-as-value approach, which is commonly seen in Gleam, Rust and Go. This approach makes it clear what errors can be encountered and forces you to handle those errors accordingly.

There are multiple approaches to error-as-value, but fundamentally there are two different methods:
- Returning a tuple with the value and possible errors. (Go)
- Returning something similar to a Result type, a thing that can be a value or an error. (Rust & Gleam)

Uitkomst is an error-as-value implementation for Typescript. It does by implementing a Result type similar to Rust and Gleam. The Result type is either an `Ok`, which indicates success, or an `Err`, which indicates that something went wrong. The type definition is more similar to Rust's implementation and looks like this:
```ts
type Result<A, B> = Ok<A> | Err<B>
```

### Inspirations
Uitkomst is primarily inspired by the [gleam/result](https://hexdocs.pm/gleam_stdlib/gleam/result.html) library. Most of those methods are also present in Uitkomst and are almost exactly the same as in gleam, for all the differences see [Comparison to gleam/result](#comparison-to-gleamresult).

However, if you want to have similar behavior to Go, you can use the `toPair()` method to convert the Result type to a tuple.

## Comparison to gleam/result

| Gleam/result implementation | Uitkomst implementation     | Notes                                                                                                                                                                                                                                       |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all()`                     | `result.all()`              | This method is implemented only on the static result object, as it uses a list of objects instead of a single instance.                                                                                                                     |
| `flatten()`                 | `result.flatten()`          | Same reason as `all()`.                                                                                                                                                                                                                     |
| `is_error()`                | `instance.err`              | This method is renamed and a property instead of a function for more elegant code.                                                                                                                                                          |
| `is_ok()`                   | `instance.ok`               | Same reason as above.                                                                                                                                                                                                                       |
| `lazy_or()`                 | `instance.lazyOr()`         |                                                                                                                                                                                                                                             |
| `lazy_unwrap()`             | `instance.lazyUnwrap()`     |                                                                                                                                                                                                                                             |
| `map()`                     | `instance.map()`            |                                                                                                                                                                                                                                             |
| `map_error()`               | `instance.mapErr()`         |                                                                                                                                                                                                                                             |
| `or()`                      | `instance.or()`             |                                                                                                                                                                                                                                             |
| `partition()`               | `result.partition()`        | Same reason as `all()`, as well as slightly different behaviour. Gleam's method returns the values in reverse order with respect to the position of the result in the array, Uitkomst doesn't, it is in the same order as the result array. |
| `replace()`                 | `instance.replace()`        |                                                                                                                                                                                                                                             |
| `replace_error()`           | `instance.replaceErr()`     |                                                                                                                                                                                                                                             |
| -                           | `instance.tap()`            | This method doesn't exist in gleam, but can be useful for debugging purposes, when you simply want to print the inner value without modifying anything. It is the same as `map()`, but it doesn't change anything.                          |
| -                           | `instance.tapErr()`         | Same reason as above.                                                                                                                                                                                                                       |
| `then()`                    | -                           | This method in Gleam is the same as `try()`, so it is removed in Uitkomst.                                                                                                                                                                  |
| -                           | `instance.toPair()`         | Converts this result to a pair; an array of length 2, where the first item is the `Ok` value (or null) and the second item is the `Err` value (or null).                                                                                    |
| `try()`                     | `instance.try()`            |                                                                                                                                                                                                                                             |
| `try_recover()`             | `instance.tryRecover()`     |                                                                                                                                                                                                                                             |
| `unwrap()`                  | `instance.unwrap()`         |                                                                                                                                                                                                                                             |
| `unwrap_both()`             | `result.unwrapBoth()`       | This method is only available on the static result object, as it requires the `Ok` and `Err` types to be the same, which cannot be done on the instances.                                                                                   |
| -                           | `result.unwrapBothUnsafe()` | The same method as above, but doesn't require both types to be the same.                                                                                                                                                                    |
|                             | `instance.use()`            | See the methods documentation for more info.                                                                                                                                                                                                |
| `unwrap_error()`            | `instance.unwrapErr()`      |                                                                                                                                                                                                                                             |
| `values()`                  | `result.values()`           | Same reason as `all()`.                                                                                                                                                                                                                     |
## Roadmap

While this library is currently suited for use, there are still a couple of features that I would like to implement

| Priority | Feature                 | Notes                                                                                                                                                                                                                                                                             |
| -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| +        | `Err` tracing           | The ability to easily trace where an error occurred, either via manual tracing, or using the Error.trace property.                                                                                                                                                                |
| +        | Async results           | A result that encapsulates a Promise, this is different from a literal Promise result, as the method chains are queued and executed once the promise resolves. This reduces the amount of await statements. A large portion of the code required for this is already implemented. |
| +        | Pattern matching        | A simple way to pattern match a result, ideally similar to Gleam's case or Rust's match expressions.                                                                                                                                                                              |
|          | HTTP client / Fetch API | A custom Fetch API (or similar to enhance its usage with result types. This should probably be in a seperate library.                                                                                                                                                             |
