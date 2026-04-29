const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function toDate(value: Date | number | string) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: Date | number | string): string {
  return dateFormatter.format(toDate(value));
}

export function formatDateTime(value: Date | number | string): string {
  return dateTimeFormatter.format(toDate(value));
}
