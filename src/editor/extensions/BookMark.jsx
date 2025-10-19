import React, { useState, useEffect } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

// --- React Node View Component ---
// This component renders the 3 states: input, loading, and card.
const BookmarkComponent = ({ node, updateAttributes, selected }) => {
    const { url, title, description, image, siteName } = node.attrs;
    const [isLoading, setIsLoading] = useState(false);

    // --- This function fetches metadata from the live mock API ---
    const fetchMetadata = async (fetchUrl) => {
        setIsLoading(true);
        console.log(`Fetching metadata for: ${fetchUrl}`);

        try {
            // IMPORTANT: Replace with your actual GitHub username and repo name.
            const MOCK_API_URL = 'https://my-json-server.typicode.com/jesvin04/ghost-editor-api/bookmarks';
            
            const response = await fetch(`${MOCK_API_URL}?url=${encodeURIComponent(fetchUrl)}`);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const dataArray = await response.json();

            if (dataArray.length === 0) {
                throw new Error('No metadata found for this URL in the mock database.');
            }
            
            const data = dataArray[0]; // Get the first match from the response

            // --- SUCCESS ---
            // Update the node's attributes with the fetched data
            updateAttributes({
                title: data.title,
                description: data.description,
                image: data.image,
                siteName: data.siteName,
            });

        } catch (error) {
            // --- FAILURE ---
            console.error('Error fetching bookmark metadata:', error);
            // On failure, just use the URL as the title and show an error description.
            updateAttributes({ title: fetchUrl, description: 'Could not fetch metadata for this URL.' });
        } finally {
            setIsLoading(false);
        }
    };

    // This effect runs when the 'url' attribute changes.
    useEffect(() => {
        // If we have a URL but no title, it means we just pasted it and need to fetch the data.
        if (url && !title) {
            fetchMetadata(url);
        }
    }, [url, title]); // Re-run if url or title changes

    
    // --- STATE 1: Input Mode ---
    // If there is no 'url', show the input box
    if (!url) {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const inputUrl = e.target.value.trim();
                if (inputUrl) {
                    // Set the URL. The useEffect hook will then trigger the fetch.
                    updateAttributes({ url: inputUrl });
                }
            }
        };

        return (
            <NodeViewWrapper className="bookmark-placeholder-wrapper">
                <div className="bookmark-placeholder">
                    <input
                        type="text"
                        placeholder="Paste URL to create bookmark..."
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>
            </NodeViewWrapper>
        );
    }

    // --- STATE 2: Loading Mode ---
    // If we have a URL and the isLoading flag is true
    if (isLoading) {
        return (
            <NodeViewWrapper className="bookmark-loading-wrapper">
                <div className="bookmark-loading">
                    Fetching metadata for: <strong>{url}</strong>
                </div>
            </NodeViewWrapper>
        );
    }

    // --- STATE 3: Rendered Card Mode ---
    // If we have a URL and are not loading
    const hostname = siteName || (url ? new URL(url).hostname : '');
    return (
        <NodeViewWrapper className={`bookmark-card-wrapper ${selected ? 'is-selected' : ''}`}>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="bookmark-card"
            >
                <div className="bookmark-content">
                    <div className="bookmark-title">{title || 'Untitled'}</div>
                    {description && <div className="bookmark-description">{description}</div>}
                    <div className="bookmark-url">{hostname}</div>
                </div>
                {image && <div className="bookmark-image" style={{ backgroundImage: `url(${image})` }}></div>}
            </a>
        </NodeViewWrapper>
    );
};


// --- Tiptap Node Extension ---
export const Bookmark = Node.create({
    name: 'bookmark',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            url: { default: null },
            title: { default: null },
            description: { default: null },
            image: { default: null },
            siteName: { default: null },
        };
    },

    // Defines how the node is saved to your output (e.g., database)
    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-bookmark': 'true',
                'data-url': HTMLAttributes.url,
                'data-title': HTMLAttributes.title,
                'data-description': HTMLAttributes.description,
                'data-image': HTMLAttributes.image,
                'data-site-name': HTMLAttributes.siteName,
            }),
        ];
    },

    // Defines how Tiptap loads the node from saved content
    parseHTML() {
        return [
            {
                tag: 'div[data-bookmark]',
                getAttrs: (dom) => ({
                    url: dom.getAttribute('data-url'),
                    title: dom.getAttribute('data-title'),
                    description: dom.getAttribute('data-description'),
                    image: dom.getAttribute('data-image'),
                    siteName: dom.getAttribute('data-site-name'),
                }),
            },
        ];
    },

    // Links our React component to the Tiptap node
    addNodeView() {
        return ReactNodeViewRenderer(BookmarkComponent);
    },

    // This is what your floating menu button calls
    addCommands() {
        return {
            insertBookmark: () => ({ commands }) => {
                // Insert an empty node. The React component will automatically show the input box.
                return commands.insertContent({
                    type: this.name,
                    attrs: { url: null }, // Start with no URL
                });
            },
        };
    },
});

export default Bookmark;

