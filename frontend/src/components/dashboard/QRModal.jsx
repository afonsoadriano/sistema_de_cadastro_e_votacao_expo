import { QRCode } from "react-qr-code";

export default function QRModal({
  projecto,
  onClose,
  getVotacaoUrl,
  imprimirQR,
  qrRef,
}) {

  if (!projecto) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>

        <button
          className="qr-fechar"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Cabeçalho */}
        <div className="qr-header">

          <span className="qr-evento">
            Feira Científica 2026
          </span>

          <h3 className="qr-titulo">
            {projecto.tema}
          </h3>

          <div className="qr-meta">

            <span>
              🎓 {projecto.curso}
            </span>

            {projecto.turma && (
              <span>
                Turma {projecto.turma}
              </span>
            )}

            <span>
              👤 {projecto.orientador}
            </span>

          </div>
        </div>

        {/* Corpo */}
        <div className="qr-body">

          <div className="qr-code-wrap" ref={qrRef}>
            <QRCode
              value={getVotacaoUrl(projecto.id)}
              size={160}
              bgColor="#ffffff"
              fgColor="#1a202c"
              level="H"
            />
          </div>

          <p className="qr-instrucao">
            📱 Aponte a câmera do telemóvel para votar
          </p>

          <p className="qr-url">
            {getVotacaoUrl(projecto.id)}
          </p>

        </div>

        {/* Rodapé */}
        <div className="qr-acoes">

          <button
            className="btn-imprimir"
            onClick={imprimirQR}
          >
            🖨️ Imprimir Cartaz
          </button>

          <button
            className="btn-cancelar"
            onClick={onClose}
          >
            Fechar
          </button>

        </div>
      </div>
    </div>
  );
}