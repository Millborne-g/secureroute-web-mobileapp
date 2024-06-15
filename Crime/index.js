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

// table
const itemsPerPage = 10;
let currentPage = 1;
let crimeToDelete = null;
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
                    if (!(crime.crime === "Manually Added")) {
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
                document.getElementById("emptyMessage").style =
                    "display: none;";
                // displayTable(currentPage);
                displayWeek()
            } else {
                console.log("No crime data available");
                document.getElementById("tableContainer").style =
                    "display: none;";
                document.getElementById("emptyMessage").style =
                    "display: flex;";
            }
            document.querySelector(".loader").style = "display: none;";
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

function displayCrimes(startOfWeek, endOfWeek) {
    startOfWeek.setHours(0, 0, 0, 0);
    endOfWeek.setHours(23, 59, 59, 999);

    const filteredCrimes = allCrimes.filter((crime) => {
        const crimeDate = new Date(crime.date);
        return crimeDate >= startOfWeek && crimeDate <= endOfWeek;
    });
    crimes = filteredCrimes;
    // displayMap();
    displayTable(currentPage);
}

function changeWeek(direction) {
    currentDate.setDate(currentDate.getDate() + direction * 7);
    displayWeek();
}

function displayTable(currentPage) {
    const tableBody = document.getElementById("table-body");
    const pagination = document.getElementById("pagination");
    const searchInput = document
        .getElementById("searchInput")
        .value.toLowerCase();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filteredData = crimes.filter(
        (crime) =>
            crime.crimeType.toLowerCase().includes(searchInput) ||
            crime.location.toLowerCase().includes(searchInput) ||
            crime.time.toLowerCase().includes(searchInput) ||
            crime.date.toLowerCase().includes(searchInput)
    );
    // Update the total number of pages based on the filtered data length
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const slicedData = filteredData.slice(startIndex, endIndex);

    tableBody.innerHTML = "";
    slicedData.forEach((crime, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td id="column" class="w-30">${crime.crimeType}</td>
            <td id="column" class="w-30">${crime.location}</td>
            <td id="column" class="w-30">${crime.longitude}</td>
            <td id="column" class="w-30">${crime.latitude}</td>
            <td id="column" class="w-30">${crime.point}</td>
            <td id="column" class="w-30">${crime.time}</td>
            <td id="column" class="w-30">${crime.date}</td>
            <td id="column" class="w-30">
              <button data-crime-id="${crime.crimeID}" type="button" class="btn btn-info text-white viewRow" data-bs-toggle="modal" data-bs-target="#viewCrimeModal"><i class="fa-regular fa-eye"></i></button>
              <button data-crime-id="${crime.crimeID}" type="button" class="btn btn-danger deleteRow" data-bs-toggle="modal" data-bs-target="#deleteConfirmationModal"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    // Update pagination based on the filtered data
    updatePagination(currentPage, totalPages);

    attachDeleteButtonListeners();
    attachViewButtonListeners();
}

// Attach Delete Button Listeners to each rows
function attachDeleteButtonListeners() {
    const deleteButtons = document.querySelectorAll(".deleteRow");
    deleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const crimeID = button.getAttribute("data-crime-id");
            // Update the crime ID in the modal
            document.getElementById("crimeIDToDelete").textContent = crimeID;
            // Store the crime ID of the row being deleted
            crimeToDelete = crimeID;
        });
    });
}

// Attach View Button Listeners to each rows
let viewLongitude = 0;
let viewLatitude = 0;
function attachViewButtonListeners() {
    const viewButtons = document.querySelectorAll(".viewRow");
    viewButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const crimeID = button.getAttribute("data-crime-id");

            let viewCrime = crimes.find((crime) => crime.crimeID === crimeID);

            document.getElementById("crimeSelectView").value =
                viewCrime.crimeType;
            document.getElementById("CrimeLongitude2").value =
                viewCrime.longitude;
            document.getElementById("CrimeLatitude2").value =
                viewCrime.latitude;
            document.getElementById("CrimeDate2").value = viewCrime.date;
            document.getElementById("CrimeTime2").value = viewCrime.time;

            viewLongitude = viewCrime.longitude;
            viewLatitude = viewCrime.latitude;
            viewModal();
        });
    });
}

// Function to update pagination
function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    // Create pagination links
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.classList.add("page-item");
        const link = document.createElement("a");
        link.classList.add("page-link");
        link.href = "#";
        link.textContent = i;
        if (i === currentPage) {
            li.classList.add("active");
        }
        link.addEventListener("click", () => {
            currentPage = i;
            displayTable(currentPage);
        });
        li.appendChild(link);
        pagination.appendChild(li);
    }

    // Add previous button
    const prevButton = document.createElement("li");
    prevButton.classList.add("page-item");
    if (currentPage === 1) {
        prevButton.classList.add("disabled");
    }
    prevButton.innerHTML = `
    <a class="page-link" href="#" aria-label="Previous">
      <span aria-hidden="true">&laquo;</span>
    </a>
  `;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayTable(currentPage);
        }
    });
    pagination.insertBefore(prevButton, pagination.firstChild);

    // Add next button
    const nextButton = document.createElement("li");
    nextButton.classList.add("page-item");
    if (currentPage === totalPages) {
        nextButton.classList.add("disabled");
    }
    nextButton.innerHTML = `
    <a class="page-link" href="#" aria-label="Next">
      <span aria-hidden="true">&raquo;</span>
    </a>
  `;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayTable(currentPage);
        }
    });
    pagination.appendChild(nextButton);
}

