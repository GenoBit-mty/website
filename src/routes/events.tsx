import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/events')({
  component: EventsPage,
})

function EventsPage() {
  const events = useQuery(api.events.get)

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8 text-primary">Eventos</h1>
      <p className="text-lg text-muted-foreground mb-10">
        Participa en nuestros talleres, conferencias y reuniones.
      </p>

      {events === undefined ? (
        <p>Cargando eventos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event._id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
              {event.imageUrl && (
                 <div className="h-48 overflow-hidden rounded-t-xl">
                  <img 
                    src={event.imageUrl} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    <Badge variant={event.isUpcoming ? "default" : "secondary"}>
                        {event.isUpcoming ? "Próximo" : "Pasado"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{event.date}</span>
                </div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                    📍 {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{event.description}</p>
              </CardContent>
              {event.registrationUrl && event.isUpcoming && (
                  <CardFooter>
                      <Button asChild className="w-full">
                          <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
                              Registrarse
                          </a>
                      </Button>
                  </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
