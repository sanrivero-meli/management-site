'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Todo, TodoCategory } from '@/types'

export async function getTodos() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch todos: ${error.message}`)
  }

  return (data || []) as Todo[]
}

export async function getCategories() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('todo_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return (data || []) as TodoCategory[]
}

export async function createTodo(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  const title = formData.get('title') as string
  const dueDate = formData.get('due_date') as string | null

  const data = {
    user_id: user.id,
    title,
    description: null,
    completed: false,
    priority: 'medium' as const,
    due_date: dueDate || null,
  }

  const { data: todo, error } = await supabase
    .from('todos')
    .insert(data)
    .select('*')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/todos')
  return { data: todo as Todo }
}

export async function updateTodo(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  const data: Partial<Todo> = {}
  
  const title = formData.get('title')
  const completed = formData.get('completed')
  const dueDate = formData.get('due_date')

  if (title !== null) data.title = title as string
  if (completed !== null) data.completed = completed === 'true' || completed === true
  if (dueDate !== null) data.due_date = dueDate as string | null

  const { error } = await supabase
    .from('todos')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/todos')
  return { success: true }
}

export async function toggleTodoComplete(id: string, completed: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('todos')
    .update({ completed })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/todos')
  return { success: true }
}

export async function deleteTodo(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/todos')
  return { success: true }
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'User not authenticated' }
  }

  const name = formData.get('name') as string
  const color = (formData.get('color') as string) || '#6366f1'

  const { data: category, error } = await supabase
    .from('todo_categories')
    .insert({
      user_id: user.id,
      name,
      color,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/todos')
  return { data: category as TodoCategory }
}
