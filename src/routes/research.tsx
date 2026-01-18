import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/research')({
  component: ResearchPage,
})

function ResearchPage() {
  const papers = useQuery(api.research.get)

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8 text-primary">Investigaciones</h1>
      <p className="text-lg text-muted-foreground mb-10">
        Nuestra contribución a la ciencia y bioinformática.
      </p>

      {papers === undefined ? (
        <p>Cargando investigaciones...</p>
      ) : (
        <div className="space-y-6">
          {papers.map((paper) => (
            <Card key={paper._id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-6 p-6">
                {paper.imageUrl && (
                    <div className="w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                        <img src={paper.imageUrl} alt={paper.title} className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex-grow">
                     <div className="flex flex-wrap gap-2 mb-2">
                        {paper.tags?.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{paper.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Por: {paper.authors.join(", ")} • {paper.publicationDate}
                    </p>
                    <p className="mb-4 text-muted-foreground">
                        {paper.description}
                    </p>
                    {paper.url && (
                        <Button variant="outline" asChild>
                            <a href={paper.url} target="_blank" rel="noopener noreferrer">
                                Leer publicación complete ↗
                            </a>
                        </Button>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
