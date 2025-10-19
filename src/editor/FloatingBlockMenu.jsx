import React, { useState } from 'react';
import { FloatingMenu } from '@tiptap/react';
import { 
    LuImage, 
    LuCode, 
    LuMinus, 
    LuBookmark, 
    LuYoutube, 
    LuTwitter 
} from 'react-icons/lu';

import './FloatingBlockMenu.css'; 

// NOTE: shouldShow moved into the component so it can read isMenuOpen

export const FloatingBlockMenu = ({ editor }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // This helper checks the editor selection AND the local open state.
    // If `isMenuOpen` is true we force the floating menu to be visible so
    // the '+' button can open it regardless of the selection position.
    const shouldShow = ({ editor }) => {
        if (isMenuOpen) return true;
        const { $from } = editor.state.selection;
        const node = $from.node($from.depth);
        return node.isTextblock && node.content.size === 0;
    };

    if (!editor) {
        return null;
    }

    return (
        <FloatingMenu 
            editor={editor} 
            shouldShow={shouldShow} 
            tippyOptions={{ 
                duration: 100, 
                placement: 'left-start',
                // Keep the floating menu in the DOM flow (don't append to body)
                // so positioning and styles remain predictable.
                interactive: true,
                hideOnClick: false,
                onHide: () => setIsMenuOpen(false),
            }}
            className="floating-menu-container"
        >
            <div className="floating-menu-layout">
            
                {/* PART 1: The '+' button */}
                <button
                    className="floating-menu-plus-button"
                    // Use onClick so Tippy/FloatingMenu can properly position
                    onClick={(e) => {
                        // log and toggle
                        console.log('FloatingBlockMenu + clicked. before toggle:', isMenuOpen);
                        setIsMenuOpen(prev => !prev);
                    }}
                >
                    +
                </button>

                {/* PART 2: The options menu 
                  ✅ CRITICAL FIX #2: Add the dynamic CSS classes
                  This connects your 'isMenuOpen' state to your CSS
                */}
                <div className={`floating-menu-options ${isMenuOpen ? 'is-open' : 'is-closed'}`}>
                    <button
                        onClick={() => editor.chain().focus().uploadImage().run()}
                        className="floating-menu-button"
                    >
                        <LuImage /> <span>Photo</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().insertHtmlBlock().run()}
                        className="floating-menu-button"
                    >
                        <LuCode /> <span>HTML</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().insertDivider().run()}
                        className="floating-menu-button"
                    >
                        <LuMinus /> <span>Divider</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().insertBookmark().run()}
                        className="floating-menu-button"
                    >
                        <LuBookmark /> <span>Bookmark</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().insertYoutube().run()}
                        className="floating-menu-button"
                    >
                        <LuYoutube /> <span>Youtube</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().insertTwitterEmbed().run()}
                        className="floating-menu-button"
                    >
                        <LuTwitter /> <span>Twitter</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().uploadImage().run()}
                        className="floating-menu-button"
                    >
                        <LuImage /> <span>Unsplash</span>
                    </button>
                </div>
            </div>
        </FloatingMenu>
    );
};

export default FloatingBlockMenu;