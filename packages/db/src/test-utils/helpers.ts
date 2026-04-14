let counter = 0;

export function nanoid(): string {
  counter += 1;
  return `test-${Date.now()}-${counter}`;
}

export function uniqueEmail(prefix = "user"): string {
  return `${prefix}-${nanoid()}@sycom.test`;
}
