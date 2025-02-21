// Constants for volcano coordinates and search radius
const VOLCANOES = {
    CAMPI_FLEGREI: {
        latitude: 40.827,
        longitude: 14.139,
        radius: 20 // km
    },
    SANTORINI: {
        latitude: 36.4,
        longitude: 25.396,
        radius: 20 // km
    }
};

const USGS_API_ENDPOINT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

/**
* Formats a date object into YYYY-MM-DD format
* @param {Date} date - The date to format
* @returns {string} Formatted date string
*/

/**
* Fetches earthquake data for Campi Flegrei
* @param {Date} startDate - Start date for the query
* @param {Date} endDate - End date for the query
* @returns {Promise<Array>} Array of earthquake data
*/

// Constants for volcano locations and search parameters
const VOLCANOES = {
    CAMPI_FLEGREI: {
        name: 'Campi Flegrei',
        latitude: 40.827,
        longitude: 14.139,
        radius: 50, // km
        color: '#2563EB' // Blue for Campi Flegrei
    },
    SANTORINI: {
        name: 'Santorini',
        latitude: 36.4,
        longitude: 25.4,
        radius: 50, // km
        color: '#FF4B4B' // Red for Santorini
    }
};

// API Configuration
const USGS_API_ENDPOINT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const API_RATE_LIMIT = 1000; // Minimum time between requests in ms
const MAX_RETRIES = 3;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache for API responses
let dataCache = new Map();
let lastRequestTime = 0;

/**
* Fetches earthquake data for a specific location
* @param {Object} location - Location object with coordinates and radius
* @param {number} daysBack - Number of days of data to fetch
* @returns {Promise<Array>} - Processed earthquake data
*/
export async function fetchEarthquakeData(location, daysBack) {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - daysBack);
    
    const params = new URLSearchParams({
        format: 'geojson',
        latitude: location.latitude,
        longitude: location.longitude,
        maxradiuskm: location.radius,
        starttime: startTime.toISOString(),
        orderby: 'time'
    });

    // Check cache first
    const cacheKey = `${location.name}-${daysBack}`;
    const cachedData = dataCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        return cachedData.data;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < API_RATE_LIMIT) {
        await new Promise(resolve => setTimeout(resolve, API_RATE_LIMIT));
    }
    lastRequestTime = Date.now();

    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            const response = await fetch(`${USGS_API_ENDPOINT}?${params}`);
            
            if (!response.ok) {
                if (response.status === 429) { // Too Many Requests
                    await new Promise(resolve => setTimeout(resolve, (retries + 1) * 1000));
                    retries++;
                    continue;
                }
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            const processedData = processEarthquakeData(data, location);
            
            // Update cache
            dataCache.set(cacheKey, {
                data: processedData,
                timestamp: Date.now()
            });

            return processedData;
    } catch (error) {
        console.error(`Error fetching data for ${location.name}:`, error);
        throw {
            message: `Failed to fetch earthquake data for ${location.name}`,
            originalError: error,
            location: location.name
        };
    }
}
}

/**
* Processes raw earthquake data
* @param {Object} rawData - Raw GeoJSON data from USGS
* @param {Object} location - Location object for reference
* @returns {Array} - Processed earthquake data
*/
function processEarthquakeData(rawData, location) {
    if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid data format: expected object');
    }
    
    if (!rawData.features || !Array.isArray(rawData.features)) {
        console.warn(`No earthquake features found for ${location.name}`);
        return [];
    }

    if (rawData.metadata) {
        console.log(`Found ${rawData.metadata.count} earthquakes for ${location.name}`);
    }

    return rawData.features
        .filter(quake => (
            quake.properties.mag != null &&
            !isNaN(quake.properties.mag) &&
            quake.geometry.coordinates.length === 3 &&
            quake.geometry.coordinates.every(coord => !isNaN(coord))
        ))
        .map(quake => ({
        id: quake.id,
        time: new Date(quake.properties.time),
        magnitude: quake.properties.mag,
        depth: quake.geometry.coordinates[2],
        latitude: quake.geometry.coordinates[1],
        longitude: quake.geometry.coordinates[0],
        location: location.name,
        place: quake.properties.place,
        distanceFromVolcano: calculateDistance(
            location.latitude,
            location.longitude,
            quake.geometry.coordinates[1],
            quake.geometry.coordinates[0]
        )
    }));
}

/**
* Calculates distance between two points using the Haversine formula
*/
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
* Gets earthquake data for Campi Flegrei
* @param {number} daysBack - Number of days of data to fetch
*/
export async function getCampiFlegeiData(daysBack = 30) {
    return fetchEarthquakeData(VOLCANOES.CAMPI_FLEGREI, daysBack);
}

export async function getSantoriniData(daysBack = 30) {
    return fetchEarthquakeData(VOLCANOES.SANTORINI, daysBack);
}

export async function getAllVolcanoData(daysBack = 30) {
    const [campiFlegrei, santorini] = await Promise.all([
        getCampiFlegeiData(daysBack),
        getSantoriniData(daysBack)
    ]);
    return [...campiFlegrei, ...santorini];
}

// Aliases for backward compatibility
export const fetchCampiFlegeriData = getCampiFlegeiData;
export const fetchSantoriniData = getSantoriniData;

/**
* Filters earthquake data based on given criteria
* @param {Array} data - Array of earthquake data objects
* @param {Object} filters - Filter criteria
* @returns {Array} - Filtered earthquake data
*/

export const constants = {
    volcanoes: VOLCANOES,
    apiEndpoint: USGS_API_ENDPOINT
};

