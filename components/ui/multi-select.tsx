'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, X } from 'lucide-react'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  disabled?: boolean
  label?: string
}

export function MultiSelect({ 
  options, 
  selected, 
  onChange, 
  placeholder = 'Select...',
  disabled = false,
  label,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useRef(`multiselect-list-${Math.random().toString(36).slice(2, 9)}`).current

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus the active option when navigating with keyboard
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      const item = items[activeIndex] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen, activeIndex])

  const toggleOption = useCallback(function toggleOption(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }, [selected, onChange])

  function removeOption(value: string, e: React.MouseEvent) {
    e.stopPropagation()
    onChange(selected.filter(v => v !== value))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setActiveIndex(0)
        } else {
          setActiveIndex(prev => Math.min(prev + 1, options.length - 1))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setActiveIndex(prev => Math.max(prev - 1, 0))
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setActiveIndex(0)
        } else if (activeIndex >= 0 && activeIndex < options.length) {
          toggleOption(options[activeIndex].value)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        triggerRef.current?.focus()
        break
      case 'Home':
        if (isOpen) {
          e.preventDefault()
          setActiveIndex(0)
        }
        break
      case 'End':
        if (isOpen) {
          e.preventDefault()
          setActiveIndex(options.length - 1)
        }
        break
      case 'Tab':
        if (isOpen) {
          setIsOpen(false)
          setActiveIndex(-1)
        }
        break
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listId : undefined}
        aria-label={label || placeholder}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
        className="w-full justify-between font-normal"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <span className="truncate text-left text-[rgba(115,115,115,1)]">
          {selected.length === 0
            ? placeholder
            : `${selected.length} selected`}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#B9B9B9' }} />
      </Button>
      {isOpen && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={label || placeholder}
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="p-2 space-y-1">
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={selected.includes(option.value)}
                tabIndex={-1}
                className={`flex items-center gap-2 cursor-pointer p-2 rounded ${
                  activeIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
                onClick={() => toggleOption(option.value)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggleOption(option.value)}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <span className="text-sm">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map((value) => {
            const option = options.find(o => o.value === value)
            return (
              <Badge key={value} variant="secondary" className="flex items-center gap-1 text-xs">
                {option?.label || value}
                <button
                  type="button"
                  onClick={(e) => removeOption(value, e)}
                  className="ml-0.5 hover:bg-white/10 rounded-full p-0.5"
                  disabled={disabled}
                  aria-label={`Remove ${option?.label || value}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
