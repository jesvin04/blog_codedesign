import React, { useState } from 'react';
import { usePostStore } from '../store/postStore';
import { Pencil, Trash2, Search, Plus } from 'lucide-react';
import './PostList.css'; 
import { useNavigate } from "react-router-dom";


const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
};

const timeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));

    if (diffInMinutes < 60) {
        return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 24 * 60) {
        const diffInHours = Math.floor(diffInMinutes / 60);
        return `${diffInHours} hours ago`;
    } else {
        return past.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }
};

// ✅ CHANGE #1: Removed the 'onSelectPost' prop from here.
export default function PostList() {
    const { posts, deletePost } = usePostStore();
    // Defensive: make sure posts is an array (localStorage might contain an object by mistake)
    const postsArray = Array.isArray(posts) ? posts : (posts ? Object.values(posts) : []);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredPosts = (postsArray || [])
        .filter(post => {
            const title = (post.title || '').toString().toLowerCase();
            const content = stripHtml(post.content || '').toLowerCase();
            const q = searchTerm.toLowerCase();
            return title.includes(q) || content.includes(q);
        })
        .sort((a, b) => {
            const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return bDate - aDate;
        });

    const PostItem = ({ post }) => {
        const displayTime = post.publishedAt 
            ? new Date(post.publishedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
            : timeAgo(post.updatedAt);
            
        const contentSnippet = stripHtml(post.content || '').substring(0, 100);

        const handleDelete = (e) => {
            e.stopPropagation(); 
            if (window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
                deletePost(post.id);
            }
        };

        return (
            <div
                key={post.id}
                className="post-item"
                onClick={() => navigate(`/edit/${post.id}`)}
            >
                <div className="post-content">
                    <h2 className="post-title">
                        {post.title || 'Untitled Post'}
                    </h2>
                    <p className="post-excerpt">
                        {contentSnippet || 'No content...'}...
                    </p>
                    <div className="post-meta">
                        {post.publishedAt ? (
                            <span className="published">
                                Published <span className="time-value">{displayTime}</span>
                            </span>
                        ) : (
                            <span className="time-value">{displayTime}</span>
                        )}
                    </div>
                </div>
                
                <div className="post-actions">
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/edit/${post.id}`); }}
                        className="edit-btn"
                        title="Edit Post"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="delete-btn"
                        title="Delete Post"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="post-list-container">
            {/* Header */}
            <div className="post-list-header">
                <h1 className="post-list-title">Posts</h1>
            </div>

            {/* Search Input + New Post Button */}
            <div className="search-and-actions">
                <div className="search-container">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search Posts"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                 <button
                    onClick={() => navigate("/new")} // This was already correct
                    className="new-post-btn"
                >
                    <Plus size={18} style={{ marginRight: '0.25rem' }} />
                    New post
                </button>
            </div>

            {/* Post List */}
            <div className="post-list-items">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => <PostItem key={post.id ?? Math.random()} post={post} />)
                ) : (
                    <div className="empty-state">
                        {searchTerm 
                            ? 'No posts match your search.' 
                            : 'You have not created any posts yet.'
                        }
                    </div>
                )}
            </div>
        </div>
    );
}

