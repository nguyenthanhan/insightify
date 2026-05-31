/**
 * Chart optimization utilities for performance
 */

/**
 * Downsample data points for chart rendering
 * Uses Largest-Triangle-Three-Buckets (LTTB) algorithm for better visual preservation
 *
 * @param data - Array of data points
 * @param maxPoints - Maximum number of points to keep (default: 500)
 * @returns Downsampled array
 */
export function downsampleData<T extends Record<string, any>>(
  data: T[],
  maxPoints: number = 500,
): T[] {
  if (data.length <= maxPoints) {
    return data;
  }

  // Simple downsampling: take every nth point
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

/**
 * Advanced downsampling using LTTB algorithm
 * Better preserves visual characteristics of the data
 *
 * @param data - Array of data points
 * @param xKey - Key for x-axis values
 * @param yKey - Key for y-axis values
 * @param threshold - Target number of points
 * @returns Downsampled array
 */
export function downsampleLTTB<T extends Record<string, any>>(
  data: T[],
  xKey: keyof T,
  yKey: keyof T,
  threshold: number = 500,
): T[] {
  if (data.length <= threshold) {
    return data;
  }

  const sampled: T[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Always include first point
  sampled.push(data[0]);

  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket
    let avgX = 0;
    let avgY = 0;
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += Number(data[j][xKey]);
      avgY += Number(data[j][yKey]);
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Get the range for this bucket
    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;

    // Point a
    const pointAX = Number(data[a][xKey]);
    const pointAY = Number(data[a][yKey]);

    let maxArea = -1;
    let maxAreaPoint = 0;

    for (let j = rangeOffs; j < rangeTo; j++) {
      const pointX = Number(data[j][xKey]);
      const pointY = Number(data[j][yKey]);

      // Calculate triangle area
      const area =
        Math.abs(
          (pointAX - avgX) * (pointY - pointAY) -
            (pointAX - pointX) * (avgY - pointAY),
        ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = j;
      }
    }

    sampled.push(data[maxAreaPoint]);
    a = maxAreaPoint;
  }

  // Always include last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Determine if data should be downsampled based on size
 */
export function shouldDownsample(
  dataLength: number,
  threshold: number = 500,
): boolean {
  return dataLength > threshold;
}

/**
 * Get optimal number of data points based on chart type
 */
export function getOptimalPointCount(chartType: string): number {
  const thresholds: Record<string, number> = {
    line: 500,
    area: 500,
    bar: 100,
    scatter: 1000,
    pie: 50,
    radar: 20,
  };

  return thresholds[chartType] || 500;
}
