import { notFound } from 'next/navigation'
import { getProject } from '@/app/actions/projects'
import { ProjectDetail } from '@/components/projects/project-detail'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  try {
    const project = await getProject(id)
    return <ProjectDetail project={project} />
  } catch (error) {
    notFound()
  }
}
