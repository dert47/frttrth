import { CallbackManager, Callbacks } from "../callbacks/manager.js";

import * as lib from "./lib.js";
import {
  Args,
  NodeContext,
  Node,
  ReadableStreamIterable,
  Tuple,
} from "./types.js";

export interface StreamOptions {
  callbacks?: Callbacks;
  signal?: AbortSignal;
  outputKey?: string;
}

export interface RunOptions extends StreamOptions {
  combineKeys?: "string" | "array";
}

export function consume(
  node: Node,
  ctx: NodeContext,
  output: TransformStream<Tuple | string, Tuple | string>
): ReadableStreamIterable<Tuple> {
  // Run the node
  const run = typeof node === "function" ? node(ctx) : node.asNode(ctx);
  // Create a completion promise and handle output
  const completion =
    // eslint-disable-next-line no-instanceof/no-instanceof
    run instanceof Promise
      ? run
      : (async function () {
          const writer = output.writable.getWriter();
          for await (const value of run) {
            await writer.ready;
            await writer.write(value);
          }
          await writer.ready;
          await writer.close();
        })();
  // Handle errors
  completion.catch((err) => {
    console.error(err); // TODO surface errors
    ctx.controller.abort();
  });
  // Return the output stream
  return output.readable.pipeThrough(
    // If the chunk is a string, wrap it in a tuple with key
    lib.map((chunk) =>
      typeof chunk === "string" ? [ctx.options.key, chunk] : chunk
    ),
    { signal: ctx.controller.signal }
  ) as ReadableStreamIterable<Tuple>;
}

export async function stream(
  piece: Node,
  args: Args,
  options: StreamOptions = {}
): Promise<ReadableStreamIterable<Tuple>> {
  // Create an abort controller for the run
  const controller = new AbortController();
  options?.signal?.addEventListener("abort", () => controller.abort());
  // Create an input stream from the arguments
  const input = new ReadableStream<Tuple>({
    start(controller) {
      for (const [key, value] of Object.entries(args)) {
        controller.enqueue([key, value]);
      }
      controller.close();
    },
    cancel() {
      controller.abort();
    },
  });
  // Create a context for running the piece
  const [ctx, output] = NodeContext.create({
    lib,
    args,
    controller,
    input,
    options: {
      callbackManager: await CallbackManager.configure(options.callbacks),
      key: options.outputKey ?? "output",
    },
  });
  // Run the piece and return the output stream
  return consume(piece, ctx, output);
}

export async function run(
  node: Node,
  args: Args,
  { combineKeys = "string", ...options }: RunOptions = {}
) {
  return lib.collect(await stream(node, args, options), combineKeys);
}
