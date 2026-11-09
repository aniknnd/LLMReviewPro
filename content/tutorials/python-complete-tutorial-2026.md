## What you will learn

This is a **complete Python tutorial from beginner to advanced in one page** — install, core language, OOP, functional programming, concurrency, typing, testing, packaging, web, data science, performance, and deployment. By the end you will write production-grade Python: typed, tested, logged, and deployable.

**Who this is for:** absolute beginners, students, and JS/Java developers who want Python for AI, automation, and data. If you only read one Python page this year, read this.

**What you need:** Python 3.12 (3.11+ works). Every code block is runnable. Copy, paste, tweak.

## Table of contents

- **Beginner:** install & venv, variables/types, operators, control flow, data structures, comprehensions, functions
- **Intermediate:** OOP (classes, inheritance, dunder, composition), modules/packages, files/JSON, error handling, iterators/generators, decorators, context managers, type hints, dataclasses/Pydantic, logging, regex, dates, collections/itertools/functools, functional style, design patterns
- **Advanced:** async/await, threading/multiprocessing, performance (profiling, optimization), packaging (pyproject, uv), testing (pytest, fixtures, mocks, coverage), debugging (breakpoint, pdb), web (requests, BeautifulSoup, Flask, FastAPI), data science (NumPy, pandas, matplotlib, sklearn), security, deployment (Docker, gunicorn)
- **Reference:** cheat sheet, 10 practice projects, FAQ, next steps

## Beginner track

### 1. Install Python & set up your environment

Check your version first:

```bash
python3 --version   # want 3.12 (3.11+ is fine)
```

**macOS:** `brew install python`. **Windows:** python.org → tick *Add python.exe to PATH*. **Linux:** `sudo apt install python3-full python3-venv`.

Create a project folder and virtual environment (always one venv per project):

```bash
mkdir my-project && cd my-project
python3 -m venv .venv
source .venv/bin/activate      # Linux/macOS
.venv\Scripts\activate        # Windows
pip install --upgrade pip
```

Verify the venv is active (prompt shows `(.venv)`), then install packages:

```bash
pip install requests pandas pytest
pip freeze > requirements.txt
```

> **Why venvs?** Each project pins its own package versions. Without them, one project upgrades a library and silently breaks another. Never `pip install` globally for projects.

**Modern alternative (uv):** `uv venv && uv pip install requests` — 10× faster than pip. Start with venv+pip, adopt uv when you feel the pain.

**Check the interpreter:** `which python3` should point inside `.venv`. If not, you are not in the venv.

### 2. Variables, types & input/output

Python is dynamically typed — you assign, Python infers. Names are `snake_case`, case-sensitive.

```python
# Core types
name = "Ava"                  # str
age = 28                      # int
price = 19.99                 # float
is_admin = True               # bool
nothing = None                # NoneType (null)

# Multiple assignment + swap
a, b = 1, 2
a, b = b, a                   # a=2, b=1

# f-strings (best formatting)
print(f"{name} is {age} years old. Price: ${price:.2f}")
print(f"{price:>10.2f}")      # right-aligned
print(f"{age:04d}")           # zero-padded: 0028

# Input
email = input("Email: ")
print(f"Got: {email}")

# Type casting
n = int("42")          # 42
f = float("3.14")      # 3.14
s = str(123)           # "123"
ok = bool("")          # False
```

```python
# Truthiness — what counts as False?
# False: False, None, 0, 0.0, "", [], {}, set()
# Everything else is True. This is why `if xs:` works for empty-checks.
if []:
    print("no")
else:
    print("empty list is falsy")  # prints
```

**Common gotchas:**
- `is` checks identity, `==` checks value. Use `is None` / `is not None`, never `== None`.
- Strings are immutable: `s += "x"` in a loop is O(n²). Use `"".join(parts)`.
- Integers are arbitrary precision. Floats are binary — `0.1 + 0.2 != 0.3`. For money, use `Decimal`.
- `print` adds `\n`; use `print(..., end="")` to suppress, `sep="-"` to join with `-`.

