'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { bulkImportInitiatives } from '@/app/actions/projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, CheckCircle, XCircle } from 'lucide-react'

export default function ImportProjectsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)

  async function handleImport() {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await bulkImportInitiatives()
      
      if (response?.error) {
        setResult({
          success: false,
          message: `Error: ${response.error}`,
        })
      } else {
        setResult({
          success: true,
          message: `Successfully imported ${response.count || 0} initiatives`,
          count: response.count,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Import Initiatives</CardTitle>
          <CardDescription>
            Import all 28 initiatives from the provided data. This will create new projects with their scope, status, dates, and estimated effort.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-informative-muted p-4 text-sm text-informative">
            <p className="font-medium mb-2">What will be imported:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>28 main initiatives</li>
              <li>Project names, scope, and status</li>
              <li>Start and end dates</li>
              <li>Estimated effort (sprints)</li>
            </ul>
          </div>

          {result && (
            <div
              className={`rounded-md p-4 ${
                result.success
                  ? 'bg-positive-muted text-positive'
                  : 'bg-destructive/20 text-destructive'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <p className="font-medium">{result.message}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isLoading ? 'Importing...' : 'Import Initiatives'}
            </Button>
            {result?.success && (
              <Link href="/projects">
                <Button variant="outline">View Projects</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
