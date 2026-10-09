export {};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: { input: string },
              callback: (
                results: Array<{ description: string; place_id: string }> | null,
                status: string,
              ) => void,
            ) => void;
          };
          PlacesService: new (attrContainer: HTMLDivElement) => {
            getDetails: (
              request: { placeId: string; fields: string[] },
              callback: (
                place: {
                  formatted_address?: string;
                  geometry?: {
                    location?: { lat: () => number; lng: () => number };
                  };
                } | null,
                status: string,
              ) => void,
            ) => void;
          };
          PlacesServiceStatus: { OK: string };
        };
      };
    };
  }
}
