import { FormEvent, useEffect, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import {
  createTenant,
  deactivateTenant,
  listTenants,
  updateTenant,
  updateTenantStatus,
  type CreateTenantPayload,
  type Tenant,
  type TenantStatus,
  type UpdateTenantPayload,
} from '../services/tenants';
import { useAuth } from '../services/auth';

const initialCreateForm: CreateTenantPayload = {
  name: '',
  cnpj: '',
  address: '',
  status: 'ACTIVE',
};

const initialEditForm: UpdateTenantPayload = {
  name: '',
  cnpj: '',
  address: '',
};

export function TenantsPage() {
  const { logout, session } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [createForm, setCreateForm] = useState<CreateTenantPayload>(initialCreateForm);
  const [editForm, setEditForm] = useState<UpdateTenantPayload>(initialEditForm);
  const [editingTenantId, setEditingTenantId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadTenants();
  }, []);

  const editingTenant = tenants.find((tenant) => tenant.id === editingTenantId) ?? null;

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

  function startEditingTenant(tenant: Tenant) {
    setEditingTenantId(tenant.id);
    setEditForm({
      name: tenant.name,
      cnpj: tenant.cnpj,
      address: tenant.address,
    });
    setFeedback(null);
  }

  function cancelEditingTenant() {
    setEditingTenantId(null);
    setEditForm(initialEditForm);
  }

  async function handleCreateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await createTenant(createForm);

      startTransition(() => {
        setTenants((currentTenants) => [response.data, ...currentTenants]);
        setCreateForm(initialCreateForm);
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to create tenant');
      });
    }
  }

  async function handleSaveTenantChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingTenantId) {
      return;
    }

    try {
      const response = await updateTenant(editingTenantId, editForm);

      startTransition(() => {
        setTenants((currentTenants) =>
          currentTenants.map((tenant) => (tenant.id === editingTenantId ? response.data : tenant)),
        );
        cancelEditingTenant();
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to update tenant');
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
        if (editingTenantId === tenantId) {
          cancelEditingTenant();
        }
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
            <div>
              <h2>{editingTenant ? 'Edit tenant' : 'Create tenant'}</h2>
              <p>
                {editingTenant
                  ? `Review the workspace data for tenant #${editingTenant.id}.`
                  : 'Use this form to register a new company workspace in the platform.'}
              </p>
            </div>

            {editingTenant ? (
              <button className="ghost-button" onClick={cancelEditingTenant} type="button">
                Cancel
              </button>
            ) : null}
          </div>

          <form className="tenant-form" onSubmit={editingTenant ? handleSaveTenantChanges : handleCreateTenant}>
            <label>
              <span>Name</span>
              <input
                onChange={(event) =>
                  editingTenant
                    ? setEditForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                    : setCreateForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                }
                placeholder="Acme Industry"
                required
                type="text"
                value={editingTenant ? editForm.name ?? '' : createForm.name}
              />
            </label>

            <label>
              <span>CNPJ</span>
              <input
                maxLength={14}
                onChange={(event) =>
                  editingTenant
                    ? setEditForm((currentForm) => ({ ...currentForm, cnpj: event.target.value }))
                    : setCreateForm((currentForm) => ({ ...currentForm, cnpj: event.target.value }))
                }
                placeholder="12345678000199"
                required
                type="text"
                value={editingTenant ? editForm.cnpj ?? '' : createForm.cnpj}
              />
            </label>

            <label>
              <span>Address</span>
              <input
                onChange={(event) =>
                  editingTenant
                    ? setEditForm((currentForm) => ({ ...currentForm, address: event.target.value }))
                    : setCreateForm((currentForm) => ({ ...currentForm, address: event.target.value }))
                }
                placeholder="Av. Paulista, 1000 - Sao Paulo/SP"
                required
                type="text"
                value={editingTenant ? editForm.address ?? '' : createForm.address}
              />
            </label>

            {!editingTenant ? (
              <label>
                <span>Status</span>
                <select
                  onChange={(event) =>
                    setCreateForm((currentForm) => ({ ...currentForm, status: event.target.value as TenantStatus }))
                  }
                  value={createForm.status}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            ) : null}

            <button className="submit-button" disabled={isPending} type="submit">
              {isPending ? 'Saving...' : editingTenant ? 'Save changes' : 'Create tenant'}
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
                <article className={`tenant-card ${editingTenantId === tenant.id ? 'tenant-card--editing' : ''}`} key={tenant.id}>
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
                    <button className="tenant-action tenant-action--accent" onClick={() => startEditingTenant(tenant)} type="button">
                      Edit
                    </button>
                    <button className="tenant-action" onClick={() => void handleUpdateStatus(tenant.id, 'ACTIVE')} type="button">
                      Activate
                    </button>
                    <button className="tenant-action" onClick={() => void handleUpdateStatus(tenant.id, 'SUSPENDED')} type="button">
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
