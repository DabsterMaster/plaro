// firebase-post-manager.js

import { getDatabase, ref, set, get, push, remove, update } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

export default class PostManager {
    constructor() {
        this.db = getDatabase();
        this.auth = getAuth();
    }

    async createPost(content, image) {
        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error('User must be logged in to create a post');

            const postRef = ref(this.db, 'posts');
            const newPostRef = push(postRef);

            const post = {
                id: newPostRef.key,
                content,
                image,
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                timestamp: new Date().toISOString(),
                likes: 0,
                comments: [],
                isLiked: false
            };

            await set(newPostRef, post);
            return post;
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }

    async loadPosts() {
        try {
            const postsRef = ref(this.db, 'posts');
            const snapshot = await get(postsRef);
            
            if (!snapshot.exists()) return [];

            const posts = [];
            snapshot.forEach((childSnapshot) => {
                posts.push(childSnapshot.val());
            });

            // Sort posts by timestamp, newest first
            return posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Error loading posts:', error);
            throw error;
        }
    }

    async deletePost(postId) {
        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error('User must be logged in to delete a post');

            const postRef = ref(this.db, `posts/${postId}`);
            const snapshot = await get(postRef);

            if (!snapshot.exists()) throw new Error('Post not found');
            
            const post = snapshot.val();
            if (post.authorId !== user.uid) throw new Error('Unauthorized to delete this post');

            await remove(postRef);
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }

    async toggleLike(postId) {
        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error('User must be logged in to like a post');

            const postRef = ref(this.db, `posts/${postId}`);
            const likesRef = ref(this.db, `postLikes/${postId}/${user.uid}`);

            const [postSnapshot, likesSnapshot] = await Promise.all([
                get(postRef),
                get(likesRef)
            ]);

            if (!postSnapshot.exists()) throw new Error('Post not found');

            const post = postSnapshot.val();
            const hasLiked = likesSnapshot.exists();

            const updates = {};
            if (hasLiked) {
                updates[`posts/${postId}/likes`] = post.likes - 1;
                updates[`postLikes/${postId}/${user.uid}`] = null;
            } else {
                updates[`posts/${postId}/likes`] = post.likes + 1;
                updates[`postLikes/${postId}/${user.uid}`] = true;
            }

            await update(ref(this.db), updates);
            return !hasLiked;
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }

    formatTimestamp(timestamp) {
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