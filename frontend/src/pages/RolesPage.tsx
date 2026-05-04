import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { listPermissions, type Permission } from '../services/permissions';
import {
  createRole,
  deactivateRole,
  listRoles,
  updateRole,
  type CreateRolePayload,
  type Role,
  type RoleStatus,
} from '../services/roles';

const initialForm: CreateRolePayload = {
  name: '',
  description: '',
  status: 'ACTIVE',
  permissionIds: [],
};

export function RolesPage() {
  const { logout, session } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [form, setForm] = useState<CreateRolePayload>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const tenantId = session?.tenantId;

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    void loadPageData(tenantId);
  }, [tenantId]);

  const usedPermissionIds = useMemo(
    () => new Set(roles.flatMap((role) => role.rolePermissions.map((item) => item.permissionId))),
    [roles],
  );

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((accumulator, permission) => {
      accumulator[permission.resource] ??= [];
      accumulator[permission.resource].push(permission);
      return accumulator;
    }, {});
  }, [permissions]);

  async function loadPageData(currentTenantId: number) {
    setIsLoading(true);

    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        listRoles(currentTenantId),
        listPermissions(),
      ]);

      setRoles(rolesResponse.data);
      setPermissions(permissionsResponse.data);
      setFeedback(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to load roles');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenantId) {
      return;
    }

    try {
      const response = await createRole(tenantId, {
        ...form,
        description: form.description?.trim() ? form.description.trim() : undefined,
      });

      startTransition(() => {
        setRoles((currentRoles) => [response.data, ...currentRoles]);
        setForm(initialForm);
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to create role');
      });
    }
  }

  async function handleUpdateRoleStatus(roleId: number, status: RoleStatus) {
    if (!tenantId) {
      return;
    }

    try {
      const response = await updateRole(tenantId, roleId, { status });

      startTransition(() => {
        setRoles((currentRoles) => currentRoles.map((role) => (role.id === roleId ? response.data : role)));
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to update role status');
      });
    }
  }

  async function handleDeactivateRole(roleId: number) {
    if (!tenantId) {
      return;
    }

    try {
      await deactivateRole(tenantId, roleId);

      startTransition(() => {
        setRoles((currentRoles) => currentRoles.filter((role) => role.id !== roleId));
        setFeedback('Role deactivated successfully');
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to deactivate role');
      });
    }
  }

  function handlePermissionToggle(permissionId: number) {
    setForm((currentForm) => {
      const alreadySelected = currentForm.permissionIds.includes(permissionId);

      return {
        ...currentForm,
        permissionIds: alreadySelected
          ? currentForm.permissionIds.filter((currentId) => currentId !== permissionId)
          : [...currentForm.permissionIds, permissionId],
      };
    });
  }

  return (
    <main className="roles-shell">
      <section className="roles-header">
        <div>
          <span className="eyebrow home-eyebrow">Roles</span>
          <h1>Tenant access layers</h1>
          <p>
            Roles bind permission sets to a tenant context. The frontend uses the current session tenant and keeps the
            URL clean while the API still receives the correct tenant scope under the hood.
          </p>
        </div>

        <div className="roles-header__actions">
          <div className="session-chip">
            <span>Tenant scope</span>
            <strong>Tenant #{tenantId ?? '--'}</strong>
          </div>
          <Link className="ghost-link" to="/permissions">
            Open permissions
          </Link>
          <Link className="ghost-link" to="/home">
            Back home
          </Link>
          <button className="ghost-button" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </section>

      <section className="roles-layout">
        <aside className="roles-form-panel">
          <div className="roles-form-panel__heading">
            <h2>Create role</h2>
            <p>Compose reusable access bundles for the authenticated tenant without leaking access rules into the UI.</p>
          </div>

          <form className="tenant-form" onSubmit={handleCreateRole}>
            <label>
              <span>Name</span>
              <input
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, name: event.target.value }))}
                placeholder="Stock Manager"
                required
                type="text"
                value={form.name}
              />
            </label>

            <label>
              <span>Description</span>
              <input
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, description: event.target.value }))}
                placeholder="Handles warehouse and inventory operations"
                type="text"
                value={form.description ?? ''}
              />
            </label>

            <label>
              <span>Status</span>
              <select
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, status: event.target.value as RoleStatus }))
                }
                value={form.status}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </label>

            <div className="role-permissions-picker">
              <div className="role-permissions-picker__header">
                <span>Permissions</span>
                <strong>{form.permissionIds.length} selected</strong>
              </div>

              <div className="role-permissions-groups">
                {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                  <section className="role-permission-group" key={resource}>
                    <span className="role-permission-group__label">{resource}</span>

                    <div className="role-permission-group__items">
                      {resourcePermissions.map((permission) => (
                        <label className="role-permission-option" key={permission.id}>
                          <input
                            checked={form.permissionIds.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            type="checkbox"
                          />
                          <span>{permission.action}</span>
                          <small>{usedPermissionIds.has(permission.id) ? 'Already used' : 'Available'}</small>
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <button className="submit-button" disabled={isPending || !tenantId} type="submit">
              {isPending ? 'Creating...' : 'Create role'}
            </button>
          </form>

          <div className={`feedback ${feedback ? 'feedback--success' : ''}`}>{feedback ?? 'No recent action.'}</div>
        </aside>

        <section className="roles-list-panel">
          <div className="tenants-list-panel__heading">
            <div>
              <h2>Current roles</h2>
              <p className="permissions-panel-copy">Only active and suspended roles are shown here.</p>
            </div>
            <button className="ghost-button" onClick={() => tenantId && void loadPageData(tenantId)} type="button">
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="tenants-empty">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="tenants-empty">No roles created for this tenant yet.</div>
          ) : (
            <div className="roles-list">
              {roles.map((role) => (
                <article className="role-card" key={role.id}>
                  <div className="tenant-card__top">
                    <div>
                      <span className="tenant-card__id">Role #{role.id}</span>
                      <h3>{role.name}</h3>
                    </div>
                    <span className={`tenant-status tenant-status--${role.status.toLowerCase()}`}>{role.status}</span>
                  </div>

                  <p className="role-card__description">
                    {role.description?.trim() || 'No description provided for this access bundle.'}
                  </p>

                  <div className="role-card__permissions">
                    {role.rolePermissions.length === 0 ? (
                      <span className="role-card__empty">No permissions assigned</span>
                    ) : (
                      role.rolePermissions.map(({ permissionId, permission }) => (
                        <code className="role-permission-chip" key={permissionId}>
                          {permission.resource}:{permission.action}
                        </code>
                      ))
                    )}
                  </div>

                  <div className="tenant-card__actions">
                    <button
                      className="tenant-action"
                      onClick={() => void handleUpdateRoleStatus(role.id, 'ACTIVE')}
                      type="button"
                    >
                      Activate
                    </button>
                    <button
                      className="tenant-action"
                      onClick={() => void handleUpdateRoleStatus(role.id, 'SUSPENDED')}
                      type="button"
                    >
                      Suspend
                    </button>
                    <button
                      className="tenant-action tenant-action--danger"
                      onClick={() => void handleDeactivateRole(role.id)}
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
