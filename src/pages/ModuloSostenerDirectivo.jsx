import React, { useState } from "react";
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
    Radar as RadarFill, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip 
} from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostenerDirectivo.css";

const ModuloSostenerDirectivo = ({ 
    userData, 
    API_URL, 
    onNavigate, 
    datosAuditar, 
    datosAsegurar, 
    datosDocentesAgregados, // Promedios de toda la institución
    promptDataGlobal,       // Dictamen ético promedio
    retosInstitucionales,   // Misiones de todos los docentes
    historialGlobal         // Evolución de la institución
}) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showModalReal, setShowModalReal] = useState(false);
    
    const [formData, setFormData] = useState({
        reflexionInicial: "",
        cumplimientoPlan: "En proceso",
        analisisImplementacion: "",
        analisisEstadoActual: "",
        decisionRuta: "",
        prioridadEstrategica: "",
        accionGobernanza: "",
        fechaRevision: ""
    });

    // --- CÁLCULOS INSTITUCIONALES ---
    const pD = datosDocentesAgregados?.promediosDimensiones || [0, 0, 0, 0];
    const nivelGlobal = datosDocentesAgregados?.promedioGlobal || 0;
    const toPct = (val) => ((val / 5) * 100).toFixed(1);

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSaveFinal = async () => {
        setLoading(true);
        try {
            const payload = {
                action: "create",
                sheet: "SOSTENER_Institucional",
                data: { ...formData, Teacher_Key: userData.Teacher_Key, Nivel_Final: nivelGlobal }
            };
            await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
            Swal.fire("Ciclo Cerrado", "La Hoja de Ruta Institucional ha sido generada.", "success");
            onNavigate('overview');
        } catch (e) {
            Swal.fire("Error", "No se pudo guardar.", "error");
        } finally { setLoading(false); }
    };

    return (
        <div className="sostener-directivo-master animate-fade-in">
            <header className="sos-dir-header">
                <div className="header-info">
                    <button className="btn-exit-sos" onClick={() => onNavigate('overview')}>⬅ Salir al Mapa</button>
                    <h1>Cierre Institucional ATLAS 2026</h1>
                </div>
                <div className="progress-container-top">
                    <div className="progress-bar-bg"><div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div></div>
                </div>
            </header>

            <div className="sos-dir-grid-layout">
                
                {/* COLUMNA IZQUIERDA: LOS 6 PANELES DE ANÁLISIS (DASHBOARD) */}
                <aside className="sos-analysis-column">
                    <div className="sos-dash-layout-vertical">
                        
                        {/* PANEL 1: ÍNDICE GLOBAL */}
                        <div className="sos-stat-card gold">
                            <span className="dash-lider-2026-panel-id">Panel 1</span>
                            <h4>Índice de Sostenibilidad Institucional</h4>
                            <div className="sos-big-val">{toPct(nivelGlobal)}%</div>
                            <p className="sub-text">Madurez promedio de la facultad</p>
                        </div>

                        {/* PANEL 2: RADAR DE PROMEDIOS */}
                        <div className="sos-stat-card radar-cont">
                            <h4>Radar COMPASS (Media Institucional)</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <RadarChart data={[
                                    { s: 'Uso', A: pD[0] }, { s: 'Ética', A: pD[1] },
                                    { s: 'Impacto', A: pD[2] }, { s: 'Desarrollo', A: pD[3] }
                                ]}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="s" tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <RadarFill name="Global" dataKey="A" stroke="#c5a059" fill="#c5a059" fillOpacity={0.5} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* PANEL 3: AUDITORÍA ÉTICA (LIDERAZGO) */}
                        <div className="sos-history-chart audit-ethic-border">
                            <span className="dash-lider-2026-panel-id">Panel 3: Riesgo Ético Promedio</span>
                            <h4>Dictamen de Liderazgo Institucional</h4>
                            <div className="sos-mini-grid-bars">
                                {[
                                    { l: 'Ética', v: promptDataGlobal?.Puntaje_Etica || 0, c: '#8b5cf6' },
                                    { l: 'Privacidad', v: promptDataGlobal?.Puntaje_Privacidad || 0, c: '#06b6d4' },
                                    { l: 'Agencia', v: promptDataGlobal?.Puntaje_Agencia || 0, c: '#f59e0b' }
                                ].map(d => (
                                    <div key={d.l} className="sos-mini-bar-item">
                                        <div className="sos-mini-bar-labels"><span>{d.l}</span><strong>{d.v}/5</strong></div>
                                        <div className="sos-mini-bar-bg">
                                            <div className="sos-mini-bar-fill" style={{ width: `${(d.v / 5) * 100}%`, backgroundColor: d.c }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="dictamen-mini-text">
                                {promptDataGlobal?.Puntaje_Agencia < 3 ? "⚠️ Alerta: Delegación de juicio docente alta en la institución." : "✅ Agencia humana consolidada en el equipo."}
                            </p>
                        </div>

                        {/* PANEL 4: MISIONES (TRANSFORMACIÓN) */}
                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 4: Transformación</span>
                            <h4>Misiones Institucionales Superadas</h4>
                            <div className="retos-summary-grid">
                                {retosInstitucionales?.length > 0 ? retosInstitucionales.slice(0, 3).map((r, i) => (
                                    <div key={i} className="reto-mini-card">
                                        <h5>{r.Nombre_Reto}</h5>
                                        <span className={`status-pill ${r.Status_Reto}`}>{r.Status_Reto}</span>
                                    </div>
                                )) : <p>No hay misiones registradas.</p>}
                            </div>
                        </div>

                        {/* PANEL 5: EVOLUCIÓN HISTÓRICA */}
                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 5: Evolución</span>
                            <h4>Trayectoria Institucional ATLAS</h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={historialGlobal || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="Fecha" hide />
                                    <YAxis domain={[0, 5]} hide />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="Promedio" stroke="#c5a059" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                    </div>
                </aside>

                {/* COLUMNA DERECHA: FORMULARIO DE PASOS (HOJA DE RUTA) */}
                <section className="sos-form-column">
                    <div className="sos-step-card-ui">
                        {step === 1 && (
                            <div className="step-content animate-slide-up">
                                <h3>Bloque 1: Diagnóstico de Liderazgo</h3>
                                <p className="step-instr">Analice los riesgos detectados en la Fase Auditar y describa las decisiones tomadas.</p>
                                <textarea 
                                    className="sos-textarea-ui"
                                    placeholder="¿Qué decisiones estratégicas se implementaron? (Mínimo 300 caracteres)"
                                    value={formData.reflexionInicial}
                                    onChange={(e) => setFormData({...formData, reflexionInicial: e.target.value})}
                                />
                                <div className="actions-footer"><button className="btn-sos-main" onClick={handleNext}>Siguiente</button></div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="step-content animate-slide-up">
                                <h3>Bloque 2: Implementación (Fase Asegurar)</h3>
                                <div className="selector-group">
                                    <label>Cumplimiento del Plan Institucional:</label>
                                    <select value={formData.cumplimientoPlan} onChange={(e)=>setFormData({...formData, cumplimientoPlan: e.target.value})}>
                                        <option>En proceso</option>
                                        <option>Parcialmente logrado</option>
                                        <option>Consolidado</option>
                                    </select>
                                </div>
                                <textarea 
                                    className="sos-textarea-ui"
                                    placeholder="Resistencias detectadas y ajustes realizados..."
                                    value={formData.analisisImplementacion}
                                    onChange={(e) => setFormData({...formData, analisisImplementacion: e.target.value})}
                                />
                                <div className="actions-footer-between">
                                    <button className="btn-back" onClick={handleBack}>Atrás</button>
                                    <button className="btn-sos-main" onClick={handleNext}>Siguiente</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="step-content animate-slide-up">
                                <h3>Bloque 3: Análisis de Madurez</h3>
                                <p>El promedio institucional actual es de <strong>{nivelGlobal.toFixed(2)}</strong>.</p>
                                <textarea 
                                    className="sos-textarea-ui"
                                    placeholder="¿Cómo garantiza la institución la supervisión humana activa?"
                                    value={formData.analisisEstadoActual}
                                    onChange={(e) => setFormData({...formData, analisisEstadoActual: e.target.value})}
                                />
                                <div className="actions-footer-between">
                                    <button className="btn-back" onClick={handleBack}>Atrás</button>
                                    <button className="btn-sos-main" onClick={handleNext}>Ver Evolución</button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="step-content animate-slide-up">
                                <h3>Bloque 4: Comparativa de Impacto</h3>
                                <div className="comparison-display">
                                    <div className="comp-item before"><span>ANTES</span><strong>Riesgos Altos</strong></div>
                                    <div className="comp-arrow">➡</div>
                                    <div className="comp-item after"><span>AHORA</span><strong>Cultura Ética</strong></div>
                                </div>
                                <div className="actions-footer-between">
                                    <button className="btn-back" onClick={handleBack}>Atrás</button>
                                    <button className="btn-sos-main" onClick={handleNext}>Proyectar</button>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="step-content animate-slide-up">
                                <h3>Bloque 5: Hoja de Ruta 2026</h3>
                                <div className="form-grid-mini">
                                    <label>Decisión Estratégica:</label>
                                    <select value={formData.decisionRuta} onChange={(e)=>setFormData({...formData, decisionRuta: e.target.value})}>
                                        <option value="">Seleccione...</option>
                                        <option value="Consolidar">Sostener Nivel Actual</option>
                                        <option value="Certificar">Buscar Certificación ATLAS</option>
                                    </select>
                                    <label>Acción de Gobernanza:</label>
                                    <input className="sos-input-ui" type="text" onChange={(e)=>setFormData({...formData, accionGobernanza: e.target.value})} />
                                    <label>Fecha de Revisión:</label>
                                    <input className="sos-input-ui" type="date" onChange={(e)=>setFormData({...formData, fechaRevision: e.target.value})} />
                                </div>
                                <div className="actions-footer-between">
                                    <button className="btn-back" onClick={handleBack}>Atrás</button>
                                    <button className="btn-finish" onClick={handleSaveFinal} disabled={loading}>
                                        {loading ? "Cerrando Ciclo..." : "Finalizar y Guardar Reporte"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ModuloSostenerDirectivo;