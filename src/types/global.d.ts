// Déclaration pour l'API Google Maps
declare interface Window {
  google: any;
  initMap: () => void;
}

// Déclaration pour les événements personnalisés
interface CustomEventMap {
  'customPricesUpdated': CustomEvent<any>;
  'batteryOptionsUpdated': CustomEvent<any>;
  'subscriptionEnabledUpdated': CustomEvent<boolean>;
  'financialSettingsUpdated': CustomEvent<any>;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Window, ev: CustomEventMap[K]) => void
    ): void;
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Window, ev: CustomEventMap[K]) => void
    ): void;
  }
  
  interface ImportMeta {
    env: {
      VITE_GOOGLE_MAPS_API_KEY: string;
      [key: string]: any;
    };
  }
}

export {};