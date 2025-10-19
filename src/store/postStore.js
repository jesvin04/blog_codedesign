import { create } from 'zustand';
import { debounce } from 'lodash'; 

// 1. Function to safely read initial state from localStorage
const getInitialState = () => {
  try {
    const storedPosts = localStorage.getItem('blogPosts');
    return storedPosts ? JSON.parse(storedPosts) : [];
  } catch (error) {
    console.error("Error reading from localStorage", error);
    return [];
  }
};

// 2. Debounced function to write data back to localStorage
const persistState = debounce((posts) => {
  localStorage.setItem('blogPosts', JSON.stringify(posts));
}, 500); // Wait 500ms after the last change before saving

export const usePostStore = create((set) => ({
  posts: getInitialState(),

  // Function to save or update a post
  savePost: (post) => set((state) => {
    const now = new Date().toISOString();
    const existingIndex = state.posts.findIndex(p => p.id === post.id);

    let updatedPosts;
    if (existingIndex > -1) {
      // Update existing post (This logic is correct)
      updatedPosts = state.posts.map((p, index) =>
        index === existingIndex ? (() => {
          const previousSnapshots = p.snapshots || [];
          const newContent = post.content || p.content || '';
          const snapshots = (newContent !== p.content)
            ? [p.content || '', ...previousSnapshots].slice(0, 50)
            : previousSnapshots;
          return { ...p, ...post, updatedAt: now, snapshots };
        })() : p
      );
    } else {
      // --- Create new post ---
      const newPost = { 
        // ✅ THE FIX IS HERE:
        // Spread the incoming post data first...
        ...post, 
        
        // ...then set (or override) the properties.
        // This ensures our new ID is not overwritten by `post.id` (which is null).
        id: Date.now(), 
        title: post.title || "Untitled Post", 
        content: post.content || "", 
        snapshots: post.content ? [post.content] : [],
        updatedAt: now, 
        createdAt: now, 
      };
      updatedPosts = [newPost, ...state.posts]; // Newest post at the top
    }
    
    persistState(updatedPosts);
    return { posts: updatedPosts };
  }),

  // Function to delete a post
  deletePost: (id) => set((state) => {
    const updatedPosts = state.posts.filter(p => p.id !== id);
    persistState(updatedPosts);
    return { posts: updatedPosts };
  }),
}));

