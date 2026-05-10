import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { inferCurrentPeriod } from '@/lib/periodInference'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const team = useQuery(api.team.get)
  const events = useQuery(api.events.get)
  const research = useQuery(api.research.get)
  const labs = useQuery(api.labs.get)
  const pastAdmins = useQuery(api.pastAdmin.get)

  const currentPeriod = team ? inferCurrentPeriod(team) : null

  const directives = team?.filter((m) => m.group === 'directives').length ?? 0
  const ndrg = team?.filter((m) => m.group === 'ndrg').length ?? 0
  const proteomics = team?.filter((m) => m.group === 'proteomics').length ?? 0
  const community =
    team?.filter((m) => m.group === 'student-community').length ?? 0

  const upcomingEvents = events?.filter((e) => e.isUpcoming).length ?? 0
  const pastEvents = events?.filter((e) => !e.isUpcoming).length ?? 0

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">GenoBit · Admin</h1>
          <p className="admin-page-sub">
            Periodo actual: {currentPeriod ?? '—'}
          </p>
        </div>
        <Link to="/admin/board-transition" className="admin-btn">
          Iniciar transición de mesa →
        </Link>
      </div>

      <div className="admin-dashboard-grid">
        <Link to="/admin/team" className="admin-tile">
          <h2 className="admin-tile-title">Equipo</h2>
          <p className="admin-tile-stat">{directives} directivos</p>
          <p className="admin-tile-stat-sub">
            {ndrg} NDRG · {proteomics} Proteomics · {community} Community
          </p>
          <span className="admin-tile-cta">→ Gestionar</span>
        </Link>

        <Link to="/admin/events" className="admin-tile">
          <h2 className="admin-tile-title">Eventos</h2>
          <p className="admin-tile-stat">{upcomingEvents} próximos</p>
          <p className="admin-tile-stat-sub">{pastEvents} pasados</p>
          <span className="admin-tile-cta">→ Gestionar</span>
        </Link>

        <Link to="/admin/research" className="admin-tile">
          <h2 className="admin-tile-title">Investigación</h2>
          <p className="admin-tile-stat">
            {research?.length ?? 0} publicaciones
          </p>
          <span className="admin-tile-cta">→ Gestionar</span>
        </Link>

        <Link to="/admin/labs" className="admin-tile">
          <h2 className="admin-tile-title">Labs</h2>
          <p className="admin-tile-stat">{labs?.length ?? 0} labs</p>
          <span className="admin-tile-cta">→ Gestionar</span>
        </Link>

        <Link to="/admin/admins" className="admin-tile">
          <h2 className="admin-tile-title">Mesas pasadas</h2>
          <p className="admin-tile-stat">
            {pastAdmins?.length ?? 0} mesas archivadas
          </p>
          <span className="admin-tile-cta">→ Ver archivo</span>
        </Link>
      </div>
    </div>
  )
}
