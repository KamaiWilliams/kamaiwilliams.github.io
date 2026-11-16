

// map

const map = L.map("us-map", {
    center: [39.5, -98.35],
    zoom: 4,
    minZoom: 3,
    maxZoom: 7,
    maxBounds: [
        [24, -126],
        [50, -65]
    ],
    maxBoundsViscosity: 1.0
});


// Filler info

const stateData = {
    "Maryland": {
        coffee: 75,
        economy: 65
    },

    "California": {
        coffee: 90,
        economy: 80
    },

    "Texas": {
        coffee: 55,
        economy: 45
    },

    "New York": {
        coffee: 85,
        economy: 75
    },

    "Florida": {
        coffee: 60,
        economy: 55
    },

    "Virginia": {
        coffee: 70,
        economy: 50
    },

    "Illinois": {
        coffee: 65,
        economy: 60
    },

    "Georgia": {
        coffee: 50,
        economy: 70
    }
};


let currentMetric = "coffee";


// color scale

function getColor(value) {

    if (value === undefined || value === null) {
        return "#d8d1c5";
    }

    if (value < 20) return "#f1dfc5";
    if (value < 40) return "#e5bd91";
    if (value < 60) return "#d18b5d";
    if (value < 80) return "#a85b3c";

    return "#512b25";
}


async function loadMap() {

    try {
        const response = await fetch(
            "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json"
        );
        if (!response.ok) {
            throw new Error("Could not load geographic data.");
        }
        const geoData = await response.json();
        createStateLayer(geoData);

    } catch (error) {

        console.error("Map loading error:", error);
        document.getElementById("state-info").textContent =
            "The map could not load. Check your connection.";

    }

}

let stateLayer;

function createStateLayer(geoData) {
    stateLayer = L.geoJSON(geoData, {
        style: function(feature) {

            const name = feature.properties.name;

            const state = stateData[name];

            const value = state
                ? state[currentMetric]
                : null;

            return {
                fillColor: getColor(value),
                weight: 1,
                color: "#ffffff",
                fillOpacity: 0.85
            };
        },

        onEachFeature: function(feature, layer) {
            const name = feature.properties.name;

            // hover
            layer.on("mouseover", function() {
                layer.setStyle({
                    weight: 3,
                    color: "#302820",
                    fillOpacity: 1
                });
            });

    
            layer.on("mouseout", function() {
                stateLayer.resetStyle(layer);
            });

            // Show information when clicked
            layer.on("click", function() {
                showStateInfo(name);
            });

        }

    }).addTo(map);

    map.fitBounds(stateLayer.getBounds());

}


function showStateInfo(name) {

    const panel = document.getElementById("state-info");
    const state = stateData[name];

    if (!state) {
        panel.innerHTML = `
            <p class="eyebrow">STATE INFORMATION</p>
            <h3>${name}</h3>
            <p>No sample data available yet.</p>
        `;
        return;
    }

    const labels = {
        coffee: "Coffee spending index",
        economy: "Economic pressure index"
    };

    panel.innerHTML = `
        <p class="eyebrow">STATE INFORMATION</p>
        <h3>${name}</h3>
        <p>${labels[currentMetric]}</p>
        <h2>${state[currentMetric]} / 100</h2>
        <p>
            This is a sample value used to test
            the interactive map.
        </p>
    `;

}


// dropdown

const dropdown = document.getElementById("metric-select");
dropdown.addEventListener("change", function() {

    currentMetric = dropdown.value;
    stateLayer.setStyle(function(feature) {

        const name = feature.properties.name;

        const state = stateData[name];

        const value = state
            ? state[currentMetric]
            : null;

        return {
            fillColor: getColor(value),
            weight: 1,
            color: "#ffffff",
            fillOpacity: 0.85
        };

    });

    document.getElementById("state-info").innerHTML = `
        <h3>Select a state</h3>
        <p>Click a state to explore its data.</p>
    `;

});
// I need to figure out how to connect multiple 
// datasets to the geographic data so that each state displays
// the correct statistics most efficiently. 

// I eventually wannause the map to compare coffee consumption with socioeconomic 
// factors like income, poverty, and food insecurity. I'm still figuring out how to 
// organize the data and connect everything through Leaflet to make that interaction work.
// most likey i will use 3 data sets max bc some are more straight forward but ik this is 
// complex so at the least i needa get the state metrics one in.
loadMap();
