import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import QRModal from "../components/dashboard/QRModal";
import { QrCode } from "lucide-react";
import { getUser, logout } from "../utils/auth";
import FormularioCadastro from "../components/forms/FormularioCadastro";
import "../styles/Dashboard.css";
import Logo from "../assets/imagens/semfundo1 - Cópia.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BASE_URL } from "../config/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const user     = getUser();
  const qrRef    = useRef(null);

  const [projectos, setProjectos]             = useState([]);
  const [loadingLista, setLoadingLista]       = useState(true);
  const [modalAberto, setModalAberto]         = useState(false);
  const [projectoEditar, setProjectoEditar]   = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [search, setSearch]                   = useState("");
  const [filtroCurso, setFiltroCurso]         = useState("");
  const [pagina, setPagina]                   = useState(1);
  const [qrProjecto, setQrProjecto]           = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const ITEMS_POR_PAGINA                      = 4;

  // ── Carregar lista ─────────────────────────────────
  const carregarProjectos = useCallback(async () => {
    setLoadingLista(true);
    try {
      const res = await axios.get(`${BASE_URL}/listar.php`);
      if (res.data.success) setProjectos(res.data.data);
      setUltimaAtualizacao(new Date());
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar projectos.");
    } finally {
      setLoadingLista(false);
    }
  }, []);

  useEffect(() => {

    carregarProjectos();

    const interval = setInterval(() => {
      carregarProjectos();
    }, 10000);

    return () => clearInterval(interval);

  }, [carregarProjectos]);
  useEffect(() => { setPagina(1); }, [search, filtroCurso]);

  // ── Logout ─────────────────────────────────────────
  const handleLogout = () => { logout(); navigate("/"); };

  // ── Abrir modal novo ───────────────────────────────
  const abrirNovo = () => { setProjectoEditar(null); setModalAberto(true); };

  // ── Abrir modal editar ─────────────────────────────
  const abrirEditar = async (id) => {
    try {
      const proj = projectos.find(p => p.id === id);
      if (!proj) { toast.error("Projecto não encontrado."); return; }
      const resM = await axios.get(`${BASE_URL}/listar_membros.php?id=${id}`);
      proj.membros = resM.data.success ? resM.data.data : [];
      setProjectoEditar({ ...proj });
      setModalAberto(true);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar projecto.");
    }
  };

  // ── Eliminar ───────────────────────────────────────
  const eliminar = async () => {
    if (!confirmEliminar) return;
    try {
      const res = await axios.delete(`${BASE_URL}/eliminar.php`, {
        data: { id: confirmEliminar.id }
      });
      if (res.data.success) {
        toast.success("Projecto eliminado! 🗑️");
        carregarProjectos();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao eliminar.");
    } finally {
      setConfirmEliminar(null);
    }
  };

  // ── Filtro ─────────────────────────────────────────
  const listaFiltrada = projectos.filter(p => {
    const matchSearch =
      p.tema.toLowerCase().includes(search.toLowerCase()) ||
      p.area.toLowerCase().includes(search.toLowerCase()) ||
      p.curso.toLowerCase().includes(search.toLowerCase()) ||
      p.orientador.toLowerCase().includes(search.toLowerCase());
    const matchCurso = filtroCurso === "" || p.curso === filtroCurso;
    return matchSearch && matchCurso;
  });

  const totalPaginas = Math.ceil(listaFiltrada.length / ITEMS_POR_PAGINA);
  const listaExibida = listaFiltrada.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  );

  // ── Estatísticas ───────────────────────────────────
  const META_PROJECTOS = 100;
  const totalProjectos = projectos.length;

  const totalVotos = projectos.reduce(
    (total, p) => total + Number(p.total_votos || 0),
    0
  );

  const topProjectos = [...projectos]
  .sort((a, b) =>
    Number(b.total_votos || 0) -
    Number(a.total_votos || 0)
  )
  .slice(0, 5);

  const contagemPorCurso = (nomeCurso) =>
    projectos.filter(p =>
      p.curso?.trim().toLowerCase() === nomeCurso.trim().toLowerCase()
    ).length;

  const pctGeral = totalProjectos === 0
    ? 0
    : Math.min(Math.round((totalProjectos / META_PROJECTOS) * 100), 100);

  const cursosConfig = [
    { label: "Gestão de Redes e Sistemas Informáticos", key: "Gestão de Redes e Sistemas Informáticos", cor: "#3182ce", bg: "#ebf4ff" },
    { label: "Electromecânica",                         key: "Electromecânica",                         cor: "#d69e2e", bg: "#fffff0" },
    { label: "Energias e Instalações Eléctricas",       key: "Energias e Instalações Eléctricas",       cor: "#e53e3e", bg: "#fff5f5" },
    { label: "Energias Renováveis",                     key: "Energias Renováveis",                     cor: "#38a169", bg: "#f0fff4" },
  ];

  // ── URL de votação ─────────────────────────────────
  const getVotacaoUrl = (id) => `${window.location.origin}/votar/${id}`;

  // ── Imprimir QR Code ───────────────────────────────
  const imprimirQR = () => {
    if (!qrProjecto) return;
    const url    = getVotacaoUrl(qrProjecto.id);
    const titulo = qrProjecto.tema;
    const svgEl  = qrRef.current?.querySelector("svg");
    const svgStr = svgEl ? new XMLSerializer().serializeToString(svgEl) : "";
    const svgB64 = btoa(
      encodeURIComponent(svgStr).replace(
        /%([0-9A-F]{2})/g,
        (_, p1) => String.fromCharCode(parseInt(p1, 16))
      )
    );
    const janela = window.open("", "_blank", "width=600,height=700");
    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8" />
        <title>QR Code — ${titulo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', sans-serif;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; background: #fff;
          }
          .cartaz {
            text-align: center;
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            padding: 2rem 2.5rem;
            max-width: 360px;
            width: 100%;
          }
          .evento { font-size: 13px; color: #718096; margin-bottom: 4px; letter-spacing: .04em; text-transform: uppercase; }
          .titulo { font-size: 18px; font-weight: 700; color: #1a202c; margin-bottom: 1.5rem; line-height: 1.3; }
          .qr-wrap { background: #fff; padding: 12px; display: inline-block; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1.25rem; }
          .qr-wrap img { width: 220px; height: 220px; display: block; }
          .instrucao { font-size: 13px; color: #4a5568; margin-bottom: 6px; }
          .url { font-size: 10px; color: #a0aec0; word-break: break-all; }
          @media print {
            body { background: #fff; }
            .cartaz { border: 2px solid #000; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="cartaz">
          <p class="evento">Feira Científica 2025</p>
          <p class="titulo">${titulo}</p>
          <div class="qr-wrap">
            <img src="data:image/svg+xml;base64,${svgB64}" alt="QR Code" />
          </div>
          <p class="instrucao">📱 Aponte a câmera e vote neste projecto</p>
          <p class="url">${url}</p>
        </div>
        <script>
          window.onload = () => { window.print(); window.onafterprint = () => window.close(); };
        <\/script>
      </body>
      </html>
    `);
    janela.document.close();
  };

  // ── Gerar Relatório PDF ────────────────────────────
  const gerarPDF = () => {
    if (listaFiltrada.length === 0) {
      toast.error("Não há projectos para exportar.");
      return;
    }
    const doc   = new jsPDF();
    const agora = new Date().toLocaleDateString("pt-PT", {
      day: "2-digit", month: "long", year: "numeric"
    });
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titulo = filtroCurso ? `Relatório — ${filtroCurso}` : "Relatório de Projectos";
    doc.text(titulo, 14, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em ${agora}`, 14, 22);
    doc.text(`Total: ${listaFiltrada.length} projecto(s)`, 14, 28);
    const resumoY = 40;
    const cards = filtroCurso
      ? [{ label: filtroCurso, valor: listaFiltrada.length }]
      : [
          { label: "Total",               valor: listaFiltrada.length },
          { label: "Gestão de Redes",     valor: contagemPorCurso("Gestão de Redes e Sistemas Informáticos") },
          { label: "Electromecânica",     valor: contagemPorCurso("Electromecânica") },
          { label: "Energias Eléctricas", valor: contagemPorCurso("Energias e Instalações Eléctricas") },
          { label: "Energias Renováveis", valor: contagemPorCurso("Energias Renováveis") },
        ];
    const cardW = filtroCurso ? 80 : 36;
    const gap   = 4;
    cards.forEach((c, i) => {
      const x = 14 + i * (cardW + gap);
      doc.setFillColor(240, 242, 255);
      doc.roundedRect(x, resumoY, cardW, 18, 3, 3, "F");
      doc.setTextColor(102, 126, 234);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(String(c.valor), x + cardW / 2, resumoY + 9, { align: "center" });
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 120);
      doc.text(c.label, x + cardW / 2, resumoY + 15, { align: "center" });
    });
    autoTable(doc, {
      startY: resumoY + 26,
      head: [["#", "Tema", "Área", "Curso", "Turma", "Orientador", "Membros"]],
      body: listaFiltrada.map((p, i) => [
        i + 1, p.tema, p.area, p.curso, p.turma || "—", p.orientador, p.membros_nomes || "—",
      ]),
      headStyles:         { fillColor: [102, 126, 234], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles:         { fontSize: 8, textColor: [45, 55, 72] },
      alternateRowStyles: { fillColor: [247, 250, 255] },
      columnStyles: {
        0: { cellWidth: 8,  halign: "center" },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: 18 },
        5: { cellWidth: 30 },
        6: { cellWidth: 30 },
      },
      margin: { left: 14, right: 14 },
      styles: { overflow: "linebreak", cellPadding: 3 },
    });
    const totalPgs = doc.getNumberOfPages();
    for (let pg = 1; pg <= totalPgs; pg++) {
      doc.setPage(pg);
      doc.setFontSize(8);
      doc.setTextColor(160, 174, 192);
      doc.text(
        `Página ${pg} de ${totalPgs}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8,
        { align: "center" }
      );
    }
    const nomeFicheiro = filtroCurso
      ? `relatorio_${filtroCurso.replace(/\s+/g, "_")}_${Date.now()}.pdf`
      : `relatorio_projectos_${Date.now()}.pdf`;
    doc.save(nomeFicheiro);
    toast.success("Relatório PDF gerado! 📄");
  };

  // ──────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <Toaster position="top-right" />

      {/* NAVBAR */}
      <header className="dash-nav">
        <img className="dash-titulo" src={Logo} alt="logo" />
        <div className="dash-user">
          <span>👋 {user?.nome}</span>
          <button onClick={handleLogout} className="btn-logout">Sair 🚪</button>
        </div>
      </header>

      <main className="dash-main">

        {/* CARDS STATS */}
        <div className="dash-stats">
          <div className="stat-card stat-total">
            <div className="stat-icon">📁</div>
            <span className="stat-num">{totalProjectos}</span>
            <span className="stat-label">Total de Projectos</span>
            <div className="stat-bar-wrap">
              <div className="stat-bar" style={{ width: "100%", background: "#667eea" }} />
            </div>
          </div>

          <div className="stat-card stat-percent">
            <div className="stat-icon">📊</div>
            <span className="stat-num" style={{
              color: pctGeral === 0 ? "#a0aec0"
                   : pctGeral < 50  ? "#e53e3e"
                   : pctGeral < 80  ? "#d69e2e"
                   : "#38a169"
            }}>
              {pctGeral}%
            </span>
            <span className="stat-label">
              Projectos Cadastrados
              <span className="stat-meta"> ({totalProjectos} de {META_PROJECTOS})</span>
            </span>
            <div className="stat-bar-wrap" style={{ marginTop: "auto" }}>
              <div className="stat-bar" style={{
                width: `${pctGeral}%`,
                background: pctGeral === 0 ? "#e2e8f0"
                           : pctGeral < 50  ? "#fc8181"
                           : pctGeral < 80  ? "#f6ad55"
                           : "#68d391",
                transition: "width 0.8s ease"
              }} />
            </div>
          </div>

          {cursosConfig.map(c => {
            const qtd = contagemPorCurso(c.key);
            const pct = totalProjectos === 0 ? 0 : Math.round((qtd / totalProjectos) * 100);
            return (
              <div key={c.key} className="stat-card" style={{ borderLeftColor: c.cor }}>
                <div className="stat-icon" style={{ background: c.bg, color: c.cor }}>🎓</div>
                <span className="stat-num" style={{ color: c.cor }}>{qtd}</span>
                <span className="stat-label">{c.label}</span>
                <div className="stat-bar-wrap">
                  <div className="stat-bar" style={{ width: `${pct}%`, background: c.cor }} />
                </div>
                <span className="stat-pct">{pct}% do total</span>
              </div>
            );
          })}

          <div className="stat-card">
            <div className="stat-icon">🗳️</div>

            <span className="stat-num">
                {totalVotos}
            </span>

            <span className="stat-label">
                Total de Votos
            </span>
          </div>
        </div>

        {/* TOP PROJECTOS */}
        <div className="ranking-box">

          <div className="ranking-header">
            <h2>🏆 Top Projectos</h2>
            <span>
              Mais votados da Feira Científica 2026
            </span>
          </div>

          <div className="ranking-lista">

            {topProjectos.length === 0 ? (

              <p className="ranking-empty">
                Ainda não há votos registados.
              </p>

            ) : (

              topProjectos.map((p, index) => {

                const medalhas = ["🥇", "🥈", "🥉"];

                return (
                  <div
                    key={p.id}
                    className={`ranking-item ranking-${index + 1}`}
                  >

                    <div className="ranking-left">

                      <div className="ranking-posicao">
                        {medalhas[index] || `#${index + 1}`}
                      </div>

                      <div className="ranking-info">

                        <h3>{p.tema}</h3>

                        <p>
                          {p.curso}
                        </p>

                      </div>
                    </div>

                    <div className="ranking-votos">
                      🗳️ {p.total_votos || 0}
                    </div>

                  </div>
                );
              })

            )}

          </div>
        </div>

        <div className="ultima-atualizacao">
          ⏱️ Última actualização:
          {" "}
          {ultimaAtualizacao?.toLocaleTimeString("pt-PT")}
        </div>

        {/* TOOLBAR */}
        <div className="dash-toolbar">
          <div className="search-wrap">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Pesquisar por tema, área, curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filtro-curso"
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
          >
            <option value="">🎓 Todos os cursos</option>
            <option value="Gestão de Redes e Sistemas Informáticos">Gestão de Redes e Sistemas Informáticos</option>
            <option value="Electromecânica">Electromecânica</option>
            <option value="Energias e Instalações Eléctricas">Energias e Instalações Eléctricas</option>
            <option value="Energias Renováveis">Energias Renováveis</option>
          </select>
          <div className="toolbar-acoes">
            <button className="btn-pdf" onClick={gerarPDF}>
              <span>📄</span> Gerar Relatório
            </button>
            <button className="btn-novo" onClick={abrirNovo}>
              <span>＋</span> Novo Projecto
            </button>
          </div>
        </div>

        {/* TABELA */}
        {loadingLista ? (
          <div className="loading-tabela">A carregar projectos...</div>
        ) : listaFiltrada.length === 0 ? (
          <div className="empty-state">
            <span>📭</span>
            <p>{search || filtroCurso ? "Nenhum resultado encontrado." : "Ainda não há projectos cadastrados."}</p>
            {!search && !filtroCurso && (
              <button className="btn-novo" onClick={abrirNovo}>+ Adicionar primeiro projecto</button>
            )}
          </div>
        ) : (
          <>
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tema</th>
                    <th>Resumo</th>
                    <th>Área</th>
                    <th>Curso</th>
                    <th>Turma</th>
                    <th>Orientador</th>
                    <th>Membros</th>
                    <th>Cadastrado Por</th>
                    <th>Votos</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaExibida.map((p, i) => (
                    <tr key={p.id}>
                      <td className="td-num">{(pagina - 1) * ITEMS_POR_PAGINA + i + 1}</td>
                      <td className="td-tema">{p.tema}</td>
                      <td className="td-resumo">
                        {p.resumo
                          ? <span title={p.resumo}>
                              {p.resumo.length > 60 ? p.resumo.substring(0, 60) + "…" : p.resumo}
                            </span>
                          : <span style={{ color: "#a0aec0" }}>—</span>}
                      </td>
                      <td><span className="badge badge-area">{p.area}</span></td>
                      <td><span className="badge badge-curso">{p.curso}</span></td>
                      <td>{p.turma || <span style={{ color: "#a0aec0" }}>—</span>}</td>
                      <td>{p.orientador}</td>
                      <td className="td-membros">{p.membros_nomes || "—"}</td>
                      <td>
                        {p.cadastrado_por
                          ? <span className="badge badge-user">👤 {p.cadastrado_por}</span>
                          : <span style={{ color: "#a0aec0" }}>—</span>}
                      </td>
                      <td>🗳️ {p.total_votos}</td>
                      <td>
                        <div className="acoes">
                          <button
                            className="btn-qr"
                            onClick={() => setQrProjecto(p)}
                            title="Gerar QR Code"
                          >
                            <QrCode size={16} />
                          </button>
                          <button className="btn-editar" onClick={() => abrirEditar(p.id)} title="Editar">✏️</button>
                          <button
                            className="btn-eliminar"
                            onClick={() => setConfirmEliminar({ id: p.id, tema: p.tema })}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            {totalPaginas > 1 && (
              <div className="paginacao">
                <button onClick={() => setPagina(1)} disabled={pagina === 1} className="pag-btn">«</button>
                <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1} className="pag-btn">‹</button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)
                  .reduce((acc, n, idx, arr) => {
                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push("...");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, idx) =>
                    n === "..." ? (
                      <span key={`dots-${idx}`} className="pag-dots">…</span>
                    ) : (
                      <button key={n} onClick={() => setPagina(n)}
                        className={`pag-btn ${pagina === n ? "pag-ativo" : ""}`}>
                        {n}
                      </button>
                    )
                  )}

                <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas} className="pag-btn">›</button>
                <button onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} className="pag-btn">»</button>
                <span className="pag-info">
                  {(pagina - 1) * ITEMS_POR_PAGINA + 1}–{Math.min(pagina * ITEMS_POR_PAGINA, listaFiltrada.length)} de {listaFiltrada.length}
                </span>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL CADASTRO / EDITAR */}
      <FormularioCadastro
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        projectoEditar={projectoEditar}
        onSucesso={carregarProjectos}
      />

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmEliminar && (
        <div className="modal-backdrop" onClick={() => setConfirmEliminar(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Eliminar Projecto?</h3>
            <p>
              Tens a certeza que queres eliminar<br />
              <strong>"{confirmEliminar.tema}"</strong>?<br />
              <span>Esta acção não pode ser desfeita.</span>
            </p>
            <div className="confirm-acoes">
              <button className="btn-cancelar" onClick={() => setConfirmEliminar(null)}>Cancelar</button>
              <button className="btn-confirmar-del" onClick={eliminar}>Sim, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QR CODE */}
      <QRModal
        projecto={qrProjecto}
        onClose={() => setQrProjecto(null)}
        getVotacaoUrl={getVotacaoUrl}
        imprimirQR={imprimirQR}
        qrRef={qrRef}
      />
    </div>
  );
}