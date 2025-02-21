// Import USGS data service functions and utilities
import { getCampiFlegeiData, getSantoriniData } from './usgsDataService.js';

// Import Chart.js
import Chart from 'chart.js/auto';

// Global variables for charts
let magnitudeChart = null;
let timeChart = null;
let depthChart = null;

// Global state for loading and error handling
let isLoading = false;
let lastError = null;
let selectedVolcano = 'campi'; // 'campi' or 'santorini'

// Fetch data based on selected volcano
async function fetchVolcanoData() {
    try {
        isLoading = true;
        updateLoadingState();
        
        let data;
        if (selectedVolcano === 'campi') {
            data = await getCampiFlegeiData();
        } else {
            data = await getSantoriniData();
        }
        
        const sortedData = data.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        isLoading = false;
        lastError = null;
        return sortedData;
    } catch (error) {
        console.error('Error fetching volcano data:', error);
        isLoading = false;
        lastError = error.message;
        updateErrorState();
        return [];
    } finally {
        updateLoadingState();
    }
}

// Handle loading state updates
function updateLoadingState() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
}

// Handle error state updates
function updateErrorState() {
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
        errorDisplay.textContent = lastError || '';
        errorDisplay.style.display = lastError ? 'block' : 'none';
    }
}

// Initialize automatic data refresh
function initializeDataRefresh() {
    // Initial load
    fetchAndUpdateCharts();
    
    // Refresh every 5 minutes
    setInterval(fetchAndUpdateCharts, 5 * 60 * 1000);
}

// Fetch data and update charts
async function fetchAndUpdateCharts() {
    const data = await fetchVolcanoData();
    if (data.length > 0) {
        updateCharts(data);
    }
}

// Charts aktualisieren
function updateCharts(events) {
    if (!events || !events.length) return;

    const chartData = prepareChartData(events);
    
    // Update all charts
    updateMagnitudeDistribution(chartData);
    updateTimeDistribution(chartData);
    updateDepthDistribution(chartData);
    
    // Update current time display
    updateCurrentTime();
}

// Daten für Charts vorbereiten
function prepareChartData(events) {
    return events.map(event => ({
        time: new Date(event.time),
        magnitude: parseFloat(event.magnitude),
        depth: parseFloat(event.depth),
        location: event.location || 'Unknown',
        coordinates: event.coordinates || []
    })).sort((a, b) => b.time - a.time);
}

// Pattern Analysis Chart
function updateMagnitudeDistribution(data) {
    const ctx = document.getElementById('magnitude-chart').getContext('2d');
    
    const magnitudes = data.map(d => d.magnitude);
    const labels = Array.from(new Set(magnitudes)).sort();
    const counts = labels.map(mag => 
        data.filter(d => d.magnitude === mag).length
    );

    if (magnitudeChart) {
        magnitudeChart.destroy();
    }

    magnitudeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Magnitude Distribution',
                data: counts,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Events'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Magnitude'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Earthquake Magnitude Distribution'
                }
            }
        }
    });
}
    }

// Magnitude vs. Time Chart
function updateTimeDistribution(data) {
    const ctx = document.getElementById('time-chart').getContext('2d');
    
    if (timeChart) {
        timeChart.destroy();
    }

    timeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.time.toLocaleString()),
            datasets: [{
                label: 'Magnitude over Time',
                data: data.map(d => d.magnitude),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Magnitude'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Earthquake Magnitude Timeline'
                }
            }
        }
    });
}

// Magnitude Analysis Chart
function updateDepthDistribution(data) {
    const ctx = document.getElementById('depth-chart').getContext('2d');
    
    if (depthChart) {
        depthChart.destroy();
    }

    // Create depth ranges
    const depthRanges = [];
    const rangeSize = 10; // 10km ranges
    const maxDepth = Math.ceil(Math.max(...data.map(d => d.depth)) / rangeSize) * rangeSize;
    
    for (let i = 0; i <= maxDepth; i += rangeSize) {
        depthRanges.push(`${i}-${i + rangeSize}`);
    }

    const depthCounts = depthRanges.map(range => {
        const [min, max] = range.split('-').map(Number);
        return data.filter(d => d.depth >= min && d.depth < max).length;
    });

    depthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: depthRanges,
            datasets: [{
                label: 'Depth Distribution',
                data: depthCounts,
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgb(153, 102, 255)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Events'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Depth Range (km)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Earthquake Depth Distribution'
                }
            }
        }
    });
}
        width: container.offsetWidth,
        height: container.offsetHeight,
        data: data,
        margin: { top: 10, right: 30, left: 0, bottom: 0 }
    },
        React.createElement(Recharts.CartesianGrid, { strokeDasharray: "3 3", stroke: "#333" }),
        React.createElement(Recharts.XAxis, {
            dataKey: "time",
            type: "number",
            scale: "time",
            domain: ['auto', 'auto'],
            tickFormatter: (unixTime) => new Date(unixTime).toLocaleTimeString(),
            stroke: "#9CA3AF"
        }),
        React.createElement(Recharts.YAxis, {
            stroke: "#9CA3AF"
        }),
        React.createElement(Recharts.Tooltip, {
            contentStyle: {
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '0.375rem',
                color: '#BFDBFE'
            },
            labelFormatter: (value) => new Date(value).toLocaleString()
        }),
        React.createElement(Recharts.Area, {
            type: "monotone",
            dataKey: "magnitude",
            stroke: "#00FFF3",
            fill: "#00FFF3",
            fillOpacity: 0.1
        })
    );

    ReactDOM.render(chart, container);
}

function updateCurrentTime() {
    const timeDisplay = document.querySelector('.current-time');
    if (timeDisplay) {
        timeDisplay.textContent = new Date().toLocaleString();
    }
    
    const lastUpdateSpan = document.getElementById('last-update');
    if (lastUpdateSpan) {
        lastUpdateSpan.textContent = new Date().toLocaleString();
    }
}

// Handle volcano selection change
function handleVolcanoSelection(volcano) {
    const buttons = {
        'both': document.getElementById('select-both'),
        'campi': document.getElementById('select-campi'),
        'santorini': document.getElementById('select-santorini')
    };
    
    // Update active state of buttons
    Object.keys(buttons).forEach(key => {
        if (buttons[key]) {
            buttons[key].classList.toggle('active', key === volcano);
        }
    });
    
    selectedVolcano = volcano;
    document.getElementById('loading-indicator').style.display = 'block';
    fetchAndUpdateCharts().finally(() => {
        document.getElementById('loading-indicator').style.display = 'none';
    });
}

// Initialize charts and event listeners when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize time immediately
    updateCurrentTime();
    
    // Set up volcano selection buttons
    document.getElementById('select-campi')?.addEventListener('click', () => handleVolcanoSelection('campi'));
    document.getElementById('select-santorini')?.addEventListener('click', () => handleVolcanoSelection('santorini'));
    
    // Start with Campi Flegrei selected
    handleVolcanoSelection('campi');
    
    // Update current time every second
    setInterval(updateCurrentTime, 1000);
    
    // Initialize automatic data refresh
    initializeDataRefresh();
});

