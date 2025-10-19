import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePostStore } from '../store/postStore';
import { debounce } from 'lodash';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { FloatingBlockMenu } from '../editor/FloatingBlockMenu';
import { Divider } from '../editor/extensions/Divider';
import { HtmlEmbed } from '../editor/extensions/HtmlEmbed';
import { ImageUpload } from '../editor/extensions/ImageUpload';
import { YoutubeEmbed } from '../editor/extensions/YoutubeEmbed';
import { TwitterEmbed } from '../editor/extensions/TwitterEmbed';
import { Bookmark } from '../editor/extensions/BookMark';

// CSS Imports
import './PostEditor.css';
import '../editor/FloatingBlockMenu.css';


function PostEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const savePost = usePostStore((state) => state.savePost);

    // State for the post data
    const [postTitle, setPostTitle] = useState('');
    const [featuredImage, setFeaturedImage] = useState('');
    const [postContent, setPostContent] = useState('');
    const [currentPostId, setCurrentPostId] = useState(null);
    const [saveStatus, setSaveStatus] = useState('New Post');
    const hasLoaded = useRef(false);

    // State for your custom snapshot/undo feature
    const [snapshots, setSnapshots] = useState([]);
    const snapshotIndex = useRef(0);
    const originalContentRef = useRef('');

    // State for the link editor bubble menu
    const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // --- TIPTAP EDITOR INSTANCE ---
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2] },
                codeBlock: false,
                blockquote: true,
                bulletList: false,
                orderedList: false,
                // Add history: false if you are fully relying on your snapshot system
                // history: false,
            }),
            Placeholder.configure({ placeholder: 'Begin writing your post...' }),
            Link.configure({ openOnClick: false, autolink: true }),
            Divider,
            HtmlEmbed,
            ImageUpload,
            YoutubeEmbed,
            TwitterEmbed,
            Bookmark,
        ],
        content: postContent,
        onUpdate: ({ editor }) => {
            setPostContent(editor.getHTML());
        },
    });

    // Effect: Load post data from the store when the component mounts or the URL `id` changes.
    useEffect(() => {
        if (id) {
            // The Zustand store is our single source of truth.
            const allPosts = usePostStore.getState().posts;
            const numericId = parseInt(id, 10);
            const existingPost = allPosts.find((p) => p.id === numericId);
            
            if (existingPost) {
                setPostTitle(existingPost.title);
                setFeaturedImage(existingPost.featuredImage || '');
                const content = existingPost.content || '';
                setPostContent(content);
                setSnapshots(existingPost.snapshots || []);
                originalContentRef.current = content;
                snapshotIndex.current = 0;
                setCurrentPostId(numericId);
                setSaveStatus('Draft - Saved');
            }
        } else {
            // Reset all fields for a new post
            setPostTitle('');
            setFeaturedImage('');
            setPostContent('');
            setSnapshots([]);
            setCurrentPostId(null);
            setSaveStatus('New Post');
        }
        setTimeout(() => { hasLoaded.current = true; }, 300);
    }, [id]); // This is the key: it re-runs when the URL changes.

    // Effect: Syncs the React state `postContent` to the Tiptap editor instance.
    useEffect(() => {
        if (editor && postContent !== editor.getHTML()) {
            editor.commands.setContent(postContent, false);
        }
    }, [postContent, editor]);

    // Your custom undo/redo logic (no changes needed here)
    useEffect(() => {
        const onKeyDown = (e) => {
            if (!editor) return;
            const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z';
            const isRedo = (e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'Z') || e.key === 'y');
            if (!isUndo && !isRedo) return;

            if (isUndo && editor.can().undo()) return; // Let Tiptap handle if it can
            if (isRedo && editor.can().redo()) return; // Let Tiptap handle if it can
            
            // Fallback to your snapshot system
            if (isUndo && snapshotIndex.current < snapshots.length) {
                const next = snapshots[snapshotIndex.current];
                snapshotIndex.current += 1;
                e.preventDefault();
                editor.commands.setContent(next || '', false);
            }
            if (isRedo && snapshotIndex.current > 0) {
                snapshotIndex.current -= 1;
                const next = snapshotIndex.current === 0 ? originalContentRef.current : snapshots[snapshotIndex.current - 1];
                e.preventDefault();
                editor.commands.setContent(next || '', false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [editor, snapshots]);


    // --- AUTO-SAVE LOGIC ---
    const handleAutoSave = (data) => {
        savePost(data);

        // ✅ ✅ ✅ THE FIX FOR THE MULTIPLE POST BUG ✅ ✅ ✅
        if (!currentPostId) {
            // If this was a new post, we need to get its new ID from the store.
            // We assume the newest post is the first one in the array.
            const newId = usePostStore.getState().posts[0]?.id;
            
            if (newId) {
                // Now we update the URL to `/edit/:newId`.
                // This is crucial because it will cause the `useEffect` hook above
                // to re-run, which will then set `currentPostId` to the new ID.
                navigate(`/edit/${newId}`, { replace: true });
            }
        }
        
        setSaveStatus('Draft - Saved');
    };

    const debouncedAutoSave = useCallback(debounce(handleAutoSave, 1500), [currentPostId]);

    useEffect(() => {
        if (hasLoaded.current) {
            if (postTitle || postContent || featuredImage) {
                setSaveStatus('Saving...');
                const postData = { id: currentPostId, title: postTitle, content: postContent, featuredImage };
                debouncedAutoSave(postData);
            }
        }
    }, [postTitle, postContent, featuredImage, debouncedAutoSave, currentPostId]);
    

    // --- All other handlers and JSX ---
    // (No changes needed below this line)
    
    const openLinkEditor = useCallback(() => { /* ... */ }, [editor]);
    const handleLinkSubmit = (e) => { /* ... */ };
    const handlePublish = () => { /* ... */ };
    const handleImageUpload = (e) => { /* ... */ };

    if (!editor) { return null; }

    return (
        <div className="editor-page-container">
            {/* ... Header JSX ... */}
            <div className="editor-header">
                <div className="header-left">
                    <button className="back-button" onClick={() => navigate('/')}>&lt; Posts</button>
                    <span className="save-status">{saveStatus}</span>
                </div>
                <div className="header-right">
                    <button className="preview-button">Preview</button>
                    <button className="publish-button" onClick={handlePublish}>Publish</button>
                </div>
            </div>

            <div className="editor-content-area">
                {/* ... Cover Image JSX ... */}
                <div className="cover-image-section">
                    {featuredImage ? (
                        <img src={featuredImage} alt="Cover" className="post-cover-image" />
                    ) : (
                        <label className="upload-cover-area">
                            <span className="upload-icon">☁️</span> Click to upload post cover
                            <span className="upload-specs">SVG, PNG, JPG or GIF (MAX. 800x400px)</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                    )}
                </div>

                <div className="writing-body-wrapper">
                    <input
                        type="text"
                        className="post-title-input"
                        placeholder="Post title"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                    />

                    {/* ... BubbleMenu and FloatingBlockMenu JSX ... */}
                    <BubbleMenu
                        editor={editor}
                        tippyOptions={{ duration: 100, onHide: () => { setIsLinkEditorOpen(false); setLinkUrl(''); } }}
                        className="bubble-menu"
                    >
                        {isLinkEditorOpen ? (
                           <div className="bubble-menu-link-editor">
                               <input type="text" className="bubble-menu-link-input" placeholder="Search or enter URL to link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={handleLinkSubmit} autoFocus />
                               <div className="bubble-menu-link-posts"><span className="bubble-menu-link-label">LATEST POSTS</span><div className="bubble-menu-link-item"><span>Coming soon</span><span>10 Oct 2025</span></div></div>
                           </div>
                        ) : (
                            <>
                                <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>B</button>
                                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>I</button>
                                <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>H</button>
                                <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H</button>
                                <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>“ ”</button>
                                <button onClick={openLinkEditor} className={editor.isActive('link') ? 'is-active' : ''}>🔗</button>
                            </>
                        )}
                    </BubbleMenu>

                    <FloatingBlockMenu editor={editor} />
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}

export default PostEditor;

