import React, { useState, useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostenerDirectivo.css";

const ModuloSostenerDirectivo = ({ userData, API_URL, onNavigate, datosAuditar, datosAsegurar, datosDocentesAgregados }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        reflexionInicial: "",
        cumplimientoPlan: "En proceso",
        analisisImplementacion: "",
        analisisEstadoActual: "",
        decisionRuta: "",
        prioridadEstrategica: "",
        accionGobernanza: "",
        indicadorMedible: "",
        fechaRevision: "",
        estrategiaComunicacion: ""
    });

    // Datos simulados o derivados de props para visualización
    const nivelActualCalculado = datosDocentesAgregados?.promedioGlobal || 3.2;
    const sugerenciaRuta = nivelActualCalculado >= 3.8 ? "Certificación" : "Consolidación";

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSaveFinal = async () => {
        setLoading(true);
        const payload = {
            action: "create",
            sheet: "SOSTENER_Institucional",
            data: {
                Teacher_Key: userData.Teacher_Key,
                Fecha: new Date().toLocaleDateString(),
                ...formData,
                Nivel_Final_Institucional: nivelActualCalculado,
                Sugerencia_Sistema: sugerenciaRuta
            }
        };

        try {
            await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
            Swal.fire("Ciclo Cerrado", "La Hoja de Ruta Institucional ha sido generada con éxito.", "success");
            onNavigate('overview');
        } catch (e) {
            Swal.fire("Error", "No se pudo guardar el reporte.", "error");
        } finally { setLoading(false); }
    };

    return (
        <div className="sostener-directivo-master">
            <header className="sos-dir-header">
                <div className="header-info">
                    <button className="btn-exit-sos" onClick={() => onNavigate('overview')}>⬅ Salir al Mapa</button>
                    <h1>Cierre Institucional ATLAS</h1>
                    <span className="badge-step">Bloque {step} de 5</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
                </div>
            </header>

            <main className="sos-dir-content">
                
                {/* BLOQUE 1: ANTES (AUDITAR) */}
                {step === 1 && (
                    <div className="sos-step-container animate-fade-in">
                        <div className="sos-comparative-card">
                            <div className="sos-side-info">
                                <h3>Punto de Partida (Fase AUDITAR)</h3>
                                <div className="data-pill">Nivel Inicial: <strong>{datosAuditar?.nivel || "Nivel 2"}</strong></div>
                                <div className="data-pill">Brecha Crítica: <strong>{datosAuditar?.brecha || "Ética y Privacidad"}</strong></div>
                                <div className="risks-list">
                                    <p>Riesgos Detectados:</p>
                                    <ul>
                                        <li>Falta de política formal de IA</li>
                                        <li>Baja supervisión en aula</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="sos-input-area">
                                <h4>Reflexión de Liderazgo</h4>
                                <p>¿Qué decisiones estratégicas eran reactivas o desarticuladas al inicio?</p>
                                <textarea 
                                    placeholder="Mínimo 300 caracteres..."
                                    value={formData.reflexionInicial}
                                    onChange={(e) => setFormData({...formData, reflexionInicial: e.target.value})}
                                />
                                <button className="btn-sos-next" disabled={formData.reflexionInicial.length < 10} onClick={handleNext}>Siguiente Bloque</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* BLOQUE 2: IMPLEMENTADO (ASEGURAR) */}
                {step === 2 && (
                    <div className="sos-step-container animate-fade-in">
                        <div className="sos-plan-summary">
                            <h3>Lo que implementaste (Fase ASEGURAR)</h3>
                            <div className="plan-review-box">
                                <p><strong>Objetivo:</strong> {datosAsegurar?.objetivo || "Institucionalizar el uso de prompts éticos."}</p>
                                <div className="compliance-selector">
                                    <label>Grado de cumplimiento:</label>
                                    <select value={formData.cumplimientoPlan} onChange={(e)=>setFormData({...formData, cumplimientoPlan: e.target.value})}>
                                        <option>En proceso</option>
                                        <option>Parcialmente logrado</option>
                                        <option>Consolidado</option>
                                    </select>
                                </div>
                            </div>
                            <textarea 
                                placeholder="Resistencias, ajustes y acciones consolidadas (mínimo 300 caracteres)..."
                                value={formData.analisisImplementacion}
                                onChange={(e) => setFormData({...formData, analisisImplementacion: e.target.value})}
                            />
                            <div className="btn-group-sos">
                                <button onClick={handleBack} className="btn-sos-back-ui">Atrás</button>
                                <button onClick={handleNext} disabled={formData.analisisImplementacion.length < 10} className="btn-sos-next">Continuar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* BLOQUE 3: AHORA (ESTADO ACTUAL) */}
                {step === 3 && (
                    <div className="sos-step-container animate-fade-in">
                        <div className="sos-now-grid">
                            <div className="sos-stats-view">
                                <h3>Estado Actual Institucional</h3>
                                <div className="growth-indicator">Crecimiento: +18%</div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <RadarChart data={[
                                        { s: 'Pedagogía', A: 2.5, B: 3.8 },
                                        { s: 'Ética', A: 1.8, B: 4.2 },
                                        { s: 'Impacto', A: 2.2, B: 3.5 },
                                        { s: 'Desarrollo', A: 2.0, B: 4.0 },
                                    ]}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="s" />
                                        <Radar name="Inicial" dataKey="A" stroke="#ccc" fill="#ccc" fillOpacity={0.3} />
                                        <Radar name="Actual" dataKey="B" stroke="#c5a059" fill="#c5a059" fillOpacity={0.6} />
                                        <Legend />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="sos-analysis-view">
                                <h4>Análisis de Madurez</h4>
                                <textarea 
                                    placeholder="¿Cómo se garantiza ahora la supervisión humana? (mínimo 350 caracteres)..."
                                    value={formData.analisisEstadoActual}
                                    onChange={(e) => setFormData({...formData, analisisEstadoActual: e.target.value})}
                                />
                                <div className="btn-group-sos">
                                    <button onClick={handleBack} className="btn-sos-back-ui">Atrás</button>
                                    <button onClick={handleNext} disabled={formData.analisisEstadoActual.length < 10} className="btn-sos-next">Ver Comparativa</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* BLOQUE 4: COMPARATIVA ANTES/DESPUÉS */}
                {step === 4 && (
                    <div className="sos-step-container animate-fade-in">
                        <div className="sos-visual-report">
                            <h3>Evolución Institucional COMPASS</h3>
                            <div className="visual-split">
                                <div className="visual-before">
                                    <span className="tag-red">ANTES</span>
                                    <ul>
                                        <li>Nivel: {datosAuditar?.nivel || "Inicial"}</li>
                                        <li>Riesgos estructurales altos</li>
                                        <li>60% Docentes Nivel 1</li>
                                    </ul>
                                </div>
                                <div className="visual-after">
                                    <span className="tag-green">DESPUÉS</span>
                                    <ul>
                                        <li>Nivel: {nivelActualCalculado}</li>
                                        <li>Cultura de uso responsable</li>
                                        <li>75% Docentes Nivel 3-4</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="sos-indicators-check">
                                <div>✔ Reducción de riesgo estructural</div>
                                <div>✔ Política de supervisión activa</div>
                            </div>
                            <div className="btn-group-sos">
                                <button onClick={handleBack} className="btn-sos-back-ui">Atrás</button>
                                <button onClick={handleNext} className="btn-sos-next">Proyectar Futuro</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* BLOQUE 5: PROYECTAR */}
                {step === 5 && (
                    <div className="sos-step-container animate-fade-in">
                        <div className="sos-projection-form">
                            <div className="suggestion-banner">
                                Basado en el nivel <strong>{nivelActualCalculado}</strong>, el sistema sugiere: 
                                <span className="sugerencia-pill">{sugerenciaRuta}</span>
                            </div>
                            
                            <div className="projection-grid">
                                <div className="proj-group">
                                    <label>Decisión Estratégica:</label>
                                    <select value={formData.decisionRuta} onChange={(e)=>setFormData({...formData, decisionRuta: e.target.value})}>
                                        <option value="">Selecciona...</option>
                                        <option value="Consolidar">Consolidar y Sostener</option>
                                        <option value="Certificar">Avanzar a Certificación ATLAS</option>
                                    </select>
                                </div>
                                <div className="proj-group">
                                    <label>Prioridad Estratégica:</label>
                                    <input type="text" onChange={(e)=>setFormData({...formData, prioridadEstrategica: e.target.value})} />
                                </div>
                                <div className="proj-group">
                                    <label>Acción de Gobernanza:</label>
                                    <input type="text" onChange={(e)=>setFormData({...formData, accionGobernanza: e.target.value})} />
                                </div>
                                <div className="proj-group">
                                    <label>Revisión Periódica:</label>
                                    <input type="date" onChange={(e)=>setFormData({...formData, fechaRevision: e.target.value})} />
                                </div>
                                <div className="proj-group full">
                                    <label>Estrategia de Comunicación de Cultura:</label>
                                    <textarea onChange={(e)=>setFormData({...formData, estrategiaComunicacion: e.target.value})} />
                                </div>
                            </div>

                            <div className="btn-group-sos">
                                <button onClick={handleBack} className="btn-sos-back-ui">Atrás</button>
                                <button onClick={handleSaveFinal} disabled={loading} className="btn-sos-finish">
                                    {loading ? "Generando Hoja de Ruta..." : "Finalizar Ciclo ATLAS e Iniciar Siguiente"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ModuloSostenerDirectivo;