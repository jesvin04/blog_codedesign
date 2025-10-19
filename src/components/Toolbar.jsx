export default function Toolbar({ editor }) {
  if (!editor) return null

  return (
    <div className="flex gap-2 mb-2">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className="px-2 py-1 border rounded">Bold</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className="px-2 py-1 border rounded">Italic</button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className="px-2 py-1 border rounded">Strike</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="px-2 py-1 border rounded">H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="px-2 py-1 border rounded">H3</button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="px-2 py-1 border rounded">Bullet</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className="px-2 py-1 border rounded">Numbered</button>
    </div>
  )
}
