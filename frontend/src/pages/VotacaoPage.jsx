import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/api";
import "../styles/Votacao.css";

const COR_CURSO = {
  "Gestão de Redes e Sistemas Informáticos": {
    cor: "#3182ce",
    bg: "#ebf4ff",
    emoji: "💻",
  },
  "Electromecânica": {
    cor: "#d69e2e",
    bg: "#fffff0",
    emoji: "⚙️",
  },
  "Energias e Instalações Eléctricas": {
    cor: "#e53e3e",
    bg: "#fff5f5",
    emoji: "⚡",
  },
  "Energias Renováveis": {
    cor: "#38a169",
    bg: "#f0fff4",
    emoji: "🌱",
  },
};

const CHAVE_VOTOS = "votacaoFeiraCientifica2026";

export default function VotacaoPage() {
  const { id } = useParams();

  const [projecto, setProjecto] = useState(null);
  const [estado, setEstado] = useState("carregar");
  const [mensagem, setMensagem] = useState("");
  const [totalVotos, setTotalVotos] = useState(null);

  // ── Verificar voto local ───────────────────────────
  const jaVotouNeste = () => {
    try {
      const guardado = JSON.parse(
        localStorage.getItem(CHAVE_VOTOS) || "{}"
      );

      return !!guardado[id];
    } catch {
      return false;
    }
  };

  // ── Guardar voto local ─────────────────────────────
  const registarVotoLocal = () => {
    try {
      const guardado = JSON.parse(
        localStorage.getItem(CHAVE_VOTOS) || "{}"
      );

      guardado[id] = Date.now();

      localStorage.setItem(
        CHAVE_VOTOS,
        JSON.stringify(guardado)
      );
    } catch (e) {
      console.error(e);
    }
  };

  // ── Carregar projecto ──────────────────────────────
  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/listar.php`);

        if (!res.data.success) {
          setEstado("erro");
          setMensagem("Não foi possível carregar os dados.");
          return;
        }

        const proj = res.data.data.find(
          (p) => String(p.id) === String(id)
        );

        if (!proj) {
          setEstado("erro");
          setMensagem("Projecto não encontrado.");
          return;
        }

        setProjecto(proj);

        if (jaVotouNeste()) {
          setEstado("jaVotou");
        } else {
          setEstado("pronto");
        }

      } catch (err) {
        console.error(err);

        setEstado("erro");
        setMensagem("Erro de ligação. Verifique a sua rede.");
      }
    };

    carregar();
  }, [id]);

  // ── Votar ──────────────────────────────────────────
  const votar = async () => {
    if (estado !== "pronto") return;

    setEstado("votando");

    try {
      const res = await axios.post(
        `${BASE_URL}/votar.php`,
        {
          projeto_id: id,
        }
      );

      console.log("RESPOSTA VOTO:", res.data);

      if (res.data.success) {
        registarVotoLocal();

        // ✅ Ambos os setState no mesmo ciclo — React 18 faz batching
        // automático em contextos async, evitando o erro removeChild
        setTotalVotos(Number(res.data.total_votos || 0));
        setEstado("votado");

      } else {
        setMensagem(
          res.data.message ||
          "Erro ao registar o voto."
        );

        setEstado("erro");
      }

    } catch (err) {
      console.error(err);

      setMensagem(
        "Erro de ligação. Tente novamente."
      );

      setEstado("erro");
    }
  };

  // ── Configuração visual ────────────────────────────
  const cfg = projecto
    ? (
        COR_CURSO[projecto.curso] || {
          cor: "#667eea",
          bg: "#f0f0ff",
          emoji: "🔬",
        }
      )
    : {
        cor: "#667eea",
        bg: "#f0f0ff",
        emoji: "🔬",
      };

  // ───────────────────────────────────────────────────
  return (
    <div className="vot-page">

      {/* LOADING */}
      {estado === "carregar" && (
        <div className="vot-loading">
          <div className="vot-spinner" />
          <p>A carregar projecto…</p>
        </div>
      )}

      {/* ERRO */}
      {estado === "erro" && (
        <div className="vot-card">
          <div className="vot-icon-big">⚠️</div>

          <h2>Ups!</h2>

          <p className="vot-msg-erro">
            {mensagem}
          </p>

          <button
            className="vot-btn-retry"
            onClick={() => window.location.reload()}
          >
            🔄 Tentar novamente
          </button>
        </div>
      )}

      {/* JÁ VOTOU */}
      {estado === "jaVotou" && projecto && (
        <div className="vot-card vot-card--already">

          <div className="vot-icon-big">
            ✅
          </div>

          <h2>Voto já registado</h2>

          <p>
            Já votou neste projecto anteriormente.
          </p>

          <div
            className="vot-proj-nome"
            style={{
              borderLeftColor: cfg.cor,
            }}
          >
            {projecto.tema}
          </div>

          <p className="vot-obrigado">
            Obrigado pela sua participação
            na Feira Científica 2026!
          </p>

        </div>
      )}

      {/* VOTADO */}
      {estado === "votado" && projecto && (
        <div className="vot-card vot-card--success">

          <div className="vot-confetti">
            🎉
          </div>

          <h2>Voto registado!</h2>

          <div
            className="vot-proj-nome"
            style={{
              borderLeftColor: cfg.cor,
            }}
          >
            {projecto.tema}
          </div>

          {totalVotos !== null && (
            <div
              className="vot-total-badge"
              style={{
                background: cfg.bg,
                color: cfg.cor,
              }}
            >
              {cfg.emoji}{" "}
              {totalVotos}{" "}
              {totalVotos === 1
                ? "voto"
                : "votos"}{" "}
              neste projecto
            </div>
          )}

          <p className="vot-obrigado">
            Obrigado pela sua participação!
            <br />
            O seu voto foi contabilizado.
          </p>

        </div>
      )}

      {/* ECRÃ PRINCIPAL */}
      {(estado === "pronto" || estado === "votando") && projecto && (
        <>
          {/* Header */}
          <div className="vot-header">
            <span className="vot-header-label">
              Feira Científica 2026
            </span>

            <span className="vot-header-sub">
              Sistema de Votação
            </span>
          </div>

          <div className="vot-card">

            {/* Curso */}
            <div
              className="vot-curso-badge"
              style={{
                background: cfg.bg,
                color: cfg.cor,
              }}
            >
              <span>{cfg.emoji}</span>
              <span>{projecto.curso}</span>
            </div>

            {/* Tema */}
            <h1 className="vot-tema">
              {projecto.tema}
            </h1>

            {/* Detalhes */}
            <div className="vot-detalhes">

              {projecto.turma && (
                <div className="vot-detalhe">
                  <span className="vot-detalhe-label">
                    Turma
                  </span>

                  <span className="vot-detalhe-val">
                    {projecto.turma}
                  </span>
                </div>
              )}

              <div className="vot-detalhe">
                <span className="vot-detalhe-label">
                  Área
                </span>

                <span className="vot-detalhe-val">
                  {projecto.area}
                </span>
              </div>

              <div className="vot-detalhe">
                <span className="vot-detalhe-label">
                  Orientador
                </span>

                <span className="vot-detalhe-val">
                  {projecto.orientador}
                </span>
              </div>

              {projecto.membros_nomes && (
                <div className="vot-detalhe">
                  <span className="vot-detalhe-label">
                    Membros
                  </span>

                  <span className="vot-detalhe-val">
                    {projecto.membros_nomes}
                  </span>
                </div>
              )}

            </div>

            {/* Resumo */}
            {projecto.resumo && (
              <div className="vot-resumo">

                <p className="vot-resumo-label">
                  Sobre o projecto
                </p>

                <p className="vot-resumo-texto">
                  {projecto.resumo}
                </p>

              </div>
            )}

            {/* Separador */}
            <div className="vot-separador" />

            {/* Acção */}
            <div className="vot-acao">

              <p className="vot-acao-txt">
                Gostou deste projecto?
              </p>

              <button
                className="vot-btn-votar"
                style={{
                  background: cfg.cor,
                }}
                onClick={votar}
                disabled={estado === "votando"}
              >
                {estado === "votando" ? (
                  <>
                    <span className="vot-btn-spinner" />
                    {" "}
                    A registar…
                  </>
                ) : (
                  <>
                    🗳️ Votar neste Projecto
                  </>
                )}
              </button>

              <p className="vot-aviso">
                Cada visitante pode votar
                uma vez por projecto.
              </p>

            </div>
          </div>

          <p className="vot-footer">
            Feira Científica 2026 ·
            Sistema de Votação Oficial
          </p>
        </>
      )}
    </div>
  );
}