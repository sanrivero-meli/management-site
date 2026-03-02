'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProjectTask, TaskStatus } from '@/types'

export async function getProjectTasks(projectId: string) {
  // #region agent log
  const logEntry1 = {location:'tasks.ts:7',message:'getProjectTasks entry',data:{projectId,hasProjectId:!!projectId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'};
  await fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry1)}).catch(()=>{});
  // #endregion
  const supabase = await createClient()
  // #region agent log
  const logEntry2 = {location:'tasks.ts:10',message:'After createClient',data:{hasSupabase:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'};
  await fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry2)}).catch(()=>{});
  // #endregion
  
  const { data, error } = await supabase
    .from('project_tasks')
    .select(`
      *,
      team_members:owner_id (
        id,
        name
      )
    `)
    .eq('project_id', projectId)
    .order('start_date', { nullsFirst: false })
    .order('created_at')

  // #region agent log
  const logEntry3 = {location:'tasks.ts:23',message:'After query',data:{hasError:!!error,errorMessage:error?.message,dataLength:data?.length||0,hasData:!!data,dataSample:data?.[0]?{id:data[0].id,name:data[0].name}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'};
  await fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry3)}).catch(()=>{});
  // #endregion

  if (error) {
    // #region agent log
    const logEntry4 = {location:'tasks.ts:25',message:'Error detected, throwing',data:{errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'};
    await fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry4)}).catch(()=>{});
    // #endregion
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  const mapped = (data || []).map(task => ({
    ...task,
    owner: task.team_members ? (task.team_members as { id: string; name: string }) : null,
  })) as (ProjectTask & {
    owner: { id: string; name: string } | null
  })[]
  
  // #region agent log
  const logEntry5 = {location:'tasks.ts:33',message:'Before return',data:{mappedLength:mapped.length,firstTaskOwner:mapped[0]?.owner},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'};
  await fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry5)}).catch(()=>{});
  // #endregion

  return mapped
}

export async function createTask(formData: FormData) {
  const supabase = await createClient()

  const projectId = formData.get('project_id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string || null
  const deliverables = formData.get('deliverables') as string || null
  const startDate = formData.get('start_date') as string || null
  const endDate = formData.get('end_date') as string || null
  const rawOwnerId = formData.get('owner_id') as string || null
  const ownerId = rawOwnerId === '__none__' ? null : rawOwnerId
  const status = (formData.get('status') as TaskStatus) || 'Not Started'

  const data = {
    project_id: projectId,
    name,
    description,
    deliverables,
    start_date: startDate || null,
    end_date: endDate || null,
    owner_id: ownerId || null,
    status,
  }

  const { data: task, error } = await supabase
    .from('project_tasks')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { data: task }
}

export async function updateTask(id: string, formData: FormData) {
  const supabase = await createClient()

  const data: Partial<ProjectTask> = {}
  
  const name = formData.get('name')
  const description = formData.get('description')
  const deliverables = formData.get('deliverables')
  const startDate = formData.get('start_date')
  const endDate = formData.get('end_date')
  const ownerId = formData.get('owner_id')
  const status = formData.get('status')

  if (name) data.name = name as string
  if (description !== null) data.description = description as string | null
  if (deliverables !== null) data.deliverables = deliverables as string | null
  if (startDate !== null) data.start_date = startDate as string | null
  if (endDate !== null) data.end_date = endDate as string | null
  if (ownerId !== null) data.owner_id = (ownerId === '__none__' ? null : ownerId) as string | null
  if (status) data.status = status as TaskStatus

  const { data: task, error } = await supabase
    .from('project_tasks')
    .select('project_id')
    .eq('id', id)
    .single()

  if (error) {
    return { error: error.message }
  }

  const { error: updateError } = await supabase
    .from('project_tasks')
    .update(data)
    .eq('id', id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/projects/${task.project_id}`)
  return { success: true }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()

  const { data: task, error: fetchError } = await supabase
    .from('project_tasks')
    .select('project_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${task.project_id}`)
  return { success: true }
}
