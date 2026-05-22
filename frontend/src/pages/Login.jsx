import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { saveAuth } from "../utils/auth";
import Logo from "../assets/imagens/semfundo1.png";
import "../styles/Login.css";
import { BASE_URL } from "../config/api";

const validate = ({ email, senha }) => {
  const errors = {};
  if (!email) errors.email = "Email é obrigatório.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Email inválido.";
  if (!senha) errors.senha = "Senha é obrigatória.";
  else if (senha.length < 6) errors.senha = "Mínimo 6 caracteres.";
  return errors;
};

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const erros = validate(form);
    if (Object.keys(erros).length > 0) { setErrors(erros); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/login.php`, form);
      if (res.data.success) {
        saveAuth(res.data.token, res.data.user);
        toast.success("Bem-vindo, " + res.data.user.nome + "!");

        // ── Limpar inputs após login com sucesso ──────────────
        setForm({ email: "", senha: "" });
        setErrors({});
        // ─────────────────────────────────────────────────────

        setTimeout(() => navigate("/dashboard"), 3000);
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Erro ao conectar com o servidor!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#f9f9fc",
            color: "#01034e",
            backdropFilter: "blur(10px)",
            border: "10px solid rgba(255,255,255,0.15)",
          },
        }}
      />

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <img src={Logo} alt="Logo" />
          </div>
          <h1>Bem-vindo!</h1>
          <p>Inicia sessão para continuar</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          <div className={`field ${errors.email ? "has-error" : ""}`}>
            <label>Email</label>
            <div className="input-wrap">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="o.teu@email.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="error-msg">⚠ {errors.email}</span>}
          </div>

          <div className={`field ${errors.senha ? "has-error" : ""}`}>
            <label>Senha</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                type={showPass ? "text" : "password"}
                name="senha"
                value={form.senha}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Esconder senha" : "Mostrar senha"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.senha && <span className="error-msg">⚠ {errors.senha}</span>}
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <span className="spinner" /> : "Entrar →"}
          </button>
        </form>

        <p className="auth-link">
          Não tens conta? <Link to="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}