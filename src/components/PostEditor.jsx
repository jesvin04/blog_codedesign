// ✅ STEP 1: Import all the necessary React hooks
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePostStore } from '../store/postStore';
import { debounce } from 'lodash';

// ✅ STEP 2: Import Tiptap components
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';

// ✅ STEP 3: Import your new extensions and the FloatingBlockMenu
import { FloatingBlockMenu } from '../editor/FloatingBlockMenu';
import { Divider } from '../editor/extensions/Divider';
import { HtmlEmbed } from '../editor/extensions/HtmlEmbed';
import { ImageUpload } from '../editor/extensions/ImageUpload';
import { YoutubeEmbed } from '../editor/extensions/YoutubeEmbed';
import { TwitterEmbed } from '../editor/extensions/TwitterEmbed';
import { Bookmark } from '../editor/extensions/BookMark';

// ✅ STEP 4: Import your CSS files
import './PostEditor.css';
import '../editor/FloatingBlockMenu.css';


function PostEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const savePost = usePostStore((state) => state.savePost);

    const [postTitle, setPostTitle] = useState('');
    const [featuredImage, setFeaturedImage] = useState('');
    const [postContent, setPostContent] = useState('');
    const [currentPostId, setCurrentPostId] = useState(null);
    const [saveStatus, setSaveStatus] = useState('New Post');
    const hasLoaded = useRef(false);
    const [snapshots, setSnapshots] = useState([]); // previous content snapshots for fallback undo/redo
    const snapshotIndex = useRef(0); // number of undos performed into the snapshots
    const originalContentRef = useRef(''); // holds the current post content when loaded

    // --- STATE FOR LINK EDITOR ---
    const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // --- TIPTAP EDITOR INSTANCE ---
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2] },
                codeBlock: false, // Disable default codeBlock
                blockquote: true,
                bulletList: false,
                orderedList: false,
            }),
            Placeholder.configure({
                placeholder: 'Begin writing your post...',
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            
            // ✅ STEP 5: Add all your custom extensions
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

    // Effect: Load post data on mount or ID change
    useEffect(() => {
        if (id) {
            // Prefer reading posts from localStorage so we always load persisted data.
            let allPosts = usePostStore.getState().posts;
            try {
                const stored = localStorage.getItem('blogPosts');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length) {
                        allPosts = parsed;
                    }
                }
            } catch (e) {
                // If parsing fails, fall back to in-memory store
                // eslint-disable-next-line no-console
                console.warn('Failed to parse blogPosts from localStorage, using in-memory store', e);
            }

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
            // Reset for a new post
            setPostTitle('');
            setFeaturedImage('');
            setPostContent('');
            setCurrentPostId(null);
            setSaveStatus('New Post');
        }
        // Use a timeout to prevent auto-save on initial load
        setTimeout(() => { hasLoaded.current = true; }, 300);
    }, [id]);

    // Effect: Update Tiptap editor when postContent state changes from loading
    useEffect(() => {
        if (editor && postContent !== editor.getHTML()) {
            editor.commands.setContent(postContent, false);
            if (editor.commands.clearHistory) {
                try {
                    editor.commands.clearHistory();
                } catch (e) {
                    
                    console.warn('clearHistory command not available', e);
                }
            }
        }
    }, [postContent, editor]);

    // Fallback undo/redo using saved snapshots when TipTap history is empty
    useEffect(() => {
        const onKeyDown = (e) => {
            if (!editor) return;
            const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z';
            const isRedo = (e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'Z') || e.key === 'y');
            if (!isUndo && !isRedo) return;

            const canNativeUndo = editor.can().undo ? editor.can().undo() : false;
            const canNativeRedo = editor.can().redo ? editor.can().redo() : false;

            if (isUndo) {
                if (canNativeUndo) return; // let TipTap handle it
                if (snapshotIndex.current < snapshots.length) {
                    const next = snapshots[snapshotIndex.current];
                    snapshotIndex.current += 1;
                    e.preventDefault();
                    editor.commands.setContent(next || '', false);
                }
            }

            if (isRedo) {
                if (canNativeRedo) return; // let TipTap handle it
                if (snapshotIndex.current > 0) {
                    snapshotIndex.current -= 1;
                    const next = snapshotIndex.current === 0 ? originalContentRef.current : snapshots[snapshotIndex.current - 1];
                    e.preventDefault();
                    editor.commands.setContent(next || '', false);
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [editor, snapshots]);


    // --- AUTO-SAVE LOGIC ---
    const handleAutoSave = (data) => {
        savePost(data);
        if (!currentPostId) {
            // If it's a new post, get its new ID from the store and update URL
            const newId = usePostStore.getState().posts[0]?.id;
            if (newId) {
                navigate(`/edit/${newId}`, { replace: true });
            }
        }
        setSaveStatus('Draft - Saved');
    };

    // Debounced auto-save function
    const debouncedAutoSave = useCallback(debounce(handleAutoSave, 1500), [currentPostId]);

    // Effect: Trigger auto-save when content changes
    useEffect(() => {
        if (hasLoaded.current) {
            if (postTitle || postContent || featuredImage) {
                setSaveStatus('Saving...');
                const postData = { id: currentPostId, title: postTitle, content: postContent, featuredImage };
                debouncedAutoSave(postData);
            }
        }
    }, [postTitle, postContent, featuredImage, debouncedAutoSave, currentPostId]);

    
    // --- EVENT HANDLERS ---

    // Bubble Menu: Link Editor
    const openLinkEditor = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        setLinkUrl(previousUrl || '');
        setIsLinkEditorOpen(true);
    }, [editor]);

    const handleLinkSubmit = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (linkUrl === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
            } else {
                let finalUrl = linkUrl;
                if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('mailto:')) {
                    finalUrl = 'https://' + finalUrl;
                }
                editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
            }
            setIsLinkEditorOpen(false);
            setLinkUrl('');
        }
    };

    // Header: Publish Button
    const handlePublish = () => {
        const postData = { id: currentPostId, title: postTitle || 'Untitled Post', featuredImage, content: postContent };
        savePost(postData);
        navigate('/'); // Go back to post list after publishing
    };

    // Header: Cover Image Upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setFeaturedImage(reader.result); };
            reader.readAsDataURL(file);
        }
    };


    if (!editor) {
        return null; // Don't render until the editor is ready
    }

    return (
        <div className="editor-page-container">
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

                    {/* --- TEXT FORMATTING BUBBLE MENU --- */}
                    <BubbleMenu
                        editor={editor}
                        tippyOptions={{
                            duration: 100,
                            onHide: () => { // Reset state when menu hides
                                setIsLinkEditorOpen(false);
                                setLinkUrl('');
                            },
                        }}
                        className="bubble-menu"
                    >
                        {isLinkEditorOpen ? (
                            <div className="bubble-menu-link-editor">
                                <input
                                    type="text"
                                    className="bubble-menu-link-input"
                                    placeholder="Search or enter URL to link"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    onKeyDown={handleLinkSubmit}
                                    autoFocus
                                />
                                <div className="bubble-menu-link-posts">
                                    <span className="bubble-menu-link-label">LATEST POSTS</span>
                                    <div className="bubble-menu-link-item">
                                        <span>Coming soon</span>
                                        <span>10 Oct 2025</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    className={editor.isActive('bold') ? 'is-active' : ''}
                                >B</button>
                                <button
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    className={editor.isActive('italic') ? 'is-active' : ''}
                                >I</button>
                                <button
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                    className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                                >H</button>
                                <button
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                    className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                                >H</button>
                                <button
                                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                    className={editor.isActive('blockquote') ? 'is-active' : ''}
                                >“ ”</button>
                                <button
                                    onClick={openLinkEditor} // <-- This opens the link editor
                                    className={editor.isActive('link') ? 'is-active' : ''}
                                >🔗</button>
                            </>
                        )}
                    </BubbleMenu>

                    {/* --- BLOCK INSERTION FLOATING MENU --- */}
                    <FloatingBlockMenu editor={editor} />

                    {/* --- THE EDITOR ITSELF --- */}
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}
export default PostEditor;