"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface PlacePrediction {
  place_id: string;
  description: string;
}

interface AutocompleteService {
  getPlacePredictions: (
    request: { input: string; language: string; componentRestrictions: { country: string } },
    callback: (
      predictions: PlacePrediction[] | null,
      status: string
    ) => void
  ) => void;
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          AutocompleteService: new () => AutocompleteService;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
          };
        };
      };
    };
    __googleMapsCallback?: () => void;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;

  if (window.google?.maps?.places) {
    scriptLoadPromise = Promise.resolve();
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("Google Maps API key not configured"));
      return;
    }

    window.__googleMapsCallback = () => {
      resolve();
      delete window.__googleMapsCallback;
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export interface PlaceOption {
  value: string; // place_id
  label: string; // description
}

export function useGooglePlacesAutocomplete() {
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const serviceRef = useRef<AutocompleteService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        if (window.google?.maps?.places) {
          serviceRef.current =
            new window.google.maps.places.AutocompleteService();
        }
      })
      .catch(() => {
        // Script failed to load — autocomplete won't work
      });
  }, []);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.length < 3) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(() => {
      if (!serviceRef.current) {
        setLoading(false);
        return;
      }

      serviceRef.current.getPlacePredictions(
        {
          input: query,
          language: "pt-BR",
          componentRestrictions: { country: "br" },
        },
        (predictions, status) => {
          if (
            status ===
              window.google?.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setOptions(
              predictions.map((p) => ({
                value: p.place_id,
                label: p.description,
              }))
            );
          } else {
            setOptions([]);
          }
          setLoading(false);
        }
      );
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setOptions([]);
    setLoading(false);
  }, []);

  return { options, loading, search, clear };
}
