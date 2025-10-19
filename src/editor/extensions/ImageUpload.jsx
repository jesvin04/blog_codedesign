import React, { useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Image as ImageIcon } from 'lucide-react';

// --- React Node View Component ---
// This component will be rendered inside Tiptap
const ImageUploadComponent = ({ node, updateAttributes, selected }) => {
    const { src, alt } = node.attrs;
    const fileInputRef = useRef(null);

    // This function is called when the user selects a file
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            // In a real app, you would upload the file to a server here.
            // For this demo, we'll use a FileReader to get a local data URL.
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target?.result;
                updateAttributes({ src: imageUrl });
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePlaceholderClick = () => {
        fileInputRef.current?.click();
    };


    // --- STATE 1: Placeholder Mode ---
    // If there is no 'src' attribute, show the placeholder and file input
    if (!src) {
        return (
            <NodeViewWrapper className="image-upload-placeholder-wrapper">
                <div className="image-upload-placeholder" onClick={handlePlaceholderClick}>
                    <ImageIcon size={48} strokeWidth={1.5} />
                    <span>Click to select an Image</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
            </NodeViewWrapper>
        );
    }

    // --- STATE 2: Rendered Image Mode ---
    return (
        <NodeViewWrapper className={`image-upload-rendered-wrapper ${selected ? 'is-selected' : ''}`} data-drag-handle>
            <img src={src} alt={alt} />
            {/* The caption placeholder from your image */}
            <div className="embed-caption">
                Type caption for image (optional)
            </div>
        </NodeViewWrapper>
    );
};


// --- Tiptap Node Extension ---
export const ImageUpload = Node.create({
    name: 'imageUpload',
    group: 'block',
    atom: true,      // Treat as a single, indivisible block
    draggable: true,

    addAttributes() {
        return {
            src: { default: null },
            alt: { default: null },
            title: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'img[src]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(HTMLAttributes)];
    },

    // This links our React component to the Tiptap node
    addNodeView() {
        return ReactNodeViewRenderer(ImageUploadComponent);
    },

    // This command is what your floating menu calls
    addCommands() {
        return {
            uploadImage: () => ({ commands }) => {
                // Insert an empty node. The React component will
                // automatically show the placeholder.
                return commands.insertContent({
                    type: this.name,
                    attrs: { src: null },
                });
            },
        };
    },
});

export default ImageUpload;
