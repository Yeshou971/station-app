// Convertit le JSON "Prix des carburants - Flux instantané v2" (data.economie.gouv.fr)
// en public/data/stations.json (format compact utilisé par l'appli).
import fs from "node:fs"
import path from "node:path"

const input = path.resolve("data/stations-source.json")
const output = path.resolve("public/data/stations.json")
const report = path.resolve("public/data/import-report.json")

if (!fs.existsSync(input)) { console.error("Fichier manquant : data/stations-source.json"); process.exit(1) }
let rows
try { rows = JSON.parse(fs.readFileSync(input, "utf8")) }
catch { console.error("JSON invalide ou tronqué."); process.exit(1) }
if (!Array.isArray(rows)) { console.error("Le JSON doit être un tableau."); process.exit(1) }

const FUELS = { Gazole: "gazole", SP95: "sp95", SP98: "sp98", E10: "e10", E85: "e85", GPLc: "gplc" }
const warnings = []
let skippedNoGeo = 0

const stations = []
for (const r of rows) {
  const lat = r.geom?.lat, lon = r.geom?.lon   // latitude/longitude à la racine sont projetées (Lambert) : on ne les utilise pas
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) { skippedNoGeo++; continue }
  const unavailable = Array.isArray(r.carburants_indisponibles) ? r.carburants_indisponibles : []
  const prices = {}, updated = {}
  for (const [fuel, key] of Object.entries(FUELS)) {
    const v = r[`${key}_prix`]
    if (typeof v === "number" && v >= 0.3 && v <= 4) { prices[fuel] = v; updated[fuel] = r[`${key}_maj`] ?? null }
    else {
      prices[fuel] = null
      if (typeof v === "number" && v !== 0) warnings.push({ stationId: r.id, city: r.ville, fuel, value: v, reason: "Valeur suspecte exclue" })
    }
  }
  stations.push({
    id: String(r.id),
    name: "Station-service",
    brand: "Non renseignée",
    city: r.ville ?? "",
    postalCode: r.cp ?? "",
    address: r.adresse ?? "",
    region: r.region ?? "",
    department: r.departement ?? "",
    latitude: lat,
    longitude: lon,
    fuelAvailable: Array.isArray(r.carburants_disponibles) ? r.carburants_disponibles : [],
    prices,
    shortage: unavailable,
    automate24h: r.horaires_automate_24_24 === "Oui",
    updatedAt: Object.values(updated).filter(Boolean).sort().pop() ?? null,
    services: []
  })
}

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify(stations))
fs.writeFileSync(report, JSON.stringify({ sourceFile: path.basename(input), sourceRows: rows.length, stationsExtracted: stations.length, skippedNoGeo, excludedSuspiciousPrices: warnings }, null, 2))
console.log(`${stations.length} stations extraites (${skippedNoGeo} sans coordonnées).`)
if (warnings.length) console.warn(`${warnings.length} prix suspects exclus (voir import-report.json).`)
