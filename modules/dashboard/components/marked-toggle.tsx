"use client"

import { Button } from "@/components/ui/button"
import { StarIcon } from "lucide-react"
import type React from "react"
import { useState, useEffect, forwardRef } from "react"
import { toast } from "sonner"
import { toggleStarMarked } from "../actions"

interface MarkedToggleButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  markedForRevision: boolean
  id: string
}

export const MarkedToggleButton = forwardRef<HTMLButtonElement, MarkedToggleButtonProps>(
  ({ markedForRevision, id, onClick, className, children, ...props }, ref) => {
    const [isMarked, setIsMarked] = useState(markedForRevision)

    useEffect(() => {
      setIsMarked(markedForRevision)
    }, [markedForRevision])

    const handleToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)

      const newMarkedState = !isMarked
      setIsMarked(newMarkedState)

      try {
        const res = await toggleStarMarked(id, newMarkedState)
        const { success, error } = res

        if (success && newMarkedState) {
          toast.success("Added to Starred Playgrounds")
        } else if (success && !newMarkedState) {
          toast.success("Removed from Starred Playgrounds")
        } else {
          toast.error(error || "Failed to update favorite status")
          setIsMarked(!newMarkedState)
        }
      } catch (error) {
        console.error("Failed to toggle star:", error)
        setIsMarked(!newMarkedState)
      }
    }

    return (
      <Button
        ref={ref}
        variant="ghost"
        className={`flex items-center justify-start w-full px-2 py-1.5 text-sm rounded-md cursor-pointer ${className}`}
        onClick={handleToggle}
        {...props}
      >
        <StarIcon
          size={16}
          className={isMarked ? "text-amber-500 fill-amber-500 mr-2" : "text-gray-400 mr-2"}
        />
        {children || (isMarked ? "Remove Favorite" : "Add to Favorite")}
      </Button>
    )
  },
)

MarkedToggleButton.displayName = "MarkedToggleButton"
