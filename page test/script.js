// Constants
const STORAGE_KEY = 'social_media_posts';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for videos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const DEBOUNCE_DELAY = 300;

// DOM Elements
const elements = {
    postInput: document.getElementById('postInput'),
    postButton: document.getElementById('postButton'),
    fileInput: document.getElementById('fileInput'),
    videoInput: document.getElementById('videoInput'),
    postsContainer: document.getElementById('postsContainer'),
    mediaPreview: document.getElementById('mediaPreview'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    themeToggle: document.getElementById('themeToggle'),
    toastContainer: document.getElementById('toastContainer'),
    searchInput: document.getElementById('searchInput')
};

// State Management
let state = {
    posts: [],
    darkMode: localStorage.getItem('darkMode') === 'true',
    isLoading: false,
    currentUser: {
        id: 'user123',
        name: 'Current User',
        avatar: '/api/placeholder/40/40'
    }
};

// Utility Functions
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const sanitizeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" 
               aria-hidden="true"></i>
            <span>${sanitizeHTML(message)}</span>
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

    static async savePost(content, media) {
        try {
            const newPost = {
                id: Date.now(),
                content: sanitizeHTML(content),
                media,
                timestamp: new Date().toISOString(),
                likes: 0,
                comments: [],
                isLiked: false,
                author: state.currentUser,
                isEditing: false
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

    static async updatePost(postId, content) {
        try {
            const post = state.posts.find(p => p.id === postId);
            if (post) {
                post.content = sanitizeHTML(content);
                post.isEditing = false;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts));
                await this.renderPosts();
                ToastManager.show('Post updated successfully');
            }
        } catch (error) {
            console.error('Error updating post:', error);
            ToastManager.show('Error updating post', 'error');
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

    static addComment(postId, comment) {
        const post = state.posts.find(p => p.id === postId);
        if (post) {
            post.comments.push({
                id: Date.now(),
                content: sanitizeHTML(comment),
                author: state.currentUser,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts));
            this.renderPosts();
            ToastManager.show('Comment added successfully');
        }
    }

    static toggleEditMode(postId) {
        const post = state.posts.find(p => p.id === postId);
        if (post) {
            post.isEditing = !post.isEditing;
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
                    <img src="${post.author.avatar}" alt="User Avatar" class="avatar">
                    <div class="post-author-info">
                        <div class="post-author">${post.author.name}</div>
                        <div class="post-timestamp">${this.formatTimestamp(post.timestamp)}</div>
                    </div>
                    ${post.author.id === state.currentUser.id ? `
                        <div class="post-actions-dropdown">
                            <button class="action-btn" aria-label="Post actions">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu">
                                <button onclick="PostManager.toggleEditMode(${post.id})" class="dropdown-item">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button onclick="PostManager.deletePost(${post.id})" class="dropdown-item text-danger">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="post-content">
                    ${post.isEditing ? `
                        <div class="edit-post-form">
                            <textarea class="edit-input">${post.content}</textarea>
                            <div class="edit-actions">
                                <button onclick="PostManager.updatePost(${post.id}, this.parentElement.previousElementSibling.value)" 
                                        class="primary-btn">Save</button>
                                <button onclick="PostManager.toggleEditMode(${post.id})" 
                                        class="secondary-btn">Cancel</button>
                            </div>
                        </div>
                    ` : `
                        <p>${post.content}</p>
                        ${post.media ? `
                            <div class="post-media">
                                ${post.media.type.startsWith('image/') ? `
                                    <img src="${post.media.url}" alt="Post image" loading="lazy">
                                ` : `
                                    <video controls>
                                        <source src="${post.media.url}" type="${post.media.type}">
                                        Your browser does not support the video tag.
                                    </video>
                                `}
                            </div>
                        ` : ''}
                    `}
                </div>
                <div class="post-actions">
                    <div class="action-buttons">
                        <button class="action-btn ${post.isLiked ? 'liked' : ''}" 
                                onclick="PostManager.toggleLike(${post.id})"
                                aria-label="${post.isLiked ? 'Unlike post' : 'Like post'}">
                            <i class="fas fa-heart"></i>
                            <span>${post.likes} ${post.likes === 1 ? 'Like' : 'Likes'}</span>
                        </button>
                        <button class="action-btn" 
                                onclick="PostManager.toggleComments(${post.id})"
                                aria-label="Show comments">
                            <i class="fas fa-comment"></i>
                            <span>${post.comments.length} Comments</span>
                        </button>
                        <button class="action-btn share-btn" 
                                onclick="ShareManager.sharePost(${post.id})"
                                aria-label="Share post">
                            <i class="fas fa-share"></i>
                            <span>Share</span>
                        </button>
                    </div>
                </div>
                <div class="comments-section hidden" id="comments-${post.id}">
                    <div class="comments-list">
                        ${post.comments.map(comment => `
                            <div class="comment">
                                <img src="${comment.author.avatar}" alt="Commenter avatar" class="avatar-sm">
                                <div class="comment-content">
                                    <div class="comment-author">${comment.author.name}</div>
                                    <div class="comment-text">${comment.content}</div>
                                    <div class="comment-timestamp">${this.formatTimestamp(comment.timestamp)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="add-comment">
                        <input type="text" placeholder="Write a comment..." 
                               class="comment-input" 
                               aria-label="Write a comment">
                        <button onclick="PostManager.addComment(${post.id}, this.previousElementSibling.value)"
                                class="comment-btn"
                                aria-label="Post comment">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            `;
            
            elements.postsContainer.appendChild(postElement);
        });
    }

    static toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        commentsSection.classList.toggle('hidden');
    }

    static formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (days < 7) {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Media Handler
class MediaHandler {
    static handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
        
        if (!isImage && !isVideo) {
            ToastManager.show('Please select an image or video file', 'error');
            return;
        }
        
        if (file.size > MAX_FILE_SIZE) {
            ToastManager.show('File size should be less than 10MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.mediaPreview.innerHTML = `
                <div class="preview-container">
                    ${isImage ? `
                        <img src="${e.target.result}" alt="Preview">
                    ` : `
                        <video src="${e.target.result}" controls></video>
                    `}
                    <button class="remove-preview" onclick="MediaHandler.removePreview()"
                            aria-label="Remove media">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    static removePreview() {
        elements.mediaPreview.innerHTML = '';
        elements.fileInput.value = '';
        elements.videoInput.value = '';
    }

    static async compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions while maintaining aspect ratio
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 1200;
                    
                    if (width > height && width > maxDimension) {
                        height = (height * maxDimension) / width;
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width = (width * maxDimension) / height;
                        height = maxDimension;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.7);
                };
            };
        });
    }
}

// Share Manager
class ShareManager {
    static async sharePost(postId) {
        const post = state.posts.find(p => p.id === postId);
        if (!post) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check out this post',
                    text: post.content,
                    url: window.location.href
                });
                ToastManager.show('Post shared successfully');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    ToastManager.show('Error sharing post', 'error');
                }
            }
        } else {
            // Fallback copying URL to clipboard
            const dummy = document.createElement('input');
            document.body.appendChild(dummy);
            dummy.value = window.location.href;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            ToastManager.show('Link copied to clipboard');
        }
    }
}

