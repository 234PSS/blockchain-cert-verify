"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface CertificateUploaderProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  accept?: Record<string, string[]>
}

export function CertificateUploader({
  onFilesSelected,
  maxFiles = 10,
  accept = {
    "application/pdf": [".pdf"],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
  },
}: CertificateUploaderProps) {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback(
    (accepted: File[]) => {
      const newFiles = [...files, ...accepted].slice(0, maxFiles)
      setFiles(newFiles)
      onFilesSelected(newFiles)
    },
    [files, maxFiles, onFilesSelected]
  )

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ scale: isDragActive ? 1.1 : 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Upload className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-semibold">
              {isDragActive ? "Drop files here" : "Drag & drop certificates"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, PNG, or JPG up to 10MB each
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
              >
                <File className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <button
                  onClick={() => removeFile(i)}
                  className="p-1 rounded-md hover:bg-background opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
