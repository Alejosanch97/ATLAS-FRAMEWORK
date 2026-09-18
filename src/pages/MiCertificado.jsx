// ══════════════════════════════════════════════════════════════════════
// CERTIFICADO DE PARTICIPACIÓN — PILOTO COMPASS IA RESPONSABLE
// Colócalo en: src/front/pages/MiCertificado.jsx
// Logos desde /public:  logo6.png (arriba) · logo1.png (sello)
// Usa Nombre_Completo. Solo botón de descarga.
//   npm install html2canvas   (si no lo tienes)
// ══════════════════════════════════════════════════════════════════════
import React, { useRef } from "react";
import html2canvas from "html2canvas";
import "../Styles/miCertificado.css";

const FASES = ["AUDITAR", "TRANSFORMAR", "LIDERAR", "ASEGURAR", "SOSTENER"];

const generarCodigoCert = (key) => {
    const base = String(key || "ATLAS").toUpperCase();
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
        hash = (hash << 5) - hash + base.charCodeAt(i);
        hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
    return `COMPASS-${hex}`;
};

export const MiCertificado = ({ userData, huella = 0, onVolver }) => {
    const certRef = useRef(null);

    // ⬇ Nombre viene de la columna Nombre_Completo (NO del Teacher_Key)
    const nombre = userData?.Nombre_Completo || "Participante COMPASS";
    const idCredencial = userData?.ID_Credencial || generarCodigoCert(userData?.Teacher_Key);
    const huellaFinal = Math.round(Number(huella) || 0);
    const fecha = new Date().toLocaleDateString("es-CO", {
        year: "numeric", month: "long", day: "numeric",
    });

    const descargar = async () => {
        if (!certRef.current) return;
        const canvas = await html2canvas(certRef.current, {
            scale: 3, backgroundColor: "#ffffff", useCORS: true,
        });
        const link = document.createElement("a");
        link.download = `Certificado-${idCredencial}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    return (
        <div className="cert-wrap">
            {onVolver && (
                <button className="btn-back-atlas cert-back" onClick={onVolver}>⬅ Volver</button>
            )}

            {/* ---------- DIPLOMA (se exporta a PNG) ---------- */}
            <div className="cert-diploma" ref={certRef}>
                {/* Cuñas decorativas de las esquinas (SVG, más seguro para exportar) */}
                <svg className="cert-corners-svg" viewBox="0 0 920 560" preserveAspectRatio="none">
                    <polygon points="0,0 172,0 0,172" fill="#c5a059" />
                    <polygon points="0,0 150,0 0,150" fill="#16233f" />
                    <polygon points="920,560 748,560 920,388" fill="#c5a059" />
                    <polygon points="920,560 770,560 920,410" fill="#16233f" />
                </svg>

                {/* Micro-textos de esquina */}
                <div className="cert-corner tr">INSTITUCIONES<br />PERSONAS<br />COMUNIDADES<br />IMPACTO REAL</div>
                <div className="cert-corner bl">CONOCIMIENTO<br />ACCIÓN<br />IMPACTO</div>
                <div className="cert-corner br-text">JUNTOS<br />NAVEGAMOS<br />UN FUTURO<br />MEJOR</div>

                {/* Logo superior (logo6.png) */}
                <div className="cert-logo-plate">
                    <img src="/logo6.png" alt="COMPASS" className="cert-logo-top" />
                </div>
                <div className="cert-logo-sub">— IA RESPONSABLE —</div>

                <h1 className="cert-title">Certificado de participación</h1>
                <p className="cert-subtitle">PILOTO COMPASS IA RESPONSABLE</p>

                <div className="cert-otorgado"><span>OTORGADO A</span></div>
                <h2 className="cert-name">{nombre}</h2>

                <p className="cert-body">
                    Por su compromiso y participación activa en el <strong>Piloto COMPASS IA Responsable</strong>,
                    contribuyendo al desarrollo de una implementación ética, sostenible y centrada en las
                    personas en instituciones educativas.
                </p>

                <div className="cert-fases">
                    {FASES.map((f, i) => (
                        <React.Fragment key={f}>
                            <span className="cert-fase">{f}</span>
                            {i < FASES.length - 1 && <span className="cert-dot">·</span>}
                        </React.Fragment>
                    ))}
                </div>

                {/* Fila de firma: fecha · sello · equipo */}
                <div className="cert-signrow">
                    <div className="cert-sign">
                        <span className="cert-sign-val">{fecha}</span>
                        <span className="cert-sign-lbl">CERTIFICADO EMITIDO EL DÍA</span>
                    </div>

                    <div className="cert-seal">
                        <img src="/logo1.png" alt="Sello COMPASS" className="cert-seal-img" />
                    </div>

                    <div className="cert-sign">
                        <span className="cert-sign-val cert-signature">Felipe Cárdenas</span>
                        <span className="cert-sign-lbl">EQUIPO COMPASS</span>
                    </div>
                </div>

                {/* Datos que ya generábamos: huella + credencial */}
                <div className="cert-meta-line">
                    Huella COMPASS: <strong>{huellaFinal}/100</strong>
                    &nbsp;·&nbsp; Credencial verificable: <strong>{idCredencial}</strong>
                </div>
            </div>

            {/* ---------- Acción ---------- */}
            <div className="cert-acciones">
                <button className="cert-btn cert-btn-download" onClick={descargar}>
                    ⬇ Descargar certificado
                </button>
            </div>
        </div>
    );
};

export default MiCertificado;