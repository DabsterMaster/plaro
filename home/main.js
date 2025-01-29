import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyARhHT5f6dVpik2NL1IMSjOJQc008trV0g",
    authDomain: "plaro-loginregister.firebaseapp.com",
    projectId: "plaro-loginregister",
    storageBucket: "plaro-loginregister.appspot.com",
    messagingSenderId: "702665391234",
    appId: "1:702665391234:web:4dbf27e57f5eedc258c89b",
    measurementId: "G-9R7763KR8E",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.querySelector(".wrapper");
    const loginLink = document.querySelector(".login-link");
    const registerLink = document.querySelector(".register-link");
    const btnPopup = document.querySelector(".btnLogin-popup");
    const iconClose = document.querySelector(".icon-close");
    const loginForm = document.querySelector(".form-box.login form");
    const registerForm = document.querySelector(".form-box.register form");
    const errorMessage = document.createElement("p");

    // Add error message styling
    errorMessage.style.color = "red";
    errorMessage.style.marginTop = "10px";

    // Navigation toggles
    registerLink.addEventListener("click", () => wrapper.classList.add("active"));
    loginLink.addEventListener("click", () => wrapper.classList.remove("active"));
    btnPopup.addEventListener("click", () => wrapper.classList.add("active-popup"));
    iconClose.addEventListener("click", () => wrapper.classList.remove("active-popup"));

    // Registration form handler
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = this.querySelector('input[name="email"]').value;
        const password = this.querySelector('input[name="password"]').value;
        const username = this.querySelector('input[name="username"]').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                // Write user data to the Realtime Database
                set(ref(db, "users/" + user.uid), {
                    username: username,
                    email: email,
                })
                    .then(() => {
                        errorMessage.textContent = "Registration successful!";
                        errorMessage.style.color = "green";
                        this.appendChild(errorMessage);
                    })
                    .catch((error) => {
                        errorMessage.textContent = `Database write failed: ${error.message}`;
                        this.appendChild(errorMessage);
                    });
            })
            .catch((error) => {
                errorMessage.textContent = `Registration failed: ${error.message}`;
                this.appendChild(errorMessage);
            });
    });

    // Login form handler
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = this.querySelector('input[name="email"]').value;
        const password = this.querySelector('input[name="password"]').value;

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                window.location.href = "./Carlist.html";
            })
            .catch((error) => {
                errorMessage.textContent = `Login failed: ${error.message}`;
                this.appendChild(errorMessage);
            });
    });
});
