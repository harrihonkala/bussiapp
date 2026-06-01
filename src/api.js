// ============================================================
// api.js — kaikki Digitransit API -kutsut täällä
// ============================================================

const ROUTING_URL = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';
const GEOCODING_URL = 'https://api.digitransit.fi/geocoding/v1';

function getApiKey() {
  return import.meta.env.VITE_DIGITRANSIT_KEY || '';
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'digitransit-subscription-key': getApiKey(),
  };
}

async function gql(query, variables = {}) {
  const res = await fetch(ROUTING_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`API virhe: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

// ------------------------------------------------------------
// Hae pysäkin reaaliaikaiset lähdöt
// ------------------------------------------------------------
export async function fetchDepartures(stopId, numberOfDepartures = 20) {
  const query = `
    query Departures($stopId: String!, $n: Int!) {
      stop(id: $stopId) {
        name
        code
        lat
        lon
        vehicleMode
        stoptimesWithoutPatterns(
          numberOfDepartures: $n
          omitCanceled: false
        ) {
          scheduledArrival
          realtimeArrival
          arrivalDelay
          scheduledDeparture
          realtimeDeparture
          departureDelay
          realtime
          realtimeState
          serviceDay
          headsign
          trip {
            route {
              shortName
              mode
              color
            }
          }
        }
      }
    }
  `;
  const data = await gql(query, { stopId, n: numberOfDepartures });
  return data.stop;
}

// ------------------------------------------------------------
// Hae pysäkin aikataulu tietylle päivämäärälle
// ------------------------------------------------------------
export async function fetchScheduleForDate(stopId, date) {
  // date = "YYYYMMDD"
  const query = `
    query Schedule($stopId: String!, $date: String!) {
      stop(id: $stopId) {
        stoptimesForServiceDate(date: $date, omitCanceled: false) {
          pattern {
            route {
              shortName
              mode
              color
            }
            headsign
          }
          stoptimes {
            scheduledDeparture
            headsign
            serviceDay
          }
        }
      }
    }
  `;
  const data = await gql(query, { stopId, date });
  return data.stop?.stoptimesForServiceDate || [];
}

// ------------------------------------------------------------
// Hae pysäkkejä nimellä tai tunnuksella
// ------------------------------------------------------------
export async function searchStops(query) {
  const q = `
    query SearchStops($name: String!) {
      stops(name: $name) {
        gtfsId
        name
        code
        lat
        lon
        vehicleMode
        routes { shortName }
      }
    }
  `;
  const data = await gql(q, { name: query });
  return data.stops || [];
}

// ------------------------------------------------------------
// Hae lähimmät pysäkit koordinaateista
// ------------------------------------------------------------
export async function fetchNearbyStops(lat, lon, radius = 800) {
  const query = `
    query Nearby($lat: Float!, $lon: Float!, $r: Int!) {
      stopsByRadius(lat: $lat, lon: $lon, radius: $r, first: 15) {
        edges {
          node {
            stop {
              gtfsId
              name
              code
              lat
              lon
              vehicleMode
              routes { shortName }
            }
            distance
          }
        }
      }
    }
  `;
  const data = await gql(query, { lat, lon, r: radius });
  return data.stopsByRadius?.edges?.map(e => ({
    ...e.node.stop,
    distance: e.node.distance,
  })) || [];
}

// ------------------------------------------------------------
// Apufunktiot aikojen muuntamiseen
// ------------------------------------------------------------

export function secondsToHHMM(seconds) {
  const s = seconds % 86400; // yli yön käsittely
  const h = Math.floor(s / 3600) % 24;
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getMinsUntil(serviceDay, realtimeDeparture) {
  const depUnix = serviceDay + realtimeDeparture;
  const nowUnix = Math.floor(Date.now() / 1000);
  return Math.round((depUnix - nowUnix) / 60);
}

export function dateToGTFS(date) {
  // Date → "YYYYMMDD"
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

export function getModeColor(mode) {
  const map = {
    BUS:    'var(--color-bus)',
    TRAM:   'var(--color-tram)',
    SUBWAY: 'var(--color-metro)',
    RAIL:   'var(--color-train)',
    FERRY:  'var(--color-ferry)',
  };
  return map[mode] || 'var(--color-bus)';
}

export function getModeLabel(mode) {
  const map = {
    BUS:    'Bussi',
    TRAM:   'Ratikka',
    SUBWAY: 'Metro',
    RAIL:   'Juna',
    FERRY:  'Lautta',
  };
  return map[mode] || mode;
}