### 3. Operators & boolean logic

```python
# Arithmetic: + - * / // % **
7 / 2    # 3.5  (always float)
7 // 2   # 3    (floor divide)
7 % 2    # 1    (modulo)
2 ** 10  # 1024 (power)

# Comparison chains (Python-only feature!)
x = 10
print(5 < x < 20)   # True — reads like English
print(5 < x and x < 20)  # same, but chain is cleaner

# Boolean logic
print(True and False)  # False
print(True or False)   # True
print(not False)       # True

# Short-circuit: `and` returns first falsy, `or` first truthy
print(0 or "default")  # "default"
print("a" and "b")     # "b"

# Walrus operator (PEP 572) — assign inside expression
if (n := len("hello")) > 3:
    print(f"Long: {n}")

# Ternary (conditional expression)
label = "adult" if age >= 18 else "minor" if (age := 15) else "?"
# Cleaner:
age = 15
label = "adult" if age >= 18 else "minor"
```

**Membership & identity:** `in` / `not in`, `is` / `is not`. `is` is for singletons (`None`, `True`); everything else uses `==`.

### 4. Control flow: if, loops, match

```python
# if / elif / else
score = 85
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

# for loop — iterate anything iterable
for ch in "abc":
    print(ch)
for i in range(5):           # range(start, stop, step) — stop-exclusive
    print(i)                 # 0..4
for i in range(0, 10, 2):
    print(i)                 # 0,2,4,6,8

# while + break/continue
n = 0
while n < 5:
    n += 1
    if n == 3:
        continue   # skip this iteration
    print(n)       # 1, 2, 4, 5

# for/else — else runs if no break (search pattern)
for x in [1, 2, 3]:
    if x == 5:
        print("found")
        break
else:
    print("not found (no break)")

# match (3.10+, like switch)
status = 404
match status:
    case 200:
        print("OK")
    case 404:
        print("Not found")
    case _:
        print("Other")  # wildcard
```

**enumerate, zip, sorted with key:**

```python
for i, name in enumerate(["Ava", "Ben"], start=1):
    print(i, name)                     # 1 Ava, 2 Ben

for a, b in zip([1, 2, 3], ["x", "y", "z"]):
    print(a, b)

users = [{"name": "Ben", "age": 30}, {"name": "Ava", "age": 25}]
print(sorted(users, key=lambda u: u["age"]))
```

### 5. Data structures: lists, dicts, sets, tuples

**Lists (mutable, ordered):**

```python
nums = [3, 1, 2]
nums.append(4)          # [3, 1, 2, 4]
nums.insert(0, 0)       # [0, 3, 1, 2, 4]
nums.sort()             # [0, 1, 2, 3, 4]
nums.remove(0)          # removes first 0
nums.pop()              # removes + returns last
print(nums, len(nums), nums[0], nums[-1])   # -1 is last
print(", ".join(["a", "b"]))                # "a,b"
```

**Dicts (key → value, insertion-ordered since 3.7):**

```python
user = {"name": "Ava", "role": "admin"}
user["level"] = 3
print(user.get("missing", "N/A"))   # safe default — never KeyError
for k, v in user.items():
    print(k, v)
user.pop("role")
user.update({"city": "Berlin"})     # merge
```

**Sets (unique, unordered) & Tuples (fixed):**

```python
tags = {"ai", "python", "ai"}   # set — dedupes to 2
print("ai" in tags)             # True — O(1) lookup
tags.add("llm")
print(tags - {"ai"})            # set difference

pair = (1, "two")               # tuple — use for rows, return multiples
first, rest = pair[0], pair[1:]
d = {1: "a", 2: "b"}
```

**Which to use?** List for ordered collections, dict for O(1) lookup, set for membership/dedupe, tuple for fixed rows. **Big-O cheat:** list append O(1), dict/set lookup O(1), set union O(n).

