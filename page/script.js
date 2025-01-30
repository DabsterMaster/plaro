// Constants
const STORAGE_KEY = 'social_media_posts';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// DOM Elements
const elements = {
    postInput: document.getElementById('postInput'),
    postButton: document.getElementById('postButton'),
    fileInput: document.getElementById('fileInput'),
    postsContainer: document.getElementById('postsContainer'),
    imagePreview: document.getElementById('imagePreview'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    themeToggle: document.getElementById('themeToggle'),
    toastContainer: document.getElementById('toastContainer')
};

// State Management
let state = {
    posts: [],
    darkMode: localStorage.getItem('darkMode') === 'true',
    isLoading: false
};

// Theme Management
class ThemeManager {
    static init() {
        if (state.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            elements.themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }

        elements.themeToggle.addEventListener('click', () => {
            state.darkMode = !state.darkMode;
            localStorage.setItem('darkMode', state.darkMode);
            document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
            
            const icon = elements.themeToggle.querySelector('i');
            icon.classList.replace(
                state.darkMode ? 'fa-moon' : 'fa-sun',
                state.darkMode ? 'fa-sun' : 'fa-moon'
            );
        });
    }
}

// Toast Notifications
class ToastManager {
    static show(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Post Management
class PostManager {
    static async loadPosts() {
        try {
            state.isLoading = true;
            elements.loadingSpinner.classList.remove('hidden');
            
            const savedPosts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            state.posts = savedPosts;
            
            await this.renderPosts();
            
            ToastManager.show('Posts loaded successfully');
        } catch (error) {
            console.error('Error loading posts:', error);
            ToastManager.show('Error loading posts', 'error');
        } finally {
            state.isLoading = false;
            elements.loadingSpinner.classList.add('hidden');
        }
    }

    static async savePost(content, image) {
        try {
            const newPost = {
                id: Date.now(),
                content,
                image,
                timestamp: new Date().toISOString(),
                likes: 0,
                comments: [],
                isLiked: false
            };

            state.posts.unshift(newPost);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts));
            
            await this.renderPosts();
            ToastManager.show('Post created successfully');
            
            return true;
        } catch (error) {
            console.error('Error saving post:', error);
            ToastManager.show('Error creating post', 'error');
            return false;
        }
    }

    static async deletePost(postId) {
        try {
            state.posts = state.posts.filter(post => post.id !== postId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts));
            
            await this.renderPosts();
            ToastManager.show('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            ToastManager.show('Error deleting post', 'error');
        }
    }

    static toggleLike(postId) {
        const post = state.posts.find(p => p.id === postId);
        if (post) {
            post.isLiked = !post.isLiked;
            post.likes += post.isLiked ? 1 : -1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts));
            this.renderPosts();
        }
    }

    static async renderPosts() {
        elements.postsContainer.innerHTML = '';
        
        state.posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="/api/placeholder/40/40" alt="User Avatar" class="avatar">
                    <div class="post-author-info">
                        <div class="post-author">John Doe</div>
                        <div class="post-timestamp">${this.formatTimestamp(post.timestamp)}</div>
                    </div>
                </div>
                <div class="post-content">
                    ${post.content}
                    ${post.image ? `
                        <div class="post-media">
                            <img src="${post.image}" alt="Post image">
                        </div>
                    ` : ''}
                </div>
                <div class="post-actions">
                    <div class="action-buttons">
                        <button class="action-btn ${post.isLiked ? 'liked' : ''}" 
                                onclick="PostManager.toggleLike(${post.id})">
                            <i class="fas fa-heart"></i>
                            <span>${post.likes} ${post.likes === 1 ? 'Like' : 'Likes'}</span>
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-comment"></i>
                            <span>${post.comments.length} Comments</span>
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-share"></i>
                            <span>Share</span>
                        </button>
                    </div>
                    <button class="delete-btn" onclick="PostManager.deletePost(${post.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            elements.postsContainer.appendChild(postElement);
        });
    }

    static formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) {
            return `${minutes} minutes ago`;
        } else if (hours < 24) {
            return `${hours} hours ago`;
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// File Handling
class FileHandler {
    static handleFileSelect(event) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            ToastManager.show('Please select an image file', 'error');
            return;
        }
        
        if (file.size > MAX_FILE_SIZE) {
            ToastManager.show('File size should be less than 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.imagePreview.innerHTML = `
                <div class="preview-container">
                    <img src="${e.target.result}" alt="Preview">
                    <button class="remove-preview" onclick="FileHandler.removePreview()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    static removePreview() {
        elements.imagePreview.innerHTML = '';
        elements.fileInput.value = '';
    }
}

// Event Listeners
function initializeEventListeners() {
    elements.postButton.addEventListener('click', async () => {
        const content = elements.postInput.value.trim();
        const imagePreview = elements.imagePreview.querySelector('img');
        const image = imagePreview ? imagePreview.src : null;

        if (!content && !image) {
            ToastManager.show('Please add some content to your post', 'error');
            return;
        }

        const success = await PostManager.savePost(content, image);
        if (success) {
            elements.postInput.value = '';
            FileHandler.removePreview();
        }
    });

    elements.fileInput.addEventListener('change', FileHandler.handleFileSelect);

    // Handle post input auto-resize
    elements.postInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
}

// Initialize Application
async function initializeApp() {
    ThemeManager.init();
    initializeEventListeners();
    await PostManager.loadPosts();
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);
// Add these functions to the existing script.js file

// Profile Picture Management
let profilePicture = localStorage.getItem('profilePicture') || '/api/placeholder/32/32';

function updateProfilePicture(src) {
    profilePicture = src;
    localStorage.setItem('profilePicture', src);
    document.getElementById('profilePic').src = src;
    document.getElementById('homeProfilePic').src = src;
    document.getElementById('profilePicture').src = src;
}

// Profile Page
document.getElementById('profilePicInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            updateProfilePicture(e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

// Settings Form Submission
document.getElementById('settingsForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const name = document.getElementById('profileNameInput').value;
    const bio = document.getElementById('profileBioInput').value;
    localStorage.setItem('profileName', name);
    localStorage.setItem('profileBio', bio);
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileBio').textContent = bio;
    ToastManager.show('Profile updated successfully');
});

// Navigation Between Pages
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function () {
        const page = this.getAttribute('data-page');
        document.querySelectorAll('.feed').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(page).classList.remove('hidden');
    });
});

// Notification Pop-up
document.getElementById('notificationsBtn').addEventListener('click', function () {
    document.getElementById('notificationPopup').classList.remove('hidden');
});

document.getElementById('closeNotificationPopup').addEventListener('click', function () {
    document.getElementById('notificationPopup').classList.add('hidden');
});

// Message Indication Pop-up
document.getElementById('messagesBtn').addEventListener('click', function () {
    document.getElementById('messagePopup').classList.remove('hidden');
});

document.getElementById('closeMessagePopup').addEventListener('click', function () {
    document.getElementById('messagePopup').classList.add('hidden');
});