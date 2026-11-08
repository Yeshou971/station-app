import type { Fuel, Station } from "@/types/station"

export function isFuelAvailable(station: Station, fuel: Fuel) {
  const price = station.prices[fuel]
  return station.fuelAvailable.includes(fuel) && !station.shortage.includes(fuel) && typeof price === "number" && Number.isFinite(price)
}

export function getFuelPrice(station: Station, fuel: Fuel) {
  return isFuelAvailable(station, fuel) ? station.prices[fuel] : null
}

export function formatPrice(price: number | null) {
  return price === null ? "Prix indisponible" : `${price.toFixed(3).replace(".", ",")} €/L`
}

// Distance à vol d'oiseau en km (formule de haversine)
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

export function formatDate(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
}
