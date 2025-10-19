import { Node, mergeAttributes } from '@tiptap/core'

const BookmarkNode = Node.create({
  name: 'bookmark',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      url: { default: '' },
      title: { default: 'Bookmark' },
      description: { default: '' },
      image: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="bookmark"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 'data-type': 'bookmark', class: 'border p-3 rounded-lg bg-gray-100' },
      `
        <a href="${HTMLAttributes.url}" target="_blank" class="font-bold text-blue-600">${HTMLAttributes.title}</a>
        <p>${HTMLAttributes.description}</p>
      `,
    ]
  },
})

export default BookmarkNode
