import { useCallback, useEffect, useState } from 'react';

// Reads the device's current position once. status: 'loading' | 'ready' | 'denied' | 'unavailable'
export function useGeolocation() {
  const [state, setState] = useState({ status: 'loading', position: null });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'unavailable', position: null });
      return;
    }
    setState({ status: 'loading', position: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ status: 'ready', position: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } }),
      (err) => setState({ status: err.code === 1 ? 'denied' : 'unavailable', position: null }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { ...state, retry: locate };
}
