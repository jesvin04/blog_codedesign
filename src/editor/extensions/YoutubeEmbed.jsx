import React from 'react';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import Youtube from '@tiptap/extension-youtube'; // <-- Removed getYoutubeEmbedUrl

//
// ✅ NEW HELPER FUNCTION ADDED HERE
// This function does the same job as the one we removed
//
const getEmbedUrlFromSrc = (src) => {
  if (!src) return null;

  // Regex to find the video ID from various YouTube URL formats
  const videoIdMatch = src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  
  if (videoIdMatch && videoIdMatch[1]) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
  }

  // Check if it's already an embed URL (less common but good to check)
  const embedMatch = src.match(/youtube\.com\/embed\/([^"&?\/\s]{11})/);
  if (embedMatch && embedMatch[1]) {
    return src;
  }
  
  return null; // Return null if no valid ID is found
};


// --- React Node View Component ---
const YoutubeEmbedComponent = ({ node, updateAttributes, selected }) => {
    const { src, width, height } = node.attrs;

    // --- STATE 1: Input Mode ---
    if (!src) {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const url = e.target.value.trim();
                if (url) {
                    updateAttributes({ src: url });
                }
            }
        };

        return (
            <NodeViewWrapper className="youtube-embed-placeholder-wrapper">
                <div className="youtube-embed-placeholder">
                    <input
                        type="text"
                        placeholder="Paste URL to add embedded content..."
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>
            </NodeViewWrapper>
        );
    }

    // --- STATE 2: Rendered Mode ---
    
    // ✅ USE OUR NEW HELPER FUNCTION
    const embedUrl = getEmbedUrlFromSrc(src);

    // --- NEW: Handle invalid URLs ---
    if (!embedUrl) {
         return (
            <NodeViewWrapper className="youtube-embed-placeholder-wrapper is-error">
                <div className="youtube-embed-placeholder">
                  Invalid YouTube URL. Please remove and try again.
                </div>
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper className={`youtube-embed-rendered-wrapper ${selected ? 'is-selected' : ''}`}>
            <div className="youtube-video-wrapper">
                <iframe
                    src={embedUrl}
                    width={width}
                    height={height}
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>
            <div className="embed-caption">
                Type caption for embed (optional)
            </div>
        </NodeViewWrapper>
    );
};


// --- Tiptap Node Extension ---
export const YoutubeEmbed = Youtube.extend({
    name: 'youtube', 

    addNodeView() {
        return ReactNodeViewRenderer(YoutubeEmbedComponent);
    },

    addCommands() {
        return {
            insertYoutube: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        src: null, 
                        width: options?.width || 640,
                        height: options?.height || 480,
                    },
                });
            },
            setYoutubeVideo: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});

export default YoutubeEmbed;