// Event listener for the confirmation button
document.getElementById("confirmDelete").addEventListener("click", () => {
    if (crimeToDelete !== null) {
        crimes.splice(
            crimes.findIndex((crime) => crime.crimeID === crimeToDelete),
            1
        );
        displayTable(currentPage);
        // Reset the variable storing the crime ID after deletion
        const crimeRef = db.ref("crimes/" + crimeToDelete);
        crimeRef
            .remove()
            .then(() => {
                console.log(
                    `Crime with ID ${crimeToDelete} has been deleted successfully.`
                );
            })
            .catch((error) => {
                console.error("Error deleting crime: ", error);
            });
        addLogs(`Delete a crime (${crimeToDelete})`);

        crimeToDelete = null;
        location.reload();
    }
});

// Search functionality
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("keyup", () => {
    displayTable(currentPage);
});

// Toast success
document.getElementById("confirmDelete").onclick = function () {
    var toastElList = [].slice.call(document.querySelectorAll(".toastSuccess"));
    var toastList = toastElList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl);
    });
    document.querySelector(".toast-body").innerHTML =
        "Crime successfully deleted!";
    toastList.forEach((toast) => toast.show());
};

// Toast error
const saveCrimeButtons = document.querySelectorAll(".saveCrime");
saveCrimeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        if (
            document.getElementById("crimeSelect").selectedIndex === 0 ||
            document.getElementById("address").value === "" ||
            document.getElementById("CrimeDate").value === "" ||
            document.getElementById("CrimeTime").value === ""
        ) {
            var toastElList = [].slice.call(
                document.querySelectorAll(".toastError")
            );
            var toastList = toastElList.map(function (toastEl) {
                return new bootstrap.Toast(toastEl);
            });

            document.querySelector(".toast-body-error").innerHTML =
                "Please fill all the fields!";
            toastList.forEach((toast) => toast.show());
        } else {
            var toastElList = [].slice.call(
                document.querySelectorAll(".toastSuccess")
            );
            var toastList = toastElList.map(function (toastEl) {
                return new bootstrap.Toast(toastEl);
            });

            document.querySelector(".toast-body-success").innerHTML =
                "Crime saved!";

            toastList.forEach((toast) => toast.show());
        }
    });
});
var generatedLocationName, generatedLatitude, generatedLongitude;

document.getElementById("addBtn").addEventListener("click", () => {
    // back to default
    document.getElementById("addressContainer").style = "display: none";
    document.getElementById("coordinatesContainer").style = "display: none";
    document.getElementById("crimeSelect").selectedIndex = 0;
    document.getElementById("address").value = "";
    document.getElementById("CrimeDate").value = "";
    document.getElementById("CrimeTime").value = "";
    generatedLocationName = "";
    generatedLatitude = 0;
    generatedLongitude = 0;
    addCrime();
});

function addCrime() {
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "dojo/domReady!",
    ], function (Map, MapView, Graphic) {
        // Create a map and view only once
        var map = new Map({
            basemap: "streets-navigation-vector",
        });

        var view = new MapView({
            container: "map",
            map: map,
            center: [124.643, 8.4812], // Longitude, Latitude of the Philippines
            zoom: 13, // Zoom level (1 = World, 20 = Streets)
        });

        function placePin(longitude, latitude) {
            var point = {
                type: "point",
                longitude: longitude,
                latitude: latitude,
            };

            var requestUrl =
                "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&featureTypes=&location=" +
                encodeURIComponent(longitude + "," + latitude);

            fetch(requestUrl)
                .then((response) => response.json())
                .then((data) => {
                    var locationName =
                        data.address.LongLabel || "Unnamed Location";

                    document.getElementById("addressContainer").style =
                        "display: block";
                    document.getElementById("coordinatesContainer").style =
                        "display: block";
                    document.getElementById("address").value = locationName;

                    var markerSymbol = {
                        type: "picture-marker",
                        url: "https://static.arcgis.com/images/Symbols/Shapes/RedPin1LargeB.png",
                        width: "30px",
                        height: "30px",
                    };

                    var pinGraphic = new Graphic({
                        geometry: point,
                        symbol: markerSymbol,
                        attributes: {
                            Name: locationName,
                        },
                    });

                    view.graphics.removeAll(); // Clear previous graphics
                    view.graphics.add(pinGraphic); // Add new graphic

                    view.goTo({
                        target: pinGraphic,
                        zoom: 15,
                    });

                    document.getElementById("CrimeLongitude").value = longitude;
                    document.getElementById("CrimeLatitude").value = latitude;

                    generatedLocationName = locationName;
                    generatedLatitude = latitude;
                    generatedLongitude = longitude;
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        }

        // Handle map clicks to place a pin
        view.on("click", function (event) {
            placePin(event.mapPoint.longitude, event.mapPoint.latitude);
        });

        document.getElementById("locateBtn").addEventListener("click", () => {
            if (
                !(
                    document.getElementById("CrimeLongitude").value === "" ||
                    document.getElementById("CrimeLatitude").value === ""
                )
            ) {
                placePin(
                    document.getElementById("CrimeLongitude").value,
                    document.getElementById("CrimeLatitude").value
                );
            }
        });
    });
}

