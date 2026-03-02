"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  defaultValue?: string
  onChange?: (date: string) => void
  name?: string
  id?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  defaultValue,
  onChange,
  name,
  id,
  required,
  disabled,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : defaultValue ? new Date(defaultValue) : undefined
  )
  const [open, setOpen] = React.useState(false)
  const hiddenInputRef = React.useRef<HTMLInputElement>(null)

  // Update date when value prop changes
  React.useEffect(() => {
    if (value) {
      setDate(new Date(value))
    } else if (defaultValue) {
      setDate(new Date(defaultValue))
    } else {
      setDate(undefined)
    }
  }, [value, defaultValue])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      // Format as YYYY-MM-DD for form submission
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = formattedDate
      }
      if (onChange) {
        onChange(formattedDate)
      }
      setOpen(false)
    } else {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = ""
      }
      if (onChange) {
        onChange("")
      }
    }
  }

  // Hidden input for form submission
  const hiddenInputValue = date ? format(date, "yyyy-MM-dd") : ""

  // Sync hidden input value with date state
  React.useEffect(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = hiddenInputValue
    }
  }, [hiddenInputValue])

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "flex items-center justify-start text-left",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">
              {date ? format(date, "PPP") : <span className="text-muted-foreground">{placeholder}</span>}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {/* Hidden input for form submission */}
      <input
        ref={hiddenInputRef}
        type="hidden"
        name={name}
        id={id}
        defaultValue={hiddenInputValue}
        required={required}
      />
    </div>
  )
}
