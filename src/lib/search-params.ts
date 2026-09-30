export function param(value: string | string[] | undefined, max = 100): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = v?.trim().slice(0, max);
  return trimmed ? trimmed : undefined;
}

export function pageParam(value: string | string[] | undefined): number {
  const n = Number(param(value, 6));
  return Number.isInteger(n) && n > 0 && n < 10000 ? n : 1;
}
