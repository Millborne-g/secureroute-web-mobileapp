let userData = {};
function retrieveData() {
    userData = JSON.parse(localStorage.getItem("userInfo"));
    if (!userData) {
        window.location.href = "/LoginSignup/index.html";
    }
    if (userData.role === "superadmin") {
        document.getElementById("crimes").style = "display: none";
        document.getElementById("routeSuggestion").style = "display: none";
        window.location.href = "/Dashboard/index.html ";
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

// Firebase configuration
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

let allCrimes = [];
let crimes = [];

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
                    // if(crime.crime !=="Manually Added"){

                    // }

                    allCrimes.push({
                        crimeID: childSnapshot.key,
                        crimeType: crime.crime,
                        label: formattedAddress,
                        latitude: crime.latitude,
                        longitude: crime.longitude,
                        time: crime.time,
                        date: crime.date,
                    });
                });
                displayWeek();
            } else {
                console.log("No crime data available");
                document.getElementById("tableContainer").style =
                    "display: none;";
            }
            // getCrimesThisWeek();
        },
        (error) => {
            console.error("Error fetching data: ", error);
        }
    );
}
fetchAllCrimes();

// let currentDate = new Date();
// currentDate.setHours(0, 0, 0, 0); // Normalize the time component to midnight.

// function displayWeek() {
//   const startOfWeek = new Date(currentDate);
//   startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Adjust to Monday of current week
//   const endOfWeek = new Date(startOfWeek);
//   endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday of the same week

//   const weekRange = `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`;
//   document.getElementById('weekRange').innerText = weekRange;

//   displayCrimes(startOfWeek, endOfWeek);
// }

// function formatDate(date) {
//   const monthNames = ["January", "February", "March", "April", "May", "June",
//                       "July", "August", "September", "October", "November", "December"];
//   return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
// }

// function displayCrimes(startOfWeek, endOfWeek) {
//   startOfWeek.setHours(0,0,0,0);
//   endOfWeek.setHours(23,59,59,999);

//   const filteredCrimes = allCrimes.filter(crime => {
//       const crimeDate = new Date(crime.date);
//       return crimeDate >= startOfWeek && crimeDate <= endOfWeek;
//   });
//   crimes = filteredCrimes;

//   // displayMap();
// }

// function changeWeek(direction) {
//   currentDate.setDate(currentDate.getDate() + direction * 7); // Move current date by 7 days
//   displayWeek();
// }

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
    displayMap();
}

function changeWeek(direction) {
    currentDate.setDate(currentDate.getDate() + direction * 7);
    displayWeek();
}

// JavaScript to change button text based on dropdown selection
document.addEventListener("DOMContentLoaded", function () {
    var dropdownItems = document.querySelectorAll(".dropdown-item");
    var dropdownButton = document.getElementById("dropdownMenuButton");

    dropdownItems.forEach(function (item) {
        item.addEventListener("click", function (event) {
            dropdownButton.textContent = event.target.textContent;
            displayMap();
            displayAddPin();
        });
    });
});

function displayAddPin() {
    let dropdownButton = document.getElementById("dropdownMenuButton");
    let buttonText = dropdownButton.textContent.trim();
    let addBtn = document.getElementById("addBtn");
    if (buttonText === "Mobile Patrol") {
        addBtn.style.display = "none";
    } else {
        addBtn.style.display = "block";
    }
}

