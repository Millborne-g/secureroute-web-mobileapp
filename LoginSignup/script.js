// Retrieve data from sessionStorage
let userData = {}
function retrieveData() {
    userData = JSON.parse(localStorage.getItem('userInfo'));
    if(userData){
        window.location.href = "/Dashboard/index.html"; 
    }
}
retrieveData();

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

// Function to handle sign up
function submitSignUpForm(event) {
    event.preventDefault();
    var newName = document.getElementById("newName").value;
    var newEmail = document.getElementById("newEmail").value;
    var newBadgeNumber = document.getElementById("newBadgeNumber").value;
    var newPassword = document.getElementById("newPassword").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return; // Exit function if passwords don't match
    }

    // Create user with email and password using Firebase Authentication
    auth.createUserWithEmailAndPassword(newEmail, newPassword)
        .then((userCredential) => {
            // Signed up successfully
            var user = userCredential.user;

            // Now you can update user profile with name
            user.updateProfile({
                displayName: newName,
                password: newPassword
            }).then(() => {
                // Profile updated successfully
                console.log("Profile updated successfully for user:", user);

                // // Show modal on successful registration
                // var modal = document.getElementById("myModal");
                // modal.style.display = "block";

                // Save user details to Realtime Database
                saveUserToDatabase(newName, newEmail, newBadgeNumber, newPassword);
                document.getElementById("newName").value = "";
                document.getElementById("newEmail").value = "";
                document.getElementById("newBadgeNumber").value = "";
                document.getElementById("newPassword").value = "";
                document.getElementById("confirmPassword").value = "";
                // setTimeout(function() {
                //     location.reload();
                // }, 2000); 
            }).catch((error) => {
                // Handle profile update errors
                console.error("Error updating profile:", error);
            });
            showSuccessPopup();
        })
        .catch((error) => {
            // Handle errors here
            var errorCode = error.code;
            var errorMessage = error.message;
            console.error("Sign up error:", errorMessage);
            alert(errorMessage);
            // You can display error message to the user or handle it in any other way
        });
}

// Function to save user details to Realtime Database
function saveUserToDatabase(name, email, badgeNumber, password) {
    // Format the date and time in a human-readable format
    let now = new Date();
    let dateString = now.toLocaleDateString();
    let timeString = now.toLocaleTimeString();

    var userRef = db.ref("users");
    userRef.push({
        name: name,
        email: email,
        badgeNumber: badgeNumber,
        password: password,
        status: "pending",
        time: timeString,
        date: dateString,
        role: "admin"
    });
}

function showSuccessPopup() {
    var popup = document.getElementById('successPopup');
    if (popup) { // Check if the element exists
        popup.style.display = 'block';
    } else {
        console.error("Error: Popup element not found");
    }
}

// Function to close the success popup
function closeSuccessPopup() {
    var popup = document.getElementById('successPopup');
    popup.style.display = 'none';
}


// Function to toggle password visibility
function togglePasswordVisibility() {
    var passwordInput = document.getElementById('password');
    var passwordToggle = document.querySelector('.password-toggle');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggle.classList.remove('bi-eye');
        passwordToggle.classList.add('bi-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordToggle.classList.remove('bi-eye-slash');
        passwordToggle.classList.add('bi-eye');
    }
}

// Function to toggle password visibility for signup form
function togglePasswordVisibility(inputId, toggleId) {
    var passwordInput = document.getElementById(inputId);
    var passwordToggle = document.getElementById(toggleId);

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggle.classList.remove('bi-eye');
        passwordToggle.classList.add('bi-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordToggle.classList.remove('bi-eye-slash');
        passwordToggle.classList.add('bi-eye');
    }
}

// Function to handle forgot password
function toggleForgotPassword() {
    var loginForm = document.getElementById("loginForm");
    var forgotPasswordForm = document.getElementById("ForgotPasswordForm");
    var signupForm = document.getElementById("signupForm");
    var signupText = document.getElementById("signupText");

    if (loginForm.style.display !== "none") {
        loginForm.style.display = "none";
        forgotPasswordForm.style.display = "block";
        signupForm.style.display = "none";
        signupText.style.display = "none";
    } else {
        loginForm.style.display = "block";
        forgotPasswordForm.style.display = "none";
        signupForm.style.display = "none";
        signupText.style.display = "block";
    }
}

