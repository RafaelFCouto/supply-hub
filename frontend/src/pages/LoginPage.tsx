import { FormEvent, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, useAuth } from '../services/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSuccess(false);

    try {
      const response = await login({ email, password });

      startTransition(() => {
        refreshSession();
        setFeedback(response.message);
        setIsSuccess(true);
      });

      navigate('/home');
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : 'Unable to login');
        setIsSuccess(false);
      });
    }
  }

  return (
    <main className="login-shell">
      <section className="brand-panel">
        <div className="brand-panel__inner">
          <span className="eyebrow">Supply Hub</span>
          <div className="brand-copy">
            <h1>Inventory governance for operations that cannot stall.</h1>
          </div>

          <div className="warehouse-visual" aria-hidden="true">
            <div className="warehouse-visual__frame">
              <div className="warehouse-visual__header">
                <span className="warehouse-dot" />
                <span className="warehouse-dot" />
                <span className="warehouse-dot" />
              </div>

              <div className="warehouse-grid">
                <article className="warehouse-card warehouse-card--stack">
                  <span className="warehouse-card__label">Stock</span>
                  <div className="box-stack">
                    <span className="box box--large" />
                    <span className="box box--medium" />
                    <span className="box box--small" />
                  </div>
                </article>

                <article className="warehouse-card warehouse-card--flow">
                  <span className="warehouse-card__label">Movement</span>
                  <div className="flow-line">
                    <span className="flow-node" />
                    <span className="flow-track" />
                    <span className="flow-node flow-node--accent" />
                    <span className="flow-track" />
                    <span className="flow-node" />
                  </div>
                </article>

                <article className="warehouse-card warehouse-card--ledger">
                  <span className="warehouse-card__label">Control</span>
                  <div className="ledger-lines">
                    <span />
                  </div>
                </article>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="form-panel">
        <div className="form-panel__frame">
          <div className="form-heading">
            <span className="form-heading__badge">Access Portal</span>
            <h2>Sign in</h2>
            <p>Use your work email and password to access your company workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="maria@company.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
              />
            </label>

            <button className="submit-button" disabled={isPending} type="submit">
              {isPending ? 'Authorizing...' : 'Sign in'}
            </button>
          </form>

          <div className={`feedback ${isSuccess ? 'feedback--success' : 'feedback--error'}`} aria-live="polite">
            {feedback ?? 'Waiting for credentials.'}
          </div>
        </div>
      </section>
    </main>
  );
}
