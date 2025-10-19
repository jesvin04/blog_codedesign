import React, { useState, useEffect, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { LuCode } from 'react-icons/lu'; // Using lucide-react icon

// --- React Node View Component ---
// This component will be rendered inside Tiptap
const HtmlEmbedComponent = ({ node, updateAttributes, selected }) => {
    // Start in editing mode if the node is new (no code yet)
    const [isEditing, setIsEditing] = useState(!node.attrs.htmlCode);
    const textareaRef = useRef(null);
    const htmlCode = node.attrs.htmlCode || '';

    // Auto-focus the textarea when editing starts
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditing]);

    const handleTextareaChange = (e) => {
        updateAttributes({ htmlCode: e.target.value });
    };

    // When the user clicks out of the textarea, stop editing
    const handleBlur = () => {
        setIsEditing(false);
    };

    // When the user clicks on the rendered embed, start editing
    const handleEditClick = (e) => {
        e.preventDefault();
        setIsEditing(true);
    };

    // STATE 1: Editing Mode (showing a textarea)
    if (isEditing) {
        return (
            <NodeViewWrapper className="html-embed-node-wrapper is-editing">
                <div className="html-embed-editor">
                    <LuCode className="html-embed-icon" />
                    <span>HTML Embed Code</span>
                    <textarea
                        ref={textareaRef}
                        value={htmlCode}
                        onChange={handleTextareaChange}
                        onBlur={handleBlur}
                        placeholder="Paste your HTML embed code here..."
                        rows="6"
                    />
                </div>
            </NodeViewWrapper>
        );
    }

    // STATE 2: Rendering Mode (showing an iframe or placeholder)
    return (
        <NodeViewWrapper className={`html-embed-node-wrapper ${selected ? 'is-selected' : ''}`}>
            {htmlCode ? (
                // If there IS code, render it in a sandboxed iframe
                <div className="html-embed-render-container" onClick={handleEditClick}>
                    <iframe
                        srcDoc={htmlCode} // This safely renders the HTML
                        sandbox="" // Restricts script execution for security
                        frameBorder="0"
                        width="100%"
                        title="HTML Embed"
                        scrolling="no"
                    />
                    <div className="html-embed-click-overlay">Click to edit HTML</div>
                </div>
            ) : (
                // If there is NO code, show a placeholder
                <div className="html-embed-placeholder" onClick={handleEditClick}>
                    <LuCode />
                    <span>Click to add HTML Embed</span>
                </div>
            )}
        </NodeViewWrapper>
    );
};


// --- Tiptap Node Extension ---
// This defines the 'htmlEmbed' node for Tiptap
export const HtmlEmbed = Node.create({
    name: 'htmlEmbed', // This is the new node name
    group: 'block',
    atom: true,      // Treat as a single, indivisible block
    draggable: true,

    addAttributes() {
        return {
            htmlCode: {
                default: null,
            },
        };
    },

    // How the node is saved to Tiptap's output (e.g., to your database)
    // We store the raw code in an inert <template> tag for safety
    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes({ 'data-html-embed': 'true' }),
            ['template', {}, HTMLAttributes.htmlCode || '']
        ];
    },

    // How the node is read from Tiptap's output
    parseHTML() {
        return [
            {
                tag: 'div[data-html-embed]',
                getAttrs: (dom) => {
                    const template = dom.querySelector('template');
                    return { htmlCode: template ? template.innerHTML : '' };
                },
            },
        ];
    },

    // This is the magic that links our React component to the Tiptap node
    addNodeView() {
        return ReactNodeViewRenderer(HtmlEmbedComponent);
    },

    // This command is what gets called from your floating menu
    addCommands() {
        return {
            insertHtmlBlock: () => ({ commands }) => { // Kept the same command name
                return commands.insertContent({
                    type: this.name,
                    attrs: { htmlCode: '' }, // Insert an empty node
                });
            },
        };
    },
});

export default HtmlEmbed;