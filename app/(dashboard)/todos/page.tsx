import { getTodos } from '@/app/actions/todos'
import { TodosPageClient } from '@/components/todos/todos-page-client'

export default async function TodosPage() {
  const todos = await getTodos()

  return <TodosPageClient todos={todos} />
}
