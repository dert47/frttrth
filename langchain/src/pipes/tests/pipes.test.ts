import { test, expect } from "@jest/globals";

import { NodeContext, Tuple } from "../types.js";
import { run, stream } from "../runner.js";
import { sequence } from "../ops.js";

test("stream with generator", async () => {
  async function* appendA(ctx: NodeContext) {
    for await (const [key, value] of ctx.input) {
      yield [key, `${value}a`] as Tuple;
    }
  }

  const args = { hello: "there", bye: "you" };
  const outputs = [];
  for await (const [key, value] of stream(appendA, args)) {
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
  for await (const [key, value] of stream(appendA, args)) {
    outputs.push([key, value]);
  }
  expect(outputs).toMatchInlineSnapshot(`
    [
      [
        "text",
        "hello=therea",
      ],
      [
        "text",
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
      "text": "200 OK",
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
  const seqABC = sequence(addA, addB, addC);
  const seqCBA = sequence(addC, addB, addA);
  const seqACB = sequence(addA, addC, addB);
  const seqBCA = sequence(addB, addC, addA);

  expect(await run(seqABC, args)).toMatchInlineSnapshot(`
    {
      "bye": "abc",
      "hello": "abc",
    }
  `);
  expect(await run(seqCBA, args)).toMatchInlineSnapshot(`
    {
      "bye": "cba",
      "hello": "cba",
    }
  `);
  expect(await run(seqACB, args)).toMatchInlineSnapshot(`
    {
      "bye": "acb",
      "hello": "acb",
    }
  `);
  expect(await run(seqBCA, args)).toMatchInlineSnapshot(`
    {
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
  const seqABC = sequence(addA, addB, addC);
  const seqCBA = sequence(addC, addB, addA);
  const seqACB = sequence(addA, addC, addB);
  const seqBCA = sequence(addB, addC, addA);

  expect(await run(seqABC, args)).toMatchInlineSnapshot(`
    {
      "text": "startabc",
    }
  `);
  expect(await run(seqCBA, args)).toMatchInlineSnapshot(`
    {
      "text": "startcba",
    }
  `);
  expect(await run(seqACB, args)).toMatchInlineSnapshot(`
    {
      "text": "startacb",
    }
  `);
  expect(await run(seqBCA, args)).toMatchInlineSnapshot(`
    {
      "text": "startbca",
    }
  `);
}, 1000);
