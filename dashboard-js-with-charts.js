// [Vorheriger Code bleibt gleich bis zu den Chart-Funktionen]

// Charts aktualisieren
function updateCharts(events) {
    if (!events || !events.length) return;

    // Daten für die Charts vorbereiten
    const chartData = prepareChartData(events);
    
    // Alle Charts aktualisieren
    updatePatternChart(chartData);
    updateMagnitudeTimeChart(chartData);
    updateMagnitudeAnalysisChart(chartData);
    updateAIAnalysisChart(chartData);
}

// Daten für Charts vorbereiten
function prepareChartData(events) {
    return events.slice(0, 20).map(event => ({
        time: new Date(event.time).getTime(),
        magnitude: parseFloat(event.magnitude),
        depth: parseFloat(event.depth)
    })).reverse();
}

// Pattern Analysis Chart
function updatePatternChart(data) {
    const container = document.getElementById('pattern-chart');
    if (!container) return;

    const chart = React.createElement(Recharts.ScatterChart, {
        width: container.offsetWidth,
        height: container.offsetHeight,
        margin: { top: 10, right: 30, left: 0, bottom: 0 }
    },
        React.createElement(Recharts.CartesianGrid, { strokeDasharray: "3 3", stroke: "#333" }),
        React.createElement(Recharts.XAxis, {
            type: "number",
            dataKey: "depth",
            name: "Depth",
            unit: "km",
            stroke: "#9CA3AF"
        }),
        React.createElement(Recharts.YAxis, {
            type: "number",
            dataKey: "magnitude",
            name: "Magnitude",
            stroke: "#9CA3AF"
        }),
        React.createElement(Recharts.Tooltip, {
            contentStyle: {
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '0.375rem',
                color: '#BFDBFE'
            }
        }),
        React.createElement(Recharts.Scatter, {
            data: data,
            fill: "#2563EB",
            r: 5
        })
    );

    ReactDOM.render(chart, container);
}

// Magnitude vs. Time Chart
function updateMagnitudeTimeChart(data) {
    const container = document.getElementById('magnitude-time-chart');
    if (!container) return;

    const chart = React.createElement(Recharts.LineChart, {
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
        React.createElement(Recharts.Line, {
            type: "monotone",
            dataKey: "magnitude",
            stroke: "#0088FE",
            strokeWidth: 2,
            dot: false
        })
    );

    ReactDOM.render(chart, container);
}

// Magnitude Analysis Chart
function updateMagnitudeAnalysisChart(data) {
    const container = document.getElementById('magnitude-analysis-chart');
    if (!container) return;

    const chart = React.createElement(Recharts.AreaChart, {
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

// AI Analysis Chart (kombinierte Visualisierung)
function updateAIAnalysisChart(data) {
    const container = document.getElementById('ai-analysis-chart');
    if (!container) return;

    // Berechne gleitenden Durchschnitt
    const movingAverage = calculateMovingAverage(data.map(d => d.magnitude), 3);
    const analysisData = data.map((d, i) => ({
        ...d,
        avg: movingAverage[i]
    }));

    const chart = React.createElement(Recharts.ComposedChart, {
        width: container.offsetWidth,
        height: container.offsetHeight,
        data: analysisData,
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
        }),
        React.createElement(Recharts.Line, {
            type: "monotone",
            dataKey: "avg",
            stroke: "#FF0088",
            strokeWidth: 2,
            dot: false
        })
    );

    ReactDOM.render(chart, container);
}

// Hilfsfunktion: Berechnung gleitender Durchschnitt
function calculateMovingAverage(data, window) {
    return data.map((_, index) => {
        const start = Math.max(0, index - Math.floor(window / 2));
        const end = Math.min(data.length, index + Math.floor(window / 2) + 1);
        const values = data.slice(start, end);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
}

// [Rest des vorherigen Codes bleibt gleich]