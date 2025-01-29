// auth-handler.js

import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

export class AuthHandler {
    constructor() {
        this.auth = getAuth();
        this.db = getDatabase();
        this.setupAuthListener();
    }

    setupAuthListener() {
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                // User is signed in
                this.getUserData(user.uid).then(userData => {
                    if (window.location.pathname.includes('main.html')) {
                        // Already on main page, just update UI
                        this.updateMainPageUI(userData);
                    } else {
                        // Redirect to main page
                        window.location.href = 'index.html';
                    }
                });
            } else {
                // User is signed out
                if (!window.location.pathname.includes('main.html')) {
                    // Already on login page, do nothing
                    return;
                }
                window.location.href = 'main.html';
            }
        });
    }

    async getUserData(uid) {
        const userRef = ref(this.db, `users/${uid}`);
        const snapshot = await get(userRef);
        return snapshot.val();
    }

    updateMainPageUI(userData) {
        // Update user info in the UI
        const userMenu = document.querySelector('.user-menu img');
        const userNameElements = document.querySelectorAll('.post-author');
        
        if (userData.username) {
            userNameElements.forEach(el => {
                el.textContent = userData.username;
            });
        }
        
        // Add logout functionality
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'menu-item';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Logout</span>';
        logoutBtn.addEventListener('click', () => this.handleLogout());
        
        const sidebarNav = document.querySelector('.sidebar-nav');
        sidebarNav.appendChild(logoutBtn);
    }

    async handleLogout() {
        try {
            await signOut(this.auth);
            window.location.href = 'main.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }
}