import React, { useState, useEffect } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

// --- MOCK API DATABASE ---
// As requested, here is the mock data you provided.
const MOCK_DB = {
  "bookmarks": [
    {
      "url": "https://tiptap.dev/",
      "title": "Tiptap",
      "description": "The headless editor framework for web artisans.",
      "image": "https://tiptap.dev/favicon-32x32.png",
      "siteName": "Tiptap",
      "id": 1
    },
    {
      "url": "https://react.dev/",
      "title": "React",
      "description": "The library for web and native user interfaces.",
      "image": "https://react.dev/images/og-image.png",
      "siteName": "React"
    }
  ]
};

// --- React Node View Component ---
// This component renders the 3 states: input, loading, and card.
const BookmarkComponent = ({ node, updateAttributes, selected }) => {
    const { url, title, description, image, siteName } = node.attrs;
    const [isLoading, setIsLoading] = useState(false);

    // --- This function simulates fetching metadata ---
    const fetchMetadata = async (fetchUrl) => {
        setIsLoading(true);
        console.log(`Fetching metadata for: ${fetchUrl}`);

        // --- MOCK API CALL ---
        // We simulate a network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // --- REAL MOCK API CALL ---
        try {
            // Replace with your actual my-json-server URL
            const MOCK_API_URL = 'https://my-json-server.typicode.com/YOUR_USERNAME/YOUR_REPO/bookmarks';

            // We query the server for the specific URL
            const response = await fetch(`${MOCK_API_URL}?url=${encodeURIComponent(fetchUrl)}`);

            let dataArray = [];

            if (response.ok) {
                try {
                    dataArray = await response.json(); // my-json-server returns an array
                } catch (jsonErr) {
                    console.warn('Failed to parse JSON from mock API, falling back to local MOCK_DB', jsonErr);
                    dataArray = [];
                }
            } else {
                console.warn('Network response was not ok, falling back to local MOCK_DB', response.status);
                dataArray = [];
            }

            // If nothing from the remote, try the local MOCK_DB
            if (!dataArray || dataArray.length === 0) {
                dataArray = MOCK_DB.bookmarks.filter(b => b.url === fetchUrl);
            }

            if (dataArray.length === 0) {
                // No metadata found anywhere
                updateAttributes({ title: fetchUrl, description: 'Could not fetch metadata.' });
                return;
            }

            const data = dataArray[0]; // Get the first match

            // Update the node's attributes with the fetched data
            updateAttributes({
                title: data.title,
                description: data.description,
                image: data.image,
                siteName: data.siteName,
            });

        } catch (error) {
            console.error('Error fetching bookmark metadata:', error);
            updateAttributes({ title: fetchUrl, description: 'Could not fetch metadata.' });
        } finally {
            setIsLoading(false);
        }
            };

    // --- This runs when the 'url' attribute changes ---
    useEffect(() => {
        // If we have a URL but no title, it means we just pasted it.
        // Let's fetch the data.
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
                    // Set the URL. The useEffect hook will trigger the fetch.
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
    // If we have a URL but are waiting for data
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
    const hostname = siteName || new URL(url).hostname;
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
            siteName: { default: null }, // Added siteName
        };
    },

    // This defines how to Tiptap node is saved (e.g., to your database)
    // We use data-attributes for a clean, robust save format.
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

    // This defines how Tiptap loads the node from saved content
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

    // This links our React component to the Tiptap node
    addNodeView() {
        return ReactNodeViewRenderer(BookmarkComponent);
    },

    // This is what your floating menu button calls
    addCommands() {
        return {
            insertBookmark: () => ({ commands }) => {
                // Insert an empty node. The React component will
                // automatically show the input box.
                return commands.insertContent({
                    type: this.name,
                    attrs: { url: null }, // Start with no URL
                });
            },
        };
    },
});

export default Bookmark;