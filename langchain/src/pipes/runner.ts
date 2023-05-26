import {
  Args,
  PieceContext,
  Piece,
  ReadableStreamIterable,
  RunOptions,
  StreamOptions,
  Tuple,
} from "./types.js";

export function consume(
  piece: Piece,
  ctx: PieceContext,
  output: TransformStream<Tuple, Tuple>
): ReadableStreamIterable<Tuple> {
  // Run the piece
  const run = piece.asPiece(ctx);
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
  return output.readable as ReadableStreamIterable<Tuple>;
}

export function stream(
  piece: Piece,
  args: Args,
  options?: StreamOptions
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
  const [ctx, output] = PieceContext.create({
    args,
    controller,
    callbacks: options?.callbacks,
    input,
  });
  // Run the piece and return the output stream
  return consume(piece, ctx, output);
}

export async function run(
  piece: Piece,
  args: Args,
  { combineKeys = "string", ...options }: RunOptions = {}
): Promise<Args> {
  const output: Args = {};
  for await (const [key, value] of stream(piece, args, options)) {
    if (combineKeys === "string") {
      if (key in output) {
        output[key] += value;
      } else {
        output[key] = value;
      }
    } else {
      if (key in output) {
        output[key].push(value);
      } else {
        output[key] = [value];
      }
    }
  }
  return output;
}
