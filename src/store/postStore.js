import { create } from 'zustand';
import { debounce } from 'lodash';

const getInitialState = () => {

  try {

    const storedPosts = localStorage.getItem('blogPosts');

    return storedPosts ? JSON.parse(storedPosts) : [];

  } catch (error) {

    console.error("Error reading from localStorage", error);

    return [];

  }

};



const persistState = debounce((posts) => {

  localStorage.setItem('blogPosts', JSON.stringify(posts));

}, 500);



export const usePostStore = create((set) => ({

  posts: getInitialState(),



  savePost: (post) => set((state) => {

    const now = new Date().toISOString();

    const existingIndex = state.posts.findIndex(p => p.id === post.id);



    let updatedPosts;

    if (existingIndex > -1) {

      // This logic for updating is correct

      updatedPosts = state.posts.map((p, index) =>

        index === existingIndex ? { ...p, ...post, updatedAt: now } : p

      );

    } else {

      // --- Create New Post ---

      const newPost = {

        // ✅ THE FIX: Spread the incoming post data first...

        ...post,

       

        // ...then set (or override) the properties.

        // This ensures our new ID is not overwritten by `post.id` (which is null).

        id: Date.now(),

        title: post.title || "Untitled Post",

        updatedAt: now,

        createdAt: now,

      };

      updatedPosts = [newPost, ...state.posts];

    }

   

    persistState(updatedPosts);

    return { posts: updatedPosts };

  }),



  deletePost: (id) => set((state) => {

    const updatedPosts = state.posts.filter(p => p.id !== id);

    persistState(updatedPosts);

    return { posts: updatedPosts };

  }),

}));