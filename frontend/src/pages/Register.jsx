import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Logo from "../assets/imagens/semfundo1.png";
import "../styles/Register.css";
import { BASE_URL } from "../config/api";

const validate = ({ nome, email, senha, confirmar }) => {
  const errors = {};
  if (!nome || nome.trim().length < 3) errors.nome = "Nome deve ter pelo menos 3 caracteres.";
  if (!email) errors.email = "Email é obrigatório.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email inválido.";
  if (!senha) errors.senha = "Senha é obrigatória.";
  else if (senha.length < 6) errors.senha = "Mínimo 6 caracteres.";
  if (!confirmar) errors.confirmar = "Confirma a senha.";
  else if (senha !== confirmar) errors.confirmar = "As senhas não coincidem.";
  return errors;
};

const calcForca = (s) => {
  if (!s) return { nivel: 0, texto: "", cor: "" };
  let pts = 0;
  if (s.length >= 6)          pts++;
  if (s.length >= 10)         pts++;
  if (/[A-Z]/.test(s))        pts++;
  if (/[0-9]/.test(s))        pts++;
  if (/[^A-Za-z0-9]/.test(s)) pts++;
  if (pts <= 2) return { nivel: pts, texto: "Fraca",   cor: "#fc8181" };
  if (pts <= 3) return { nivel: pts, texto: "Média",   cor: "#f6ad55" };
  return            { nivel: pts, texto: "Forte 💪", cor: "#68d391" };
};

const FORM_VAZIO = { nome: "", email: "", senha: "", confirmar: "" };

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(FORM_VAZIO);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const forcaSenha = calcForca(form.senha);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const erros = validate(form);
    if (Object.keys(erros).length > 0) { setErrors(erros); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/register.php`, form);
      if (res.data.success) {
        toast.success("Conta criada! Faz login agora. ✅");

        // ── Limpar inputs após registo com sucesso ────────────
        setForm(FORM_VAZIO);
        setErrors({});
        setShowPass(false);
        // ─────────────────────────────────────────────────────

        setTimeout(() => navigate("/"), 2000);
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
      <Toaster position="top-right" />
      <div className="auth-overlay" />

      <div className="auth-card wide">
        <div className="auth-header">
          <div className="auth-icon"><img src={Logo} alt="Logo" /></div>
          <h1>Criar Conta</h1>
          <p>Regista-te para começar</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={`field ${errors.nome ? "has-error" : ""}`}>
            <label>Nome completo</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input type="text" name="nome" value={form.nome}
                onChange={handleChange} placeholder="O teu nome" />
            </div>
            {errors.nome && <span className="error-msg">⚠ {errors.nome}</span>}
          </div>

          <div className={`field ${errors.email ? "has-error" : ""}`}>
            <label>Email</label>
            <div className="input-wrap">
              <span className="input-icon">✉️</span>
              <input type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="o.teu@email.com" />
            </div>
            {errors.email && <span className="error-msg">⚠ {errors.email}</span>}
          </div>

          <div className={`field ${errors.senha ? "has-error" : ""}`}>
            <label>Senha</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input type={showPass ? "text" : "password"} name="senha"
                value={form.senha} onChange={handleChange} placeholder="Mínimo 6 caracteres" />
              <button type="button" className="toggle-pass"
                onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {form.senha && (
              <div className="forca-wrap">
                <div className="forca-bar">
                  <div style={{ width: `${(forcaSenha.nivel / 5) * 100}%`, background: forcaSenha.cor }} />
                </div>
                <span style={{ color: forcaSenha.cor }}>{forcaSenha.texto}</span>
              </div>
            )}
            {errors.senha && <span className="error-msg">⚠ {errors.senha}</span>}
          </div>

          <div className={`field ${errors.confirmar ? "has-error" : ""}`}>
            <label>Confirmar Senha</label>
            <div className="input-wrap">
              <span className="input-icon">🔑</span>
              <input type={showPass ? "text" : "password"} name="confirmar"
                value={form.confirmar} onChange={handleChange} placeholder="Repete a senha" />
            </div>
            {errors.confirmar && <span className="error-msg">⚠ {errors.confirmar}</span>}
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <span className="spinner" /> : "Criar Conta →"}
          </button>
        </form>

        <p className="auth-link">
          Já tens conta? <Link to="/">Iniciar sessão</Link>
        </p>
      </div>
    </div>
  );
}