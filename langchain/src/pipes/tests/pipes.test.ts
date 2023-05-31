import { test, expect } from "@jest/globals";

import { NodeContext, Tuple } from "../types.js";
import { run, stream } from "../runner.js";
import { Sequence } from "../ops.js";

test("stream with generator", async () => {
  async function* appendA(ctx: NodeContext) {
    for await (const [key, value] of ctx.input) {
      yield [key, `${value}a`] as Tuple;
    }
  }

  const args = { hello: "there", bye: "you" };
  const outputs = [];
  for await (const [key, value] of await stream(appendA, args)) {
    outputs.push([key, value]);
  }
  expect(outputs).toMatchInlineSnapshot(`
    [
      [
        "hello",
        "therea",
      ],
      [
        "bye",
        "youa",
      ],
    ]
  `);
}, 1000);

test("stream with generator yielding strings", async () => {
  async function* appendA(ctx: NodeContext) {
    for await (const [key, value] of ctx.input) {
      yield `${key}=${value}a`;
    }
  }

  const args = { hello: "there", bye: "you" };
  const outputs = [];
  for await (const [key, value] of await stream(appendA, args)) {
    outputs.push([key, value]);
  }
  expect(outputs).toMatchInlineSnapshot(`
    [
      [
        "output",
        "hello=therea",
      ],
      [
        "output",
        "bye=youa",
      ],
    ]
  `);
}, 1000);

test("run to arrays", async () => {
  async function* appendA(ctx: NodeContext) {
    for await (const [key, value] of ctx.input) {
      yield [key, `${value}a`] as Tuple;
    }
  }

  const args = { hello: "there", bye: "you" };
  const outputs = await run(appendA, args, { combineKeys: "array" });
  expect(outputs).toMatchInlineSnapshot(`
    {
      "bye": [
        "youa",
      ],
      "hello": [
        "therea",
      ],
    }
  `);
}, 1000);

test("run to strings", async () => {
  async function* appendA(ctx: NodeContext) {
    for await (const [key, value] of ctx.input) {
      yield [key, `${value}a`] as Tuple;
    }
  }

  const args = { hello: "there", bye: "you" };
  const outputs = await run(appendA, args);
  expect(outputs).toMatchInlineSnapshot(`
    {
      "bye": "youa",
      "hello": "therea",
    }
  `);
}, 1000);

test("run with pipe", async () => {
  async function fetchAsText(ctx: NodeContext) {
    const response = await fetch("https://httpstat.us/200");
    await response.body
      ?.pipeThrough(new TextDecoderStream())
      .pipeTo(ctx.output);
  }

  const args = {};
  const outputs = await run(fetchAsText, args);
  expect(outputs).toMatchInlineSnapshot(`
    {
      "output": "200 OK",
    }
  `);
}, 5000);

test("run with sequence", async () => {
  async function* addA(ctx: NodeContext) {
    for await (const [key, value] of ctx.input) {
      yield [key, `${value}a`] as Tuple;
    }
  }

  async function* addB(ctx: NodeContext) {
    for await (const [key, value] of ctx.input) {
      yield [key, `${value}b`] as Tuple;
    }
  }

  async function* addC(ctx: NodeContext) {
    for await (const [key, value] of ctx.input) {
      yield [key, `${value}c`] as Tuple;
    }
  }
  const args = { hello: "", bye: "" };
  const seqABC = new Sequence(addA, addB, addC);
  const seqCBA = new Sequence(addC, addB, addA);
  const seqACB = new Sequence(addA, addC, addB);
  const seqBCA = new Sequence(addB, addC, addA);

  expect(await run(seqABC, args)).toMatchInlineSnapshot(`
    {
      "0.bye": "a",
      "0.hello": "a",
      "1.bye": "ab",
      "1.hello": "ab",
      "bye": "abc",
      "hello": "abc",
    }
  `);
  expect(await run(seqCBA, args)).toMatchInlineSnapshot(`
    {
      "0.bye": "c",
      "0.hello": "c",
      "1.bye": "cb",
      "1.hello": "cb",
      "bye": "cba",
      "hello": "cba",
    }
  `);
  expect(await run(seqACB, args)).toMatchInlineSnapshot(`
    {
      "0.bye": "a",
      "0.hello": "a",
      "1.bye": "ac",
      "1.hello": "ac",
      "bye": "acb",
      "hello": "acb",
    }
  `);
  expect(await run(seqBCA, args)).toMatchInlineSnapshot(`
    {
      "0.bye": "b",
      "0.hello": "b",
      "1.bye": "bc",
      "1.hello": "bc",
      "bye": "bca",
      "hello": "bca",
    }
  `);
}, 1000);

test("run with sequence of strings", async () => {
  async function* addA(ctx: NodeContext) {
    for await (const [, value] of ctx.input) {
      yield `${value}a`;
    }
  }

  async function* addB(ctx: NodeContext) {
    for await (const [, value] of ctx.input) {
      yield `${value}b`;
    }
  }

  async function* addC(ctx: NodeContext) {
    for await (const [, value] of ctx.input) {
      yield `${value}c`;
    }
  }
  const args = { hello: "start" };
  const seqABC = new Sequence(addA, addB, addC);
  const seqCBA = new Sequence(addC, addB, addA);
  const seqACB = new Sequence(addA, addC, addB);
  const seqBCA = new Sequence(addB, addC, addA);

  expect(await run(seqABC, args)).toMatchInlineSnapshot(`
    {
      "0.output": "starta",
      "1.output": "startab",
      "output": "startabc",
    }
  `);
  expect(await run(seqCBA, args)).toMatchInlineSnapshot(`
    {
      "0.output": "startc",
      "1.output": "startcb",
      "output": "startcba",
    }
  `);
  expect(await run(seqACB, args)).toMatchInlineSnapshot(`
    {
      "0.output": "starta",
      "1.output": "startac",
      "output": "startacb",
    }
  `);
  expect(await run(seqBCA, args)).toMatchInlineSnapshot(`
    {
      "0.output": "startb",
      "1.output": "startbc",
      "output": "startbca",
    }
  `);
}, 1000);
