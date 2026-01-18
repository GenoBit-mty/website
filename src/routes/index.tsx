import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center space-y-8 bg-gradient-to-b from-background to-muted/20">
        <h1 className="text-6xl font-bold tracking-tight text-primary">
          GenoBit
        </h1>
        <p className="text-2xl text-muted-foreground max-w-2xl">
          Grupo Estudiantil de Bioinformática
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Impulsando el descubrimiento científico a través de la computación.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/team">Conoce al Equipo</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link to="/events">Próximos Eventos</Link>
          </Button>
        </div>
      </section>

      {/* Navigation Cards Section */}
      <section className="py-20 px-4 container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border rounded-2xl hover:border-primary transition-colors bg-card">
                <h3 className="text-2xl font-bold mb-4">Investigación</h3>
                <p className="text-muted-foreground mb-6">Explora nuestros proyectos, papers y colaboraciones científicas.</p>
                <Button asChild variant="secondary">
                    <Link to="/research">Ver Investigaciones</Link>
                </Button>
            </div>
             <div className="p-8 border rounded-2xl hover:border-primary transition-colors bg-card">
                <h3 className="text-2xl font-bold mb-4">Gestiones Pasadas</h3>
                <p className="text-muted-foreground mb-6">Conoce la historia y el legado de nuestros líderes anteriores.</p>
                <Button asChild variant="secondary">
                    <Link to="/administrations">Ver Archivo</Link>
                </Button>
            </div>
             <div className="p-8 border rounded-2xl hover:border-primary transition-colors bg-card">
                <h3 className="text-2xl font-bold mb-4">Eventos</h3>
                <p className="text-muted-foreground mb-6">Talleres, conferencias y hackathons. ¡Involúcrate!</p>
                <Button asChild variant="secondary">
                    <Link to="/events">Calendario Completo</Link>
                </Button>
            </div>
        </div>
      </section>
      
      <footer className="py-8 text-center text-muted-foreground border-t">
          <p>© {new Date().getFullYear()} GenoBit. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}