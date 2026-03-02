'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Trash2, CalendarIcon, X } from 'lucide-react'
import { deleteTodo, toggleTodoComplete, updateTodo } from '@/app/actions/todos'
import { announce } from '@/lib/utils'
import type { Todo } from '@/types'
import { format } from 'date-fns'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return due < today && !todo.completed
  }

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this todo?')) {
      startTransition(async () => {
        await deleteTodo(todo.id)
        announce('Task deleted')
        router.refresh()
      })
    }
  }

  async function handleToggleComplete(checked: boolean) {
    startTransition(async () => {
      await toggleTodoComplete(todo.id, checked)
      announce(checked ? 'Task completed' : 'Task marked incomplete')
      router.refresh()
    })
  }

  async function handleDateChange(date: Date | undefined) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('due_date', date ? format(date, 'yyyy-MM-dd') : '')
      
      await updateTodo(todo.id, formData)
      router.refresh()
      setIsDatePickerOpen(false)
    })
  }

  async function handleClearDate() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('due_date', '')
      
      await updateTodo(todo.id, formData)
      router.refresh()
      setIsDatePickerOpen(false)
    })
  }

  return (
    <div className="group flex items-center gap-3 px-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
      {/* Checkbox */}
      <Checkbox
        checked={todo.completed}
        onCheckedChange={handleToggleComplete}
        disabled={isPending}
        className="shrink-0"
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />

      {/* Task Title */}
      <div className={`flex-1 min-w-0 text-sm ${
        todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'
      }`}>
        {todo.title}
      </div>

      {/* Due Date - Clickable, hover only */}
      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            aria-label={todo.due_date ? `Change due date, currently ${format(new Date(todo.due_date), 'MMM d')}` : 'Set due date'}
            className={`shrink-0 text-xs text-muted-foreground hover:text-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-opacity flex items-center gap-1 h-6 w-fit ${
              isDatePickerOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
          >
            {todo.due_date ? (
              <>
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(todo.due_date), 'MMM d')}
              </>
            ) : (
              <CalendarIcon className="h-3 w-3" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={todo.due_date ? new Date(todo.due_date) : undefined}
              onSelect={handleDateChange}
              initialFocus
            />
            {todo.due_date && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearDate}
                disabled={isPending}
                className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear date
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete Icon - hover only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Delete todo"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-opacity"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
