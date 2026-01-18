import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export const Route = createFileRoute('/team')({
  component: TeamPage,
})

function TeamPage() {
  const teamMembers = useQuery(api.team.get)

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8 text-primary">Conoce al equipo</h1>
      <p className="text-lg text-muted-foreground mb-10">
        El equipo apasionado detrás de GenoBit.
      </p>

      {teamMembers === undefined ? (
        <p>Cargando equipo...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <Card key={member._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {member.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={member.imageUrl} 
                    alt={member.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{member.name}</CardTitle>
                <CardDescription className="text-primary font-medium">{member.role}</CardDescription>
              </CardHeader>
              <CardContent>
                {member.bio && <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>}
                <div className="flex gap-2 text-sm">
                    {member.email && (
                        <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                            Email
                        </a>
                    )}
                    {member.linkedinUrl && (
                        <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            LinkedIn
                        </a>
                    )}
                     {member.githubUrl && (
                        <a href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            GitHub
                        </a>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
