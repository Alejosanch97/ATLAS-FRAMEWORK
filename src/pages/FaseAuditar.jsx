import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseAuditar.css";

export const FaseAuditar = ({ userData, API_URL, onNavigate, existingResponses = [], existingForms = [] }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reflexion, setReflexion] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    const [formulariosFase, setFormulariosFase] = useState([]);
    const [respuestasUsuario, setRespuestasUsuario] = useState([]);
    
    const [micromodulosProgreso, setMicromodulosProgreso] = useState([]);

    const FORM_IDS_MAP = {
        1: "FORM-1770840416708",
        2: "FORM-1770840694625",
        3: "FORM-1770840767445"
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        // Solo activamos loading si es la primera carga para evitar parpadeos
        if (!progreso) setLoading(true);

        try {
            // 1. LANZAMOS TODO EN PARALELO (Ráfaga ATLAS)
            const [resProgreso, resForms, resAnswers, resMicros] = await Promise.all([
                fetch(`${API_URL}?sheet=Progreso_Fases_ATLAS&user_key=${userData.Teacher_Key}`),
                fetch(`${API_URL}?sheet=Config_Formularios`),
                fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${userData.Teacher_Key}`),
                fetch(`${API_URL}?sheet=Progreso_Micromodulos&user_key=${userData.Teacher_Key}`)
            ]);

            // 2. PROCESAMOS JSON EN PARALELO
            const [dataProgreso, allForms, allAnswers, allMicros] = await Promise.all([
                resProgreso.json(),
                resForms.json(),
                resAnswers.json(),
                resMicros.json()
            ]);

            // 3. ACTUALIZACIÓN DE ESTADOS (React agrupa estos cambios en un solo render)

            // Registro de Fase
            const registroFase = Array.isArray(dataProgreso) ? dataProgreso.find(item => item.Fase === "AUDITAR") : null;
            if (registroFase) {
                setProgreso(registroFase);
                setReflexion(registroFase.Capa_3_Hito_Texto || "");
            }

            // Filtrado de Formularios por Rol
            let formsFaseA = Array.isArray(allForms) ? allForms.filter(f => f.Fase_ATLAS === "A") : [];
            const ID_RELEVANTE = userData.Rol === "DIRECTIVO" ? "FORM-1770695655576" : "FORM-1770684713222";

            // Si es ADMIN verá ambos, si no, solo el de su rol
            if (userData.Rol !== "ADMIN") {
                formsFaseA = formsFaseA.filter(f => f.ID_Form === ID_RELEVANTE);
            }

            setFormulariosFase(formsFaseA);
            setRespuestasUsuario(Array.isArray(allAnswers) ? allAnswers : []);
            setMicromodulosProgreso(Array.isArray(allMicros) ? allMicros : []);

        } catch (e) {
            console.error("Error crítico en sincronización ATLAS:", e);
        } finally {
            setLoading(false);
        }
    };

    const calcularNotaReal = (moduloId) => {
        const idFormBuscado = FORM_IDS_MAP[moduloId];
        const respuestasDelModulo = respuestasUsuario.filter(r => r.ID_Form === idFormBuscado);

        const intentosMap = {};
        respuestasDelModulo.forEach(r => {
            const intentoKey = r.ID_Respuesta_Global;
            if (!intentosMap[intentoKey]) intentosMap[intentoKey] = 0;
            intentosMap[intentoKey] += (parseFloat(r.Puntos_Ganados) || 0);
        });
        const ptsBrutosExamen = Object.values(intentosMap).length > 0 ? Math.max(...Object.values(intentosMap)) : 0;
        const ptsExamenPonderado = (ptsBrutosExamen / 100) * 50;

        const actualDB = micromodulosProgreso.find(m => m.Modulo_ID.toString() === moduloId.toString());
        const ptsForo = (actualDB?.Foro_Aporte?.trim().length >= 10) ? 25 : 0;
        const ptsActividad = (actualDB?.Actividad_Texto?.trim().length >= 10) ? 25 : 0;

        return Math.min(100, ptsExamenPonderado + ptsForo + ptsActividad);
    };

    const checkFormulariosCompletos = () => {
        if (formulariosFase.length === 0) return false;
        // --- CORRECCIÓN: CALIFICA EL FINALIZADO SEGÚN EL FORMULARIO CORRESPONDIENTE AL ROL ---
        return formulariosFase.every(form => 
            respuestasUsuario.some(resp => resp.ID_Form === form.ID_Form)
        );
    };

    // LOGICA COMENTADA PERO MANTENIDA
    /*
    const checkMicromodulosCompletos = () => {
        const m1 = calcularNotaReal(1);
        const m2 = calcularNotaReal(2);
        const m3 = calcularNotaReal(3);
        return m1 >= 80 && m2 >= 80 && m3 >= 80;
    };
    */

    const formsCompletos = checkFormulariosCompletos();
    // NUEVA LOGICA: El proceso se completa solo con los dos primeros pasos
    const isProcessComplete = progreso?.Capa_1_Sentido === 'COMPLETADO' && formsCompletos;

    // --- NUEVO: EFFECT PARA POP-UP DE FELICITACIONES ---
    useEffect(() => {
        if (isProcessComplete && !loading) {
            Swal.fire({
                title: "¡Felicitaciones!",
                text: "Has completado con éxito la primera etapa de Auditoría ATLAS.",
                icon: "success",
                confirmButtonColor: "#c5a059",
                timer: 5000,
                timerProgressBar: true,
                backdrop: `rgba(197, 160, 89, 0.2)`
            });
        }
    }, [isProcessComplete, loading]);

    const handleAceptarMarco = async () => {
        // --- MEJORA DE VELOCIDAD: ACTUALIZACIÓN OPTIMISTA ---
        // Definimos el objeto temporal para que la UI cambie de inmediato
        const optimisticProgreso = {
            ...progreso,
            Capa_1_Sentido: "COMPLETADO",
            ID_Progreso: progreso?.ID_Progreso || `PROG-${Date.now()}`,
            Fase: "AUDITAR"
        };

        // Actualizamos estado local inmediatamente para desbloquear Capa 2
        setProgreso(optimisticProgreso);
        
        // Mostramos alerta rápido
        Swal.fire({
            title: "Compromiso Registrado",
            text: "Ha formalizado su adhesión al Marco Ético ATLAS. El diagnóstico ha sido habilitado.",
            icon: "success",
            confirmButtonColor: "#c5a059",
            timer: 2000
        });

        setIsSaving(true);
        const dataPayload = {
            action: progreso ? "update" : "create",
            sheet: "Progreso_Fases_ATLAS",
            rowId: progreso?.rowId || null,
            idField: "ID_Progreso",
            idValue: optimisticProgreso.ID_Progreso,
            data: {
                ...optimisticProgreso,
                Teacher_Key: userData.Teacher_Key,
                Fecha_Actualizacion: new Date().toISOString()
            }
        };

        try {
            // Se envía en segundo plano
            await fetch(API_URL, { method: "POST", body: JSON.stringify(dataPayload) });
            // Sincronizamos datos finales sin bloquear al usuario
            const resProgreso = await fetch(`${API_URL}?sheet=Progreso_Fases_ATLAS&user_key=${userData.Teacher_Key}`);
            const dataProgreso = await resProgreso.json();
            const registroFase = Array.isArray(dataProgreso) ? dataProgreso.find(item => item.Fase === "AUDITAR") : null;
            if (registroFase) setProgreso(registroFase);
        } catch (e) {
            console.error(e);
            // Si falla, podrías revertir si fuera crítico, pero aquí priorizamos fluidez
        } finally {
            setIsSaving(false);
        }
    };

    // FUNCIÓN MANTENIDA POR SI SE HABILITA CAPA 3 LUEGO
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
            
            {/* NUEVO: BOTÓN DE VOLVER */}
            <div className="nav-back-container" style={{ marginBottom: '20px' }}>
                <button 
                    className="btn-back-minimal" 
                    onClick={() => onNavigate('overview')}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#fff',
                        border: '1px solid #c5a059',
                        borderRadius: '8px',
                        color: '#c5a059',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ⬅ Volver al Panel
                </button>
            </div>

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
                    {/* El paso 2 ahora marca "done" si el proceso completo se cumple (Capa 1 + Forms) */}
                    <div className={`step-item ${isProcessComplete ? 'done' : (progreso?.Capa_1_Sentido === 'COMPLETADO' ? 'active' : '')}`}>
                        <span className="step-num">{isProcessComplete ? "✓" : "2"}</span>
                        <p>Diagnóstico</p>
                    </div>

                    {/* SECCIÓN 2.5 Y 3 COMENTADAS EN EL ROADMAP */}
                    {/* <div className={`step-item ${microsCompletos ? 'done' : (formsCompletos ? 'active' : '')}`}>
                        <span className="step-num">{microsCompletos ? "✓" : "2.5"}</span>
                        <p>Micromódulos</p>
                    </div>
                    <div className={`step-item ${isProcessComplete ? 'done' : (canUnlockCapa3 ? 'active' : '')}`}>
                        <span className="step-num">{isProcessComplete ? "✓" : "3"}</span>
                        <p>Evidencias</p>
                    </div> 
                    */}
                </div>
            </div>

            <div className="auditar-layers-grid">
                
                <div className={`layer-card main-entry ${progreso?.Capa_1_Sentido === 'COMPLETADO' ? 'completed' : 'pending'}`}>
                    <div className="layer-badge">A1</div>
                    <div className="layer-content">
                        <h3>Capa 1: El Sentido (Gobernanza)</h3>
                        <p className="intro-p">
                            ATLAS no es una capacitación técnica sobre herramientas de IA. Es un proceso de 
                            <strong> Auditoría Pedagógica y Gobernanza Institucional</strong>.
                            Declarar este compromiso significa asumir la responsabilidad de integrar la inteligencia artificial
                            con criterio ético, intención pedagógica y evidencia documentada.
                            Este es el punto de partida para una implementación consciente, regulada y estratégica en tu práctica educativa.
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

                {/* SECCIÓN DE MICROMÓDULOS 2.5 COMENTADA */}
                {/* <div className={`layer-card micro-entry ${!formsCompletos ? 'locked' : ''}`}>
                    <div className="layer-badge">A2.5</div>
                    <div className="layer-content">
                        <h3>Capa 2.5: Micromódulos de Profundización</h3>
                        <p>Formación especializada en ética y auditoría algorítmica.</p>
                        
                        <div className="micros-progress-grid">
                            {[1, 2, 3].map(id => {
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
                */}
            </div>

            {/* SECCIÓN DE HITO DE EVIDENCIA (CAPA 3) COMENTADA */}
            {/* {isProcessComplete ? (
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
                    <p>🔒 El <strong>Hito de Evidencia (Capa 3)</strong> se habilitará tras completar el Diagnóstico.</p>
                </div>
            )} 
            */}
        </div>
    );
};