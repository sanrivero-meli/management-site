'use client'

import { useState, useRef, useEffect } from 'react'
import { SKILL_CATEGORIES, SKILL_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, X } from 'lucide-react'

interface SkillMultiSelectProps {
  label: string
  selectedSkills: string[]
  onSkillsChange: (skills: string[]) => void
  namePrefix: string
}

export function SkillMultiSelect({ label, selectedSkills, onSkillsChange, namePrefix }: SkillMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  function toggleSkill(skill: string) {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter(s => s !== skill))
    } else {
      onSkillsChange([...selectedSkills, skill])
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>
            {selectedSkills.length === 0
              ? 'Select skills...'
              : `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected`}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#B9B9B9' }} />
        </Button>
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-96 overflow-y-auto">
            <div className="p-2 space-y-4">
              {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                <div key={category} className="space-y-2">
                  <Label className="text-sm font-semibold">{category}</Label>
                  <div className="space-y-2 pl-4">
                    {skills.map((skill) => (
                      <label
                        key={skill}
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded"
                      >
                        <Checkbox
                          checked={selectedSkills.includes(skill)}
                          onCheckedChange={() => toggleSkill(skill)}
                        />
                        <span className="text-sm">{SKILL_LABELS[skill]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedSkills.map((skill) => (
            <Badge key={skill} variant="outline" className="flex items-center gap-1">
              {SKILL_LABELS[skill]}
              <button
                type="button"
                onClick={() => toggleSkill(skill)}
                className="ml-1 hover:bg-white/10 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {/* Hidden inputs for form submission */}
      {selectedSkills.map((skill) => (
        <input
          key={skill}
          type="hidden"
          name={`${namePrefix}_${skill}`}
          value="on"
        />
      ))}
    </div>
  )
}
