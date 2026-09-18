// ══════════════════════════════════════════════════════════════════════
// CERTIFICADO COMPASS (versión Apps Script / Excel)
// Colócalo en: src/front/pages/MiCertificado.jsx
// No usa backend: arma el certificado con userData + la huella que le pases.
// Solo botón de DESCARGA (sin LinkedIn, sin verificación).
//
// Requiere html2canvas (una sola vez):  npm install html2canvas
// ══════════════════════════════════════════════════════════════════════
import React, { useRef } from "react";
import html2canvas from "html2canvas";
import "../Styles/miCertificado.css";

const FASES = ["AUDITAR", "TRANSFORMAR", "LIDERAR", "ASEGURAR", "SOSTENER"];
const PROGRAMA = "ATLAS Framework 2026 - Adopción Ética de IA";

// Genera un código estable a partir del Teacher_Key (misma persona = mismo código)
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

    const nombre = userData?.Nombre_Completo || "Docente ATLAS";
    // Si tu Excel trae un ID_Credencial lo usa; si no, genera uno estable
    const idCredencial = userData?.ID_Credencial || generarCodigoCert(userData?.Teacher_Key);
    const huellaFinal = Math.round(Number(huella) || 0);
    const fecha = new Date().toLocaleDateString("es-CO", {
        year: "numeric", month: "long", day: "numeric",
    });

    const descargarImagen = async () => {
        if (!certRef.current) return;
        const canvas = await html2canvas(certRef.current, { scale: 3, backgroundColor: null });
        const link = document.createElement("a");
        link.download = `Certificado-${idCredencial}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    return (
        <div className="cert-container">
            {onVolver && (
                <button
                    className="btn-back-atlas"
                    onClick={onVolver}
                    style={{ marginBottom: 16 }}
                >
                    ⬅ Volver
                </button>
            )}

            {/* ---- Tarjeta que se exporta a imagen ---- */}
            <div className="cert-diploma" ref={certRef}>
                <div className="cert-topbar" />
                <div className="cert-brand">COMPASS</div>
                <p className="cert-eyebrow">CERTIFICADO DE FINALIZACIÓN</p>
                <h1 className="cert-nombre">{nombre}</h1>
                <p className="cert-texto">ha completado exitosamente el programa</p>
                <h2 className="cert-programa">{PROGRAMA}</h2>

                <div className="cert-fases">
                    {FASES.map((f) => (
                        <span key={f} className="cert-chip">{f}</span>
                    ))}
                </div>

                <div className="cert-meta">
                    <div>
                        <span className="cert-meta-label">Huella COMPASS</span>
                        <span className="cert-meta-val">{huellaFinal}/100</span>
                    </div>
                    <div>
                        <span className="cert-meta-label">Fecha</span>
                        <span className="cert-meta-val">{fecha}</span>
                    </div>
                </div>

                <div className="cert-footer">
                    <span className="cert-seal">✓</span>
                    <div className="cert-footer-txt">
                        <span>Credencial verificable</span>
                        <span className="cert-id">{idCredencial}</span>
                    </div>
                </div>
            </div>

            {/* ---- Acción: solo descargar ---- */}
            <div className="cert-acciones">
                <button className="cert-btn cert-btn-download" onClick={descargarImagen}>
                    ⬇ Descargar certificado
                </button>
            </div>
        </div>
    );
};

export default MiCertificado;