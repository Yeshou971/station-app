"use client";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Station, Fuel } from "@/types/station";
import { formatDate, formatPrice, getFuelPrice } from "@/lib/fuel";

type Props = {
  stations: Station[];
  fuel: Fuel;
  selectedId: string | null;
  position: { lat: number; lon: number } | null;
};

function priceIcon(price: number | null, best: boolean) {
  const label = price === null ? "?" : price.toFixed(3).replace(".", ",");
  const cls = best ? "pin pin-best" : "pin";
  return L.divIcon({
    className: "pin-wrap",
    html: `<span class="${cls}">${label}</span>`,
    iconSize: [0, 0],
  });
}

function Controller({ stations, selectedId, position, markers }: { stations: Station[]; selectedId: string | null; position: Props["position"]; markers: React.MutableRefObject<Map<string, L.Marker>> }) {
  const map = useMap();

  // Cadre la carte sur les résultats quand la sélection change
  useEffect(() => {
    if (position) {
      const pts = stations.map((s) => [s.latitude, s.longitude] as [number, number]);
      pts.push([position.lat, position.lon]);
      map.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 14 });
    } else if (stations.length) {
      map.fitBounds(L.latLngBounds(stations.map((s) => [s.latitude, s.longitude] as [number, number])), { padding: [30, 30], maxZoom: 13 });
    }
  }, [map, stations, position]);

  // Centre sur la station choisie dans la liste
  useEffect(() => {
    if (!selectedId) return;
    const s = stations.find((x) => x.id === selectedId);
    if (!s) return;
    map.setView([s.latitude, s.longitude], Math.max(map.getZoom(), 14));
    markers.current.get(selectedId)?.openPopup();
  }, [map, selectedId, stations, markers]);

  return null;
}

export default function StationMap({ stations, fuel, selectedId, position }: Props) {
  const markers = useRef<Map<string, L.Marker>>(new Map());

  return (
    <MapContainer className="map" center={[46.6, 2.5]} zoom={6} scrollWheelZoom>
      <Controller stations={stations} selectedId={selectedId} position={position} markers={markers} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {position && <CircleMarker center={[position.lat, position.lon]} radius={8} pathOptions={{ color: "#1a56a0", fillColor: "#1a56a0", fillOpacity: 0.8 }} />}
      {stations.map((s, i) => (
        <Marker
          key={s.id}
          position={[s.latitude, s.longitude]}
          icon={priceIcon(getFuelPrice(s, fuel), i === 0)}
          zIndexOffset={i === 0 ? 1000 : 0}
          ref={(m) => {
            if (m) markers.current.set(s.id, m);
            else markers.current.delete(s.id);
          }}
        >
          <Popup>
            <strong>{s.city}</strong>
            <br />
            {s.address}, {s.postalCode}
            <br />
            {fuel} : <strong>{formatPrice(getFuelPrice(s, fuel))}</strong>
            {s.updatedAt && (<><br />Mis à jour le {formatDate(s.updatedAt)}</>)}
            <br />
            <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}>Itinéraire</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
