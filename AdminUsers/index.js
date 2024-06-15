// Retrieve data from sessionStorage
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
        window.location.href = "/Dashboard/index.html ";
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
// Dummy data
// const users = [
//   { name: 'John Doe', email: 'john.doe@gmail.com', username: 'JDoe', password: 'test', code: '1343', time: '10:00 AM', date: '2024-04-13'},
//   { name: 'Jane Smith', email: 'jane.smith@yahoo.com', username: 'JSmith', password: '123456', code: '5678', time: '11:30 AM', date: '2024-04-15'},
//   { name: 'Alice Johnson', email: 'alice.johnson@hotmail.com', username: 'AJ', password: 'password123', code: '9876', time: '02:45 PM', date: '2024-04-14'},
//   { name: 'Bob Anderson', email: 'bob.anderson@example.com', username: 'BAnderson', password: 'qwerty', code: '3210', time: '09:15 AM', date: '2024-04-16'},
//   { name: 'Emily Davis', email: 'emily.davis@gmail.com', username: 'EDavis', password: 'abcdef', code: '7890', time: '08:00 AM', date: '2024-04-18'},
//   { name: 'Michael Wilson', email: 'michael.wilson@gmail.com', username: 'MWilson', password: 'pass123', code: '', time: '03:30 PM', date: '2024-04-17'},
//   { name: 'Sarah Brown', email: 'sarah.brown@example.com', username: 'SBrown', password: 'ilovecoding', code: '', time: '01:00 PM', date: '2024-04-19'},
//   { name: 'David Martinez', email: 'david.martinez@yahoo.com', username: 'DMartinez', password: 'david123', code: '', time: '10:45 AM', date: '2024-04-20'},
//   { name: 'Olivia Miller', email: 'olivia.miller@hotmail.com', username: 'OMiller', password: 'password456', code: '', time: '11:15 AM', date: '2024-04-21'},
//   { name: 'William Taylor', email: 'william.taylor@example.com', username: 'WTaylor', password: 'taylor789', code: '', time: '09:30 AM', date: '2024-04-22'}
// ];

const itemsPerPage = 10;
let currentPage = 1;
let userToDelete = null;
let userToView = null;
let users = [];

function fetchAllCrimes() {
  const usersRef = db.ref("users");

  usersRef.once('value', (snapshot) => {
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        let user = childSnapshot.val();
        if(!(user.name === "Super Admin")){
          users.push({
            userID: childSnapshot.key,
            name: user.name,
            email: user.email,
            badgeNumber: user.badgeNumber,
            status: user.status,
            time: user.time,
            date: user.date
          });
        }
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
fetchAllCrimes();

function displayTable(currentPage) {
    const tableBody = document.getElementById('table-body');
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filteredData = users.filter(user =>
        user.name.toLowerCase().includes(searchInput) ||
        user.email.toLowerCase().includes(searchInput) ||
        user.status.toLowerCase().includes(searchInput)
    );
    // Update the total number of pages based on the filtered data length
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    const slicedData = filteredData.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    slicedData.forEach((user, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="h-30">${user.name}</td>
            <td class="h-30">${user.email}</td>
            <td class="h-30">${user.badgeNumber}</td>
            <td class="h-30">${user.status}</td>
            <td class="h-30">${user.time}</td>
            <td class="h-30">${user.date}</td>
            <td class="h-30">
              <button data-crime-index="${index}" type="button" class="btn btn-info text-white viewRow" data-bs-toggle="modal" data-bs-target="#viewModal"><i class="fa-regular fa-eye"></i></button>
              <button data-crime-index="${index}" type="button" class="btn btn-danger deleteRow" data-bs-toggle="modal" data-bs-target="#deleteConfirmationModal"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    // Update pagination based on the filtered data
    updatePagination(currentPage, totalPages);

    attachViewButtonListeners();
    attachDeleteButtonListeners();
}
displayTable(currentPage);

// Attach Delete Button Listeners to each rows
function attachDeleteButtonListeners() {
  const deleteButtons = document.querySelectorAll('.deleteRow');
  deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
          const row = button.closest('tr');
          const index = button.getAttribute('data-crime-index');
          const userID = users[index].userID;
          const userFullname = users[index].name;
          document.getElementById('userToDelete').textContent = userFullname;
          userToDelete = userID;
      });
  });
}

// Attach view button event listeners
function attachViewButtonListeners() {
  const viewButtons = document.querySelectorAll('.viewRow');
  viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const row = button.closest('tr');
            const user = row.querySelector('td').textContent;
            const selectedUser = users.find(findUser => findUser.name === user);
            document.getElementById('viewUserFullname').value = selectedUser.name;
            document.getElementById('viewUserEmail').value = selectedUser.email;
            document.getElementById('viewUserBadgeNumber').value = selectedUser.badgeNumber;
            userToView = selectedUser.userID;

            if(selectedUser.status === "approved" || selectedUser.status === "disapproved") {
              document.getElementById("disapprovedUser").style = "display: none;";
              document.getElementById("approveUser").style = "display: none;";
            } else {
              document.getElementById("disapprovedUser").style = "display: block;";
              document.getElementById("approveUser").style = "display: block;";
            }
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
  if (userToDelete !== null) {
      // users.splice(users.findIndex(user => user.name === userToDelete), 1);
      // Reset the variable storing the crime ID after deletion
      const userRef = db.ref('users/' + userToDelete);
      userRef.remove()
        .then(() => {
          console.log(`User with ID ${userToDelete} has been deleted successfully.`);
        })
        .catch((error) => {
          console.error("Error deleting user: ", error);
        });
      displayTable(currentPage);
      addLogs(`Delete a Admin User (${userToDelete})`);
      userToDelete = null;
      location.reload();

  }
});