### 6. Comprehensions, unpacking & slicing

```python
# List / dict / set comprehensions — Python's superpower
squares = [x**2 for x in range(5) if x % 2 == 0]   # [0, 4, 16]
d = {name: len(name) for name in ["Ava", "Ben"]}    # {"Ava": 3, "Ben": 3}
uniq = {x.lower() for x in ["AI", "ai", "Ai"]}      # {"ai"}

# Nested + ternary inside comprehension
grid = [[r * c for c in range(3)] for r in range(3)]  # 3x3 multiplication table
labels = ["big" if n > 100 else "small" for n in [5, 500]]

# Generator expressions (lazy, for sum/min/max)
total = sum(x for x in range(1000))   # no intermediate list

# Unpacking — first, *rest; swap; nested
first, *rest = [1, 2, 3, 4]   # first=1, rest=[2,3,4]
a, (b, c) = (1, (2, 3))       # a=1, b=2, c=3

# Slicing — [start:stop:step], stop-exclusive
s = "hello"
print(s[1:4])   # "ell"
print(s[::-1])  # "olleh" (reverse)
print(s[::2])   # "hlo"
lst = [0, 1, 2, 3, 4]
print(lst[1:3]) # [1, 2]
print(lst[-2:]) # [3, 4]
```

**Read comprehensions as:** `[expr for item in iterable if cond]`. If you cannot read it in one breath, write a loop instead.

### 7. Functions, scope & *args/**kwargs

```python
# Typed function with defaults, keyword args, return hint
def greet(name: str, punct: str = "!") -> str:
    """Return a greeting."""
    return f"Hello, {name}{punct}"

print(greet("Ava"))               # Hello, Ava!
print(greet("Ben", punct="?"))    # keyword arg
print(greet.__doc__)              # docstring

# *args (tuple) / **kwargs (dict) — variadic
def total(*nums: int) -> int:
    return sum(nums)              # total(1,2,3) -> 6

def profile(**kw) -> str:
    return ", ".join(f"{k}={v}" for k, v in kw.items())
# profile(name="Ava", age=28) -> "name=Ava, age=28"

# Recursion
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n-1) + fib(n-2)

# Lambdas for tiny one-liners (sorting keys, map/filter)
print(sorted(["bb", "a", "ccc"], key=lambda s: len(s)))
```

**Scope (LEGB):** Local → Enclosing → Global → Builtin. Use `global` sparingly; prefer returning values.

```python
count = 0
def bump():
    global count
    count += 1
```

**Default-arg trap:** `def f(x=[])` shares ONE list across calls. Use `def f(x=None)` + `if x is None: x = []`.

```python
# BAD
def add(x=[]):
    x.append(1)
    return x
add()  # [1]
add()  # [1, 1] — surprise!

# GOOD
def add2(x=None):
    x = [] if x is None else x
    x.append(1)
    return x
```

## Intermediate track

### 8. Classes & OOP: inheritance, dunder, composition

```python
class Animal:
    """Base class."""
    species = "unknown"   # class attribute (shared)

    def __init__(self, name: str, sound: str) -> None:
        self.name = name      # instance attribute
        self.sound = sound

    def speak(self) -> str:   # method (self = this)
        return f"{self.name} says {self.sound}"

    def __repr__(self) -> str:
        return f"Animal(name={self.name!r})"

class Dog(Animal):
    def __init__(self, name: str):
        super().__init__(name, "woof")

dog = Dog("Rex")
print(dog.speak())              # Rex says woof
print(dog)                      # Animal(name='Rex')
print(isinstance(dog, Animal))  # True
```

**Inheritance vs composition:** inherit when `is-a`, compose when `has-a`. Prefer composition — it avoids fragile base chains.

```python
class Engine:
    def start(self): return "vroom"

class Car:                       # has-a Engine, not is-a
    def __init__(self):
        self.engine = Engine()
    def drive(self): return self.engine.start()
```

