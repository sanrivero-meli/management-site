'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { TodoList } from '@/components/todos/todo-list'
import { createTodo } from '@/app/actions/todos'
import { announce } from '@/lib/utils'
import type { Todo } from '@/types'

interface TodosPageClientProps {
  todos: Todo[]
}

export function TodosPageClient({ todos }: TodosPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    if (!title.trim()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set('title', title.trim())

      const result = await createTodo(formData)
      
      if (!result?.error) {
        announce('Task added')
        // Clear input
        setTitle('')
        // Refresh the list
        router.refresh()
        // Refocus the input
        setTimeout(() => {
          titleInputRef.current?.focus()
        }, 0)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Todos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your tasks and due dates
        </p>
      </div>

      {/* Inline Creation Row */}
      <div className="border-b border-border pb-3 mb-2">
        <Input
          ref={titleInputRef}
          type="text"
          placeholder="+ Add a task..."
          aria-label="Add a new task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className="border-0 shadow-none px-2 focus-visible:ring-1 focus-visible:ring-primary/20"
        />
      </div>

      {todos.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No todos yet. Add a task above to get started.</p>
      ) : (
        <TodoList todos={todos} />
      )}
    </div>
  )
}
