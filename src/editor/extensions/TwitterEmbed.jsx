import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';

// You'd need a React component to render the tweet embed
const TweetEmbedComponent = ({ node, HTMLAttributes }) => {
    const tweetUrl = node.attrs.url;
    // In a real app, you'd load the Twitter script and replace this div with the actual embed
    return (
        <div {...HTMLAttributes} className="twitter-embed-wrapper">
            {tweetUrl ? (
                <p>Loading Tweet: <a href={tweetUrl} target="_blank" rel="noopener noreferrer">{tweetUrl}</a></p>
            ) : (
                <p>Invalid Tweet URL</p>
            )}
            {/* Real implementation would use something like:
            <blockquote class="twitter-tweet">
                <a href={tweetUrl}></a>
            </blockquote>
            <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
            */}
        </div>
    );
};

export const TwitterEmbed = Node.create({
    name: 'twitterEmbed',
    group: 'block',
    atom: true, // Treat as a single block
    draggable: true,

    addAttributes() {
        return {
            url: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div.twitter-embed-wrapper',
                getAttrs: (dom) => ({
                    url: dom.querySelector('a')?.href,
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TweetEmbedComponent);
    },

    addCommands() {
        return {
            insertTwitterEmbed: () => ({ commands }) => {
                const url = window.prompt('Enter Twitter Tweet URL:');
                if (url) {
                    return commands.insertContent({
                        type: this.name,
                        attrs: { url: url },
                    });
                }
                return false;
            },
        };
    },
});

export default TwitterEmbed;