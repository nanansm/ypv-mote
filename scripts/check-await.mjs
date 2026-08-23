#!/usr/bin/env node
// Guards the libsql/D1 migration: every Drizzle call must be awaited.
//
// `tsc` only catches a missing await when the result is USED. Fire-and-forget
// inserts/updates/deletes type-check fine and then silently race, so they need
// their own gate. Zero-arg `.get()/.all()/.run()` is unambiguous here: Map.get,
// Headers.get, cookies().get and Promise.all all take arguments.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const CALL = /\.(get|all|run)\(\)/g;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

// Walk left from a call site to the head of its expression chain, stepping over
// balanced (), [] and {} — an argument object like `.set({ ... })` must not be
// mistaken for the end of the statement — then report what sits in front of it.
function chainHead(src, end) {
  let i = end - 1;
  let depth = 0;
  while (i >= 0) {
    const c = src[i];
    // A closing brace at depth 0 belongs to the PREVIOUS statement's block, not
    // to this chain — chains only ever reach a `}` from inside a group.
    if (c === "}" && depth === 0) break;
    if (c === ")" || c === "]" || c === "}") depth++;
    else if (c === "(" || c === "[" || c === "{") {
      if (depth === 0) break;
      depth--;
    } else if (depth === 0 && !/[\w$.\s]/.test(c)) break;
    i--;
  }
  return { before: src.slice(0, i + 1), chain: src.slice(i + 1, end) };
}

// True when the chain carries its own `await` OUTSIDE any nested group — an
// await buried in an argument (`.values({ a: await f() })`) must not count as
// awaiting the chain itself.
function awaitsAtTopLevel(chain) {
  let depth = 0;
  for (let i = 0; i < chain.length; i++) {
    const c = chain[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (depth === 0 && chain.startsWith("await", i) && !/[\w$]/.test(chain[i + 5] ?? "")) {
      return true;
    }
  }
  return false;
}

const offenders = [];

for (const file of walk(ROOT)) {
  const src = readFileSync(file, "utf8");
  for (const match of src.matchAll(CALL)) {
    const { before, chain } = chainHead(src, match.index);
    // The keyword lands on either side of the split depending on what precedes
    // the chain: `const x = await db…` keeps it in the chain, `return await db…`
    // leaves it behind. Accept both, and only both.
    if (/\bawait\s*$/.test(before) || awaitsAtTopLevel(chain)) continue;
    const line = src.slice(0, match.index).split("\n").length;
    offenders.push(`${file}:${line}: un-awaited ${match[0]}`);
  }
}

if (offenders.length > 0) {
  console.error(`check-await: ${offenders.length} un-awaited Drizzle call(s)\n`);
  console.error(offenders.join("\n"));
  process.exit(1);
}
console.log("check-await: all Drizzle calls awaited");
