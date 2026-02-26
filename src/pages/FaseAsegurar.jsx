import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseTransformar.css"; // Reutilizamos los estilos base por consistencia visual

const FaseAsegurar = ({ userData, API_URL, onNavigate, onRefreshProgreso }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [statusAsegurar, setStatusAsegurar] = useState(null);

    const isDirectivo = userData.Rol === "DIRECTIVO";

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Obtener progreso de fase ASEGURAR
            const resProgreso = await fetch(`${API_URL}?sheet=Progreso_Fases_ATLAS&user_key=${userData.Teacher_Key}`);
            const dataProgreso = await resProgreso.json();
            const registro = Array.isArray(dataProgreso) ? dataProgreso.find(item => item.Fase === "ASEGURAR") : null;
            if (registro) setProgreso(registro);

            // 2. Verificar si ya completó el Taller o el Diagnóstico Directivo
            const hoja = isDirectivo ? "ASEGURAR_Directivos_Plan_Accion" : "ASEGURAR_Docentes";
            const resStatus = await fetch(`${API_URL}?sheet=${hoja}&user_key=${userData.Teacher_Key}`);
            const dataStatus = await resStatus.json();
            if (Array.isArray(dataStatus) && dataStatus.length > 0) {
                // Buscamos el registro específico de este usuario
                const userStatus = dataStatus.find(d => d.Teacher_Key === userData.Teacher_Key);
                if (userStatus) setStatusAsegurar(userStatus);
            }
        } catch (e) {
            console.error("Error cargando Asegurar:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAceptarFase = async () => {
        // Si ya está completada la capa de sentido, solo pasamos a la vista de misiones
        if (progreso?.Capa_1_Sentido === 'COMPLETADO') {
            setShowIntro(false);
            return;
        }

        setIsSaving(true);
        const nuevoID = progreso?.ID_Progreso || `PROG-AS-${Date.now()}`;
        
        const dataPayload = {
            action: progreso ? "update" : "create",
            sheet: "Progreso_Fases_ATLAS",
            idField: "ID_Progreso",
            idValue: nuevoID,
            data: {
                Teacher_Key: userData.Teacher_Key,
                Fase: "ASEGURAR",
                Capa_1_Sentido: "COMPLETADO",
                Fecha_Actualizacion: new Date().toLocaleString()
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
                title: isDirectivo ? "Estrategia Activada" : "Taller de Mejora Activado",
                text: "Has iniciado la fase de consolidación y estandarización ética.",
                icon: "success",
                confirmButtonColor: "#c5a059"
            });
        } catch (e) {
            Swal.fire("Error", "No se pudo sincronizar el inicio.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="transformar-master-container">
            {loading && (
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🛡️</span>
                        <span className="sync-text">Cargando Protocolos de Seguridad...</span>
                    </div>
                </div>
            )}

            {showIntro ? (
                /* --- VISTA INTRODUCTORIA (CAPA DE SENTIDO) --- */
                <div className="transformar-intro-container animate-fade-in">
                    <header className="intro-hero">
                        <div className="top-nav-intro">
                            <button className="btn-back-atlas-minimal" onClick={() => onNavigate('overview')}>⬅ Volver al Mapa</button>
                        </div>
                        <span className="badge-fase-pill">Fase: Asegurar</span>
                        <h1>{isDirectivo ? "Gobernanza y Sostenibilidad IA" : "Taller de Mejora Guiada"}</h1>
                        <p className="hero-subtitle">
                            {isDirectivo ? 
                                "Evaluar el nivel de preparación estratégica y asegurar un plan de acción institucional bajo marcos regulatorios." : 
                                "Pasar de un uso funcional de la IA a un uso estructurado, ético y sostenible de tu práctica docente."}
                        </p>
                    </header>

                    <section className="narrative-grid">
                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">01</span>
                                <h3>Propósito Principal</h3>
                            </div>
                            <p>
                                {isDirectivo ? 
                                "Este ejercicio no evalúa innovación tecnológica. Evalúa la calidad de la gobernanza, el nivel de responsabilidad y la sostenibilidad institucional en la gestión del riesgo." : 
                                "Reducir riesgos, estandarizar buenas prácticas y garantizar que el estudiante mantenga un rol cognitivo activo."}
                            </p>
                            <div className="unesco-stack">
                                <div className="u-item">AI Act - Deployer Responsibility</div>
                                <div className="u-item">UNESCO - Professional Learning</div>
                            </div>
                        </div>

                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">02</span>
                                <h3>Factores Críticos</h3>
                            </div>
                            <ul className="bullet-list-minimal">
                                <li>• <strong>Supervisión Humana:</strong> Decisión final siempre docente.</li>
                                <li>• <strong>Transparencia:</strong> Declaración explícita de uso.</li>
                                <li>• <strong>Agencia:</strong> Evitar la dependencia cognitiva.</li>
                                {isDirectivo && <li>• <strong>Gobernanza:</strong> Políticas y protocolos formales.</li>}
                            </ul>
                        </div>
                    </section>

                    <section className="video-full-section">
                        <div className="section-title-box">
                            <span className="icon-badge">✅</span>
                            <div>
                                <h3>{isDirectivo ? "Panorama Estratégico" : "Upgrade de Prácticas con IA"}</h3>
                                <p className="text-muted-liderar">
                                    {isDirectivo ? 
                                    "Analice los riesgos regulatorios, el desarrollo de competencias docentes, la dimensión ética y la cultura institucional frente al uso de IA." : 
                                    "No vas a crear algo nuevo. Vas a mejorar y consolidar lo que ya estás usando para hacerlo infalible."}
                                </p>
                            </div>
                        </div>
                        
                        <div className="liderar-full-width-container">
                            <div className="liderar-protocols-card-canvas">
                                <h4>{isDirectivo ? "Dimensiones del Radar Directivo:" : "Resultados del Taller:"}</h4>
                                <div className="liderar-commitments">
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Riesgos Regulatorios" : "Reducción de Riesgo"}</p>
                                            <small>{isDirectivo ? "Cumplimiento de protección de datos y AI Act." : "Disminución medible de la dependencia cognitiva."}</small>
                                        </div>
                                    </div>
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Competencias Docentes" : "Estándar Personal"}</p>
                                            <small>{isDirectivo ? "Niveles Acquire, Deepen y Create (UNESCO)." : "Compromiso formal de uso ético y responsable."}</small>
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
                                {isSaving ? "Iniciando..." : (progreso?.Capa_1_Sentido === 'COMPLETADO' ? (isDirectivo ? "Ir al Diagnóstico Directivo" : "Ir al Taller de Mejora") : "Activar Fase ASEGURAR")}
                            </button>
                            <p className="helper-text">
                                {isDirectivo ? "Accederá al radar institucional y al constructor de plan estratégico." : "Accederá a la interfaz de comparativa y refactor de prompts éticos."}
                            </p>
                        </div>
                    </section>
                </div>
            ) : (
                /* --- VISTA DASHBOARD DE MISIONES (ACCESO A LOS RETOS) --- */
                <div className="transformar-dashboard animate-fade-in">
                    <div className="dashboard-header-flex">
                        <div className="title-area">
                            <button className="btn-back-atlas" onClick={() => setShowIntro(true)}>⬅ Volver al Contexto</button>
                            <h2>{isDirectivo ? "Módulo Estratégico de Sostenibilidad" : "Consolidación de Práctica Ética"}</h2>
                        </div>
                        <div className="level-badge-status">
                            {statusAsegurar?.Status === 'Completed' ? "Certificado" : "Fase Activa"}
                        </div>
                    </div>

                    <div className="retos-roadmap-v2">
                        {isDirectivo ? (
                            /* RUTA PARA DIRECTIVOS */
                            <>
                                <div className={`reto-card-premium active`} style={{ gridColumn: "1 / -1" }}>
                                    <div className="reto-icon-box">🏢</div>
                                    <span className="reto-label">Directivo</span>
                                    <h3>Diagnóstico y Plan Institucional</h3>
                                    <p style={{fontSize: '0.9rem', color: '#666', marginTop: '10px'}}>
                                        Visualice el panorama docente, realice el cuestionario de gobernanza y genere su Plan de Acción IA v1.0.
                                    </p>
                                    {/* CLAVE: Navegación al nuevo ModuloDirectivoEstrategico */}
                                    <button onClick={() => onNavigate('diagnostico_directivo')} className="btn-launch-mission">
                                        {statusAsegurar ? "Revisar Plan Institucional" : "Iniciar Diagnóstico"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* RUTA PARA DOCENTES */
                            <>
                                <div className={`reto-card-premium ${statusAsegurar ? 'completed' : 'active'}`}>
                                    <div className="reto-icon-box">🛠️</div>
                                    <span className="reto-label">Misión 1</span>
                                    <h3>Taller de Mejora Guiada</h3>
                                    <p style={{fontSize: '0.85rem', color: '#666', margin: '10px 0'}}>
                                        Refactoriza tu prompt previo para eliminar riesgos de agencia y privacidad.
                                    </p>
                                    <button onClick={() => onNavigate('taller_asegurar')} className="btn-launch-mission">
                                        {statusAsegurar ? "Ver Mejora Realizada" : "Realizar Upgrade"}
                                    </button>
                                    {statusAsegurar && <div className="badge-done">Completado</div>}
                                </div>

                                <div className={`reto-card-premium ${statusAsegurar ? 'active' : 'locked'}`}>
                                    <div className="reto-icon-box">📄</div>
                                    <span className="reto-label">Misión 2</span>
                                    <h3>Estándar de Uso Responsable</h3>
                                    <p style={{fontSize: '0.85rem', color: '#666', margin: '10px 0'}}>
                                        Obtén tu declaración jurada de ética docente para el Logbook.
                                    </p>
                                    {!statusAsegurar ? (
                                        <div className="lock-indicator">🔒 Requiere Upgrade</div>
                                    ) : (
                                        <button onClick={() => onNavigate('ver_estandar_asegurar')} className="btn-launch-mission">
                                            Ver Documento Final
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaseAsegurar;