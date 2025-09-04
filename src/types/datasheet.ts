export interface TechnicalDatasheet {
  id: string;
  name: string;
  url: string;
  category: 'panel' | 'inverter' | 'battery' | 'other';
  description?: string;
  createdAt: string;
}