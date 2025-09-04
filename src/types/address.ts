export interface AddressFeature {
  properties: {
    id: string;
    label: string;
    score: number;
    housenumber: string;
    street: string;
    postcode: string;
    city: string;
    context: string;
    type: string;
    name: string;
    citycode?: string;
    x?: number;
    y?: number;
    importance?: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  type: string;
}