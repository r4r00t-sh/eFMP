"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      position="top-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        className: "!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800 !shadow-lg",
        style: {
          background: resolvedTheme === 'dark' ? '#18181b' : '#ffffff',
          color: resolvedTheme === 'dark' ? '#fafafa' : '#09090b',
          border: resolvedTheme === 'dark' ? '1px solid #27272a' : '1px solid #e4e4e7',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
