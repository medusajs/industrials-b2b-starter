import { useRef, useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Label, Text, clx } from "@medusajs/ui"
import { ArrowDownTray, XMark, CheckCircleSolid } from "@medusajs/icons"
import { sdk } from "../lib/client"

type ImageUploadProps = {
  label?: string
  value?: string | null
  onChange: (url: string | null) => void
  optional?: boolean
  error?: string
}

export const ImageUpload = ({
  label = "Image",
  value,
  onChange,
  optional = true,
  error,
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  // Reset success indicator when value changes externally
  useEffect(() => {
    if (!value) {
      setShowSuccess(false)
      setUploadedFileName(null)
    }
  }, [value])

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const response = await sdk.admin.upload.create({ files })
      return response
    },
  })

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !files.length) {
      return
    }

    const file = files[0]
    setUploadedFileName(file.name)
    
    uploadMutation.mutate([file], {
      onSuccess: (data) => {
        if (data.files && data.files.length > 0) {
          const uploadedUrl = data.files[0].url
          onChange(uploadedUrl)
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        }
      },
      onError: () => {
        setUploadedFileName(null)
      },
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleRemove = () => {
    onChange(null)
    setUploadedFileName(null)
    setShowSuccess(false)
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-x-1">
        <Label size="small" weight="plus">
          {label}
        </Label>
        {optional && (
          <Text size="small" className="text-ui-fg-muted">
            (Optional)
          </Text>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {value ? (
        <div className="relative group">
          <div className="border border-ui-border-base rounded-lg overflow-hidden bg-ui-bg-subtle">
            <img
              src={value}
              alt="Uploaded"
              className="w-full h-32 object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-md bg-ui-bg-base border border-ui-border-base shadow-sm hover:bg-ui-bg-base-hover transition-colors"
          >
            <XMark className="w-4 h-4 text-ui-fg-subtle" />
          </button>
          {showSuccess && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-x-2 px-3 py-2 bg-ui-tag-green-bg border border-ui-tag-green-border rounded-md">
              <CheckCircleSolid className="w-4 h-4 text-ui-tag-green-icon" />
              <Text size="small" className="text-ui-tag-green-text">
                {uploadedFileName ? `"${uploadedFileName}" uploaded successfully` : "Image added successfully"}
              </Text>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={clx(
            "flex flex-col items-center justify-center gap-y-2 py-8 px-4",
            "border border-dashed border-ui-border-strong rounded-lg",
            "cursor-pointer transition-colors",
            "hover:bg-ui-bg-base-hover",
            isDragging && "bg-ui-bg-base-hover border-ui-border-interactive",
            uploadMutation.isPending && "opacity-50 pointer-events-none"
          )}
        >
          <div className="flex items-center gap-x-2 text-ui-fg-subtle">
            <ArrowDownTray className="w-5 h-5" />
            <Text size="small" weight="plus">
              {uploadMutation.isPending ? "Uploading..." : "Upload image"}
            </Text>
          </div>
          <Text size="small" className="text-ui-fg-muted">
            Drag and drop an image here or click to upload
          </Text>
        </div>
      )}

      {uploadMutation.isError && (
        <span className="text-ui-fg-error text-small">Failed to upload image. Please try again.</span>
      )}

      {error && (
        <span className="text-ui-fg-error text-small">{error}</span>
      )}
    </div>
  )
}