// Event listener for the confirmation approve button
const approveUser = document.getElementById('approveUser');
approveUser.addEventListener('click', () => {
  if (userToView !== null) {
      // users.splice(users.findIndex(user => user.name === userToDelete), 1);
      // Reset the variable storing the crime ID after deletion
      const userRef = db.ref('users/' + userToView);
      userRef.update({ status: 'approved' })
        .then(() => {
          console.log(`User with ID ${userToView} status updated to inactive successfully.`);
        })
        .catch((error) => {
          console.error("Error updating user status: ", error);
        });
      displayTable(currentPage); // Assuming there's a function to refresh the displayed table of users
      addLogs(`Approve Admin User (${userToView})`);
      userToView = null;
      location.reload(); // Optionally, refresh the page to reflect changes (might not always be desired)
  }
});

// Event listener for the confirmation approve button
const disapprovedUser = document.getElementById('disapprovedUser');
disapprovedUser.addEventListener('click', () => {
  if (userToView !== null) {
      const userRef = db.ref('users/' + userToView);
      userRef.update({ status: 'disapproved' })
        .then(() => {
          console.log(`User with ID ${userToView} status updated to inactive successfully.`);
        })
        .catch((error) => {
          console.error("Error updating user status: ", error);
        });
      displayTable(currentPage);
      addLogs(`Disapprove Admin User (${userToView})`);
      userToView = null;
      location.reload();
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
  document.querySelector('.toast-body').innerHTML = 'User successfully deleted!'
  toastList.forEach(toast => toast.show()) 
}

document.querySelectorAll("saveChanges").onclick = function() {
  var toastElList = [].slice.call(document.querySelectorAll('.toast'))
  var toastList = toastElList.map(function(toastEl) {
    return new bootstrap.Toast(toastEl)
  });

  document.querySelector('.toast-body').innerHTML = 'User saved!'

  toastList.forEach(toast => toast.show()) 
}

function addLogs(type){
  let logsRef = db.ref("webLogs");
  let now = new Date();
  let dateString = now.toLocaleDateString();
  let timeString = now.toLocaleTimeString();

  logsRef.push({
    type: type,
    time: timeString,
    date: dateString,
    user: userData.name,
    userRole: userData.role
  })

}









