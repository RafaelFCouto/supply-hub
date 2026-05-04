import { useAuth } from '../services/auth';
import { Link } from 'react-router-dom';

export function HomePage() {
  const { logout, session } = useAuth();

  return (
    <main className="home-shell">
      <section className="home-panel">
        <div className="home-panel__hero">
          <span className="eyebrow home-eyebrow">Workspace</span>
          <h1>Supply Hub is under active construction.</h1>
          <p>
            The authenticated area is already available and role-driven access will be centralized from this point
            forward. The next modules will expand on top of this foundation.
          </p>
        </div>

        <div className="home-grid">
          <article className="home-card">
            <span className="home-card__label">Session</span>
            <strong>{session?.email ?? 'Unknown user'}</strong>
            <p>Authenticated user loaded from the JWT stored on the client.</p>
          </article>

          <article className="home-card">
            <span className="home-card__label">Tenant</span>
            <strong>Tenant #{session?.tenantId ?? '--'}</strong>
            <p>Tenant context is derived from the token and will drive access boundaries.</p>
          </article>

          <article className="home-card">
            <span className="home-card__label">Authorization</span>
            <strong>{session?.roleIds.length ?? 0} active roles</strong>
            <p>UI permissions will be mediated centrally instead of scattered across pages.</p>
          </article>
        </div>

        <div className="home-actions">
          <div className="home-actions__group">
            <Link className="primary-link" to="/tenants">
              Open tenants
            </Link>
            <Link className="ghost-link" to="/permissions">
              Open permissions
            </Link>
            <Link className="ghost-link" to="/roles">
              Open roles
            </Link>
            <Link className="ghost-link" to="/users">
              Open users
            </Link>
            <button className="ghost-button" onClick={logout} type="button">
              Sign out
            </button>
          </div>
          <span className="home-status">Area scaffold in development</span>
        </div>
      </section>
    </main>
  );
}
