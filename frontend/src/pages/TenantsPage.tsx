import { FormEvent, useEffect, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import {
  createTenant,
  deactivateTenant,
  listTenants,
  updateTenantStatus,
  type CreateTenantPayload,
  type Tenant,
  type TenantStatus,
} from '../services/tenants';
import { useAuth } from '../services/auth';

const initialForm: CreateTenantPayload = {
  name: '',
  cnpj: '',
  address: '',
  status: 'ACTIVE',
};

export function TenantsPage() {
  const { logout, session } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState<CreateTenantPayload>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadTenants();
  }, []);

  async function loadTenants() {
    setIsLoading(true);

    try {
      const response = await listTenants();
      setTenants(response.data);
      setFeedback(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to load tenants');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await createTenant(form);

      startTransition(() => {
        setTenants((currentTenants) => [response.data, ...currentTenants]);
        setForm(initialForm);
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to create tenant');
      });
    }
  }

  async function handleUpdateStatus(tenantId: number, status: TenantStatus) {
    try {
      const response = await updateTenantStatus(tenantId, { status });

      startTransition(() => {
        setTenants((currentTenants) =>
          currentTenants.map((tenant) => (tenant.id === tenantId ? response.data : tenant)),
        );
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to update tenant status');
      });
    }
  }

  async function handleDeactivateTenant(tenantId: number) {
    try {
      await deactivateTenant(tenantId);

      startTransition(() => {
        setTenants((currentTenants) => currentTenants.filter((tenant) => tenant.id !== tenantId));
        setFeedback('Tenant deactivated successfully');
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to deactivate tenant');
      });
    }
  }

  return (
    <main className="tenants-shell">
      <section className="tenants-header">
        <div>
          <span className="eyebrow home-eyebrow">Tenants</span>
          <h1>Operational tenants</h1>
          <p>Create and govern company workspaces before expanding into roles, permissions and users.</p>
        </div>

        <div className="tenants-header__actions">
          <div className="session-chip">
            <span>Signed in as</span>
            <strong>{session?.email ?? 'Unknown user'}</strong>
          </div>
          <Link className="ghost-link" to="/home">
            Back home
          </Link>
          <button className="ghost-button" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </section>

      <section className="tenants-layout">
        <aside className="tenants-form-panel">
          <div className="tenants-form-panel__heading">
            <h2>Create tenant</h2>
            <p>Use this form to register a new company workspace in the platform.</p>
          </div>

          <form className="tenant-form" onSubmit={handleCreateTenant}>
            <label>
              <span>Name</span>
              <input
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, name: event.target.value }))}
                placeholder="Acme Industry"
                required
                type="text"
                value={form.name}
              />
            </label>

            <label>
              <span>CNPJ</span>
              <input
                maxLength={14}
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, cnpj: event.target.value }))}
                placeholder="12345678000199"
                required
                type="text"
                value={form.cnpj}
              />
            </label>

            <label>
              <span>Address</span>
              <input
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, address: event.target.value }))}
                placeholder="Av. Paulista, 1000 - Sao Paulo/SP"
                required
                type="text"
                value={form.address}
              />
            </label>

            <label>
              <span>Status</span>
              <select
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, status: event.target.value as TenantStatus }))
                }
                value={form.status}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>

            <button className="submit-button" disabled={isPending} type="submit">
              {isPending ? 'Creating...' : 'Create tenant'}
            </button>
          </form>

          <div className={`feedback ${feedback ? 'feedback--success' : ''}`}>{feedback ?? 'No recent action.'}</div>
        </aside>

        <section className="tenants-list-panel">
          <div className="tenants-list-panel__heading">
            <h2>Current tenants</h2>
            <button className="ghost-button" onClick={() => void loadTenants()} type="button">
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="tenants-empty">Loading tenants...</div>
          ) : tenants.length === 0 ? (
            <div className="tenants-empty">No active tenants available yet.</div>
          ) : (
            <div className="tenants-list">
              {tenants.map((tenant) => (
                <article className="tenant-card" key={tenant.id}>
                  <div className="tenant-card__top">
                    <div>
                      <span className="tenant-card__id">Tenant #{tenant.id}</span>
                      <h3>{tenant.name}</h3>
                    </div>
                    <span className={`tenant-status tenant-status--${tenant.status.toLowerCase()}`}>{tenant.status}</span>
                  </div>

                  <dl className="tenant-card__meta">
                    <div>
                      <dt>CNPJ</dt>
                      <dd>{tenant.cnpj}</dd>
                    </div>
                    <div>
                      <dt>Address</dt>
                      <dd>{tenant.address}</dd>
                    </div>
                  </dl>

                  <div className="tenant-card__actions">
                    <button
                      className="tenant-action"
                      onClick={() => void handleUpdateStatus(tenant.id, 'ACTIVE')}
                      type="button"
                    >
                      Activate
                    </button>
                    <button
                      className="tenant-action"
                      onClick={() => void handleUpdateStatus(tenant.id, 'SUSPENDED')}
                      type="button"
                    >
                      Suspend
                    </button>
                    <button
                      className="tenant-action tenant-action--danger"
                      onClick={() => void handleDeactivateTenant(tenant.id)}
                      type="button"
                    >
                      Deactivate
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