document.getElementById("saveCrime").addEventListener("click", () => {
    let crimeDate = document.getElementById("CrimeDate").value;
    let crimeTime = document.getElementById("CrimeTime").value;
    if (
        !(
            document.getElementById("crimeSelect").selectedIndex === 0 ||
            document.getElementById("address").value === "" ||
            crimeDate === "" ||
            crimeTime === ""
        )
    ) {
        let selectedCrime = document.getElementById("crimeSelect").value;
        saveCrimeToDatabase(
            selectedCrime,
            generatedLocationName,
            generatedLatitude,
            generatedLongitude,
            crimeDate,
            crimeTime
        );
    }
});

// Pin Location View modal
function viewModal() {
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "dojo/domReady!",
    ], function (Map, MapView, Graphic) {
        if (viewLongitude !== 0 && viewLatitude !== 0) {
            var map = new Map({
                basemap: "streets-navigation-vector",
            });
            var view = new MapView({
                container: "map2",
                map: map,
                center: [viewLongitude, viewLatitude], // Longitude, Latitude of the Philippines
                zoom: 13, // Zoom level (1 = World, 20 = Streets)
            });

            // Automatically fetch and display address when the map loads
            view.when(() => {
                displayLocation(view.center);
            });

            function displayLocation(center) {
                var requestUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&featureTypes=&location=${encodeURIComponent(
                    center.longitude + "," + center.latitude
                )}`;

                fetch(requestUrl)
                    .then((response) => response.json())
                    .then((data) => {
                        var locationName =
                            data.address.LongLabel || "Unnamed Location";
                        document.getElementById("address2").value =
                            locationName;

                        // Create a marker symbol
                        var markerSymbol = {
                            type: "picture-marker",
                            url: "https://static.arcgis.com/images/Symbols/Shapes/RedPin1LargeB.png",
                            width: "30px",
                            height: "30px",
                        };

                        // Create a graphic for the center
                        var pinGraphic = new Graphic({
                            geometry: center,
                            symbol: markerSymbol,
                            attributes: {
                                Name: locationName,
                            },
                        });

                        view.graphics.removeAll(); // Clear previous graphics
                        view.graphics.add(pinGraphic); // Add new graphic
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });
            }
        }
    });
}

let addCrimeModal = new bootstrap.Modal(
    document.getElementById("addCrimeModal"),
    {
        keyboard: false,
    }
);

function convertTime(time) {
    // Split the input string to extract hours and minutes
    let [hours, minutes] = time.split(":").map(Number);

    // Convert to 12-hour format and determine AM/PM
    let period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert hours to 12-hour format

    // Format hours, minutes, and seconds (assuming 30 seconds for this example)
    let formattedTime = `${hours}:${minutes
        .toString()
        .padStart(2, "0")}:30 ${period}`;

    return formattedTime;
}

// Function to save user details to Realtime Database
function saveCrimeToDatabase(
    crime,
    address,
    latitude,
    longitude,
    crimeDate,
    crimeTime
) {
    // Create a new Date object
    let now = new Date();

    // Format the date and time in a human-readable format
    let dateString = now.toLocaleDateString();
    let timeString = now.toLocaleTimeString();
    let crimeRef = db.ref("crimes");

    let points = 0;

    if (crime === "Murder" || crime === "Homicide" || crime === "Rape" || crime === "Carnapping mv" || crime === "Carnapping mc") {
        points = 2;
    } else if (
        crime === "Physical injury" ||
        crime === "Theft" ||
        crime === "Robbery"
    ) {
        points = 1;
    }
    crimeRef.push({
        crime: crime,
        address: address,
        latitude: latitude,
        longitude: longitude,
        time: convertTime(crimeTime),
        date: crimeDate,
        point: points,
    });
    addCrimeModal.hide();
    addLogs("Add a crime");
    location.reload();
}

function addLogs(type) {
    let logsRef = db.ref("webLogs");
    let now = new Date();
    let dateString = now.toLocaleDateString();
    let timeString = now.toLocaleTimeString();

    logsRef.push({
        type: type,
        time: timeString,
        date: dateString,
        user: userData.name,
        userRole: userData.role,
    });
}
