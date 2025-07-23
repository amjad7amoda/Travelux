function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = angle => angle * (Math.PI / 180);
  const R = 6371; 
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function calculateDuration(distanceKm, speedKmPerHour) {
  const durationHours = distanceKm / speedKmPerHour;
  const durationMinutes = Math.round(durationHours * 60);
  return durationMinutes;
}

function formatMinutesToHHMM(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hrs == 0? `${mins}m`: `${hrs}h and ${mins}m`;
}

module.exports = {
    calculateDistance,
    calculateDuration,
    formatMinutesToHHMM
}