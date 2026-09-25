"use client";
import { useEffect, useState } from "react";
import { UserRound, X, LoaderCircle, LogOut } from "lucide-react";
export default function Account() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null),
    [open, setOpen] = useState(false),
    [action, setAction] = useState<"login" | "register" | "change-password">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user || null);
        if (d.user) setEmail(d.user.email);
      })
      .catch(() => {});
    const listener = () => {
      setOpen(true);
      setAction("login");
    };
    window.addEventListener("algovisual:sign-in", listener);
    return () => window.removeEventListener("algovisual:sign-in", listener);
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email,
          password,
          newPassword: action === "change-password" ? newPassword : undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setUser(d.user);
      setPassword("");
      setNewPassword("");
      setOpen(false);
      window.dispatchEvent(new Event("algovisual:session-changed"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/auth", { method: "DELETE" });
      if (!r.ok) throw new Error("Sign out failed. Try again.");
      setUser(null);
      setOpen(false);
      window.dispatchEvent(new Event("algovisual:session-changed"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        className="button secondary small"
        onClick={() => {
          setOpen(true);
          setError("");
          setAction(user ? "change-password" : "login");
        }}
      >
        <UserRound size={14} />
        {user ? "Account" : "Sign in"}
      </button>
      {open && (
        <div className="modal-backdrop">
          <div className="modal account-modal" role="dialog" aria-modal="true" aria-label="Account">
            <button
              className="modal-close icon-button"
              aria-label="Close account"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
            <span className="eyebrow">YOUR PRIVATE WORKSPACE</span>
            <h2>
              {user
                ? "Your account"
                : action === "register"
                  ? "Create your account"
                  : "Welcome back."}
            </h2>
            <p className="modal-description">
              {user
                ? user.email
                : "Sign in to run code and keep your experiments private. The graph playground is free to explore without an account."}
            </p>
            {!user && (
              <div className="segmented">
                <button
                  className={action === "login" ? "chosen" : ""}
                  onClick={() => setAction("login")}
                >
                  Sign in
                </button>
                <button
                  className={action === "register" ? "chosen" : ""}
                  onClick={() => setAction("register")}
                >
                  Create account
                </button>
              </div>
            )}
            <form onSubmit={submit}>
              <label className="field-label">
                Email
                <input
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  disabled={!!user}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="field-label">
                {user ? "Current password" : "Password"}
                <input
                  aria-label={user ? "Current password" : "Password"}
                  type="password"
                  autoComplete={action === "register" ? "new-password" : "current-password"}
                  required
                  minLength={10}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {user && (
                <label className="field-label">
                  New password
                  <input
                    aria-label="New password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={10}
                    maxLength={128}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>
              )}
              <p className="form-hint">
                Use at least 10 characters. Changing your password signs out your other sessions.
              </p>
              {error && (
                <div className="error-message" role="alert">
                  {error}
                </div>
              )}
              <div className="modal-actions">
                {user && (
                  <button type="button" className="text-button" disabled={busy} onClick={logout}>
                    <LogOut size={14} />
                    Sign out
                  </button>
                )}
                <button className="button primary" disabled={busy} type="submit">
                  {busy && <LoaderCircle size={14} className="spin" />}
                  {user ? "Change password" : action === "register" ? "Create account" : "Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
