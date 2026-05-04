import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { listRoles, type Role, type RoleStatus } from '../services/roles';
import {
  createUser,
  deactivateUser,
  listUsers,
  updateUser,
  type CreateUserPayload,
  type User,
  type UserStatus,
} from '../services/users';

const initialForm: CreateUserPayload = {
  name: '',
  email: '',
  password: '',
  status: 'ACTIVE',
  roleIds: [],
};

export function UsersPage() {
  const { logout, session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<CreateUserPayload>(initialForm);
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

  const roleUsage = useMemo(
    () =>
      roles.map((role) => ({
        id: role.id,
        count: users.filter((user) => user.userRoles.some((userRole) => userRole.roleId === role.id)).length,
      })),
    [roles, users],
  );

  async function loadPageData(currentTenantId: number) {
    setIsLoading(true);

    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        listUsers(currentTenantId),
        listRoles(currentTenantId),
      ]);

      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
      setFeedback(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to load users');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenantId) {
      return;
    }

    try {
      const response = await createUser(tenantId, {
        ...form,
        email: form.email.trim().toLowerCase(),
      });

      startTransition(() => {
        setUsers((currentUsers) => [response.data, ...currentUsers]);
        setForm(initialForm);
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to create user');
      });
    }
  }

  async function handleUpdateUserStatus(userId: number, status: UserStatus) {
    if (!tenantId) {
      return;
    }

    try {
      const response = await updateUser(tenantId, userId, { status });

      startTransition(() => {
        setUsers((currentUsers) => currentUsers.map((user) => (user.id === userId ? response.data : user)));
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to update user status');
      });
    }
  }

  async function handleDeactivateUser(userId: number) {
    if (!tenantId) {
      return;
    }

    try {
      await deactivateUser(tenantId, userId);

      startTransition(() => {
        setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
        setFeedback('User deactivated successfully');
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to deactivate user');
      });
    }
  }

  function handleRoleToggle(roleId: number) {
    setForm((currentForm) => {
      const alreadySelected = currentForm.roleIds.includes(roleId);

      return {
        ...currentForm,
        roleIds: alreadySelected
          ? currentForm.roleIds.filter((currentRoleId) => currentRoleId !== roleId)
          : [...currentForm.roleIds, roleId],
      };
    });
  }

  return (
    <main className="users-shell">
      <section className="users-header">
        <div>
          <span className="eyebrow home-eyebrow">Users</span>
          <h1>Tenant operators</h1>
          <p>
            Users stay bound to the current tenant and inherit what they can do through tenant roles. This view keeps
            creation and operational status in one place while the permission logic remains centralized.
          </p>
        </div>

        <div className="users-header__actions">
          <div className="session-chip">
            <span>Tenant scope</span>
            <strong>Tenant #{tenantId ?? '--'}</strong>
          </div>
          <Link className="ghost-link" to="/roles">
            Open roles
          </Link>
          <Link className="ghost-link" to="/home">
            Back home
          </Link>
          <button className="ghost-button" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </section>

      <section className="users-layout">
        <aside className="users-form-panel">
          <div className="users-form-panel__heading">
            <h2>Create user</h2>
            <p>Register tenant-specific operators and attach the roles that define their access boundaries.</p>
          </div>

          <form className="tenant-form" onSubmit={handleCreateUser}>
            <label>
              <span>Name</span>
              <input
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, name: event.target.value }))}
                placeholder="Maria Silva"
                required
                type="text"
                value={form.name}
              />
            </label>

            <label>
              <span>Email</span>
              <input
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, email: event.target.value }))}
                placeholder="maria@acme.com"
                required
                type="email"
                value={form.email}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                minLength={8}
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, password: event.target.value }))}
                placeholder="Minimum 8 characters"
                required
                type="password"
                value={form.password}
              />
            </label>

            <label>
              <span>Status</span>
              <select
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, status: event.target.value as UserStatus }))
                }
                value={form.status}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </label>

            <div className="user-roles-picker">
              <div className="role-permissions-picker__header">
                <span>Roles</span>
                <strong>{form.roleIds.length} selected</strong>
              </div>

              <div className="user-roles-list">
                {roles.length === 0 ? (
                  <div className="users-empty-inline">No active roles available for this tenant.</div>
                ) : (
                  roles.map((role) => (
                    <label className="user-role-option" key={role.id}>
                      <input
                        checked={form.roleIds.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        type="checkbox"
                      />
                      <div>
                        <span>{role.name}</span>
                        <small>{role.description?.trim() || 'No description provided'}</small>
                      </div>
                      <em>
                        {roleUsage.find((entry) => entry.id === role.id)?.count ?? 0} user
                        {(roleUsage.find((entry) => entry.id === role.id)?.count ?? 0) === 1 ? '' : 's'}
                      </em>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button className="submit-button" disabled={isPending || !tenantId} type="submit">
              {isPending ? 'Creating...' : 'Create user'}
            </button>
          </form>

          <div className={`feedback ${feedback ? 'feedback--success' : ''}`}>{feedback ?? 'No recent action.'}</div>
        </aside>

        <section className="users-list-panel">
          <div className="tenants-list-panel__heading">
            <div>
              <h2>Current users</h2>
              <p className="permissions-panel-copy">Only active and suspended users are shown here.</p>
            </div>
            <button className="ghost-button" onClick={() => tenantId && void loadPageData(tenantId)} type="button">
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="tenants-empty">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="tenants-empty">No users created for this tenant yet.</div>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <article className="user-card" key={user.id}>
                  <div className="tenant-card__top">
                    <div>
                      <span className="tenant-card__id">User #{user.id}</span>
                      <h3>{user.name}</h3>
                    </div>
                    <span className={`tenant-status tenant-status--${user.status.toLowerCase()}`}>{user.status}</span>
                  </div>

                  <p className="user-card__email">{user.email}</p>

                  <div className="user-card__roles">
                    {user.userRoles.length === 0 ? (
                      <span className="role-card__empty">No roles assigned</span>
                    ) : (
                      user.userRoles.map(({ roleId, role }) => (
                        <code className="role-permission-chip" key={roleId}>
                          {role.name} · {role.status.toLowerCase() as Lowercase<RoleStatus>}
                        </code>
                      ))
                    )}
                  </div>

                  <div className="tenant-card__actions">
                    <button
                      className="tenant-action"
                      onClick={() => void handleUpdateUserStatus(user.id, 'ACTIVE')}
                      type="button"
                    >
                      Activate
                    </button>
                    <button
                      className="tenant-action"
                      onClick={() => void handleUpdateUserStatus(user.id, 'SUSPENDED')}
                      type="button"
                    >
                      Suspend
                    </button>
                    <button
                      className="tenant-action tenant-action--danger"
                      onClick={() => void handleDeactivateUser(user.id)}
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
