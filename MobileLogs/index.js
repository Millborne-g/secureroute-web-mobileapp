let userData = {}
function retrieveData() {
    userData = JSON.parse(localStorage.getItem('userInfo'));
    if(!userData){
        window.location.href = "/LoginSignup/index.html"; 
    }
    if(userData.role === "superadmin"){
        document.getElementById("crimes").style = "display: none";
        document.getElementById("routeSuggestion").style = "display: none";
    } else if (userData.role === "admin") {
        document.getElementById("adminUsers").style = "display: none";
        document.getElementById("adminLogs").style = "display: none";
    }

    if(userData.role === "admin"){
        if(userData.status === 'pending' || userData.status === 'disapproved'){

            let myModal = new bootstrap.Modal(document.getElementById('noButtonModal'), {
                keyboard: false,
                backdrop: 'static'
            });
        
            // Show the modal
            myModal.show();

            setTimeout(function() {
                myModal.hide();
                localStorage.removeItem('userInfo');

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

document.querySelector(".logout").addEventListener('click', () => {
  localStorage.removeItem('userInfo');
  window.location.href = "/LoginSignup/index.html"; 
});

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_4AIr2IjdMWl815G95z3rx8HM3eaur9k",
  authDomain: "crime-hotspot-ustp-cpe.firebaseapp.com",
  databaseURL: "https://crime-hotspot-ustp-cpe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crime-hotspot-ustp-cpe",
  storageBucket: "crime-hotspot-ustp-cpe.appspot.com",
  messagingSenderId: "1093769132537",
  appId: "1:1093769132537:web:de4a2d38b20d3ac0a5a528"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); 
const db = firebase.database(); 


// Sidebar
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("sidebarCollapse").addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("active");
        document.getElementById("content").classList.toggle("sidebarActive");
        document.getElementById("sidebarActiveBg").classList.toggle("active");
    });
});
  

// Function to handle screen width change
function handleScreenWidthChange() {
    var screenWidth = window.innerWidth;
    if(screenWidth < 1400){
        document.getElementById("sidebar").classList.add("active");
        document.getElementById("sidebarActiveBg").classList.remove("active");
    } else {
        document.getElementById("content").classList.add("sidebarActive");
        document.getElementById("sidebar").classList.remove("active");
    }
}
handleScreenWidthChange();
window.addEventListener('resize', handleScreenWidthChange);

// table
let logs = [];

const itemsPerPage = 10;
let currentPage = 1;
let logToDelete = null;

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}
function formatDate(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fetchMyLogs() {
  const logsRef = db.ref("logs");

  logsRef.once('value', (snapshot) => {
    if (snapshot.exists()) {
      let tempLogsDB = [];
      snapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;  // Get the unique Firebase key
        let logsDB = childSnapshot.val();
        Object.keys(logsDB).forEach(key => {
          // Get the object associated with each key
          const logsInfo = logsDB[key];
          const date = new Date(logsInfo.timestamp);
          logs.push({
            id: key,
            logType: logsInfo.status,
            time: formatTime(date),
            date: formatDate(date)
          }
          );
        });
        
      });
      document.getElementById("emptyMessage").style = "display: none;"
      displayTable(currentPage);
    } else {
      console.log("No crime data available");
      document.getElementById("tableContainer").style = "display: none;"
      document.getElementById("emptyMessage").style = "display: flex;"
    }
    document.querySelector(".loader").style = "display: none;"

  }, (error) => {
    console.error("Error fetching data: ", error);
  });
}

fetchMyLogs();

function displayTable(currentPage) {
    const tableBody = document.getElementById('table-body');
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filteredData = logs.filter(log =>
        log.id.toString().includes(searchInput) ||
        log.logType.toLowerCase().includes(searchInput) ||
        log.time.toLowerCase().includes(searchInput) ||
        log.date.toLowerCase().includes(searchInput)
    );
    // Update the total number of pages based on the filtered data length
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    const slicedData = filteredData.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    slicedData.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="h-30">${log.id}</td>
            <td class="h-30">${log.logType}</td>
            <td class="h-30">${log.time}</td>
            <td class="h-30">${log.date}</td>
        `;
        tableBody.appendChild(row);
    });
    // Update pagination based on the filtered data
    updatePagination(currentPage, totalPages);

    attachDeleteButtonListeners();
}
displayTable(currentPage);

// Attach Delete Button Listeners to each rows
function attachDeleteButtonListeners() {
  const deleteButtons = document.querySelectorAll('.deleteRow');
  deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
          const row = button.closest('tr');
          const log = row.querySelector('td').textContent;
          document.getElementById('logToDelete').textContent = log;
          logToDelete = log;
      });
  });
}

// Function to update pagination
function updatePagination(currentPage, totalPages) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  
  // Create pagination links
  for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement('li');
      li.classList.add('page-item');
      const link = document.createElement('a');
      link.classList.add('page-link');
      link.href = '#';
      link.textContent = i;
      if (i === currentPage) {
          li.classList.add('active');
      }
      link.addEventListener('click', () => {
          currentPage = i;
          displayTable(currentPage);
      });
      li.appendChild(link);
      pagination.appendChild(li);
  }
  
  // Add previous button
  const prevButton = document.createElement('li');
  prevButton.classList.add('page-item');
  if (currentPage === 1) {
    prevButton.classList.add('disabled');
  }
  prevButton.innerHTML = `
    <a class="page-link" href="#" aria-label="Previous">
      <span aria-hidden="true">&laquo;</span>
    </a>
  `;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayTable(currentPage);
    }
  });
  pagination.insertBefore(prevButton, pagination.firstChild);
  
  // Add next button
  const nextButton = document.createElement('li');
  nextButton.classList.add('page-item');
  if (currentPage === totalPages) {
    nextButton.classList.add('disabled');
  }
  nextButton.innerHTML = `
    <a class="page-link" href="#" aria-label="Next">
      <span aria-hidden="true">&raquo;</span>
    </a>
  `;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayTable(currentPage);
    }
  });
  pagination.appendChild(nextButton);
}

// Event listener for the confirmation button

const confirmDelete = document.getElementById('confirmDelete');
confirmDelete.addEventListener('click', () => {
  if (logToDelete !== null) {
      logs.splice(logs.findIndex(log => log.id.toString() === logToDelete), 1);
      displayTable(currentPage);
      logToDelete = null;
  }
});

// Search functionality
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('keyup', () => {
    displayTable(currentPage);
});

// Toast
document.getElementById("confirmDelete").onclick = function() {
  var toastElList = [].slice.call(document.querySelectorAll('.toast'))
  var toastList = toastElList.map(function(toastEl) {
    return new bootstrap.Toast(toastEl)
  })
  toastList.forEach(toast => toast.show()) 
}