// display route
function displayMap() {
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/geometry/Circle",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/support/FeatureSet",
        "esri/config",
        "esri/widgets/Expand",
    ], function (
        Map,
        MapView,
        Graphic,
        Point,
        Circle,
        SimpleMarkerSymbol,
        SimpleFillSymbol,
        route,
        RouteParameters,
        FeatureSet,
        esriConfig,
        Expand
    ) {
        esriConfig.apiKey =
            "AAPK5ef76e25deb54d2a8b30a427be25a367L9xKNojkbXZdALYDE_kMmuFAX1l_MWmbe9eD3dABLEd8X_RdISIOriJXXcZ93tT-";

        const map = new Map({
            basemap: "arcgis-navigation",
        });

        const view = new MapView({
            container: "map",
            map: map,
            center: new Point({ longitude: 124.6319, latitude: 8.4542 }), // Center on map initialization
            zoom: 13,
        });

        // Haversine formula to calculate the distance between two points, considering altitude as well
        function haversineDistance(point1, point2) {
            var R = 6371e3; // Radius of the Earth in meters
            var lat1Rad = (point1.latitude * Math.PI) / 180; // Convert degrees to radians
            var lat2Rad = (point2.latitude * Math.PI) / 180;
            var deltaLat =
                ((point2.latitude - point1.latitude) * Math.PI) / 180;
            var deltaLon =
                ((point2.longitude - point1.longitude) * Math.PI) / 180;
            var deltaAlt = (point2.altitude || 0) - (point1.altitude || 0); // Calculate altitude difference

            var a =
                Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1Rad) *
                    Math.cos(lat2Rad) *
                    Math.sin(deltaLon / 2) *
                    Math.sin(deltaLon / 2);

            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var distance = R * c; // Distance in meters

            // Calculate the vertical distance
            var verticalDistance = Math.abs(deltaAlt);

            // Return the maximum of horizontal and vertical distances
            return Math.max(distance, verticalDistance);
        }

        // Function to merge points within 200 meters
        // function mergeClosePoints(points) {
        //     console.log("points", points);
        //     var mergedPoints = [];
        //     var visited = new Array(points.length).fill(false);

        //     for (var i = 0; i < points.length; i++) {
        //         if (!visited[i]) {
        //             visited[i] = true;
        //             var closePoints = [points[i]];
        //             for (var j = i + 1; j < points.length; j++) {
        //                 if (haversineDistance(points[i], points[j]) <= 100) {
        //                     closePoints.push(points[j]);
        //                     visited[j] = true;
        //                 }
        //             }
        //             // Calculate the average latitude and longitude of the close points
        //             var avgLat =
        //                 closePoints.reduce(
        //                     (sum, point) => sum + point.latitude,
        //                     0
        //                 ) / closePoints.length;
        //             var avgLon =
        //                 closePoints.reduce(
        //                     (sum, point) => sum + point.longitude,
        //                     0
        //                 ) / closePoints.length;
        //             mergedPoints.push({ latitude: avgLat, longitude: avgLon });
        //         }
        //     }

        //     return mergedPoints;
        // }

        function mergeClosePoints(points) {
            var mergedPoints = [];
            var visited = new Array(points.length).fill(false);

            for (var i = 0; i < points.length; i++) {
                if (!visited[i]) {
                    visited[i] = true;
                    var closePoints = [points[i]];
                    for (var j = i + 1; j < points.length; j++) {
                        if (
                            !visited[j] &&
                            haversineDistance(points[i], points[j]) <= 100
                        ) {
                            closePoints.push(points[j]);
                            visited[j] = true;
                        }
                    }
                    if (closePoints.length > 0) {
                        var avgLat =
                            closePoints.reduce(
                                (sum, point) =>
                                    sum + parseFloat(point.latitude),
                                0
                            ) / closePoints.length;
                        var avgLon =
                            closePoints.reduce(
                                (sum, point) =>
                                    sum + parseFloat(point.longitude),
                                0
                            ) / closePoints.length;
                        mergedPoints.push({
                            latitude: avgLat,
                            longitude: avgLon,
                        });
                    } else {
                        console.log(
                            "No close points found for point: ",
                            points[i]
                        );
                    }
                }
            }

            return mergedPoints;
        }

        // Sample haversineDistance function for completeness
        function haversineDistance(point1, point2) {
            var R = 6371; // Radius of the Earth in km
            var dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
            var dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
            var a =
                0.5 -
                Math.cos(dLat) / 2 +
                (Math.cos((point1.latitude * Math.PI) / 180) *
                    Math.cos((point2.latitude * Math.PI) / 180) *
                    (1 - Math.cos(dLon))) /
                    2;
            return R * 2 * Math.asin(Math.sqrt(a)) * 1000; // distance in meters
        }

        // Sample data
        var crimeFiltered = [
            { latitude: 8.4749, longitude: 124.6437 },
            { latitude: 8.475, longitude: 124.6438 },
            { latitude: 8.4803, longitude: 124.6345 },
        ];

        view.when(() => {
            let crimeFiltered = crimes;
            let dropdownButton = document.getElementById("dropdownMenuButton");
            let buttonText = dropdownButton.textContent.trim();
            if (buttonText === "Mobile Patrol") {
                crimeFiltered = crimes.filter(
                    (crime) => crime.crimeType !== "Manually Added"
                );
            } else {
                crimeFiltered = crimes.filter(
                    (crime) => crime.crimeType === "Manually Added"
                );
            }

            let mergeCrimePoints = mergeClosePoints(crimeFiltered);
            mergeCrimePoints.forEach((point, index) => {
                addGraphic(point.label, new Point(point));
                addCircle(new Point(point));
            });
            crimeFiltered.forEach((point) => {
                addGraphic(point.label, new Point(point), "black");
            });
            getRoute();
        });

        // Function to add a graphic to the view
        function addGraphic(label, point, color = "red") {
            const graphic = new Graphic({
                symbol: new SimpleMarkerSymbol({
                    color: color,
                    size: "5px",
                }),
                geometry: point,
                attributes: {
                    label: label,
                },
            });
            view.graphics.add(graphic);
        }

        // Function to add a circle graphic around a point
        function addCircle(point) {
            const circle = new Circle({
                center: point,
                radius: 100,
            });

            const circleGraphic = new Graphic({
                geometry: circle,
                symbol: new SimpleFillSymbol({
                    color: [0, 0, 0, 0.3], // 30% opacity
                    outline: null, // Remove the outline
                }),
            });

            view.graphics.add(circleGraphic);
        }

        // Function to get the route
        function getRoute() {
            const routeGraphics = view.graphics.filter(
                (g) => g.symbol.color.toHex() === "#ff0000"
            ); // Only use red points for routing
            const routeParams = new RouteParameters({
                stops: new FeatureSet({
                    features: routeGraphics.toArray(),
                }),
                returnDirections: true,
            });

            route
                .solve(
                    "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
                    routeParams
                )
                .then((data) => {
                    if (data.routeResults.length > 0) {
                        showRoutes(data.routeResults);
                        showDirections(
                            data.routeResults[0].directions.features
                        );
                    } else {
                        console.error("No route results found");
                    }
                })
                .catch((error) => {
                    console.error("Routing error: ", error);
                    let week = document.getElementById("weekRange").innerText;
                    alert(
                        "Failed to calculate route: " +
                            error.message +
                            ` This might be caused by the absence of pinned locations within the specified date range. Please add at least 2 pinned locations within the date range of ${week}.`
                    );
                });
        }

        // Function to show the routes on the map
        function showRoutes(routes) {
            routes.forEach((result) => {
                result.route.symbol = {
                    type: "simple-line",
                    color: [5, 150, 255],
                    width: 3,
                };
                view.graphics.add(result.route);
            });
        }

        // Function to show the directions
        function showDirections(directions) {
            const directionsElement = document.createElement("div");
            directionsElement.innerHTML = "<h6 class='pt-2'>Directions</h6>";
            directionsElement.classList.add(
                "esri-widget",
                "esri-widget--panel",
                "esri-directions__scroller",
                "directions"
            );
            directionsElement.style.marginTop = "0";
            directionsElement.style.padding = "0 15px";
            directionsElement.style.minHeight = "365px";

            const directionsList = document.createElement("ol");

            directions.forEach((result, index) => {
                const direction = document.createElement("li");
                direction.innerHTML =
                    result.attributes.text +
                    (result.attributes.length > 0
                        ? ` (${result.attributes.length.toFixed(2)} miles)`
                        : "");
                directionsList.appendChild(direction);
            });

            directionsElement.appendChild(directionsList);

            view.ui.empty("top-right");
            view.ui.add(
                new Expand({
                    view: view,
                    content: directionsElement,
                    expanded: true,
                    mode: "floating",
                }),
                "top-right"
            );
        }
    });
}

