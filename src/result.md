# Methods from gleam

- all                 > (propery on the result obj)
- flatten             > (propery on the result obj)
- is_error            > Result.err: boolean
- is_ok               > Result.ok: boolean
- lazy_or             > Result.lazyOr
- lazy_unwrap         > Result.lazyUnwrap
- map
- map_error           > Result.mapErr
- or
- partition           / (no tuples in ts -> use another way?)
- replace
- replace_error       > Result.replaceErr
- then                / (in gleam is just an alias for try)
- try
- try_recover         > Result.tryRecover
- unwrap
- unwrap_both         | (Result.val can be used for same purpose, but it is also a property on the result obj)
- unwrap_error
- values              > (propery on the result obj)

# Added methods

- tap
- tapErr
