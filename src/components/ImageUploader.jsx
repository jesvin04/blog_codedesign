export default function ImageUploader({ editor }) {
  if (!editor) return null

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result }).run()
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mt-2">
      <input type="file" onChange={handleUpload} className="border p-1 rounded" />
    </div>
  )
}
