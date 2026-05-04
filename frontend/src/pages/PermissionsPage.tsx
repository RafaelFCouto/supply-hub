import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import {
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
  createPermission,
  listPermissions,
  updatePermission,
  type CreatePermissionPayload,
  type Permission,
  type UpdatePermissionPayload,
} from '../services/permissions';
import { useAuth } from '../services/auth';

const initialCreateForm: CreatePermissionPayload = {
  resource: PERMISSION_RESOURCES[0],
  action: PERMISSION_ACTIONS[0],
};

const initialEditForm: UpdatePermissionPayload = {
  resource: PERMISSION_RESOURCES[0],
  action: PERMISSION_ACTIONS[0],
};

export function PermissionsPage() {
  const { logout, session } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [createForm, setCreateForm] = useState<CreatePermissionPayload>(initialCreateForm);
  const [editForm, setEditForm] = useState<UpdatePermissionPayload>(initialEditForm);
  const [editingPermissionId, setEditingPermissionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadPermissions();
  }, []);

  const editingPermission = permissions.find((permission) => permission.id === editingPermissionId) ?? null;

  const insights = useMemo(() => {
    const resources = new Set(permissions.map((permission) => permission.resource));
    const actions = new Set(permissions.map((permission) => permission.action));

    return {
      total: permissions.length,
      resources: resources.size,
      actions: actions.size,
    };
  }, [permissions]);

  const createExistingKeys = useMemo(
    () => new Set(permissions.map((permission) => `${permission.resource}:${permission.action}`)),
    [permissions],
  );

  const editExistingKeys = useMemo(
    () =>
      new Set(
        permissions
          .filter((permission) => permission.id !== editingPermissionId)
          .map((permission) => `${permission.resource}:${permission.action}`),
      ),
    [editingPermissionId, permissions],
  );

  const createAvailableActions = useMemo(
    () => PERMISSION_ACTIONS.filter((action) => !createExistingKeys.has(`${createForm.resource}:${action}`)),
    [createExistingKeys, createForm.resource],
  );

  const createAvailableResources = useMemo(
    () =>
      PERMISSION_RESOURCES.map((resource) => ({
        resource,
        hasAvailableActions: PERMISSION_ACTIONS.some((action) => !createExistingKeys.has(`${resource}:${action}`)),
      })),
    [createExistingKeys],
  );

  const editAvailableActions = useMemo(() => {
    const selectedResource = editForm.resource ?? PERMISSION_RESOURCES[0];
    return PERMISSION_ACTIONS.filter((action) => !editExistingKeys.has(`${selectedResource}:${action}`));
  }, [editExistingKeys, editForm.resource]);

  const editAvailableResources = useMemo(
    () =>
      PERMISSION_RESOURCES.map((resource) => ({
        resource,
        hasAvailableActions: PERMISSION_ACTIONS.some((action) => !editExistingKeys.has(`${resource}:${action}`)),
      })),
    [editExistingKeys],
  );

  const isCreateCombinationTaken = createExistingKeys.has(`${createForm.resource}:${createForm.action}`);
  const isEditCombinationTaken = editingPermission
    ? editExistingKeys.has(`${editForm.resource}:${editForm.action}`)
    : false;

  useEffect(() => {
    if (createAvailableActions.length > 0 && !createAvailableActions.includes(createForm.action)) {
      setCreateForm((currentForm) => ({
        ...currentForm,
        action: createAvailableActions[0],
      }));
    }
  }, [createAvailableActions, createForm.action]);

  useEffect(() => {
    if (editingPermission && editAvailableActions.length > 0 && !editAvailableActions.includes(editForm.action ?? PERMISSION_ACTIONS[0])) {
      setEditForm((currentForm) => ({
        ...currentForm,
        action: editAvailableActions[0],
      }));
    }
  }, [editAvailableActions, editForm.action, editingPermission]);

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

  function startEditingPermission(permission: Permission) {
    setEditingPermissionId(permission.id);
    setEditForm({
      resource: permission.resource,
      action: permission.action,
    });
    setFeedback(null);
  }

  function cancelEditingPermission() {
    setEditingPermissionId(null);
    setEditForm(initialEditForm);
  }

  async function handleCreatePermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCreateCombinationTaken) {
      setFeedback('This permission already exists');
      return;
    }

    try {
      const response = await createPermission(createForm);

      startTransition(() => {
        setPermissions((currentPermissions) => [response.data, ...currentPermissions]);
        setCreateForm(initialCreateForm);
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to create permission');
      });
    }
  }

  async function handleSavePermissionChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingPermissionId || !editForm.resource || !editForm.action) {
      return;
    }

    if (isEditCombinationTaken) {
      setFeedback('This permission already exists');
      return;
    }

    try {
      const response = await updatePermission(editingPermissionId, {
        resource: editForm.resource,
        action: editForm.action,
      });

      startTransition(() => {
        setPermissions((currentPermissions) =>
          currentPermissions.map((permission) => (permission.id === editingPermissionId ? response.data : permission)),
        );
        cancelEditingPermission();
        setFeedback(response.message);
      });
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to update permission');
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
                <article className={`permission-card ${editingPermissionId === permission.id ? 'permission-card--editing' : ''}`} key={permission.id}>
                  <div className="permission-card__top">
                    <span className="tenant-card__id">Permission #{permission.id}</span>
                    <span className="permission-chip">{permission.action}</span>
                  </div>

                  <strong>{permission.resource}</strong>
                  <code>{`${permission.resource}:${permission.action}`}</code>

                  <div className="permission-card__actions">
                    <button className="tenant-action tenant-action--accent" onClick={() => startEditingPermission(permission)} type="button">
                      Edit
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="permissions-form-panel">
          <div className="permissions-form-panel__heading">
            <div>
              <h2>{editingPermission ? 'Edit permission' : 'Create permission'}</h2>
              <p>
                {editingPermission
                  ? `Adjust the capability pair for permission #${editingPermission.id}.`
                  : 'Keep permission names compact and explicit. Prefer stable resource and action pairs.'}
              </p>
            </div>

            {editingPermission ? (
              <button className="ghost-button" onClick={cancelEditingPermission} type="button">
                Cancel
              </button>
            ) : null}
          </div>

          <form className="tenant-form" onSubmit={editingPermission ? handleSavePermissionChanges : handleCreatePermission}>
            <label>
              <span>Resource</span>
              <select
                onChange={(event) => {
                  const nextResource = event.target.value as CreatePermissionPayload['resource'];

                  if (editingPermission) {
                    const nextAvailableActions = PERMISSION_ACTIONS.filter(
                      (action) => !editExistingKeys.has(`${nextResource}:${action}`),
                    );

                    setEditForm({
                      resource: nextResource,
                      action: nextAvailableActions[0] ?? editForm.action,
                    });
                    return;
                  }

                  const nextAvailableActions = PERMISSION_ACTIONS.filter(
                    (action) => !createExistingKeys.has(`${nextResource}:${action}`),
                  );

                  setCreateForm({
                    resource: nextResource,
                    action: nextAvailableActions[0] ?? createForm.action,
                  });
                }}
                value={editingPermission ? editForm.resource : createForm.resource}
              >
                {PERMISSION_RESOURCES.map((resource) => (
                  <option
                    disabled={
                      editingPermission
                        ? !editAvailableResources.find((entry) => entry.resource === resource)?.hasAvailableActions
                        : !createAvailableResources.find((entry) => entry.resource === resource)?.hasAvailableActions
                    }
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
                disabled={editingPermission ? editAvailableActions.length === 0 : createAvailableActions.length === 0}
                onChange={(event) =>
                  editingPermission
                    ? setEditForm((currentForm) => ({
                        ...currentForm,
                        action: event.target.value as CreatePermissionPayload['action'],
                      }))
                    : setCreateForm((currentForm) => ({
                        ...currentForm,
                        action: event.target.value as CreatePermissionPayload['action'],
                      }))
                }
                value={editingPermission ? editForm.action : createForm.action}
              >
                {(editingPermission ? editAvailableActions : createAvailableActions).length === 0 ? (
                  <option value={editingPermission ? editForm.action : createForm.action}>No actions available</option>
                ) : (
                  (editingPermission ? editAvailableActions : createAvailableActions).map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))
                )}
              </select>
            </label>

            <button
              className="submit-button"
              disabled={isPending || (editingPermission ? editAvailableActions.length === 0 : createAvailableActions.length === 0)}
              type="submit"
            >
              {isPending ? 'Saving...' : editingPermission ? 'Save changes' : 'Create permission'}
            </button>
          </form>

          <div className={`feedback ${feedback ? 'feedback--success' : ''}`}>{feedback ?? 'No recent action.'}</div>
        </aside>
      </section>
    </main>
  );
}
