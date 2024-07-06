// Retrieve data from sessionStorage
let userData = {};
function retrieveData() {
    userData = JSON.parse(localStorage.getItem("userInfo"));
    if (!userData) {
        window.location.href = "/LoginSignup/index.html";
    }
    if (userData.role === "superadmin") {
        document.getElementById("crimes").style = "display: none";
        document.getElementById("routeSuggestion").style = "display: none";
    } else if (userData.role === "admin") {
        document.getElementById("adminUsers").style = "display: none";
        document.getElementById("adminLogs").style = "display: none";
    }

    if (userData.role === "admin") {
        if (
            userData.status === "pending" ||
            userData.status === "disapproved"
        ) {
            let myModal = new bootstrap.Modal(
                document.getElementById("noButtonModal"),
                {
                    keyboard: false,
                    backdrop: "static",
                }
            );

            // Show the modal
            myModal.show();

            setTimeout(function () {
                myModal.hide();
                localStorage.removeItem("userInfo");

                window.location.href = "/LoginSignup/index.html";
            }, 4000); // 3000 milliseconds = 3 seconds
        }
    }
}
retrieveData();
const firstName = userData.name.split(" ")[0];
const fullName = userData.name;

function setDataToFrontend() {
    document.querySelector(".userFullname").textContent = userData.name;
}
setDataToFrontend();

function logOut() {
    window.location.href = "/LoginSignup/index.html";
}

document.querySelector(".logout").addEventListener("click", () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/LoginSignup/index.html";
});

const firebaseConfig = {
    apiKey: "AIzaSyC_4AIr2IjdMWl815G95z3rx8HM3eaur9k",
    authDomain: "crime-hotspot-ustp-cpe.firebaseapp.com",
    databaseURL:
        "https://crime-hotspot-ustp-cpe-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "crime-hotspot-ustp-cpe",
    storageBucket: "crime-hotspot-ustp-cpe.appspot.com",
    messagingSenderId: "1093769132537",
    appId: "1:1093769132537:web:de4a2d38b20d3ac0a5a528",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let screenWidth;

// Sidebar
document.addEventListener("DOMContentLoaded", function () {
    document
        .getElementById("sidebarCollapse")
        .addEventListener("click", function () {
            document.getElementById("sidebar").classList.toggle("active");
            document
                .getElementById("content")
                .classList.toggle("sidebarActive");
            document
                .getElementById("sidebarActiveBg")
                .classList.toggle("active");
        });
});

// Greetings
function randomGreeting() {
    let name = firstName;
    if (fullName === "Super Admin") {
        name = "Super Admin";
    }
    const greetings = [
        `Hi ${name}, good to see you!`,
        `Hello ${name}! It's great to have you here.`,
        `Hey ${name}, welcome back!`,
        `Greetings ${name}! How have you been?`,
        `Good day, ${name}! It's always a pleasure.`,
    ];
    const randomIndex = Math.floor(Math.random() * greetings.length);
    const userGreetingsSpan = document.getElementById("userGreetings");
    userGreetingsSpan.textContent = greetings[randomIndex];
}

randomGreeting();

let allCrimes = [];
let crimes = [];

let crimeStats = [
    { name: "Murder", y: 0 },
    { name: "Homicide", y: 0 },
    { name: "Physical injury", y: 0 },
    { name: "Rape", y: 0 },
    { name: "Theft", y: 0 },
    { name: "Robbery", y: 0 },
];

function formatAddress(fullAddress) {
    // Split the address into components
    let parts = fullAddress.split(",");
    // Check if the parts length is at least the number you expect (3 for the basic address)
    if (parts.length >= 3) {
        // Join the first three components
        return parts.slice(0, 3).join(",");
    }
    return fullAddress; // Return the full address if it's shorter than expected
}

function fetchAllCrimes() {
    const crimesRef = db.ref("crimes");

    crimesRef.once(
        "value",
        (snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    let crime = childSnapshot.val();
                    let formattedAddress = formatAddress(crime.address);
                    if (crime.crime !== "Manually Added") {
                        allCrimes.push({
                            crimeID: childSnapshot.key,
                            crimeType: crime.crime,
                            location: formattedAddress,
                            latitude: crime.latitude,
                            longitude: crime.longitude,
                            point: crime.point,
                            time: crime.time,
                            date: crime.date,
                        });
                    }
                });
            } else {
                allCrimes = [];
                console.log("No crime data available");

                //   document.getElementById("tableContainer").style = "display: none;"
            }
            displayWeek();

            // getCrimesThisWeek();
        },
        (error) => {
            console.error("Error fetching data: ", error);
        }
    );
}
fetchAllCrimes();