// Search Handler
class SearchHandler {
    static init() {
        elements.searchInput.addEventListener('input', 
            debounce(this.handleSearch, DEBOUNCE_DELAY)
        );
    }

    static handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const posts = document.querySelectorAll('.post');
        
        posts.forEach(post => {
            const content = post.querySelector('.post-content').textContent.toLowerCase();
            const author = post.querySelector('.post-author').textContent.toLowerCase();
            
            if (content.includes(searchTerm) || author.includes(searchTerm)) {
                post.style.display = '';
            } else {
                post.style.display = 'none';
            }
        });
    }
}

// Accessibility Helper
class AccessibilityHelper {
    static init() {
        this.setupKeyboardNavigation();
        this.setupFocusHandling();
    }

    static setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open dropdowns or modals
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    static setupFocusHandling() {
        // Add focus outline for keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }
}

// Event Listeners
function initializeEventListeners() {
    elements.postButton.addEventListener('click', async () => {
        const content = elements.postInput.value.trim();
        const mediaPreview = elements.mediaPreview.querySelector('img, video');
        let media = null;

        if (mediaPreview) {
            media = {
                url: mediaPreview.src,
                type: mediaPreview.tagName.toLowerCase() === 'img' ? 'image/jpeg' : 'video/mp4'
            };
        }

        if (!content && !media) {
            ToastManager.show('Please add some content to your post', 'error');
            return;
        }

        elements.postButton.disabled = true;
        elements.postButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

        const success = await PostManager.savePost(content, media);
        if (success) {
            elements.postInput.value = '';
            MediaHandler.removePreview();
        }

        elements.postButton.disabled = false;
        elements.postButton.innerHTML = '<i class="fas fa-paper-plane"></i> Post';
    });

    elements.fileInput.addEventListener('change', MediaHandler.handleFileSelect);
    elements.videoInput.addEventListener('change', MediaHandler.handleFileSelect);

    // Handle post input auto-resize
    elements.postInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    // Handle dropdown menus
    document.addEventListener('click', (e) => {
        const dropdown = e.target.closest('.post-actions-dropdown');
        if (!dropdown) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
            return;
        }

        const menu = dropdown.querySelector('.dropdown-menu');
        menu.classList.toggle('show');
    });
}

// Initialize Application
async function initializeApp() {
    ThemeManager.init();
    SearchHandler.init();
    AccessibilityHelper.init();
    initializeEventListeners();
    await PostManager.loadPosts();
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);