**Private by convention + property:**

```python
class Account:
    def __init__(self):
        self._balance = 0
    @property
    def balance(self) -> int:
        return self._balance
    @balance.setter
    def balance(self, v: int) -> None:
        if v < 0:
            raise ValueError("negative")
        self._balance = v
```

**Dunder methods (magic, called implicitly):** `__init__`, `__repr__`, `__str__`, `__len__`, `__eq__`, `__call__`, `__enter__`/`__exit__`, `__iter__`/`__next__`.

```python
class Counter:
    def __init__(self):
        self.n = 0
    def __len__(self): return self.n
    def __repr__(self): return f"Counter(n={self.n})"
    def __call__(self): self.n += 1; return self.n
    def __iter__(self):
        for _ in range(self.n):
            yield _
```

**Multiple inheritance + MRO:** `class C(A, B)` resolves via C3 linearization. Keep it shallow; prefer mixins for capabilities, not deep hierarchies.

### 9. Modules, packages & virtual environments

The standard library is huge (`os`, `sys`, `json`, `pathlib`, `datetime`, `collections`, `re`, `logging`). Third-party installs via PyPI:

```bash
pip install requests          # then: import requests
pip show requests             # metadata
pip freeze > requirements.txt # pin versions
pip install -r requirements.txt  # reproduce env
```

**Package structure:**

```
myapp/
  __init__.py      # makes it a package (can be empty)
  core.py
  utils.py
  __main__.py      # python -m myapp
from myapp.core import run
if __name__ == "__main__":
    run()
```

**`__all__`, relative imports, `if __name__`:** `__all__` controls `import *`; relative dots (`from . import utils`) only work inside packages. The `if __name__ == "__main__"` guard prevents side-effects on import.

**`pathlib` over `os.path`:**

```python
from pathlib import Path
p = Path("data") / "file.txt"      # join with /
print(p.exists(), p.suffix, p.parent)
p.write_text("hi", encoding="utf-8")
```

**Environment variables:** `os.getenv("KEY", "default")`. Secrets never in git — use `.env` + `python-dotenv` (dev only) or platform secrets (prod).

### 10. Files, JSON, CSV & error handling

```python
from pathlib import Path
import json

# Text files — always with encoding + with-statement (auto-close)
with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("hello\nworld")
with open("notes.txt", encoding="utf-8") as f:
    print(f.read())

# Modern one-liner (same guarantees)
Path("notes.txt").write_text("hi", encoding="utf-8")
print(Path("notes.txt").read_text(encoding="utf-8"))

# JSON (structured data)
data = {"name": "Ava", "scores": [9, 8]}
Path("data.json").write_text(json.dumps(data, indent=2))
loaded = json.loads(Path("data.json").read_text())

# CSV (stdlib) — for big files, use pandas instead
import csv
with open("t.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["name", "age"])
    w.writerow(["Ava", 28])
```

**Error handling — be specific:**

```python
try:
    n = int(input("Number: "))
except ValueError:
    print("Not a number")
except KeyboardInterrupt:
    print("Cancelled")
else:
    print(f"Got {n}")
finally:
    print("Always runs")

# Raise + custom exceptions
class InvalidAge(ValueError):
    pass

def set_age(a: int) -> int:
    if a < 0:
        raise InvalidAge("Age must be >= 0")
    return a

# Never bare `except:` — it hides bugs and swallows KeyboardInterrupt.
```