let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0); // Normalize the time component to midnight.

function displayWeek() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Adjust to Monday of current week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday of the same week

    const weekRange = `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`;
    document.getElementById("weekRange").innerText = weekRange;

    displayCrimes(startOfWeek, endOfWeek);
}

function formatDate(date) {
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    return `${
        monthNames[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
}

function convertLatLongToNumbers(data) {
    return data.map((item) => {
        item.latitude =
            typeof item.latitude === "string"
                ? parseFloat(item.latitude)
                : item.latitude;
        item.longitude =
            typeof item.longitude === "string"
                ? parseFloat(item.longitude)
                : item.longitude;
        return item;
    });
}

function displayCrimes(startOfWeek, endOfWeek) {
    startOfWeek.setHours(0, 0, 0, 0);
    endOfWeek.setHours(23, 59, 59, 999);

    const filteredCrimes = allCrimes.filter((crime) => {
        const crimeDate = new Date(crime.date);
        return crimeDate >= startOfWeek && crimeDate <= endOfWeek;
    });
    let convertFilteredCrimes = convertLatLongToNumbers(filteredCrimes);
    crimes = convertFilteredCrimes;
    processCrimeData(convertFilteredCrimes);
    displayMap(null);
}

function changeWeek(direction) {
    currentDate.setDate(currentDate.getDate() + direction * 7); // Move current date by 7 days
    crimeStats = [
        { name: "Murder", y: 0 },
        { name: "Homicide", y: 0 },
        { name: "Physical injury", y: 0 },
        { name: "Rape", y: 0 },
        { name: "Theft", y: 0 },
        { name: "Robbery", y: 0 },
    ];
    displayWeek();
}

function processCrimeData(crimesData) {
    crimesData.forEach((crime) => {
        const { crimeType } = crime;
        // Find the corresponding crime type in crimeStats and increment the y value
        const crimeStat = crimeStats.find(
            (stat) => stat.name.toLowerCase() === crimeType.toLowerCase()
        );
        if (crimeStat) {
            crimeStat.y += 1; // Here you can set the logic to increment y based on your specific criteria
        } else {
            // Optionally add the crime type if it's not predefined in the stats
            crimeStats.push({ name: crimeType, y: 1 });
        }
    });
    displayHighCharts(crimeStats);
}

// pie graph
function displayHighCharts(newCrimeStats) {
    Highcharts.chart("container", {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: "pie",
        },
        title: {
            text: `${crimes.length} Total Crime`,
            align: "left",
        },
        tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>",
        },
        accessibility: {
            point: {
                valueSuffix: "%",
            },
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: {
                    enabled: false,
                },
                showInLegend: true,
            },
            series: {
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: [
                    {
                        enabled: true,
                        distance: 20,
                    },
                    {
                        enabled: true,
                        distance: -40,
                        format: "{point.percentage:.1f}%",
                        style: {
                            fontSize: "1.2em",
                            textOutline: "none",
                            opacity: 0.7,
                        },
                        filter: {
                            operator: ">",
                            property: "percentage",
                            value: 10,
                        },
                    },
                ],
            },
        },
        series: [
            {
                name: "Brands",
                colorByPoint: true,
                data: newCrimeStats,
            },
        ],
    });
}

// Function to handle screen width change
function handleScreenWidthChange() {
    var screenWidth = window.innerWidth;
    if (screenWidth < 1400) {
        document.getElementById("sidebar").classList.add("active");
        document.getElementById("sidebarActiveBg").classList.remove("active");
    } else {
        document.getElementById("content").classList.add("sidebarActive");
        document.getElementById("sidebar").classList.remove("active");
    }
}
handleScreenWidthChange();
window.addEventListener("resize", handleScreenWidthChange);

// var coordinates = [
//     [8.4542, 124.6319],  // Cagayan de Oro
//     [8.4796, 124.6471],  // CDO 2
//     [8.4619, 124.6424],  // CDO 3
//     [8.4538, 124.6432],  // CDO 4
//     [8.4325, 124.5600],  // CDO 5
//     [8.4781, 124.6423],  // CDO 6
//     [8.4791, 124.6361],  // CDO 7
//     [8.4601, 124.6080],  // CDO 8
//     [8.4505, 124.6286],  // CDO 9
//     [8.4833, 124.6500],  // CDO 10
// ];

// var map = L.map('map').setView([8.4542, 124.6319], 15); // Centered on Cagayan de Oro, zoom level 14

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19
// }).addTo(map);

// var heat = L.heatLayer(coordinates, {
//     radius: 70,
//     blur: 50,
//     maxZoom: 15,
// }).addTo(map);

// Heatmap

var map; // Declare map globally
var markersLayer = new L.LayerGroup(); // Create a layer group for markers to facilitate easy removal
var mobilePatrolLocation = null;
let heatmapMode = false; // Default to heatmap mode off

// Define the toggleHeatmap function globally
function toggleHeatmap(enable) {
    if (enable) {
        window.markersLayer.eachLayer(function (layer) {
            if (layer instanceof L.Marker && layer.hotspot) {
                window.markersLayer.removeLayer(layer.hotspot);
            }
        });
        window.map.removeLayer(window.markersLayer);
        if (!window.heatmapLayer) {
            updateHeatmap();
        }
        window.heatmapLayer.addTo(window.map);
    } else {
        if (window.heatmapLayer) {
            window.map.removeLayer(window.heatmapLayer);
        }
        window.markersLayer.eachLayer(function (layer) {
            if (layer instanceof L.Marker && layer.hotspot) {
                window.markersLayer.addLayer(layer.hotspot);
            }
        });
        window.markersLayer.addTo(window.map);
    }
}

// Define the updateHeatmap function globally
function updateHeatmap() {
    if (window.heatmapLayer) {
        window.map.removeLayer(window.heatmapLayer);
    }
    var heatData = crimes.map(function (location) {
        return [location.latitude, location.longitude, location.point];
    });
    window.heatmapLayer = L.heatLayer(heatData, {
        radius: 40,
        blur: 20,
        maxZoom: 15,
    });
}

// Set up the changeView event listener globally
document.getElementById("changeView").addEventListener("click", () => {
    window.heatmapMode = !window.heatmapMode;
    toggleHeatmap(window.heatmapMode);
    var button = document.getElementById("changeView");
    var toggleIcon = document.getElementById("toggleIcon");
    if (window.heatmapMode) {
        button.className = button.className.replace(
            "btn-outline-secondary",
            "btn-success"
        );
        toggleIcon.className = toggleIcon.className.replace(
            "fa-toggle-off",
            "fa-toggle-on"
        );
    } else {
        button.className = button.className.replace(
            "btn-success",
            "btn-outline-secondary"
        );
        toggleIcon.className = toggleIcon.className.replace(
            "fa-toggle-on",
            "fa-toggle-off"
        );
    }
});

function displayMap(newLocation) {
    let latitude = 8.464;
    let longitude = 124.622;

    function updateIndependentLocation(latitude, longitude) {
        var newLocationIcon = L.icon({
            iconUrl: "./assets/police-car.png",
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [-3, -76],
            shadowSize: [50, 64],
            shadowAnchor: [4, 62],
        });

        if (!window.independentLocationMarker) {
            window.independentLocationBackground = L.circle(
                [latitude, longitude],
                {
                    color: "transparent",
                    fillColor: "#384CFF",
                    fillOpacity: 0.5,
                    radius: 100,
                }
            ).addTo(window.map);
            window.independentLocationMarker = L.marker([latitude, longitude], {
                icon: newLocationIcon,
            }).addTo(window.map);
        } else {
            window.independentLocationMarker.setLatLng([latitude, longitude]);
            window.independentLocationBackground.setLatLng([
                latitude,
                longitude,
            ]);
        }
    }

    if (newLocation) {
        latitude = newLocation.latitude;
        longitude = newLocation.longitude;
        updateIndependentLocation(newLocation.latitude, newLocation.longitude);
    }

    if (!window.map) {
        if (newLocation) {
            latitude = newLocation.latitude;
            longitude = newLocation.longitude;
        }
        window.map = L.map("map").setView([latitude, longitude], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(window.map);

        window.markersLayer = L.layerGroup().addTo(window.map);
        window.heatmapLayer = null;
    } else {
        window.markersLayer.clearLayers();
        if (window.heatmapLayer) {
            window.map.removeLayer(window.heatmapLayer);
        }
    }

    document
        .getElementById("findMobilePatrol")
        .addEventListener("click", handleButtonClick);
    function handleButtonClick() {
        console.log(
            mobilePatrolLocation.latitude,
            mobilePatrolLocation.longitude
        );
        window.map.setView(
            [mobilePatrolLocation.latitude - 0.01, mobilePatrolLocation.longitude + 0.01],
            15.1
        );
    }

    var redDotIcon = L.divIcon({
        className: "custom-div-icon",
        html: "<div style='background-color: black; width: 5px; height: 5px; border-radius: 50%;'></div>",
        iconSize: [10, 10],
        iconAnchor: [5, 5],
    });

    crimes.forEach(function (location) {
        var latlng = L.latLng(location.latitude, location.longitude);
        var marker = L.marker(latlng, { icon: redDotIcon });
        window.markersLayer.addLayer(marker);

        var addHotspot = location.point === 2;

        crimes.forEach(function (otherLocation) {
            if (location !== otherLocation) {
                var otherLatlng = L.latLng(
                    otherLocation.latitude,
                    otherLocation.longitude
                );
                if (window.map.distance(latlng, otherLatlng) <= 100) {
                    addHotspot = true;
                }
            }
        });

        if (addHotspot) {
            var circle = L.circle(latlng, {
                color: "transparent",
                fillColor: "#ff6961",
                fillOpacity: 0.5,
                radius: 100,
            });
            marker.hotspot = circle;
            if (!window.heatmapMode) {
                window.markersLayer.addLayer(circle);
            }
        }
    });

    window.markersLayer.addTo(window.map);

    // Update the heatmap data
    updateHeatmap();

    // If heatmap is on, re-enable it
    if (window.heatmapMode) {
        toggleHeatmap(true);
    }
}

// Expand map
let expanded = false;
document.getElementById("expandMap").addEventListener("click", () => {
    var mapElement = document.querySelector(".mapview");
    var expandContainer = document.getElementById("expandContainer");
    var navbar = document.querySelector(".navbar");
    var rightSideContainer = document.querySelector("#rightSideContainer");
    var expandMapButton = document.getElementById("expandMap");

    if (!expanded) {
        mapElement.classList.add("mapContainer");
        expandContainer.classList.add("floatingExpandContainer");

        // navbar
        navbar.style.display = "none";

        // rightSideContainer
        rightSideContainer.style.display = "none";

        // change btn color
        expandMapButton.className = expandMapButton.className.replace(
            "btn-light",
            "btn-success"
        );

        expanded = true;
    } else {
        mapElement.classList.remove("mapContainer");
        expandContainer.classList.remove("floatingExpandContainer");

        // navbar
        navbar.style.display = "block";

        // rightSideContainer
        rightSideContainer.style.display = "block";

        // change btn color
        expandMapButton.className = expandMapButton.className.replace(
            "btn-success",
            "btn-light"
        );

        expanded = false;
    }

    // Add a class as the first class
    // mapElement.className = "mapContainer " + mapElement.className;
    // var mapCard = document.getElementById("mapCard");
    // var rightSideContainer = document.getElementById("rightSideContainer");
    // var expandMapButton = document.getElementById("expandMap");

    // if (!expanded) {
    //     // Map
    //     mapCard.classList.remove(
    //         "col-xl-8",
    //         "col-lg-12",
    //         "mb-xl-0",
    //         "mb-lg-3",
    //         "mb-3"
    //     );
    //     mapCard.classList.add("col-12", "mb-3");

    //     // rightSideContainer
    //     rightSideContainer.classList.remove("col-xl-4", "col-lg-12");
    //     rightSideContainer.classList.add("col-12");

    //     // CHange button color
    //     expandMapButton.className = expandMapButton.className.replace(
    //         "btn-light",
    //         "btn-success"
    //     );

    //     // Close Sidebar
    //     document.getElementById("sidebar").classList.add("active");
    //     document.getElementById("content").classList.remove("sidebarActive");
    //     document.getElementById("sidebarActiveBg").classList.remove("active");

    //     expanded = true;
    // } else {
    //     // Map
    //     mapCard.classList.remove("col-12", "mb-3");
    //     mapCard.classList.add(
    //         "col-xl-8",
    //         "col-lg-12",
    //         "mb-xl-0",
    //         "mb-lg-3",
    //         "mb-3"
    //     );

    //     // rightSideContainer
    //     rightSideContainer.classList.remove("col-12");
    //     rightSideContainer.classList.add("col-xl-4", "col-lg-12");

    //     expandMapButton.className = expandMapButton.className.replace(
    //         "btn-success",
    //         "btn-light"
    //     );
    //     expanded = false;
    // }
});

// Socket
const socket = io("https://taweng-sever.onrender.com/");

socket.on("connect", () => {
    console.log("Connected to server");
});

socket.on("receiveLocation", (data) => {
    mobilePatrolLocation = data;
    displayMap(data);
    var button = document.getElementById("findMobilePatrol");
    button.className = button.className.replace("btn-secondary", "btn-primary");
    button.removeAttribute("disabled");
});

function sendMessage() {
    const message = "Tangina mo!";
    socket.emit("sendLocation", message);
}