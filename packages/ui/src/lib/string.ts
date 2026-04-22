export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function camelCaseToTitleCase(string: string): string {
  return string.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function snakeCaseToTitleCase(string: string): string {
  return string.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function kebabCaseToTitleCase(string: string): string {
  return string.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
