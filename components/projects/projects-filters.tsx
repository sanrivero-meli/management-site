'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Search, X, Filter, CheckCircle, Flag, Folder, Users, Tag, UserCircle, ChevronRight, ArrowUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTransition, useMemo, useState, useEffect } from 'react'
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  PROJECT_CATEGORIES,
  PROJECT_SQUADS,
  PROJECT_TAGS,
  PRODUCT_OWNERS,
} from '@/types'
import { getTeamMembers } from '@/app/actions/team'
import type { TeamMember } from '@/types'

type FilterCategory = 'status' | 'priority' | 'category' | 'squad' | 'tags' | 'product_owner' | 'owners'

type SortOption = 'name' | 'status' | 'priority' | 'start_date' | 'end_date' | 'created_at' | 'estimated'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'end_date', label: 'End Date' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'estimated', label: 'Estimated Effort' },
]

interface FilterCategoryConfig {
  key: FilterCategory
  label: string
  icon: React.ComponentType<{ className?: string }>
  options: string[]
  getOptions?: () => Promise<string[]>
}

// Static filter categories configuration
const STATIC_FILTER_CATEGORIES: Omit<FilterCategoryConfig, 'getOptions'>[] = [
  {
    key: 'status',
    label: 'Status',
    icon: CheckCircle,
    options: [...PROJECT_STATUSES],
  },
  {
    key: 'priority',
    label: 'Priority',
    icon: Flag,
    options: [...PROJECT_PRIORITIES],
  },
  {
    key: 'category',
    label: 'Category',
    icon: Folder,
    options: [...PROJECT_CATEGORIES],
  },
  {
    key: 'squad',
    label: 'Squad',
    icon: Users,
    options: [...PROJECT_SQUADS],
  },
  {
    key: 'tags',
    label: 'Tags',
    icon: Tag,
    options: [...PROJECT_TAGS],
  },
  {
    key: 'product_owner',
    label: 'Product',
    icon: UserCircle,
    options: [...PRODUCT_OWNERS],
  },
]

