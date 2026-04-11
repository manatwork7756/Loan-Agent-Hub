import React, { useRef, useState } from 'react'
import chatService from '../../services/chatService'
import useChatStore from '../../store/useChatStore'

export default function FileUploadButton({ docType, label, onUploaded }) {
  const { loanApplicationId } = useChatStore()
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      await chatService.uploadDocument(loanApplicationId, docType, file)
      setUploaded(true)
      onUploaded?.(docType, file.name)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed, please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading || uploaded}
        className={[
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          uploaded
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100',
          (uploading) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {uploading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Uploading...
          </>
        ) : uploaded ? (
          <><span>✅</span> {label} Uploaded</>
        ) : (
          <><span>📎</span> Upload {label}</>
        )}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
