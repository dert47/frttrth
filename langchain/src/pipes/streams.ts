export function map<I, O>(predicate: (chunk: I) => O): TransformStream<I, O> {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(predicate(chunk));
    },
  });
}
