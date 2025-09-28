/**
 * Round a value to a set precision
 * @param value - The value to round
 * @param precision - The precision (decimal places), default: 3
 * @returns Rounded number
 */
export const round = (value: number, precision: number = 3): number =>
  parseFloat(value.toFixed(precision));

/**
 * Clamp a value between min & max
 * @param value - The value to clamp
 * @param min - Minimum value to allow, default: 0
 * @param max - Maximum value to allow, default: 100
 * @returns Clamped number
 */
export const clamp = (value: number, min: number = 0, max: number = 100): number =>
  Math.min(Math.max(value, min), max);

/**
 * Re-map a value from one range to another
 * For example: adjust(10, 0, 100, 100, 0) = 90
 * @param value - The value to re-map (or adjust)
 * @param fromMin - Min value to re-map from
 * @param fromMax - Max value to re-map from
 * @param toMin - Min value to re-map to
 * @param toMax - Max value to re-map to
 * @returns Re-mapped number
 */
export const adjust = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number => {
  const fromRange = fromMax - fromMin;
  // Guard against zero range to prevent NaN
  if (fromRange === 0) {
    return round(toMin);
  }
  return round(toMin + (toMax - toMin) * (value - fromMin) / fromRange);
};