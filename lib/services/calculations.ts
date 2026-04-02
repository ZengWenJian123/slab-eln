const PI = Math.PI;

export function calculateLossRate(targetWeight: number, ingotWeight: number) {
  if (targetWeight <= 0) return 0;
  return ((targetWeight - ingotWeight) / targetWeight) * 100;
}

export function calculateGlassThickness(
  coatedWireDiameterUm: number,
  bareWireDiameterUm: number
) {
  return (coatedWireDiameterUm - bareWireDiameterUm) / 2;
}

export function calculateCurrentMa(
  currentDensityAmm2: number,
  bareWireDiameterMm: number
) {
  return currentDensityAmm2 * PI * (bareWireDiameterMm / 2) ** 2 * 1000;
}

export function calculateTensileForceMpa(
  weightGram: number,
  bareWireDiameterMm: number
) {
  const area = PI * (bareWireDiameterMm / 2) ** 2;
  if (area <= 0) return 0;
  return (weightGram * 9.8) / area;
}

