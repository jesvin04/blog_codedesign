import { Node, mergeAttributes } from '@tiptap/core';

export const Divider = Node.create({
    name: 'divider',
    group: 'block',
    // Allow an empty paragraph after a divider for easier typing
    addKeyboardShortcuts() {
        return {
            'Mod-Shift-Enter': () => this.editor.commands.insertDivider(),
        };
    },
    parseHTML() {
        return [{ tag: 'hr' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['hr', mergeAttributes(HTMLAttributes)];
    },
    addCommands() {
        return {
            insertDivider: () => ({ commands }) => {
                // Insert the hr and then a new paragraph
                return commands.insertContent('<hr><p></p>');
            },
        };
    },
});

export default Divider;