export function ProjectsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory | null>(null)
  const [categorySearch, setCategorySearch] = useState('')
  const [optionSearch, setOptionSearch] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [ownersOptions, setOwnersOptions] = useState<string[]>([])
  
  const searchQuery = searchParams.get('search') || ''
  const sortBy = (searchParams.get('sort') as SortOption) || 'name'
  const order = searchParams.get('order') || 'asc'

  // Fetch team members for Owners filter
  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const members = await getTeamMembers()
        setTeamMembers(members)
        setOwnersOptions(members.map(m => m.id))
      } catch (err) {
        console.error('Failed to load team members:', err)
      }
    }
    loadTeamMembers()
  }, [])

  // Build filter categories with dynamic owners options
  const FILTER_CATEGORIES: FilterCategoryConfig[] = useMemo(() => {
    return [
      ...STATIC_FILTER_CATEGORIES,
      {
        key: 'owners',
        label: 'Owners',
        icon: Users,
        options: ownersOptions,
      },
    ]
  }, [ownersOptions])

  // Parse comma-separated filter values from URL params
  function parseFilterParam(param: string | null): string[] {
    if (!param) return []
    return param.split(',').filter(Boolean)
  }

  const statusFilters = parseFilterParam(searchParams.get('status'))
  const priorityFilters = parseFilterParam(searchParams.get('priority'))
  const categoryFilters = parseFilterParam(searchParams.get('category'))
  const squadFilters = parseFilterParam(searchParams.get('squad'))
  const tagFilters = parseFilterParam(searchParams.get('tags'))
  const productOwnerFilters = parseFilterParam(searchParams.get('product_owner'))
  const ownersFilters = parseFilterParam(searchParams.get('owners'))

  // Get current filter values for a category
  function getFilterValues(category: FilterCategory): string[] {
    switch (category) {
      case 'status':
        return statusFilters
      case 'priority':
        return priorityFilters
      case 'category':
        return categoryFilters
      case 'squad':
        return squadFilters
      case 'tags':
        return tagFilters
      case 'product_owner':
        return productOwnerFilters
      case 'owners':
        return ownersFilters
      default:
        return []
    }
  }

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      statusFilters.length > 0 ||
      priorityFilters.length > 0 ||
      categoryFilters.length > 0 ||
      squadFilters.length > 0 ||
      tagFilters.length > 0 ||
      productOwnerFilters.length > 0 ||
      ownersFilters.length > 0
    )
  }, [statusFilters, priorityFilters, categoryFilters, squadFilters, tagFilters, productOwnerFilters, ownersFilters])

  function updateFilterParam(key: FilterCategory, values: string[]) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (values.length === 0) {
        params.delete(key)
      } else {
        params.set(key, values.join(','))
      }
      router.push(`/projects?${params.toString()}`)
    })
  }

  function handleSearchChange(value: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
      router.push(`/projects?${params.toString()}`)
    })
  }

  function handleSortChange(newSort: SortOption) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      // If clicking the same sort option, toggle order
      if (newSort === sortBy) {
        const newOrder = order === 'asc' ? 'desc' : 'asc'
        params.set('order', newOrder)
      } else {
        // New sort option - default to desc for numeric/date fields, asc for name/status
        const isDescDefault = ['priority', 'start_date', 'end_date', 'created_at', 'estimated'].includes(newSort)
        params.set('sort', newSort)
        params.set('order', isDescDefault ? 'desc' : 'asc')
      }
      
      router.push(`/projects?${params.toString()}`)
    })
  }

  function clearAllFilters() {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('status')
      params.delete('priority')
      params.delete('category')
      params.delete('squad')
      params.delete('tags')
      params.delete('product_owner')
      params.delete('owners')
      router.push(`/projects?${params.toString()}`)
    })
  }

  function removeFilterValue(category: FilterCategory, value: string) {
    const currentValues = getFilterValues(category)
    const newValues = currentValues.filter(v => v !== value)
    updateFilterParam(category, newValues)
  }

  function toggleFilterValue(category: FilterCategory, value: string) {
    const currentValues = getFilterValues(category)
    if (currentValues.includes(value)) {
      updateFilterParam(category, currentValues.filter(v => v !== value))
    } else {
      updateFilterParam(category, [...currentValues, value])
    }
  }

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return FILTER_CATEGORIES
    const searchLower = categorySearch.toLowerCase()
    return FILTER_CATEGORIES.filter(cat => 
      cat.label.toLowerCase().includes(searchLower)
    )
  }, [categorySearch, FILTER_CATEGORIES])

  // Get filtered options for selected category
  const filteredOptions = useMemo(() => {
    if (!selectedCategory) return []
    const category = FILTER_CATEGORIES.find(cat => cat.key === selectedCategory)
    if (!category) return []
    
    let options = category.options
    
    // For owners filter, show team member names but use IDs as values
    if (selectedCategory === 'owners') {
      options = teamMembers.map(m => m.id)
    }
    
    if (!optionSearch) return options
    
    const searchLower = optionSearch.toLowerCase()
    if (selectedCategory === 'owners') {
      // Filter by team member names
      return teamMembers
        .filter(m => m.name.toLowerCase().includes(searchLower))
        .map(m => m.id)
    }
    return options.filter(opt => 
      opt.toLowerCase().includes(searchLower)
    )
  }, [selectedCategory, optionSearch, teamMembers, FILTER_CATEGORIES])

  // Get display label for an option (for owners, show name instead of ID)
  function getOptionLabel(option: string): string {
    if (selectedCategory === 'owners') {
      const member = teamMembers.find(m => m.id === option)
      return member?.name || option
    }
    return option
  }

  // Reset option search when category changes
  function handleCategorySelect(category: FilterCategory) {
    setSelectedCategory(category)
    setOptionSearch('')
  }

  return (
    <div className="flex flex-col space-y-3">
      {/* Filter Button, Search Bar, and Active Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[600px] p-0" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex h-[500px]">
              {/* Left Panel - Categories */}
              <div className="w-[240px] border-r border-border flex flex-col">
                {/* Search filters header */}
                <div className="p-3 border-b border-border">
                  <Input
                    placeholder="Search filters..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                
                {/* Category list */}
                <div className="flex-1 overflow-y-auto">
                  {filteredCategories.map((category) => {
                    const Icon = category.icon
                    const isSelected = selectedCategory === category.key
                    const filterValues = getFilterValues(category.key)
                    const hasActiveFilters = filterValues.length > 0
                    
                    return (
                      <button
                        key={category.key}
                        onClick={() => handleCategorySelect(category.key)}
                        className={`
                          w-full px-3 py-2.5 text-left flex items-center justify-between gap-2
                          hover:bg-white/5 transition-colors
                          ${isSelected ? 'bg-[rgba(67,76,228,0.15)] border-r-2 border-primary' : ''}
                        `}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-foreground truncate">{category.label}</span>
                          {hasActiveFilters && (
                            <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                              {filterValues.length}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 ${isSelected ? 'text-foreground' : ''}`} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Panel - Options */}
              <div className="flex-1 flex flex-col">
                {selectedCategory ? (
                  <>
                    {(() => {
                      const category = FILTER_CATEGORIES.find(cat => cat.key === selectedCategory)
                      if (!category) return null
                      
                      const filterValues = getFilterValues(selectedCategory)
                      
                      return (
                        <>
                          {/* Search options header */}
                          <div className="p-3 border-b border-border">
                            <Input
                              placeholder={`Search ${category.label.toLowerCase()}...`}
                              value={optionSearch}
                              onChange={(e) => setOptionSearch(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          
                          {/* Options list */}
                          <div className="flex-1 overflow-y-auto p-2">
                            {filteredOptions.length === 0 ? (
                              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                No options found
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {filteredOptions.map((option) => {
                                  const isChecked = filterValues.includes(option)
                                  return (
                                    <label
                                      key={option}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => toggleFilterValue(selectedCategory, option)}
                                      />
                                      <span className="text-sm text-foreground flex-1">{getOptionLabel(option)}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          
                          {/* Footer with count */}
                          {filterValues.length > 0 && (
                            <div className="p-3 border-t border-border text-xs text-muted-foreground">
                              {filterValues.length} {filterValues.length === 1 ? 'value' : 'values'} selected
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    Select a filter category to see options
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <>
            {statusFilters.map((value) => (
              <Badge
                key={`status-${value}`}
                variant="secondary"
                className="text-xs flex items-center gap-1 px-2 py-1"
              >
                Status: {value}
                <button
                  onClick={() => removeFilterValue('status', value)}
                  className="ml-1 hover:bg-white/10 rounded-full p-0.5"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {priorityFilters.map((value) => (
              <Badge
                key={`priority-${value}`}
                variant="secondary"
                className="text-xs flex items-center gap-1 px-2 py-1"
              >
                Priority: {value}
                <button
                  onClick={() => removeFilterValue('priority', value)}
                  className="ml-1 hover:bg-white/10 rounded-full p-0.5"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {categoryFilters.map((value) => (
              <Badge
                key={`category-${value}`}
                variant="secondary"
                className="text-xs flex items-center gap-1 px-2 py-1"
              >
                Category: {value}
                <button
                  onClick={() => removeFilterValue('category', value)}
                  className="ml-1 hover:bg-white/10 rounded-full p-0.5"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {squadFilters.map((value) => (
              <Badge
                key={`squad-${value}`}
                variant="secondary"
                className="text-xs flex items-center gap-1 px-2 py-1"
              >
                Squad: {value}
                <button
                  onClick={() => removeFilterValue('squad', value)}
                  className="ml-1 hover:bg-white/10 rounded-full p-0.5"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {tagFilters.map((value) => (
              <Badge
                key={`tags-${value}`}
                variant="secondary"
                className="text-xs flex items-center gap-1 px-2 py-1"
              >
                Tags: {value}
                <button
                  onClick={() => removeFilterValue('tags', value)}
                  className="ml-1 hover:bg-white/10 rounded-full p-0.5"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {productOwnerFilters.map((value) => (
              <Badge
                key={`product_owner-${value}`}
                variant="secondary"
                className="text-xs flex items-center gap-1 px-2 py-1"
              >
                Product: {value}
                <button
                  onClick={() => removeFilterValue('product_owner', value)}
                  className="ml-1 hover:bg-white/10 rounded-full p-0.5"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {ownersFilters.map((value) => {
              const member = teamMembers.find(m => m.id === value)
              const displayName = member?.name || value
              return (
                <Badge
                  key={`owners-${value}`}
                  variant="secondary"
                  className="text-xs flex items-center gap-1 px-2 py-1"
                >
                  Owners: {displayName}
                  <button
                    onClick={() => removeFilterValue('owners', value)}
                    className="ml-1 hover:bg-white/10 rounded-full p-0.5"
                    disabled={isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              disabled={isPending}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          </>
        )}

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={handleSortChange} disabled={isPending}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue>
                {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Name'} {order === 'asc' ? '↑' : '↓'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                  {sortBy === option.value && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {order === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects..."
            defaultValue={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
      </div>
    </div>
  )
}
