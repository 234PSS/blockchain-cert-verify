"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("container py-8", className)}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-gradient">{title}</h1>
      {description && (
        <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>
      )}
    </div>
  )
}
