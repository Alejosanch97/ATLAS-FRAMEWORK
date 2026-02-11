import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseAuditar.css";

export const FaseAuditar = ({ userData, API_URL, onNavigate }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reflexion, setReflexion] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Estados para la validación de formularios de la Fase A (Auditar)
    const [formulariosFase, setFormulariosFase] = useState([]);
    const [respuestasUsuario, setRespuestasUsuario] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        // Solo mostramos loading total la primera vez si no hay datos
        if (!progreso) setLoading(true);
        try {
            // 1. Obtener progreso de las fases para este usuario
            const resProgreso = await fetch(`${API_URL}?sheet=Progreso_Fases_ATLAS&user_key=${userData.Teacher_Key}`);
            const dataProgreso = await resProgreso.json();
            const registroFase = Array.isArray(dataProgreso) ? dataProgreso.find(item => item.Fase === "AUDITAR") : null;
            
            if (registroFase) {
                setProgreso(registroFase);
                setReflexion(registroFase.Capa_3_Hito_Texto || "");
            }

            // 2. Traer configuración de formularios para filtrar los de Fase A
            const resForms = await fetch(`${API_URL}?sheet=Config_Formularios`);
            const allForms = await resForms.json();
            const formsFaseA = Array.isArray(allForms) ? allForms.filter(f => f.Fase_ATLAS === "A") : [];
            setFormulariosFase(formsFaseA);

            // 3. Traer las respuestas del usuario para verificar completitud
            const resAnswers = await fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${userData.Teacher_Key}`);
            const allAnswers = await resAnswers.json();
            setRespuestasUsuario(Array.isArray(allAnswers) ? allAnswers : []);

        } catch (e) {
            console.error("Error al cargar datos ATLAS:", e);
        } finally {
            setLoading(false);
        }
    };

    // Lógica para determinar si la Capa 2 está completa
    const checkFormulariosCompletos = () => {
        if (formulariosFase.length === 0) return false;
        // Verifica que para cada formulario de la Fase A exista al menos una respuesta del usuario
        return formulariosFase.every(form => 
            respuestasUsuario.some(resp => resp.ID_Form === form.ID_Form)
        );
    };

    const formsCompletos = checkFormulariosCompletos();
    const canUnlockCapa3 = progreso?.Capa_1_Sentido === 'COMPLETADO' && formsCompletos;
    // El proceso se considera cerrado si ya existe texto guardado en la Capa 3
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
        
        // Actualizamos el estado local inmediatamente para que la UI responda (Envío Optimista)
        const updatedProgreso = { ...progreso, Capa_3_Hito_Texto: reflexion };
        setProgreso(updatedProgreso);

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

        // Mostramos el mensaje de éxito de una vez
        Swal.fire({
            title: "Hito Sincronizado",
            text: "Su Mapa de Riesgos ha sido enviado a revisión institucional. La nube se actualizará en segundo plano.",
            icon: "success",
            confirmButtonColor: "#c5a059"
        });

        try {
            // Ejecutamos la petición sin bloquear al usuario con el await del mensaje
            fetch(API_URL, { method: "POST", body: JSON.stringify(dataPayload) })
                .then(() => fetchInitialData()) // Refresca los datos reales cuando termine
                .finally(() => setIsSaving(false));
            
        } catch (e) {
            console.error(e);
            setIsSaving(false);
            Swal.fire("Error", "Hubo un problema al subir la evidencia, pero su progreso local se mantiene.", "error");
        }
    };

    return (
        <div className="auditar-container animate-fade-in">
            
            {/* PÍLDORA DE CARGA SUPERIOR */}
            {(loading || isSaving) && (
                <div className="sync-status-pill-floating">
                    <span className="sync-icon">🔄</span>
                    {loading ? "Sincronizando con ATLAS..." : "Actualizando nube..."}
                </div>
            )}

            {/* RUTA VISUAL HACIA LA CERTIFICACIÓN */}
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
                    <div className={`step-item ${isProcessComplete ? 'done' : (canUnlockCapa3 ? 'active' : '')}`}>
                        <span className="step-num">{isProcessComplete ? "✓" : "3"}</span>
                        <p>Evidencias</p>
                    </div>
                    <div className={`step-item last ${isProcessComplete ? 'done' : ''}`}>
                        <span className="step-num">{isProcessComplete ? "🏆" : "⏳"}</span>
                        <p>{isProcessComplete ? "Cierre" : "Pendiente"}</p>
                    </div>
                </div>
            </div>

            <div className="auditar-layers-grid">
                
                {/* CAPA 1: EL SENTIDO */}
                <div className={`layer-card main-entry ${progreso?.Capa_1_Sentido === 'COMPLETADO' ? 'completed' : 'pending'}`}>
                    <div className="layer-badge">A1</div>
                    <div className="layer-content">
                        <h3>Capa 1: El Sentido (Gobernanza)</h3>
                        <p className="intro-p">
                            ATLAS no es una capacitación técnica sobre herramientas de IA. Es un proceso de 
                            <strong> Auditoría Pedagógica</strong> para garantizar el uso con criterio profesional y responsabilidad ética.
                        </p>
                        
                        <div className="manifesto-highlights">
                            <h4>En esta etapa fundamental usted reconocerá:</h4>
                            <ul>
                                <li>Soberanía de datos y ética en entornos educativos.</li>
                                <li>Detección de sesgos algorítmicos y riesgos cognitivos.</li>
                                <li>Preservación de la autonomía intelectual del estudiante.</li>
                            </ul>
                        </div>

                        <div className="impact-box-formal">
                            <strong>Impacto Institucional:</strong>
                            <p>Esta etapa habilita su proceso. Establece el compromiso profesional necesario para la certificación.</p>
                        </div>

                        <button 
                            onClick={handleAceptarMarco} 
                            disabled={progreso?.Capa_1_Sentido === 'COMPLETADO' || isSaving}
                            className={`btn-formal-action ${progreso?.Capa_1_Sentido === 'COMPLETADO' ? 'btn-done' : ''}`}
                        >
                            {progreso?.Capa_1_Sentido === 'COMPLETADO' 
                                ? "✓ Compromiso Profesional Declarado" 
                                : "Declaro Compromiso con el Proceso ATLAS"}
                        </button>
                    </div>
                </div>

                {/* CAPA 2: EL DIAGNÓSTICO (DATA-DRIVEN) */}
                <div className={`layer-card side-entry ${progreso?.Capa_1_Sentido !== 'COMPLETADO' ? 'locked' : ''}`}>
                    <div className="layer-badge">A2</div>
                    <div className="layer-content">
                        <h3>Capa 2: El Diagnóstico (Data-Driven)</h3>
                        <p>Identificación de brechas entre los lineamientos institucionales y la práctica real.</p>
                        
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
                            {progreso?.Capa_1_Sentido === 'COMPLETADO' 
                                ? (
                                    formsCompletos 
                                    ? <span className="status-tag success">✅ Diagnóstico Completo</span>
                                    : <button 
                                        className="btn-go-diagnostic"
                                        onClick={() => onNavigate('responder_fase', 'A')}
                                      >
                                        Ir a Bitácora de Diagnóstico
                                      </button>
                                )
                                : <span className="status-tag locked">🔒 Bloqueado: Requiere Capa 1</span>
                            }
                        </div>
                    </div>
                </div>

            </div>

            {/* SECCIÓN DEL RETO - CAPA 3: DISEÑO EXPANDIDO */}
            {canUnlockCapa3 ? (
                <section className="reto-section animate-slide-up">
                    <div className="reto-card-full">
                        <div className="reto-header">
                            <div className="icon-box-gold">🎓</div>
                            <div>
                                <h2>Hito de Evidencia: Mapa de Riesgos Pedagógicos</h2>
                                <p className="reto-subtitle">Fase Auditar - Consolidación de Criterio Profesional</p>
                            </div>
                        </div>
                        
                        <div className="reto-body">
                            <div className="reto-instrucciones-formal">
                                <p>Para completar la Fase Auditar, realice un ejercicio de <strong>Metacognición Curricular</strong>:</p>
                                <ol>
                                    <li>Identifique una unidad de aprendizaje vulnerable a la automatización acrítica.</li>
                                    <li>Describa su estrategia para verificar la autoría humana y el juicio crítico.</li>
                                </ol>
                            </div>

                            <div className="textarea-container">
                                <textarea 
                                    className="reto-textarea-premium"
                                    placeholder="Escriba aquí su análisis detallado y propuesta de mitigación..."
                                    value={reflexion}
                                    onChange={(e) => setReflexion(e.target.value)}
                                ></textarea>
                                <div className="char-count">
                                    {reflexion.length} / 100 caracteres mínimos (Rigor Académico)
                                </div>
                            </div>

                            <button 
                                className="btn-save-reto-atlas-full" 
                                onClick={handleGuardarReto} 
                                disabled={isSaving}
                            >
                                {isSaving ? "Sincronizando con ATLAS..." : "Enviar Hito a Auditoría Institucional"}
                            </button>
                        </div>
                    </div>
                </section>
            ) : (
                <div className="locked-section-notice">
                    <p>🔒 El <strong>Hito de Evidencia (Capa 3)</strong> se habilitará cuando completes el Compromiso Ético y el Diagnóstico de la Fase A.</p>
                </div>
            )}
        </div>
    );
};