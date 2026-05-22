import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getUser } from "../../utils/auth";
import "../../styles/FormularioCadastro.css";
import { BASE_URL } from "../../config/api";

const VAZIO  = { tema: "", area: "", orientador: "", necessidades: "", curso: "", resumo: "", turma: ""};
const CURSOS = [
  "Gestão de Redes e Sistemas Informáticos",
  "Electromecânica",
  "Energias e Instalações Eléctricas",
  "Energias Renováveis",
];

export default function FormularioCadastro({ aberto, onFechar, projectoEditar, onSucesso }) {
  const [form, setForm]       = useState(VAZIO);
  const [membros, setMembros] = useState([{ nome: "", email: "" }]);
  const [loading, setLoading] = useState(false);
  const isEditar = !!projectoEditar;
  const userLogado = getUser();

  useEffect(() => {
    if (projectoEditar) {
      const { tema, area, orientador, necessidades, curso, turma, resumo, membros: mb } = projectoEditar;
      setForm({ tema, area, orientador, necessidades: necessidades || "", curso, turma: turma || "", resumo: resumo || "" });
      setMembros(mb?.length > 0 ? mb : [{ nome: "", email: "" }]);
    } else {
      setForm(VAZIO);
      setMembros([{ nome: "", email: "" }]);
    }
  }, [projectoEditar, aberto]);

  if (!aberto) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleMembroChange = (i, e) => {
    const lista = [...membros];
    lista[i][e.target.name] = e.target.value;
    setMembros(lista);
  };

  const adicionarMembro = () => setMembros([...membros, { nome: "", email: "" }]);
  const removerMembro   = (i) => {
    if (membros.length === 1) return;
    setMembros(membros.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, membros, usuario_id: userLogado?.id };
      let res;
      if (isEditar) {
        res = await axios.put(`${BASE_URL}/editar.php`, { ...payload, id: projectoEditar.id });
      } else {
        res = await axios.post(`${BASE_URL}/cadastrar.php`, payload);
      }

      if (res.data.success) {
        toast.success(isEditar ? "Projecto atualizado! ✅" : "Projecto cadastrado! ✅");
        onSucesso();
        onFechar();
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
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2>{isEditar ? "✏️ Editar Projecto" : "📋 Novo Projecto"}</h2>
          <button className="modal-fechar" onClick={onFechar}>✕</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="modal-grid">

              <div className="form-group">
                <label>Tema do Projecto *</label>
                <input name="tema" value={form.tema} onChange={handleChange}
                  placeholder="Ex: Sistema de Gestão Escolar" required />
              </div>

              <div className="form-group full">
                <label>Resumo do Projecto</label>
                <textarea name="resumo" value={form.resumo}
                  onChange={handleChange} rows={3}
                  placeholder="Descreve brevemente o projecto, objectivos e metodologia..." />
              </div>

              <div className="form-group">
                <label>Turma *</label>
                <input name="turma" value={form.turma} onChange={handleChange}
                  placeholder="Ex: 12ª A, Turma B..." required />
              </div>

              <div className="form-group">
                <label>Área *</label>
                <input name="area" value={form.area} onChange={handleChange}
                  placeholder="Ex: Tecnologias de Informação" required />
              </div>

              <div className="form-group">
                <label>Orientador *</label>
                <input name="orientador" value={form.orientador} onChange={handleChange}
                  placeholder="Ex: Prof. Dr. João Silva" required />
              </div>

              {/* ✅ CURSO — SELECT */}
              <div className="form-group">
                <label>Curso *</label>
                <select name="curso" value={form.curso} onChange={handleChange} required>
                  <option value="">— Seleciona o curso —</option>
                  {CURSOS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full">
                <label>Necessidades</label>
                <textarea name="necessidades" value={form.necessidades}
                  onChange={handleChange} rows={2}
                  placeholder="Ex: Computadores, sala de reuniões..." />
              </div>

            </div>

            <div className="membros-section">
              <h3>👥 Membros do Grupo</h3>
              {membros.map((m, i) => (
                <div key={i} className="membro-row">
                  <input name="nome" value={m.nome}
                    onChange={(e) => handleMembroChange(i, e)}
                    placeholder={`Nome do membro ${i + 1}`} required />
                  <button type="button" className="btn-remover"
                    onClick={() => removerMembro(i)}
                    disabled={membros.length === 1}>✕</button>
                </div>
              ))}
              <button type="button" className="btn-adicionar" onClick={adicionarMembro}>
                + Adicionar Membro
              </button>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancelar" onClick={onFechar}>
                Cancelar
              </button>
              <button type="submit" className="btn-salvar" disabled={loading}>
                {loading ? "A guardar..." : isEditar ? "💾 Salvar Alterações" : "💾 Cadastrar"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}