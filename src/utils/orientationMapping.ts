export const ORIENTATION_OPTIONS = [
  { value: -90, label: 'EST' },
  { value: -45, label: 'SUD-EST' },
  { value: 0, label: 'SUD' },
  { value: 45, label: 'SUD-OUEST' },
  { value: 90, label: 'OUEST' }
];

export const TILT_OPTIONS = Array.from({ length: 19 }, (_, i) => ({
  value: i * 5,
  label: `${i * 5}°`
}));

export function getOrientationLabel(value: number): string {
  const option = ORIENTATION_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : `${value}°`;
}