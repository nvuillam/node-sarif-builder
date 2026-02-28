export function setOptionValues(
  options: Record<string, any>,
  object: Record<string, any>,
) {
  for (const key of Object.keys(options)) {
    if (options[key] !== undefined) {
      object[key] = options[key];
    }
  }
  return object;
}
