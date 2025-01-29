import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { AuthHandler } from './auth-handler.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyARhHT5f6dVpik2NL1IMSjOJQc008trV0g",
    authDomain: "plaro-loginregister.firebaseapp.com",
    projectId: "plaro-loginregister",
    storageBucket: "plaro-loginregister.appspot.com",
    messagingSenderId: "702665391234",
    appId: "1:702665391234:web:4dbf27e57f5eedc258c89b",
    measurementId: "G-9R7763KR8E",
    databaseURL: "https://plaro-loginregister-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Initialize auth handler
const authHandler = new AuthHandler();

document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.querySelector(".wrapper");
    const loginLink = document.querySelector(".login-link");
    const registerLink = document.querySelector(".register-link");
    const btnPopup = document.querySelector(".btnLogin-popup");
    const iconClose = document.querySelector(".icon-close");
    const loginForm = document.querySelector(".form-box.login form");
    const registerForm = document.querySelector(".form-box.register form");

    // Navigation toggles
    if (registerLink) registerLink.addEventListener("click", () => wrapper.classList.add("active"));
    if (loginLink) loginLink.addEventListener("click", () => wrapper.classList.remove("active"));
    if (btnPopup) btnPopup.addEventListener("click", () => wrapper.classList.add("active-popup"));
    if (iconClose) iconClose.addEventListener("click", () => wrapper.classList.remove("active-popup"));

    // Registration form handler
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input[name="email"]').value;
            const password = e.target.querySelector('input[name="password"]').value;
            const username = e.target.querySelector('input[name="username"]').value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Store additional user data
                await set(ref(db, `users/${user.uid}`), {
                    username: username,
                    email: email,
                    createdAt: new Date().toISOString()
                });

                window.location.href = 'index.html';
            } catch (error) {
                showError(registerForm, error.message);
            }
        });
    }

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input[name="email"]').value;
            const password = e.target.querySelector('input[name="password"]').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'index.html';
            } catch (error) {
                showError(loginForm, error.message);
            }
        });
    }
});

function showError(form, message) {
    const errorDiv = form.querySelector('.error-message') || document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.marginTop = '10px';
    errorDiv.textContent = message;
    
    if (!form.querySelector('.error-message')) {
        form.appendChild(errorDiv);
    }
}