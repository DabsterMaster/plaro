// script.js
import PostManager from './firebase-post-manager.js';

// Constants
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
    darkMode: localStorage.getItem('darkMode') === 'true',
    isLoading: false
};

// Initialize PostManager
const postManager = new PostManager();

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

// Event Listeners
async function initializeEventListeners() {
    elements.postButton.addEventListener('click', async () => {
        const content = elements.postInput.value.trim();
        const imagePreview = elements.imagePreview.querySelector('img');
        const image = imagePreview ? imagePreview.src : null;

        if (!content && !image) {
            ToastManager.show('Please add some content to your post', 'error');
            return;
        }

        try {
            state.isLoading = true;
            elements.loadingSpinner.classList.remove('hidden');
            elements.postButton.disabled = true;

            await postManager.createPost(content, image);
            
            elements.postInput.value = '';
            FileHandler.removePreview();
            ToastManager.show('Post created successfully');
            
            await loadAndRenderPosts();
        } catch (error) {
            ToastManager.show(error.message, 'error');
        } finally {
            state.isLoading = false;
            elements.loadingSpinner.classList.add('hidden');
            elements.postButton.disabled = false;
        }
    });

    elements.fileInput.addEventListener('change', FileHandler.handleFileSelect);

    elements.postInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
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

// Post Rendering
async function loadAndRenderPosts() {
    try {
        state.isLoading = true;
        elements.loadingSpinner.classList.remove('hidden');
        elements.postsContainer.innerHTML = '';

        const posts = await postManager.loadPosts();
        
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="/api/placeholder/40/40" alt="User Avatar" class="avatar">
                    <div class="post-author-info">
                        <div class="post-author">${post.authorName}</div>
                        <div class="post-timestamp">${postManager.formatTimestamp(post.timestamp)}</div>
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
                                onclick="handleLikeClick('${post.id}')">
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
                    <button class="delete-btn" onclick="handleDeleteClick('${post.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            elements.postsContainer.appendChild(postElement);
        });
    } catch (error) {
        ToastManager.show(error.message, 'error');
    } finally {
        state.isLoading = false;
        elements.loadingSpinner.classList.add('hidden');
    }
}

// Handle post actions
async function handleLikeClick(postId) {
    try {
        const isLiked = await postManager.toggleLike(postId);
        await loadAndRenderPosts();
        ToastManager.show(isLiked ? 'Post liked!' : 'Post unliked!');
    } catch (error) {
        ToastManager.show(error.message, 'error');
    }
}

async function handleDeleteClick(postId) {
    try {
        await postManager.deletePost(postId);
        await loadAndRenderPosts();
        ToastManager.show('Post deleted successfully');
    } catch (error) {
        ToastManager.show(error.message, 'error');
    }
}

// Make functions available globally
window.handleLikeClick = handleLikeClick;
window.handleDeleteClick = handleDeleteClick;

// Initialize Application
async function initializeApp() {
    ThemeManager.init();
    await initializeEventListeners();
    await loadAndRenderPosts();
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);