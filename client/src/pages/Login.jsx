import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { post } from "../api/client";
import { useAuth } from "../auth/AuthContext";

// Send the user to the redirect URL, or home/admin based on role.
function pathAfterLogin(user, redirect) {
  if (redirect && redirect.startsWith("/")) {
    return redirect;
  }
  return user.role === "admin" ? "/admin" : "/";
}

// Customer and admin login form.
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Submit email and password, then store the user and redirect.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await post("/auth/login", { email, password });
      login(user);
      navigate(pathAfterLogin(user, params.get("redirect")));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page auth-page">
      <div className="card">
        <h1>Welcome back</h1>
        <p className="muted">Log in with your email and password.</p>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Log in"}
          </button>
        </form>
        <p className="auth-switch">
          New guest? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
