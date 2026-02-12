import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseAuditar.css";

export const FaseAuditar = ({ userData, API_URL, onNavigate }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reflexion, setReflexion] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    const [formulariosFase, setFormulariosFase] = useState([]);
    const [respuestasUsuario, setRespuestasUsuario] = useState([]);
    
    const [micromodulosProgreso, setMicromodulosProgreso] = useState([]);

    // Mapeo de IDs de formularios para el cálculo de notas (Igual al de MicromodulosPage)
    const FORM_IDS_MAP = {
        1: "FORM-1770840416708",
        2: "FORM-1770840694625",
        3: "FORM-1770840767445"
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        if (!progreso) setLoading(true);
        try {
            const resProgreso = await fetch(`${API_URL}?sheet=Progreso_Fases_ATLAS&user_key=${userData.Teacher_Key}`);
            const dataProgreso = await resProgreso.json();
            const registroFase = Array.isArray(dataProgreso) ? dataProgreso.find(item => item.Fase === "AUDITAR") : null;
            
            if (registroFase) {
                setProgreso(registroFase);
                setReflexion(registroFase.Capa_3_Hito_Texto || "");
            }

            const resForms = await fetch(`${API_URL}?sheet=Config_Formularios`);
            const allForms = await resForms.json();
            const formsFaseA = Array.isArray(allForms) ? allForms.filter(f => f.Fase_ATLAS === "A") : [];
            setFormulariosFase(formsFaseA);

            const resAnswers = await fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${userData.Teacher_Key}`);
            const allAnswers = await resAnswers.json();
            setRespuestasUsuario(Array.isArray(allAnswers) ? allAnswers : []);

            const resMicros = await fetch(`${API_URL}?sheet=Progreso_Micromodulos&user_key=${userData.Teacher_Key}`);
            const allMicros = await resMicros.json();
            setMicromodulosProgreso(Array.isArray(allMicros) ? allMicros : []);

        } catch (e) {
            console.error("Error al cargar datos ATLAS:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- NUEVA FUNCIÓN: CÁLCULO DE NOTA REAL (REGLA DE TRES) ---
    const calcularNotaReal = (moduloId) => {
        const idFormBuscado = FORM_IDS_MAP[moduloId];
        
        // 1. Filtrar respuestas del examen para este módulo
        const respuestasDelModulo = respuestasUsuario.filter(r => r.ID_Form === idFormBuscado);

        // Calcular mejor intento del examen (Base 100 -> Ponderado 50%)
        const intentosMap = {};
        respuestasDelModulo.forEach(r => {
            const intentoKey = r.ID_Respuesta_Global;
            if (!intentosMap[intentoKey]) intentosMap[intentoKey] = 0;
            intentosMap[intentoKey] += (parseFloat(r.Puntos_Ganados) || 0);
        });
        const ptsBrutosExamen = Object.values(intentosMap).length > 0 ? Math.max(...Object.values(intentosMap)) : 0;
        const ptsExamenPonderado = (ptsBrutosExamen / 100) * 50;

        // 2. Foro y Actividad (25% cada uno -> Mínimo 10 caracteres)
        const actualDB = micromodulosProgreso.find(m => m.Modulo_ID.toString() === moduloId.toString());
        const ptsForo = (actualDB?.Foro_Aporte?.trim().length >= 10) ? 25 : 0;
        const ptsActividad = (actualDB?.Actividad_Texto?.trim().length >= 10) ? 25 : 0;

        return Math.min(100, ptsExamenPonderado + ptsForo + ptsActividad);
    };

    const checkFormulariosCompletos = () => {
        if (formulariosFase.length === 0) return false;
        return formulariosFase.every(form => 
            respuestasUsuario.some(resp => resp.ID_Form === form.ID_Form)
        );
    };

    const checkMicromodulosCompletos = () => {
        // Ahora validamos con la nota real calculada aquí
        const m1 = calcularNotaReal(1);
        const m2 = calcularNotaReal(2);
        const m3 = calcularNotaReal(3);
        return m1 >= 80 && m2 >= 80 && m3 >= 80;
    };

    const formsCompletos = checkFormulariosCompletos();
    const microsCompletos = checkMicromodulosCompletos();
    
    const canUnlockCapa3 = progreso?.Capa_1_Sentido === 'COMPLETADO' && formsCompletos && microsCompletos;
    const isProcessComplete = canUnlockCapa3 && progreso?.Capa_3_Hito_Texto?.length >= 100;

    const handleAceptarMarco = async () => {
        setIsSaving(true);
        const dataPayload = {
            action: progreso ? "update" : "create",
            sheet: "Progreso_Fases_ATLAS",
            rowId: progreso?.rowId || null,
            idField: "ID_Progreso",
            idValue: progreso?.ID_Progreso || null,
            data: {
                ID_Progreso: progreso?.ID_Progreso || `PROG-${Date.now()}`,
                Teacher_Key: userData.Teacher_Key,
                Fase: "AUDITAR",
                Capa_1_Sentido: "COMPLETADO",
                Fecha_Actualizacion: new Date().toISOString()
            }
        };

        try {
            await fetch(API_URL, { method: "POST", body: JSON.stringify(dataPayload) });
            await fetchInitialData();
            Swal.fire({
                title: "Compromiso Registrado",
                text: "Ha formalizado su adhesión al Marco Ético ATLAS. El diagnóstico ha sido habilitado.",
                icon: "success",
                confirmButtonColor: "#c5a059"
            });
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudo registrar el compromiso.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGuardarReto = async () => {
        if (reflexion.length < 100) {
            Swal.fire("Rigor Académico", "La evidencia requiere una profundidad analítica mayor (mínimo 100 caracteres).", "warning");
            return;
        }
        setIsSaving(true);
        const dataPayload = {
            action: "update",
            sheet: "Progreso_Fases_ATLAS",
            rowId: progreso?.rowId,
            idField: "ID_Progreso",
            idValue: progreso?.ID_Progreso,
            data: {
                Capa_3_Hito_Texto: reflexion,
                Fecha_Actualizacion: new Date().toISOString()
            }
        };
        
        try {
            await fetch(API_URL, { method: "POST", body: JSON.stringify(dataPayload) });
            await fetchInitialData();
            Swal.fire({
                title: "Hito Sincronizado",
                text: "Su Mapa de Riesgos ha sido enviado a revisión institucional.",
                icon: "success",
                confirmButtonColor: "#c5a059"
            });
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudo guardar la evidencia.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="auditar-container animate-fade-in">
            
            {(loading || isSaving) && (
                <div className="sync-status-pill-floating">
                    <span className="sync-icon">🔄</span>
                    {loading ? "Sincronizando con ATLAS..." : "Actualizando nube..."}
                </div>
            )}

            <div className="atlas-roadmap-container">
                <h2 className="roadmap-title">📍 Ruta de finalización de Auditoria ATLAS</h2>
                <div className="roadmap-steps">
                    <div className={`step-item ${progreso?.Capa_1_Sentido === 'COMPLETADO' ? 'done' : 'active'}`}>
                        <span className="step-num">{progreso?.Capa_1_Sentido === 'COMPLETADO' ? "✓" : "1"}</span>
                        <p>Marco Ético</p>
                    </div>
                    <div className={`step-item ${formsCompletos ? 'done' : (progreso?.Capa_1_Sentido === 'COMPLETADO' ? 'active' : '')}`}>
                        <span className="step-num">{formsCompletos ? "✓" : "2"}</span>
                        <p>Diagnóstico</p>
                    </div>
                    <div className={`step-item ${microsCompletos ? 'done' : (formsCompletos ? 'active' : '')}`}>
                        <span className="step-num">{microsCompletos ? "✓" : "2.5"}</span>
                        <p>Micromódulos</p>
                    </div>
                    <div className={`step-item ${isProcessComplete ? 'done' : (canUnlockCapa3 ? 'active' : '')}`}>
                        <span className="step-num">{isProcessComplete ? "✓" : "3"}</span>
                        <p>Evidencias</p>
                    </div>
                </div>
            </div>

            <div className="auditar-layers-grid">
                
                <div className={`layer-card main-entry ${progreso?.Capa_1_Sentido === 'COMPLETADO' ? 'completed' : 'pending'}`}>
                    <div className="layer-badge">A1</div>
                    <div className="layer-content">
                        <h3>Capa 1: El Sentido (Gobernanza)</h3>
                        <p className="intro-p">
                            ATLAS no es una capacitación técnica sobre herramientas de IA. Es un proceso de 
                            <strong> Auditoría Pedagógica</strong>.
                        </p>
                        <button 
                            onClick={handleAceptarMarco} 
                            disabled={progreso?.Capa_1_Sentido === 'COMPLETADO' || isSaving}
                            className={`btn-formal-action ${progreso?.Capa_1_Sentido === 'COMPLETADO' ? 'btn-done' : ''}`}
                        >
                            {progreso?.Capa_1_Sentido === 'COMPLETADO' ? "✓ Compromiso Declarado" : "Declaro Compromiso ATLAS"}
                        </button>
                    </div>
                </div>

                <div className={`layer-card side-entry ${progreso?.Capa_1_Sentido !== 'COMPLETADO' ? 'locked' : ''}`}>
                    <div className="layer-badge">A2</div>
                    <div className="layer-content">
                        <h3>Capa 2: El Diagnóstico (Data-Driven)</h3>
                        <div className="forms-status-list">
                            {formulariosFase.map(f => {
                                const respondido = respuestasUsuario.some(r => r.ID_Form === f.ID_Form);
                                return (
                                    <div key={f.ID_Form} className={`form-mini-status ${respondido ? 'is-ok' : 'is-pending'}`}>
                                        <span className="f-title">{f.Titulo_Form}</span>
                                        <span className="f-check">{respondido ? "✅" : "⏳"}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="status-indicator-box">
                            {progreso?.Capa_1_Sentido === 'COMPLETADO' ? (
                                formsCompletos ? <span className="status-tag success">✅ Completo</span> :
                                <button className="btn-go-diagnostic" onClick={() => onNavigate('responder_fase', 'A')}>Ir a Bitácora</button>
                            ) : <span className="status-tag locked">🔒 Bloqueado</span>}
                        </div>
                    </div>
                </div>

                <div className={`layer-card micro-entry ${!formsCompletos ? 'locked' : ''}`}>
                    <div className="layer-badge">A2.5</div>
                    <div className="layer-content">
                        <h3>Capa 2.5: Micromódulos de Profundización</h3>
                        <p>Formación especializada en ética y auditoría algorítmica.</p>
                        
                        <div className="micros-progress-grid">
                            {[1, 2, 3].map(id => {
                                // LLAMADA A LA FUNCIÓN DE CÁLCULO REAL
                                const notaReal = calcularNotaReal(id);
                                return (
                                    <div key={id} className={`micro-pill ${notaReal >= 80 ? 'passed' : 'pending'}`}>
                                        <span className="m-label">M{id}</span>
                                        <span className="m-score">{notaReal.toFixed(1)}%</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="status-indicator-box">
                            {!formsCompletos ? (
                                <span className="status-tag locked">🔒 Bloqueado: Finalice Diagnóstico</span>
                            ) : (
                                <button 
                                    className={`btn-go-micros ${microsCompletos ? 'btn-done' : ''}`}
                                    onClick={() => onNavigate('micromodulos_fase', 'A')}
                                >
                                    {microsCompletos ? "✓ Módulos Completados" : "Ir a Estudiar Micromódulos"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {canUnlockCapa3 ? (
                <section className="reto-section animate-slide-up">
                    <div className="reto-card-full">
                        <div className="reto-header">
                            <div className="icon-box-gold">🎓</div>
                            <div>
                                <h2>Hito de Evidencia: Mapa de Riesgos Pedagógicos</h2>
                                <p className="reto-subtitle">Consolidación de Criterio Profesional</p>
                            </div>
                        </div>
                        <div className="reto-body">
                            <textarea 
                                className="reto-textarea-premium"
                                placeholder="Escriba aquí su análisis detallado..."
                                value={reflexion}
                                onChange={(e) => setReflexion(e.target.value)}
                            ></textarea>
                            <button className="btn-save-reto-atlas-full" onClick={handleGuardarReto} disabled={isSaving}>
                                {isSaving ? "Sincronizando..." : "Enviar Hito a Auditoría Institucional"}
                            </button>
                        </div>
                    </div>
                </section>
            ) : (
                <div className="locked-section-notice">
                    <p>🔒 El <strong>Hito de Evidencia (Capa 3)</strong> se habilitará tras completar el Diagnóstico y los Micromódulos con nota superior a 80%.</p>
                </div>
            )}
        </div>
    );
};