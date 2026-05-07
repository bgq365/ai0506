import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeHeaderValue(input: string | number | null | undefined) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[（）()【】[\]{}]/g, "")
    .replace(/[：:]/g, "")
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "");
}

export function cleanCellValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : String(value);
  }

  return String(value).trim();
}

export function clampPercent(current: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((current / total) * 100)));
}

export function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parsePositiveInteger(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d+\-()\s]/g, "").trim();
}

export function phoneDigitsCount(value: string) {
  return value.replace(/\D/g, "").length;
}

export function waitFor<T>(fn: () => T) {
  return Promise.resolve().then(fn);
}
