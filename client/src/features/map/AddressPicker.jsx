import { useEffect, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import BaseMap from './BaseMap.jsx';
import { homeIcon } from './mapIcons.js';
import { geocodeAddress } from '../../services/geocodingService.js';
import { TSHWANE_CENTER } from '../../utils/geo.js';

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16));
  }, [position, map]);
  return null;
}

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

// Address text box + "find on map" + a draggable pin, so the citizen can correct the location.
export default function AddressPicker({ address, onAddressChange, position, onPositionChange, error }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const findOnMap = async () => {
    if (!address.trim()) return;
    setBusy(true);
    setNote('');
    try {
      const found = (await geocodeAddress(address)) ?? (await geocodeAddress(`${address}, Pretoria`));
      if (found) {
        onPositionChange({ lat: found.lat, lng: found.lng });
        setNote('Address found. Drag the pin if it is not exactly on your house.');
      } else {
        setNote('We could not find that address. Tap or drag on the map to place the pin yourself.');
        if (!position) onPositionChange(TSHWANE_CENTER);
      }
    } catch {
      setNote('Address search is unavailable. Tap the map to place the pin yourself.');
      if (!position) onPositionChange(TSHWANE_CENTER);
    } finally {
      setBusy(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setNote('Location is not available on this device.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPositionChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNote('Pin placed at your current location.');
      },
      () => setNote('Location permission was denied. Tap the map to place the pin.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="address-picker">
      <div className="field">
        <label htmlFor="address">Home address</label>
        <input id="address" type="text" autoComplete="street-address" placeholder="e.g. 12 Tsamaya Street, Mamelodi" value={address} onChange={(e) => onAddressChange(e.target.value)} />
        {error && <span className="error">{error}</span>}
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={findOnMap} disabled={busy || !address.trim()}>
          {busy ? 'Searching...' : 'Find on map'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={useMyLocation}>Use my location</button>
      </div>
      {note && <p className="small muted">{note}</p>}
      <BaseMap className="map-sm" center={position ?? TSHWANE_CENTER} zoom={position ? 16 : 11}>
        <ClickToPlace onPick={onPositionChange} />
        <Recenter position={position} />
        {position && (
          <Marker
            position={[position.lat, position.lng]}
            icon={homeIcon()}
            draggable
            eventHandlers={{ dragend: (e) => onPositionChange({ lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng }) }}
          />
        )}
      </BaseMap>
      <p className="hint small muted" style={{ marginTop: 6 }}>
        {position ? 'This pin is used to check that outage reports come from your property.' : 'Search for your address, or tap the map, to place your home pin.'}
      </p>
    </div>
  );
}
