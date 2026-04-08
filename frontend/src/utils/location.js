export const DEFAULT_LOCATION = { lat: 30.3165, lng: 78.0322 };

export function normalizeCoords(coords) {
  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function parseCoordinateString(rawValue) {
  const match = String(rawValue || "")
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);

  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function tryJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Location lookup failed");
  return response.json();
}

export async function geocodePlace(rawPlace) {
  const place = String(rawPlace || "").trim();
  if (!place) return null;

  const directCoords = parseCoordinateString(place);
  if (directCoords) return directCoords;

  const candidates = [
    place,
    `${place}, Uttarakhand, India`,
    `${place}, India`,
  ].filter((value, index, arr) => arr.indexOf(value) === index);

  for (const candidate of candidates) {
    try {
      const data = await tryJson(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(candidate)}&limit=1`
      );
      const coords = data?.features?.[0]?.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length === 2) {
        return { lat: Number(coords[1]), lng: Number(coords[0]) };
      }
    } catch {
      // fall through to the next source
    }

    try {
      const data = await tryJson(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(candidate)}`
      );
      if (Array.isArray(data) && data[0]) {
        return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
      }
    } catch {
      // fall through to the next source
    }
  }

  return null;
}

export async function reverseGeocode(lat, lng) {
  try {
    const data = await tryJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`
    );
    const formatted = [data.locality, data.principalSubdivision]
      .filter(Boolean)
      .join(", ");
    if (formatted) return formatted;
  } catch {
    // fall through to backup source
  }

  try {
    const data = await tryJson(
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json`
    );
    return (
      data?.address?.suburb ||
      data?.address?.road ||
      data?.address?.town ||
      data?.address?.city ||
      data?.display_name?.split(",")?.slice(0, 2)?.join(", ") ||
      `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
    );
  } catch {
    return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
  }
}

export function getBrowserLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      ...options,
    });
  });
}