let newLocation = "";
let newLongitude = "";
let newLatitude = "";

// Pin Location Add modal
require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "dojo/domReady!",
], function (Map, MapView, Graphic) {
    // Create a map and add it to the view
    var map = new Map({
        basemap: "streets-navigation-vector",
    });

    var view = new MapView({
        container: "mapClick",
        map: map,
        center: [124.643, 8.4812], // Longitude, Latitude of the Philippines
        zoom: 13, // Zoom level (1 = World, 20 = Streets)
    });

    // back to default
    document.getElementById("addBtn").addEventListener("click", () => {
        view.graphics.removeAll();
        view.goTo({
            center: [124.643, 8.4812], // Default center
            zoom: 13, // Default zoom
        });
        document.getElementById("addressContainer").style = "display: none";
        document.getElementById("address").value = "";
    });
    // When the view is clicked, create a pin at that location
    view.on("click", function (event) {
        var point = {
            type: "point",
            longitude: event.mapPoint.longitude,
            latitude: event.mapPoint.latitude,
        };

        // Log the coordinates to the console
        // console.log("Pinned Location - Latitude:", point.latitude, "Longitude:", point.longitude);

        // Use forward geocoding to get address
        var requestUrl =
            "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&featureTypes=&location=" +
            encodeURIComponent(
                event.mapPoint.longitude + "," + event.mapPoint.latitude
            );

        fetch(requestUrl)
            .then((response) => response.json())
            .then((data) => {
                var locationName = data.address.LongLabel || "Unnamed Location";

                // Log the name and coordinates to the console
                // console.log("Location Name:", locationName, "Latitude:", point.latitude, "Longitude:", point.longitude);
                document.getElementById("addressContainer").style =
                    "display: block";
                document.getElementById("address").value = locationName;

                // Create a symbol for the pin
                var markerSymbol = {
                    type: "picture-marker", // Using a picture-marker symbol
                    url: "../assets/locationIcon.png", // URL of your custom icon
                    width: "30px", // Icon width
                    height: "30px", // Icon height
                };

                // Create a graphic with the name as an attribute
                var pinGraphic = new Graphic({
                    geometry: point,
                    symbol: markerSymbol,
                    attributes: {
                        Name: locationName,
                    },
                });

                view.graphics.removeAll(); // Clear previous graphics
                view.graphics.add(pinGraphic); // Add new graphic

                // Zoom to the new graphic
                view.goTo({
                    target: pinGraphic,
                    zoom: 15,
                });

                newLocation = locationName;
                newLongitude = point.longitude;
                newLatitude = point.latitude;

                // document.getElementById("saveCrime").addEventListener('click', () => {
                //   if(!(document.getElementById('crimeSelect').selectedIndex === 0 || document.getElementById("address").value === '')){
                //     let selectedCrime = document.getElementById('crimeSelect').value;
                //     saveCrimeToDatabase(selectedCrime, locationName, point.latitude, point.longitude);
                //   }
                // })
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    });
});

function displayNewRoute() {
    // crimes = allCrimes;
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/support/FeatureSet",
        "esri/config",
        "esri/widgets/Expand",
    ], function (
        Map,
        MapView,
        Graphic,
        Point,
        route,
        RouteParameters,
        FeatureSet,
        esriConfig,
        Expand
    ) {
        esriConfig.apiKey =
            "AAPK5ef76e25deb54d2a8b30a427be25a367L9xKNojkbXZdALYDE_kMmuFAX1l_MWmbe9eD3dABLEd8X_RdISIOriJXXcZ93tT-";

        const map = new Map({
            basemap: "arcgis-navigation",
        });

        const view = new MapView({
            container: "mapRoute",
            map: map,
            center: new Point({ longitude: 124.6319, latitude: 8.4542 }), // Center on map initialization
            zoom: 12,
        });

        view.when(() => {
            let crimeFiltered = crimes.filter(
                (crime) => crime.crimeType === "Manually Added"
            );
            crimeFiltered.forEach((point, index) => {
                setTimeout(() => {
                    addGraphic(point.label, new Point(point));
                }, 200 * (index + 1));
            });
            setTimeout(() => {
                getRoute();
            }, 200 * (crimeFiltered.length + 1));
        });

        // view.on("click", (event) => {
        //   if (view.graphics.length < 3) {
        //     const label = ["Start", "Waypoint", "Destination"][view.graphics.length];
        //     addGraphic(label, event.mapPoint);
        //   } else {
        //     view.graphics.removeAll();
        //     addGraphic("Start", event.mapPoint);
        //   }
        // });

        function addGraphic(label, point) {
            const graphic = new Graphic({
                symbol: {
                    type: "simple-marker",
                    color: "red",
                    size: "12px",
                },
                geometry: point,
                attributes: {
                    label: label,
                },
            });
            view.graphics.add(graphic);
        }

        function getRoute() {
            const routeParams = new RouteParameters({
                stops: new FeatureSet({
                    features: view.graphics.toArray(),
                }),
                returnDirections: true,
            });
            route
                .solve(
                    "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
                    routeParams
                )
                .then((data) => {
                    showRoutes(data.routeResults);
                    showDirections(data.routeResults[0].directions.features);
                })
                .catch((error) => {
                    console.error("Routing error: ", error);
                });
        }

        function showRoutes(routes) {
            routes.forEach((result) => {
                result.route.symbol = {
                    type: "simple-line",
                    color: [5, 150, 255],
                    width: 3,
                };
                view.graphics.add(result.route, 0);
            });
        }

        function showDirections(directions) {
            const directionsElement = document.createElement("div");
            directionsElement.innerHTML = "<h6 class='pt-2'>Directions</h6>";
            directionsElement.classList.add(
                "esri-widget",
                "esri-widget--panel",
                "esri-directions__scroller",
                "directions"
            );
            directionsElement.style.marginTop = "0";
            directionsElement.style.padding = "0 15px";
            directionsElement.style.minHeight = "365px";

            const directionsList = document.createElement("ol");

            // Assuming each segment ends with the arrival at a point except the first which starts at the first point
            let currentPointIndex = 0;
            directions.forEach((result, index) => {
                const direction = document.createElement("li");
                direction.innerHTML =
                    result.attributes.text +
                    (result.attributes.length > 0
                        ? ` (${result.attributes.length.toFixed(2)} miles)`
                        : "");
                directionsList.appendChild(direction);

                if (result.attributes.maneuverType === "esriDMTStop") {
                    currentPointIndex++; // Move to next point
                }
            });

            directionsElement.appendChild(directionsList);

            view.ui.empty("top-right");
            view.ui.add(
                new Expand({
                    view: view,
                    content: directionsElement,
                    expanded: true,
                    mode: "floating",
                }),
                "top-right"
            );
        }
    });
}

