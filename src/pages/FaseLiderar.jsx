import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseTransformar.css"; // Reutilizamos estilos por coherencia visual

const FaseLiderar = ({ userData, API_URL, onNavigate, onRefreshProgreso }) => {
    // ESTADOS BASADOS EN TU FASE TRANSFORMAR
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retosCompletados, setRetosCompletados] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    
    // NUEVO ESTADO: Para mostrar el reporte directamente aquí sin navegar
    const [verReporte, setVerReporte] = useState(false);
    const [datosPrompt, setDatosPrompt] = useState(null);

    // Identificador de Rol
    const isDirectivo = userData.Rol === "DIRECTIVO";

    // CARGA DE DATOS
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Obtener progreso general de la fase LIDERAR
            const resProgreso = await fetch(`${API_URL}?sheet=Progreso_Fases_ATLAS&user_key=${userData.Teacher_Key}`);
            const dataProgreso = await resProgreso.json();
            const registro = Array.isArray(dataProgreso) ? dataProgreso.find(item => item.Fase === "LIDERAR") : null;
            
            if (registro) {
                setProgreso(registro);
            }

            // 2. Obtener misiones desde la hoja de Prompts
            const resRetos = await fetch(`${API_URL}?sheet=Liderar_Prompts_Docentes&user_key=${userData.Teacher_Key}`);
            const dataRetos = await resRetos.json();
            
            if (Array.isArray(dataRetos)) {
                // Buscamos el registro específico de este usuario
                const registroUser = dataRetos.find(r => r.Teacher_Key === userData.Teacher_Key);
                
                if (registroUser && registroUser.Status === 'completed') {
                    setRetosCompletados([1, 2]); // Desbloqueamos ambos visualmente
                    setDatosPrompt(registroUser); // Guardamos los datos para el semáforo
                }
            }
        } catch (e) {
            console.error("Error cargando Liderar:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAceptarFase = async () => {
        if (progreso?.Capa_1_Sentido === 'COMPLETADO') {
            setShowIntro(false);
            return;
        }

        setIsSaving(true);
        const nuevoID = progreso?.ID_Progreso || `PROG-L-${Date.now()}`;
        
        const dataPayload = {
            action: progreso ? "update" : "create",
            sheet: "Progreso_Fases_ATLAS",
            idField: "ID_Progreso",
            idValue: nuevoID,
            data: {
                Teacher_Key: userData.Teacher_Key,
                Fase: "LIDERAR",
                Capa_1_Sentido: "COMPLETADO",
                Fecha_Actualizacion: new Date().toISOString()
            }
        };

        try {
            await fetch(API_URL, { 
                method: "POST", 
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(dataPayload) 
            });

            setProgreso({ ...progreso, Capa_1_Sentido: 'COMPLETADO', ID_Progreso: nuevoID });
            setShowIntro(false); 
            
            if (onRefreshProgreso) await onRefreshProgreso();

            Swal.fire({
                title: "Protocolo Activado",
                text: "Has ingresado oficialmente al Laboratorio Ético de Liderazgo.",
                icon: "success",
                confirmButtonColor: "#c5a059"
            });
        } catch (e) {
            console.error("Error:", e);
            Swal.fire("Error", "No se pudo sincronizar el inicio de fase. Intenta de nuevo.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper para determinar color del semáforo basado en nivel 1-5
    const getSemaforoColor = (nivel) => {
        const n = Number(nivel);
        if (n >= 4.5) return "#22c55e"; // Verde Esmeralda (Excelente)
        if (n >= 3.5) return "#84cc16"; // Verde Lima (Bueno)
        if (n >= 2.5) return "#eab308"; // Amarillo (Riesgo Moderado)
        return "#ef4444"; // Rojo (Riesgo Alto)
    };

    // FUNCIÓN DE ANÁLISIS DINÁMICO (Lógica para determinar el texto del índice global)
    const getTextoIndiceATLAS = () => {
        if (!datosPrompt) return "No evaluado";
        const promedio = (Number(datosPrompt.Puntaje_Etica) + 
                          Number(datosPrompt.Puntaje_Privacidad) + 
                          Number(datosPrompt.Puntaje_Agencia) + 
                          Number(datosPrompt.Puntaje_Dependencia)) / 4;
        
        if (promedio >= 4.5) return "Liderazgo Responsable";
        if (promedio >= 3.5) return "Uso Seguro con Mejora";
        if (promedio >= 2.5) return "Riesgo Moderado (Requiere ajuste)";
        return "Riesgo Alto / No Aprobado";
    };

    const getInterpretacionDinamica = (dimension, valor) => {
        const v = Number(valor);
        const textos = {
            etica: {
                bajo: "Riesgo Ético Detectado: El prompt parece inducir juicios de valor, etiquetas sociales o clasificaciones que podrían generar sesgos de exclusión.",
                medio: "Cumplimiento Ético Parcial: Aunque el lenguaje es profesional, faltan instrucciones explícitas para evitar alucinaciones o prejuicios algorítmicos.",
                alto: "Liderazgo Ético: Tu instrucción garantiza un trato equitativo y protege la integridad moral de los sujetos involucrados."
            },
            privacidad: {
                bajo: "Alerta de Seguridad: Se detectó el uso de datos sensibles (nombres, correos o IDs). Esto viola los marcos de protección de datos internacionales.",
                medio: "Privacidad Estándar: No hay datos críticos, pero se recomienda el uso de datos sintéticos o anonimización total para evitar re-identificación.",
                alto: "Protocolo Seguro: Gestión impecable de la información. Cero exposición de datos sensibles conforme a la AI Act."
            },
            agencia: {
                bajo: "Delegación Crítica: Estás permitiendo que la IA tome decisiones pedagógicas definitivas (calificar/decidir) sin supervisión humana obligatoria.",
                medio: "Agencia Compartida: La IA propone y tú supervisas, pero los límites de la autoridad docente podrían ser más estrictos.",
                alto: "Soberanía Docente: La IA se mantiene estrictamente como asistente. La decisión pedagógica final reside 100% en tu criterio experto."
            },
            dependencia: {
                bajo: "Alta Dependencia: El prompt automatiza procesos cognitivos que el estudiante debería realizar por sí mismo, limitando su esfuerzo mental.",
                medio: "Uso Instrumental: La IA agiliza la tarea, pero podría integrarse mejor para fomentar el pensamiento crítico en lugar de solo entregar resultados.",
                alto: "Andamiaje Cognitivo: La IA se utiliza para potenciar el análisis y la creatividad, no para sustituir el pensamiento del alumno."
            }
        };

        if (v <= 2) return textos[dimension].bajo;
        if (v <= 3.9) return textos[dimension].medio;
        return textos[dimension].alto;
    };

    return (
        <div className="transformar-master-container">
            {loading && (
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🔄</span>
                        <span className="sync-text">Sincronizando Liderazgo...</span>
                    </div>
                </div>
            )}

            {/* --- VISTA 1: INTRODUCCIÓN Y CONTEXTO --- */}
            {showIntro ? (
                <div className="transformar-intro-container animate-fade-in">
                    <header className="intro-hero">
                        <div className="top-nav-intro">
                            <button className="btn-back-atlas-minimal" onClick={() => onNavigate('overview')}>⬅ Volver al Mapa</button>
                        </div>
                        <span className="badge-fase-pill">Fase: Liderar</span>
                        
                        {/* TÍTULO CONDICIONAL */}
                        <h1>{isDirectivo ? "Seguimiento Pedagógico Institucional" : "Laboratorio de Prompt Ético"}</h1>
                        
                        {/* PROPÓSITO CONDICIONAL */}
                        <p className="hero-subtitle">
                            {isDirectivo ? (
                                <>Propósito: Garantizar que el equipo docente: 1. Complete AUDITAR. 2. Complete TRANSFORMAR. 3. Reduzca riesgos identificados. 4. Mejore su práctica de manera medible.</>
                            ) : (
                                <>Propósito: Desarrollar competencia en uso responsable de IA generativa alineado con el <strong> enfoque humano-céntrico y ética aplicada</strong>. Basado en marcos globales de gobernanza <span className="highlight-text">(UNESCO 2024 & AI Act)</span>.</>
                            )}
                        </p>
                    </header>

                    <section className="narrative-grid">
                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">01</span>
                                <h3>Propósito Estratégico</h3>
                            </div>
                            {isDirectivo ? (
                                <p>Priorice en su plan de seguimiento aquellas áreas que superen el 20% de aspectos pendientes. La transición a la fase ASEGURAR debe realizarse únicamente cuando se alcance un mínimo del 80% de cumplimiento. <strong>"Un liderazgo sólido se fundamenta en la coherencia pedagógica, la responsabilidad y la acción basada en evidencia."</strong></p>
                            ) : (
                                <p>Reflexionar sobre el impacto ético, pedagógico y profesional de tu interacción con la IA antes de llevarla al aula. <strong> Este laboratorio no evalúa tu creatividad</strong>, sino tu capacidad de supervisión humana.</p>
                            )}
                            <div className="unesco-stack">
                                <div className="u-item">AI for teachers – UNESCO 2024</div>
                                <div className="u-item">Enfoque basado en riesgo – AI Act</div>
                            </div>
                        </div>

                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">02</span>
                                <h3>{isDirectivo ? "Protocolo de Seguimiento" : "Nivel de Responsabilidad"}</h3>
                            </div>
                            {isDirectivo ? (
                                <p>Observe si el riesgo alto disminuyó tras TRANSFORMAR. Si no disminuyó al menos 30%, programe intervención formativa. Identifique la dimensión más débil: Ética, Privacidad, Agencia o Dependencia Cognitiva.</p>
                            ) : (
                                <>
                                    <p>Cada instrucción que delegas a la IA debe ser auditada bajo cuatro dimensiones de control irrenunciables:</p>
                                    <ul className="bullet-list-minimal">
                                        <li>• <strong>Agencia Humana:</strong> El docente mantiene el control y la decisión final.</li>
                                        <li>• <strong>Transparencia:</strong> Declaración explícita del uso de algoritmos.</li>
                                        <li>• <strong>Privacidad:</strong> Protección absoluta de datos sensibles de menores.</li>
                                        <li>• <strong>Equidad:</strong> Vigilancia activa contra sesgos y alucinaciones.</li>
                                    </ul>
                                </>
                            )}
                        </div>
                    </section>

                    <section className="video-full-section">
                        <div className="section-title-box">
                            <span className="icon-badge">{isDirectivo ? "📊" : "🔬"}</span>
                            <div>
                                <h3>{isDirectivo ? "Dashboard de Gobernanza" : "Laboratorio de Prompts"}</h3>
                                <p className="text-muted-liderar">
                                    {isDirectivo 
                                        ? "Monitoreo del 90% del equipo completando el ciclo y reducción del 40% en riesgo alto." 
                                        : "Evalúa el nivel de responsabilidad y riesgo del uso de IA en tu práctica docente. Pasar de ser un \"usuario de herramientas\" a ser un \"líder de tecnología\"."}
                                </p>
                            </div>
                        </div>
                        
                        <div className="liderar-full-width-container">
                            <div className="liderar-protocols-card-canvas">
                                <h4>{isDirectivo ? "Metas de Liderazgo Efectivo:" : "Protocolos de Validación Humana:"}</h4>
                                <div className="liderar-commitments">
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Cumplimiento General" : "Seguridad y Privacidad"}</p>
                                            <small>{isDirectivo ? "Verificación de áreas rezagadas y activación de recordatorios." : "Cero exposición de identidades estudiantiles en modelos externos."}</small>
                                        </div>
                                    </div>
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Verificación de Mejora" : "Verificación Crítica"}</p>
                                            <small>{isDirectivo ? "Comparar indicadores antes y después para validar reducción de riesgo." : "Validación sistemática de fuentes y detección de sesgos."}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="final-action-section">
                        <div className="action-button-wrapper">
                            <button 
                                className="btn-start-transformar-large" 
                                onClick={handleAceptarFase} 
                                disabled={isSaving}
                            >
                                {isSaving ? "Registrando..." : (progreso?.Capa_1_Sentido === 'COMPLETADO' ? (isDirectivo ? "Ver Panel de Control" : "Ver Misiones de Liderazgo") : (isDirectivo ? "Activar Seguimiento Pedagógico" : "Activar Protocolo LIDERAR"))}
                            </button>
                            <p className="helper-text">
                                {isDirectivo 
                                    ? "Al activar, habilitas la vista de dashboard institucional y protocolos de intervención focalizada."
                                    : "Al activar, habilitas el Laboratorio de Prompt Ético y el sistema de Auditoría de Riesgo Pedagógico."}
                            </p>
                        </div>
                    </section>
                </div>
            ) : (
                /* --- VISTA 2: DASHBOARD DE RETOS --- */
                <div className="transformar-dashboard animate-fade-in">
                    <div className="dashboard-header-flex">
                        <div className="title-area">
                            <button className="btn-back-atlas" onClick={() => { setVerReporte(false); setShowIntro(true); }}>⬅ Volver al Contexto</button>
                            <h2>{isDirectivo ? "Consola de Liderazgo Institucional" : "Centro de Auditoría y Liderazgo"}</h2>
                        </div>
                        <div className="level-badge-status">
                            {isDirectivo ? "Gobernanza" : (datosPrompt?.Clasificacion_Riesgo?.split('|')[0] || "Auditor en Formación")}
                        </div>
                    </div>

                    {/* --- REPORTE DETALLADO REESTRUCTURADO --- */}
                    {verReporte ? (
                        <div className="liderar-report-canvas animate-slide-up">
                            {/* PASO 1: PROMPT ORIGINAL */}
                            <div className="report-narrative-section">
                                <div className="narrative-step-header">
                                    <span className="step-circle">1</span>
                                    <h3>Análisis de tu interacción</h3>
                                </div>
                                <div className="narrative-content-box">
                                    <p className="narrative-label">Tu prompt original fue:</p>
                                    <blockquote className="prompt-blockquote">"{datosPrompt?.Prompt_Original}"</blockquote>
                                </div>
                            </div>

                            {/* PASO 2: RESULTADO ATLAS */}
                            <div className="report-narrative-section">
                                <div className="narrative-step-header">
                                    <span className="step-circle">2</span>
                                    <h3>Tu Autoevaluación Ética</h3>
                                </div>
                                <div className="narrative-content-box">
                                    <div className="resultado-indice-global">
                                        <p className="indice-at-label">Índice Global ATLAS:</p>
                                        <h4 className="indice-at-value">{getTextoIndiceATLAS()}</h4>
                                    </div>
                                    <p className="interpreta-text">
                                        Este resultado refleja tu nivel de consciencia sobre la integridad pedagógica y técnica de tu interacción. {Number(datosPrompt?.Puntaje_Etica) > 4 ? "Demuestras una alta sensibilidad hacia la equidad y la transparencia." : "Existen dimensiones donde la supervisión humana debe fortalecerse."}
                                    </p>
                                </div>
                            </div>

                            {/* PASO 3: SEMÁFORO DE RIESGO */}
                            <div className="report-narrative-section">
                                <div className="narrative-step-header">
                                    <span className="step-circle">3</span>
                                    <h3>Dictamen del Semáforo de Riesgo</h3>
                                </div>
                                <div className="narrative-content-box">
                                    <div className="resultado-semaforo-badge" style={{ 
                                        backgroundColor: datosPrompt?.Clasificacion_Riesgo?.includes('ALTO') ? '#ef4444' : (datosPrompt?.Clasificacion_Riesgo?.includes('MODERADO') ? '#f59e0b' : '#22c55e')
                                    }}>
                                        {datosPrompt?.Clasificacion_Riesgo?.split('|')[0]}
                                    </div>
                                    <p className="dictamen-desc-text">El sistema valida que tu proceso respeta la <strong>Gobernanza de Decisión Docente</strong> y establece un marco de transparencia adecuado para la implementación en el aula.</p>
                                </div>
                            </div>

                            {/* ANÁLISIS GENERAL - EL PÁRRAFO FINAL DE CONTEXTO */}
                            <div className="analisis-final-master">
                                <div className="dictamen-header">
                                    <span className="badge-atlas-audit">DICTAMEN FINAL LIDERAR</span>
                                    <h3>Análisis de Liderazgo Pedagógico</h3>
                                </div>
                                <div className="parrafo-analisis-format">
                                    <p>
                                        Tras completar el Laboratorio de Prompt Ético, el análisis integral concluye que tu interacción con la IA presenta un <strong>{datosPrompt?.Clasificacion_Riesgo?.split('|')[0]} ({datosPrompt?.Puntaje_Heuristica || "0"}/20)</strong>. 
                                        Alineado con los marcos de la <strong>UNESCO 2024 (AI for Teachers)</strong> y la <strong>AI Act</strong>, tu prompt ("{datosPrompt?.Prompt_Original}") 
                                        ha sido auditado bajo la premisa de que la IA debe fortalecer, no reemplazar, la agencia humana. 
                                        En la dimensión de Privacidad, se observa que {Number(datosPrompt?.Puntaje_Privacidad) < 3 ? "existe un riesgo crítico por uso de datos identificables que requiere anonimización inmediata." : "has mantenido un protocolo seguro de minimización de datos."} 
                                        Respecto a la Dependencia Cognitiva, el sistema detecta que tu enfoque {Number(datosPrompt?.Puntaje_Dependencia) > 3 ? "promueve el aprendizaje profundo y el pensamiento crítico," : "podría estar delegando procesos de pensamiento esenciales del estudiante,"} lo cual es vital para el desarrollo de la autonomía intelectual. 
                                        Tu rol como docente líder no es evitar la tecnología, sino supervisar que cada salida algorítmica pase por tu filtro profesional. 
                                    </p>
                                </div>
                                <div className="reporte-actions-footer">
                                    <button className="btn-launch-mission" onClick={() => setVerReporte(false)}>Finalizar Auditoría</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="retos-roadmap-v2">
                            {isDirectivo ? (
                                <>
                                    {/* RETO ÚNICO PARA DIRECTIVO - REDIRIGE A ANALISIS_LIDERAZGO */}
                                    <div className={`reto-card-premium active`} style={{ gridColumn: "1 / -1" }}>
                                        <div className="reto-icon-box">📊</div>
                                        <span className="reto-label">Misión de Liderazgo</span>
                                        <h3>Interfaz de Seguimiento Pedagógico</h3>
                                        <p style={{fontSize: '0.9rem', color: '#666', marginTop: '10px'}}>Acceda a los Paneles de: Estado de Cumplimiento, Panorama de Riesgo, Brechas por Dimensión y Acciones de Seguimiento.</p>
                                        <button onClick={() => onNavigate('analisis_liderazgo')} className="btn-launch-mission">
                                            Abrir Panel de Control
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* MISIONES ORIGINALES PARA TEACHER - REDIRIGEN A RETOS_LIDERAR */}
                                    <div className={`reto-card-premium ${retosCompletados.includes(1) ? 'completed' : 'active'}`}>
                                        <div className="reto-icon-box">🧪</div>
                                        <span className="reto-label">Misión 1</span>
                                        <h3>Laboratorio de Prompts</h3>
                                        <button onClick={() => onNavigate('retos_liderar', 1)} className="btn-launch-mission">
                                            {retosCompletados.includes(1) ? "Revisar Prompt" : "Abrir Laboratorio"}
                                        </button>
                                        {retosCompletados.includes(1) && <div className="badge-done">Completado</div>}
                                    </div>

                                    <div className={`reto-card-premium ${retosCompletados.includes(2) ? 'completed' : (retosCompletados.includes(1) ? 'active' : 'locked')}`}>
                                        <div className="reto-icon-box">🚦</div>
                                        <span className="reto-label">Misión 2</span>
                                        <h3>Semáforo de Riesgo IA</h3>
                                        {!retosCompletados.includes(1) ? (
                                            <div className="lock-indicator">🔒 Pendiente Misión 1</div>
                                        ) : (
                                            <button 
                                                onClick={() => setVerReporte(true)} 
                                                className="btn-launch-mission"
                                            >
                                                {retosCompletados.includes(2) ? "Ver Resultado" : "Ejecutar Semáforo"}
                                            </button>
                                        )}
                                        {retosCompletados.includes(2) && <div className="badge-done">Completado</div>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FaseLiderar;