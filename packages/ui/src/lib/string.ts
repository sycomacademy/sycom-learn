export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function parseName(name: string): { firstName: string; lastName: string } {
  const spaceIdx = name.indexOf(" ");
  const firstName = spaceIdx === -1 ? name : name.slice(0, spaceIdx);
  const lastName = spaceIdx === -1 ? "" : name.slice(spaceIdx + 1);
  return { firstName, lastName };
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

export function slugify(string: string): string {
  return string
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 63);
}
