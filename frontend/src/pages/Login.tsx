import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, setNewPassword } from "../lib/auth";
import { ErrorBox, Field } from "../components/ui";

export default function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [newPassword, setNewPass] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (session) {
        await setNewPassword(email, newPassword, session);
      } else {
        const r = await login(email, password);
        if (r.newPasswordSession) {
          setSession(r.newPasswordSession);
          return;
        }
      }
      const next = params.get("next");
      nav(next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-10 w-full max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">Đăng nhập Admin</h1>
      {error ? <ErrorBox error={error} /> : null}
      <Field label="Email">
        <input className="input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Mật khẩu">
        <input className="input" type="password" required autoComplete="current-password" disabled={!!session} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {session ? (
        <>
          <p className="text-sm text-slate-600">Đăng nhập lần đầu: hãy đặt mật khẩu mới (tối thiểu 12 ký tự, có chữ hoa, chữ thường và số).</p>
          <Field label="Mật khẩu mới">
            <input className="input" type="password" required minLength={12} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPass(e.target.value)} />
          </Field>
        </>
      ) : null}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Đang xử lý…" : session ? "Đặt mật khẩu và đăng nhập" : "Đăng nhập"}</button>
    </form>
  );
}
