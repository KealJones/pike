// A function that will take in an object and template and convert the existing object from its current shape to the new shape defined by the template, allowing for direct property mapping or a function to transform the value.
export function objectConvert<TInput, TOutput>(
  input: TInput,
  template: Partial<{
    [K in keyof TOutput]: string | ((input: TInput) => TOutput[K]);
  }>,
): TOutput {
  const output: Partial<TOutput> = {};
  for (const key in template) {
    const templateValue = template[key];
    if (typeof templateValue === 'function') {
      output[key as keyof TOutput] = (
        templateValue as (input: TInput) => TOutput[typeof key]
      )(input);
    } else if (
      typeof templateValue === 'string' &&
      Object.prototype.hasOwnProperty.call(input, templateValue)
    ) {
      if ((templateValue as string).includes('.')) {
        const keys = (templateValue as string).split('.');
        output[key as keyof TOutput] = keys.reduce(
          (acc: any, curr: string) => acc?.[curr],
          input,
        );
      } else {
        // @ts-expect-error: dynamic access
        output[key as keyof TOutput] = input[templateValue];
      }
    }
  }
  return output as TOutput;
}