// Function to handle forgot password form submission
function submitForgotPasswordForm() {
    var userEmail = document.getElementById("forgot-email").value;

    // Regular expression pattern for email validation
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if the email provided is valid
    if (!emailPattern.test(userEmail)) {
        // Display an error message for invalid email format
        alert("Please enter a valid email address.");
        return; // Exit the function early if the email is not valid
    }

    // Check if the provided email exists in Firebase Authentication
    auth.fetchSignInMethodsForEmail(userEmail)
        .then((signInMethods) => {
            // Check if any sign-in methods are associated with the email
            if (signInMethods.length === 0) {
                // Email address not found in Firebase Authentication
                alert("Email address not found. Please enter a registered email address.");
            } else {
                // Send a password reset email to the user's email address
                return auth.sendPasswordResetEmail(userEmail);
            }
        })
        .then(() => {
            // Password reset email sent successfully
            console.log("Password reset email sent to", userEmail);
            // Display a success message to the user
            alert("Password reset email sent. Please check your inbox.");
        })
        .catch((error) => {
            // Handle errors that occurred while sending the password reset email
            var errorMessage = error.message;
            console.error("Error sending password reset email:", errorMessage);
            // Display a generic error message
            alert("An error occurred while sending the password reset email. Please try again later.");
        });
}


// Function to toggle login form
function toggleLogin() {
    var loginForm = document.getElementById("loginForm");
    var signupForm = document.getElementById("signupForm");
    var forgotPasswordForm = document.getElementById("ForgotPasswordForm");
    var signupText = document.getElementById("signupText");

    loginForm.style.display = "block";
    signupForm.style.display = "none";
    forgotPasswordForm.style.display = "none";
    signupText.style.display = "block";
    closeSuccessPopup()
}

function toggleSignUp() {
    var loginForm = document.getElementById("loginForm");
    var signupForm = document.getElementById("signupForm");
    var signupText = document.getElementById("signupText");

    if (loginForm.style.display === "none") {
        loginForm.style.display = "block";
        signupForm.style.display = "none";
        signupText.style.display = "block";
    } else {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
        signupText.style.display = "none";
    }      
    closeSuccessPopup();
}

// Function to handle successful login and display the loading screen
function handleSuccessfulLogin() {
    // Hide the login form or any other content related to login
    var formContainer = document.querySelector(".form-container");
    if (loginForm) {
        formContainer.style.display = "none";
    }

    // Show the loading screen
    var loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
        loadingScreen.style.display = "block";
    }
    window.location.href = "/Dashboard/index.html"; 
    // setTimeout(function() {
    //     window.location.href = "/Dashboard/index.html"; 
    // }, 3000); // Change 3000 to the desired delay in milliseconds
}

function submitForm(event) {
    event.preventDefault();
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    document.querySelector(".warning").style = "display: none";

    if(email && password){
        firebase.auth().signInWithEmailAndPassword(email.toString(), password.toString())
            .then((userCredential) => {
                // Log success or navigate
                console.log("Logged in with UID:", userCredential.user.uid);
                var user = userCredential.user;
                fetchData(user)
            })
            .catch((error) => {
                document.querySelector(".warning").style = "display: flex";
            });
    }
}


function fetchData(user) {
    const usersRef = db.ref("users");

    usersRef.once('value', (snapshot) => {
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        let userDB = childSnapshot.val();
        if(user.email === userDB.email){
            localStorage.setItem('userInfo', JSON.stringify({ name: userDB.name, email: userDB.email, role: userDB.role, status: userDB.status}));
        }
      });
      handleSuccessfulLogin();
    } else {
      console.log("No users data available");
    }
  }, (error) => {
    console.error("Error fetching data: ", error);
  });
}


