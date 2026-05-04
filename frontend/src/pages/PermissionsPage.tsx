import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import {
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
  createPermission,
  listPermissions,
  type CreatePermissionPayload,
  type Permission,
} from '../services/permissions';
import { useAuth } from '../services/auth';

const initialForm: CreatePermissionPayload = {
  resource: PERMISSION_RESOURCES[0],
  action: PERMISSION_ACTIONS[0],
};

export function PermissionsPage() {
  const { logout, session } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [form, setForm] = useState<CreatePermissionPayload>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadPermissions();
  }, []);

  const insights = useMemo(() => {
    const resources = new Set(permissions.map((permission) => permission.resource));
    const actions = new Set(permissions.map((permission) => permission.action));

    return {
      total: permissions.length,
      resources: resources.size,
      actions: actions.size,
    };
  }, [permissions]);

  const existingPermissionKeys = useMemo(
    () => new Set(permissions.map((permission) => `${permission.resource}:${permission.action}`)),
    [permissions],
  );

  const availableActions = useMemo(
    () =>
      PERMISSION_ACTIONS.filter((action) => !existingPermissionKeys.has(`${form.resource}:${action}`)),
    [existingPermissionKeys, form.resource],
  );

  const availableResources = useMemo(
    () =>
      PERMISSION_RESOURCES.map((resource) => ({
        resource,
        hasAvailableActions: PERMISSION_ACTIONS.some((action) => !existingPermissionKeys.has(`${resource}:${action}`)),
      })),
    [existingPermissionKeys],
  );

  const isCurrentCombinationTaken = existingPermissionKeys.has(`${form.resource}:${form.action}`);

  useEffect(() => {
    if (availableActions.length > 0 && !availableActions.includes(form.action)) {
      setForm((currentForm) => ({
        ...currentForm,
        action: availableActions[0],
      }));
    }
  }, [availableActions, form.action]);

  async function loadPermissions() {
    setIsLoading(true);

    try {
      const response = await listPermissions();
      setPermissions(response.data);
      setFeedback(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to load permissions');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreatePermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCurrentCombinationTaken) {
      setFeedback('This permission already exists');
      return;
    }

    try {
      const response = await createPermission(form);

      startTransition(() => {
        setPermissions((currentPermissions) => [response.data, ...currentPermissions]);
        setForm(initialForm);
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to create permission');
      });
    }
  }

  return (
    <main className="permissions-shell">
      <section className="permissions-header">
        <div>
          <span className="eyebrow home-eyebrow">Permissions</span>
          <h1>Capability registry</h1>
          <p>
            Build the action catalog that roles will inherit later. Permissions stay global while access remains
            bounded by tenant roles.
          </p>
        </div>

        <div className="permissions-header__actions">
          <div className="session-chip">
            <span>Signed in as</span>
            <strong>{session?.email ?? 'Unknown user'}</strong>
          </div>
          <Link className="ghost-link" to="/home">
            Back home
          </Link>
          <Link className="ghost-link" to="/tenants">
            Open tenants
          </Link>
          <button className="ghost-button" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </section>

      <section className="permissions-overview">
        <article className="permission-metric">
          <span className="permission-metric__label">Catalog size</span>
          <strong>{insights.total}</strong>
          <p>Total permissions currently registered in the platform.</p>
        </article>

        <article className="permission-metric">
          <span className="permission-metric__label">Resources</span>
          <strong>{insights.resources}</strong>
          <p>Distinct bounded contexts that can be guarded on the client and on the API.</p>
        </article>

        <article className="permission-metric">
          <span className="permission-metric__label">Actions</span>
          <strong>{insights.actions}</strong>
          <p>Shared verbs that can be combined into roles without hardcoding access in the UI.</p>
        </article>
      </section>

      <section className="permissions-layout">
        <section className="permissions-list-panel">
          <div className="tenants-list-panel__heading">
            <div>
              <h2>Permission catalog</h2>
              <p className="permissions-panel-copy">Resource and action pairs that will feed tenant roles.</p>
            </div>
            <button className="ghost-button" onClick={() => void loadPermissions()} type="button">
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="tenants-empty">Loading permissions...</div>
          ) : permissions.length === 0 ? (
            <div className="tenants-empty">No permissions registered yet.</div>
          ) : (
            <div className="permissions-grid">
              {permissions.map((permission) => (
                <article className="permission-card" key={permission.id}>
                  <div className="permission-card__top">
                    <span className="tenant-card__id">Permission #{permission.id}</span>
                    <span className="permission-chip">{permission.action}</span>
                  </div>

                  <strong>{permission.resource}</strong>
                  <code>{`${permission.resource}:${permission.action}`}</code>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="permissions-form-panel">
          <div className="permissions-form-panel__heading">
            <h2>Create permission</h2>
            <p>Keep permission names compact and explicit. Prefer stable resource and action pairs.</p>
          </div>

          <form className="tenant-form" onSubmit={handleCreatePermission}>
            <label>
              <span>Resource</span>
              <select
                onChange={(event) =>
                  setForm((currentForm) => {
                    const nextResource = event.target.value as CreatePermissionPayload['resource'];
                    const nextAvailableActions = PERMISSION_ACTIONS.filter(
                      (action) => !existingPermissionKeys.has(`${nextResource}:${action}`),
                    );

                    return {
                      resource: nextResource,
                      action: nextAvailableActions[0] ?? currentForm.action,
                    };
                  })
                }
                value={form.resource}
              >
                {PERMISSION_RESOURCES.map((resource) => (
                  <option
                    disabled={!availableResources.find((entry) => entry.resource === resource)?.hasAvailableActions}
                    key={resource}
                    value={resource}
                  >
                    {resource}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Action</span>
              <select
                disabled={availableActions.length === 0}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, action: event.target.value as CreatePermissionPayload['action'] }))
                }
                value={form.action}
              >
                {availableActions.length === 0 ? (
                  <option value={form.action}>No actions available</option>
                ) : (
                  availableActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))
                )}
              </select>
            </label>

            <button className="submit-button" disabled={isPending || availableActions.length === 0} type="submit">
              {isPending ? 'Creating...' : 'Create permission'}
            </button>
          </form>

          <div className={`feedback ${feedback ? 'feedback--success' : ''}`}>{feedback ?? 'No recent action.'}</div>

        </aside>
      </section>
    </main>
  );
}