// Back to default
function backToDefault() {
    document.getElementById("chooseLocation").style.display = "block";
    document.getElementById("verifyRoute").style.display = "none";
    document.getElementById("rightBtn").innerHTML = "Next";
    document.getElementById("chooseLocationText").style = "color: #7794DA;";
    document.getElementById("verifyRouteText").style = "color: #000000;";
    crimes.pop();
}

// save new location
let newCrime = {};
document.getElementById("rightBtn").addEventListener("click", function () {
    if (document.getElementById("rightBtn").textContent.trim() === "Next") {
        // Create a new Date object
        let now = new Date();
        let year = now.getFullYear();
        let month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-based
        let day = String(now.getDate()).padStart(2, "0");
        let dateString = `${year}-${month}-${day}`;
        let timeString = now.toLocaleTimeString();

        newCrime = {
            crime: "Manually Added",
            address: newLocation,
            latitude: newLatitude,
            longitude: newLongitude,
            time: timeString,
            date: dateString,
            point: 0,
        };

        let newCrimelocal = {
            crimeType: "Manually Added",
            label: newLocation,
            latitude: newLatitude,
            longitude: newLongitude,
            time: timeString,
            date: dateString,
            point: 0,
        };
        let updatedCrimes = [...crimes, newCrimelocal];
        crimes = updatedCrimes;
        displayNewRoute();
        document.getElementById("chooseLocation").style = "display: none;";
        document.getElementById("verifyRoute").style = "display: block;";
        document.getElementById("rightBtn").innerHTML = "Save";
        document.getElementById("chooseLocationText").style = "color: #000000;";
        document.getElementById("verifyRouteText").style = "color: #7794DA;";

        // #3d8afd
    } else {
        console.log(
            document.getElementById("rightBtn").textContent.trim() === "Next"
        );
        saveToDatabase(newCrime);
    }
});

