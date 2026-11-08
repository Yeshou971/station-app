"use client"
import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import type { Fuel, Station } from "@/types/station"
import { FUEL_OPTIONS } from "@/types/station"
import { distanceKm, formatDate, formatPrice, getFuelPrice } from "@/lib/fuel"

const StationMap = dynamic(() => import("@/components/StationMap"), {
  ssr: false,
  loading: () => <div className="map map-loading">Chargement de la carte…</div>,
})

const ALL = "Tous"
const MAX_RESULTS = 100
const RADIUS_OPTIONS = [2, 5, 10, 20, 50]

type Position = { lat: number; lon: number }
type Row = { station: Station; price: number; distance: number | null }

const uniq = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr"))

export default function StationExplorer() {
  const [stations, setStations] = useState<Station[]>([])
  const [loadError, setLoadError] = useState(false)
  const [fuel, setFuel] = useState<Fuel>("Gazole")
  const [region, setRegion] = useState("Île-de-France")
  const [department, setDepartment] = useState(ALL)
  const [city, setCity] = useState(ALL)
  const [search, setSearch] = useState("")
  const [position, setPosition] = useState<Position | null>(null)
  const [radius, setRadius] = useState(10)
  const [geoError, setGeoError] = useState("")
  const [locating, setLocating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/data/stations.json")
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => setStations(data as Station[]))
      .catch(() => setLoadError(true))
  }, [])

  const regions = useMemo(() => uniq(stations.map((s) => s.region)), [stations])
  const inRegion = useMemo(() => stations.filter((s) => region === ALL || s.region === region), [stations, region])
  const departments = useMemo(() => uniq(inRegion.map((s) => s.department)), [inRegion])
  const inDept = useMemo(() => inRegion.filter((s) => department === ALL || s.department === department), [inRegion, department])
  const cities = useMemo(() => uniq(inDept.map((s) => s.city)), [inDept])

  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase()
    // Avec la position, on cherche dans tout le pays  sinon selon les filtres de zone
    const pool = position ? stations : inDept
    const out: Row[] = []
    for (const s of pool) {
      const price = getFuelPrice(s, fuel)
      if (price === null) continue
      let distance: number | null = null
      if (position) {
        distance = distanceKm(position.lat, position.lon, s.latitude, s.longitude)
        if (distance > radius) continue
      } else if (city !== ALL && s.city !== city) continue
      if (q && !`${s.city} ${s.postalCode} ${s.address}`.toLowerCase().includes(q)) continue
      out.push({ station: s, price, distance })
    }
    out.sort((a, b) => a.price - b.price || (a.distance ?? 0) - (b.distance ?? 0))
    return out
  }, [stations, inDept, city, fuel, search, position, radius])

  const shown = useMemo(() => rows.slice(0, MAX_RESULTS), [rows])
  const shownStations = useMemo(() => shown.map((r) => r.station), [shown])

  function locate() {
    setGeoError("")
    if (!navigator.geolocation) { setGeoError("La géolocalisation n'est pas disponible sur cet appareil."); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => { setPosition({ lat: p.coords.latitude, lon: p.coords.longitude }); setSelectedId(null); setLocating(false) },
      () => { setGeoError("Position refusée ou introuvable. Utilise les filtres région / ville."); setLocating(false) },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Prix des carburants</h1>
        <p>Stations-service classées par prix, du moins cher au plus cher.</p>
      </header>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>Carburant
          <select value={fuel} onChange={(e) => setFuel(e.target.value as Fuel)}>
            {FUEL_OPTIONS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>

        {position ? (
          <>
            <label>Rayon
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
            </label>
            <label>Adresse ou code postal
              <input value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <button type="button" onClick={() => { setPosition(null); setSelectedId(null) }}>Revenir aux filtres</button>
          </>
        ) : (
          <>
            <label>Région
              <select value={region} onChange={(e) => { setRegion(e.target.value); setDepartment(ALL); setCity(ALL) }}>
                <option>{ALL}</option>{regions.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label>Département
              <select value={department} onChange={(e) => { setDepartment(e.target.value); setCity(ALL) }}>
                <option>{ALL}</option>{departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
            <label>Ville
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option>{ALL}</option>{cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Adresse ou code postal
              <input value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <button type="button" onClick={locate} disabled={locating || stations.length === 0}>
              {locating ? "Localisation…" : "Autour de ma position"}
            </button>
          </>
        )}
      </form>
      {geoError && <p className="error">{geoError}</p>}

      <p className="summary">
        {stations.length === 0 ? "" : `${rows.length} station(s) trouvée(s)${rows.length > MAX_RESULTS ? `, les ${MAX_RESULTS} moins chères sont affichées` : ""}.`}
        {position && ` Rayon de ${radius} km autour de votre position.`}
      </p>

      <div className="layout">
        <div className="map-col">
          <StationMap stations={shownStations} fuel={fuel} selectedId={selectedId} position={position} />
        </div>

        <ol className="list">
          {loadError && <li className="empty">Impossible de charger les données des stations.</li>}
          {!loadError && stations.length === 0 && <li className="empty">Chargement des stations…</li>}
          {stations.length > 0 && shown.length === 0 && <li className="empty">Aucune station avec un prix valide pour ce carburant dans cette zone.</li>}
          {shown.map((r, i) => (
            <li key={r.station.id} className={r.station.id === selectedId ? "item selected" : "item"}>
              <button type="button" onClick={() => setSelectedId(r.station.id)}>
                <span className="rank">{i + 1}</span>
                <span className="info">
                  <span className="city">{r.station.city}</span>
                  <span className="addr">{r.station.address}, {r.station.postalCode}</span>
                  <span className="meta">
                    {r.distance !== null && `${r.distance.toFixed(1).replace(".", ",")} km · `}
                    {r.station.automate24h ? "Automate 24 h/24 · " : ""}
                    {r.station.updatedAt ? `maj ${formatDate(r.station.updatedAt)}` : ""}
                  </span>
                </span>
                <span className="price">{formatPrice(r.price)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <footer className="footer">
        Source : « Prix des carburants en France – flux instantané », data.economie.gouv.fr. Les prix sont ceux déclarés par les stations et peuvent avoir changé depuis. Les carburants en rupture ou sans prix valide sont exclus.
      </footer>
    </div>
  )
}
