export function calculateSystemLossFactor(losses: number): number {
  return 1 - (losses / 100);
}