**Best practices:** catch narrow, log with context (`logging.exception`), raise custom exceptions for your domain, fail fast on corrupt data (don't silently fallback).

### 11. Iterators, generators & `yield`

Everything iterable (`for`, `in`, `*`) runs on the iterator protocol: `__iter__` → `__next__` (raise `StopIteration` when done).

```python
# Generator — lazy, memory-light, composes
def gen(n: int):
    for i in range(n):
        yield i * i

g = gen(5)
print(next(g))          # 0
print(list(gen(4)))     # [0, 1, 4, 9]
print(sum(x for x in range(1000)))  # generator expr — no list allocated

# yield from — delegate to sub-generator
def flat(rows):
    for row in rows:
        yield from row
print(list(flat([[1, 2], [3]])))  # [1, 2, 3]
```

**Why generators win:** processing 1M rows without loading them. Pipeline: read → parse → filter → aggregate, each a generator stage.

### 12. Decorators: higher-order functions

A decorator wraps a function to add behaviour (logging, timing, auth) without editing it.

```python
from functools import wraps
import time

def timed(fn):
    @wraps(fn)   # preserve __name__/__doc__
    def wrapper(*a, **kw):
        t0 = time.time()
        result = fn(*a, **kw)
        print(f"{fn.__name__} took {time.time()-t0:.3f}s")
        return result
    return wrapper

@timed
def work():
    time.sleep(0.1)

# Stacking + parameterized decorators
def role_required(*roles):
    def deco(fn):
        @wraps(fn)
        def wrap(user, *a, **kw):
            if user["role"] not in roles:
                raise PermissionError("denied")
            return fn(user, *a, **kw)
        return wrap
    return deco
```

**Closures:** a function returning a function that remembers its scope. That is all decorators are. Use `functools.wraps` always.

### 13. Context managers: `with` done right

`with` guarantees cleanup (close, unlock, rollback) even on exception.

```python
# Built-in: files, locks, transactions
with open("f.txt") as f:
    data = f.read()  # closed here, even if read() raises

# Custom: __enter__ / __exit__
class Timer:
    def __enter__(self):
        self.t0 = time.time()
        return self
    def __exit__(self, exc_type, exc, tb):
        print(f"took {time.time()-self.t0:.2f}s")
        return False  # False = don't suppress exceptions

with Timer():
    time.sleep(0.1)

# Generator-based (contextlib)
from contextlib import contextmanager
@contextmanager
def temp_file():
    print("open")
    yield
    print("close")  # runs even on exception
```

**Rule:** any resource that needs cleanup gets a context manager.

### 14. Type hints, `mypy`, dataclasses & Pydantic

```python
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    age: int = 0
    tags: list[str] = field(default_factory=list)  # never [] default!

u = User("Ava", 28, ["a"])
print(u)  # User(name='Ava', age=28, tags=['a'])
```

**Hints & unions:**

```python
# Python 3.10+ style
def parse(raw: str) -> int | None: ...
ids: list[int] = [1, 2]
res: dict[str, list[int]] = {}
opt: str | None = None
```

Run `mypy myapp/` in CI. Hints are documentation the compiler checks. `Pydantic` adds runtime validation:

```python
from pydantic import BaseModel

class Ticket(BaseModel):
    id: int
    priority: str  # validate + coerce on construction
```

**Rule:** type the boundaries (functions, API in/out), not every local. `list[str]`, `dict[str, Any]`, `int | None` cover 90% of needs.

### 15. Logging, regex, dates & standard-library power tools

**Logging (never `print` in prod):**

```python
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)
log.info("started")
log.warning("slow query")
log.exception("failed")  # includes traceback
```

**Regex (`re`):** patterns are strings. Compile once, search many.

```python
import re
pat = re.compile(r"\b\d{3}-\d{4}\b")
print(pat.search("call 555-1234 or 555-9999").group(0))  # 555-1234
print(re.findall(r"\w+@\w+\.\w+", "mail a@b.co now"))    # ['a@b.co']
print(re.sub(r"\s+", " ", "a  b   c"))                    # collapse spaces
```

**Dates (`datetime`, `zoneinfo`):**

```python
from datetime import datetime, timezone, timedelta
now = datetime.now(timezone.utc).isoformat()   # always UTC for storage
dt = datetime.fromisoformat("2026-11-09T10:00:00+00:00")
print((datetime.now(timezone.utc) - dt) > timedelta(days=1))
```

**`collections`:** `Counter` (counts), `defaultdict`, `OrderedDict`, `deque` (O(1) popleft), `ChainMap`.

**`itertools`:** `chain`, `compress`, `count`, `cycle`, `groupby` (sort first!), `islice`, `pairwise` (3.10+).

**`functools`:** `partial`, `lru_cache`, `reduce`, `cmp_to_key`.

```python
from collections import Counter
print(Counter(["a", "a", "b"]).most_common())  # [('a', 2), ('b', 1)]

from functools import lru_cache
@lru_cache(maxsize=128)
def fib(n: int) -> int:
    return n if n < 2 else fib(n-1) + fib(n-2)
print(fib(50))  # instant — memoized
```

### 16. Functional style & design patterns

**Functional core, imperative shell:** pure functions (easy to test) + imperative edges (I/O). `map`/`filter` (prefer comprehensions for readability), `sorted`/`reversed`, `any`/`all`.

```python
nums = [1, 2, 3, 4]
print(list(map(lambda x: x * 2, nums)))   # [2,4,6,8]
print([x * 2 for x in nums])              # clearer — prefer this
print(any(x > 3 for x in nums))           # True
```

**Patterns worth knowing:**

- **Singleton:** one instance (`__new__` guard) — for config, caches.
- **Factory:** `create(kind)` returns the right class — hides construction.
- **Strategy:** pass a function for behaviour (`key=`, `sort=`).
- **Observer:** subscribers notified on change (`dataclasses`, callbacks).
- **Context (see §13):** `with` as resource strategy.

Keep patterns as *vocabulary*, not cargo-cult. Most scripts need functions + dataclasses + one pattern.

## Advanced track

### 17. Concurrency: `asyncio`, threads, processes

Three models for three costs: I/O wait (async), CPU-light parallelism (threads), CPU-heavy parallelism (processes).

**`asyncio` (I/O-bound: HTTP, DB, files):**

```python
import asyncio

async def fetch(i: int) -> int:
    await asyncio.sleep(0.1)  # stands in for await http.get(...)
    return i * 2

async def main():
    results = await asyncio.gather(*[fetch(i) for i in range(5)])
    print(results)  # [0, 2, 4, 6, 8] — concurrent, not sequential

asyncio.run(main())
```

**Threads (`concurrent.futures`):** good for blocking I/O you cannot async-ify. The GIL means threads do not speed CPU work.

**Processes (`multiprocessing` / `ProcessPoolExecutor`):** true CPU parallelism, separate memory. For data crunching, image processing, model inference.

```python
from concurrent.futures import ProcessPoolExecutor

def heavy(n: int) -> int:
    return sum(x * x for x in range(n))

with ProcessPoolExecutor() as ex:
    print(list(ex.map(heavy, [1000, 2000])))
```

**Rule:** async for I/O, processes for CPU, threads as the awkward middle. Never block the event loop (`time.sleep` in async) — use `await asyncio.sleep`.

### 18. Performance: profiling & optimization

1. **Measure first:** `python -m cProfile -s cumulative app.py` or `line_profiler`. Never guess.
2. **Hotspots are usually loops:** vectorize with NumPy, or hoist invariant work out.
3. **Algorithm beats micro-optimization:** O(n) → O(log n) dwarfs any in-loop tweak.
4. **Profile in prod too:** `logging` + `time` around slow paths, `py-spy` for live sampling.

```python
import time

def timed(fn, *a, **kw):
    t0 = time.perf_counter()
    r = fn(*a, **kw)
    print(f"{fn.__name__}: {time.perf_counter()-t0:.3f}s")
    return r
```

**Common wins:** avoid string concat in loops (`"".join`), use `list` + `append` for building, cache with `lru_cache`, batch DB/API calls (avoid N+1).

### 19. Packaging, `uv`/poetry, config & environments

**`pyproject.toml` (modern standard):**

```toml
[project]
name = "myapp"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["requests>=2.0", "pydantic>=2.0"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

```bash
pip install -e .          # editable install
python -m myapp           # or via [project.scripts]
```

**Tools:** `uv` (fast installer), `poetry`/`hatch` (dependency mgmt), `pip-tools` (hashes). Pick one; consistency beats preference.

**Config:** env vars for secrets, `pydantic-settings` or `argparse` for options, never hardcode tokens. `.env` for dev (gitignored), platform secrets for prod.

### 20. Testing: pytest, fixtures, mocks, coverage

```python
# test_core.py
import pytest
from myapp.core import greet

def test_greet():
    assert greet("Ava") == "Hello, Ava!"

@pytest.fixture
def client():
    return FakeAPI()

def test_client(client):
    assert client.get(1)["id"] == 1

@pytest.mark.parametrize("inp,exp", [("a", "A"), ("b", "B")])
def test_upper(inp, exp):
    assert inp.upper() == exp
```

**Mocks:** `unittest.mock.patch` for network/DB. Test behaviour, not implementation. **Coverage:** `pytest --cov=myapp` — 80% on core modules is a good bar. **CI:** `pytest -q && mypy && ruff check .` on every push.

### 21. Debugging: `breakpoint()`, `pdb`, logging

```python
def buggy(xs):
    # breakpoint() drops into pdb (3.7+)
    breakpoint()
    return sum(xs)
```

Commands: `n` next, `c` continue, `p expr` print, `bt` backtrace, `s` step. **Non-interactive alternative:** `logging` + assertions. Use breakpoints interactively, logging in production. Never ship `breakpoint()`.

### 22. Web: `requests`, BeautifulSoup, Flask, FastAPI

```python
import requests

r = requests.get("https://example.com", timeout=10)
r.raise_for_status()
data = r.json()
# Always timeout + raise_for_status + retry with backoff
```

**Scraping (polite + legal):** `BeautifulSoup` for HTML, respect `robots.txt`, rate-limit, cache. Example:

```python
from bs4 import BeautifulSoup
soup = BeautifulSoup(r.text, "html.parser")
for h in soup.select("h2.title"):
    print(h.get_text(strip=True))
```

**FastAPI (APIs) — the 2026 default:**

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class TicketIn(BaseModel):
    text: str

@app.get("/health")
def health(): return {"status": "ok"}

@app.post("/triage")
def triage(t: TicketIn):
    return {"priority": "high" if "refund" in t.text.lower() else "low",
            "echo": t.text[:80]}

# uvicorn main:app --reload
```

Flask remains for tiny scripts; FastAPI wins for validation + async + docs.

### 23. Data science: NumPy, pandas, matplotlib, sklearn

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

a = np.array([1, 2, 3, 4])
print(a * 2, a.mean())                 # vectorized math

df = pd.read_csv("data.csv")
print(df.describe())                   # stats
print(df.groupby("cat")["val"].mean()) # the superpower
df.to_csv("clean.csv", index=False)

# Plot → save (headless-safe)
plt.figure()
plt.plot(df["x"], df["y"])
plt.savefig("chart.png", dpi=150)
```

**sklearn pattern (split → fit → score):**

```python
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
clf = RandomForestClassifier(n_estimators=200).fit(X_train, y_train)
print(accuracy_score(y_test, clf.predict(X_test)))
```

Start linear (logistic/ridge). Reach for trees/deep only when linear plateaus. Always hold out a test set.

### 24. Security, style & deployment

**Security:**
- Validate all input (Pydantic / length / allowlists). Never `eval`/`exec` on user data.
- Secrets in env/secret manager, never git. `bandit` scans for issues.
- Pin dependencies (`pip freeze`, hashes) and update monthly.

**Style (autofix, don't hand-fight):**

```bash
pip install ruff black mypy
ruff check --fix . && ruff format . && mypy myapp/
```

Black/Ruff for formatting, Mypy for types, Pytest for tests — four commands in CI.

**Docker + gunicorn (deploy):**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8000", "main:app"]
```

```bash
docker build -t myapp . && docker run -p 8000:8000 myapp
```

**Production checklist:** env-configured, `DEBUG=False`, logging not print, health check endpoint, graceful shutdown, backups for data.

## Cheat sheet (copy-paste)

| Task | Code |
|---|---|
| Print | `print(f"x={x}")` |
| Read/write file | `Path("f").write_text(json.dumps(d))` / `Path("f").read_text()` |
| Sort by key | `sorted(xs, key=lambda x: x.field)` |
| Dedupe keep order | `list(dict.fromkeys(xs))` |
| Env var | `os.getenv("KEY", "default")` |
| UTC now ISO | `datetime.now(timezone.utc).isoformat()` |
| Retry + backoff | `for i in range(3): try: ...; break; except: time.sleep(0.5 * 2**i)` |
| Parallel I/O | `asyncio.gather(*[fetch(i) for i in ...])` |
| Parallel CPU | `ProcessPoolExecutor` + `map` |
| Test | `pytest -q && mypy && ruff check .` |

## 10 practice projects (in order)

1. **Converter** — CLI with functions + `pytest`. Difficulty: beginner.
2. **CSV analyser** — pandas groupby + chart + JSON export.
3. **API scraper** — requests, retries, cache, BeautifulSoup.
4. **FastAPI service** — CRUD + Pydantic + tests + Docker.
5. **LLM script** — call any LLM API with streaming + eval.
6. **RAG pipeline** — chunk → embed → Chroma → cite (see RAG tutorial).
7. **Fine-tune prep** — build `train.jsonl`, eval harness (see fine-tuning guide).
8. **Async fetcher** — 100 URLs with `asyncio`, rate-limit, resume.
9. **Data portal** — FastAPI + pandas + auth + deploy.
10. **Agent loop** — perceive → plan → act → observe (see Agents tutorial).

## FAQ

### Python vs JavaScript for learning?

Python is easier to start (no braces, batteries included). JavaScript wins for web. Learn Python first for AI/data.

### Python 3.11 vs 3.12 vs 3.13?

3.12 is the sweet spot (speed + errors). Target 3.12+, test 3.11 if you must support it.

### Do I need OOP for scripts?

No. Functions until classes clarify design. OOP pays at 500+ lines.

### How do I run this code?

`python3 file.py` inside your venv. `python3 -m pytest` to test. `uvicorn main:app --reload` for FastAPI.

### Async: when do I need it?

When waiting (HTTP, DB, files) dominates. For CPU math, use processes instead.

### What library should I learn first?

NumPy + pandas (data), requests (HTTP), pytest (testing). Then FastAPI, pydantic, sklearn.

## Verdict

Python rewards small, typed, tested scripts. Beginner: data structures and functions. Intermediate: OOP, generators, decorators, typing, pytest. Advanced: async, processes, packaging, FastAPI, data science, Docker. Read the standard library before installing packages, venv everything, and type the boundaries.

When you are ready for AI, your next steps are [fine-tuning](/blog/llm-fine-tuning-complete-guide-2026), [RAG from scratch](/blog/rag-from-scratch-2026-tutorial), [prompt engineering](/blog/prompt-engineering-complete-guide-2026), and [agents](/blog/ai-agents-with-langgraph-2026) — all in Python, all on this site.

## Further reading

- Python docs + `python -m pydoc json`
- `python -m pytest --help`, `mypy --help`, `ruff --help`
- Our tutorials: [Fine-tuning](/blog/llm-fine-tuning-complete-guide-2026), [RAG](/blog/rag-from-scratch-2026-tutorial), [Prompt engineering](/blog/prompt-engineering-complete-guide-2026), [Agents](/blog/ai-agents-with-langgraph-2026), [Transformers](/blog/transformers-explained-2026), [Vector DBs](/blog/vector-databases-2026-guide), [Python for AI](/blog/python-for-ai-2026-numpy-pandas-ml)
