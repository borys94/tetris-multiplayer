import type { Metric } from "prom-client";

interface Sample {
  value: number;
  labels: Record<string, string | number | undefined>;
  metricName?: string;
}

/** Bieżąca wartość serii o danych etykietach (dla histogramu: liczba obserwacji). */
export async function metricValue(
  metric: Metric,
  labels: Record<string, string> = {},
): Promise<number> {
  const values = (await metric.get()).values as Sample[];
  const match = values.find(
    (v) =>
      (v.metricName === undefined || v.metricName.endsWith("_count")) &&
      Object.entries(labels).every(([k, value]) => v.labels[k] === value),
  );
  return match?.value ?? 0;
}