// close modal
// Select all elements with the class 'closeAddModal'
const closeButtons = document.querySelectorAll(".closeAddModal");

// Loop through all elements and attach the event listener to each
closeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        backToDefault();
    });
});

let addLocation = new bootstrap.Modal(document.getElementById("addLocation"), {
    keyboard: false,
});

function saveToDatabase(newCrime) {
    let crimeRef = db.ref("crimes");
    crimeRef.push(newCrime);
    addLocation.hide();
    addLogs("Add a location");
    location.reload();
}

function addLogs(type) {
    let logsRef = db.ref("webLogs");
    let now = new Date();
    let options = { year: "numeric", month: "2-digit", day: "2-digit" };
    let dateString = now.toLocaleDateString("en-US", options);
    let timeString = now.toLocaleTimeString();

    logsRef.push({
        type: type,
        time: timeString,
        date: dateString,
        user: userData.name,
        userRole: userData.role,
    });
}

$(document).ready(function () {
    $("#addLocation").on("click", function (e) {
        if (e.target === this) {
            backToDefault();
        }
    });
});

// Toast
// document.getElementById("confirmDelete").onclick = function() {
//   var toastElList = [].slice.call(document.querySelectorAll('.toast'))
//   var toastList = toastElList.map(function(toastEl) {
//     return new bootstrap.Toast(toastEl)
//   })
//   toastList.forEach(toast => toast.show())
// }
