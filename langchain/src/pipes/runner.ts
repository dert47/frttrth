import { map } from "./streams.js";
import {
  Args,
  NodeContext,
  Node,
  ReadableStreamIterable,
  Tuple,
  NodeOptions,
} from "./types.js";

export interface StreamOptions extends Partial<NodeOptions> {
  signal?: AbortSignal;
}

export interface RunOptions extends StreamOptions {
  combineKeys?: "string" | "array";
}

export function consume(
  node: Node,
  ctx: NodeContext,
  output: TransformStream<Tuple | string, Tuple | string>
): ReadableStreamIterable<Tuple> {
  // Run the piece
  const run = node.asNode(ctx);
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
  completion.catch(() => ctx.controller.abort());
  // Return the output stream
  return output.readable.pipeThrough(
    // If the chunk is a string, wrap it in a tuple with textKey
    map((chunk) =>
      typeof chunk === "string" ? [ctx.options.textKey, chunk] : chunk
    )
  ) as ReadableStreamIterable<Tuple>;
}

export function stream(
  piece: Node,
  args: Args,
  options: StreamOptions = {}
): ReadableStreamIterable<Tuple> {
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
    args,
    controller,
    input,
    options: {
      callbacks: options.callbacks,
      textKey: options.textKey ?? "text",
    },
  });
  // Run the piece and return the output stream
  return consume(piece, ctx, output);
}

export async function run(
  node: Node,
  args: Args,
  { combineKeys = "string", ...options }: RunOptions = {}
): Promise<Args> {
  const output: Args = {};
  const nullKey = "output";
  // TODO Move this sink utility to streams.ts
  for await (const [key, value] of stream(node, args, options)) {
    const Key = key ?? nullKey;
    if (combineKeys === "string") {
      if (Key in output) {
        output[Key] += value;
      } else {
        output[Key] = value;
      }
    } else {
      if (Key in output) {
        output[Key].push(value);
      } else {
        output[Key] = [value];
      }
    }
  }
  return output;
}
