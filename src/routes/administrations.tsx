import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card'

export const Route = createFileRoute('/administrations')({
  component: AdministrationsPage,
})

function AdministrationsPage() {
  const admins = useQuery(api.pastAdmin.get)

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8 text-primary">Gestiones Pasadas</h1>
      <p className="text-lg text-muted-foreground mb-10">
        Legado de liderazgo en GenoBit.
      </p>

      {admins === undefined ? (
        <p>Cargando gestiones...</p>
      ) : (
        <div className="space-y-12">
          {admins.map((admin) => (
            <Card key={admin._id} className="overflow-hidden border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <CardDescription className="text-lg font-semibold text-primary mb-1">
                            {admin.period}
                        </CardDescription>
                        <CardTitle className="text-3xl">Presidencia: {admin.presidentName}</CardTitle>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8 mt-4">
                     {admin.imageUrl && (
                        <div className="w-full md:w-1/3 rounded-xl overflow-hidden shadow-md">
                            <img src={admin.imageUrl} alt={`Gestión ${admin.period}`} className="w-full h-auto" />
                        </div>
                    )}
                    <div className="flex-1">
                        {admin.description && (
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold mb-2">Logros destacados</h3>
                                <p className="text-muted-foreground">{admin.description}</p>
                            </div>
                        )}
                        
                        <div>
                            <h3 className="text-xl font-semibold mb-3">Equipo</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {admin.members.map((member, idx) => (
                                    <div key={idx} className="flex flex-col p-3 bg-muted/50 rounded-lg">
                                        <span className="font-medium">{member.name}</span>
                                        <span className="text-sm text-muted-foreground">{member.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
