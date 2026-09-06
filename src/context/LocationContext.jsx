/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem("arogyampath_city") || null;
  });
  
  const [predictions, setPredictions] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const isLocatingRef = useRef(false);

  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem("arogyampath_city", selectedCity);
    }
  }, [selectedCity]);
  const [autocompleteService, setAutocompleteService] = useState(null);
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // LOAD GOOGLE MAPS SDK 
  useEffect(() => {
    if (window.google?.maps?.places) {
      if (!autocompleteService) setAutocompleteService(new window.google.maps.places.AutocompleteService());
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&loading=async&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    window.initGoogleMaps = () => {
      if (window.google?.maps?.places) setAutocompleteService(new window.google.maps.places.AutocompleteService());
    };

    if (!document.getElementById("google-maps-sdk")) document.head.appendChild(script);
  }, [GOOGLE_API_KEY, autocompleteService]);

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }
    
    setIsLocating(true);
    isLocatingRef.current = true;
    
    // Add a timeout of 10 seconds to prevent hanging 
    const timeoutId = setTimeout(() => {
      if (isLocatingRef.current) {
        setIsLocating(false);
        isLocatingRef.current = false;
        toast.error("Location request timed out. Please select manually.");
      }
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        isLocatingRef.current = false;
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
          );
          const data = await response.json();
          
          let detectedCity = null;
          if (data.results && data.results.length > 0) {
            // Priority: Locality -> Administrative Area Level 2
            const addressComponents = data.results[0].address_components;
            const cityObj = addressComponents.find(c => 
              c.types.includes("locality")
            ) || addressComponents.find(c => 
              c.types.includes("administrative_area_level_2")
            );
            detectedCity = cityObj?.long_name;
          }
          
          if (detectedCity) {
            setSelectedCity(detectedCity);
            toast.success(`Location: ${detectedCity}`, { icon: "📍" });
          } else {
            toast.error("Could not determine city name. Please select manually.");
          }
        } catch (error) {
          console.error("Geocoding Error:", error);
          toast.error("Network error while fetching city name.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        setIsLocating(false);
        isLocatingRef.current = false;
        if (error.code === 1) {
          toast.error("Please allow location access in your browser settings.");
        } else {
          toast.error("Location detection failed.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Debounce to save API hits 
  const searchTimeout = useRef(null);
  const searchCities = (input) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!input.trim() || !autocompleteService) {
      setPredictions([]);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        { input, types: ["(regions)"], componentRestrictions: { country: "in" } },
        (results, status) => {
          setPredictions(status === "OK" ? results : []);
        }
      );
    }, 400);
  };

  return (
    <LocationContext.Provider value={{ 
      selectedCity, 
      setSelectedCity, 
      predictions, 
      setPredictions,
      isLocating, 
      handleDetectLocation, 
      searchCities 
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used within a LocationProvider");
  return context;
};
