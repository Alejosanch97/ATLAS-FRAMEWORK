import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseTransformar.css"; // Reutilizamos los estilos base por consistencia visual

const FaseAsegurar = ({ userData, API_URL, onNavigate, onRefreshProgreso, datosExistentes, existingResponses }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [statusAsegurar, setStatusAsegurar] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const isDirectivo = userData.Rol === "DIRECTIVO";

    useEffect(() => {
        const sincronizarDatos = async () => {
            let datosCargados = false;

            // 1. Prioridad: Datos que vienen por Props (Carga instantánea)
            if (datosExistentes) {
                setStatusAsegurar(datosExistentes);
                datosCargados = true;
            }

            if (existingResponses && Array.isArray(existingResponses)) {
                const registro = existingResponses.find(item => item.Fase === "ASEGURAR");
                if (registro) {
                    setProgreso(registro);
                    datosCargados = true;
                }
            }

            // 2. Respaldo: Solo si el Dashboard no mandó nada
            if (!datosCargados) {
                await fetchData();
            } else {
                // Si ya cargamos por props, quitamos el loading de una vez
                setLoading(false);
            }
        };

        sincronizarDatos();
    }, [datosExistentes, existingResponses]);

    const fetchData = async () => {
        if (progreso && statusAsegurar) return;

        setLoading(true);
        try {
            const [resProgreso, resStatus] = await Promise.all([
                fetch(`${API_URL}?sheet=Progreso_Fases_ATLAS&user_key=${userData.Teacher_Key}`),
                fetch(`${API_URL}?sheet=${isDirectivo ? "ASEGURAR_Directivos_Plan_Accion" : "ASEGURAR_Docentes"}&user_key=${userData.Teacher_Key}`)
            ]);

            const dataProgreso = await resProgreso.json();
            const dataStatus = await resStatus.json();

            const registro = Array.isArray(dataProgreso)
                ? dataProgreso.find(item => item.Fase === "ASEGURAR" && item.Teacher_Key === userData.Teacher_Key)
                : null;

            if (registro) setProgreso(registro);

            if (Array.isArray(dataStatus) && dataStatus.length > 0) {
                // Buscamos el registro específico de este usuario en el taller
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
        if (progreso?.Capa_1_Sentido === 'COMPLETADO' || statusAsegurar) {
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

            // Actualización optimista del estado local
            setProgreso({ ...progreso, Capa_1_Sentido: 'COMPLETADO', ID_Progreso: nuevoID });
            setShowIntro(false); 
            
            // Avisar al Dashboard que actualice sus datos globales
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

    const handleNavegacionSegura = (destino, id = null) => {
        setIsNavigating(true); // El botón cambia a "Cargando datos..."

        // 1. Vigilamos que 'loading' sea false (que los datos ya estén listos)
        const verificarCarga = setInterval(() => {
            if (!loading) {
                clearInterval(verificarCarga); // Detenemos la vigilancia al confirmar carga

                // 2. Tiempo extra de seguridad para asegurar la persistencia del estado
                setTimeout(() => {
                    setIsNavigating(false);
                    // Pasamos destino, id y el status actual para que el Dashboard lo reciba
                    onNavigate(destino, id, statusAsegurar);
                    window.scrollTo(0, 0); // Entrada limpia desde arriba
                }, 600); // 600ms de "respiro" visual
            }
        }, 100);
    };

    return (
        <div className="transformar-master-container">
            
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
                                className={`btn-start-transformar-large ${progreso?.Capa_1_Sentido === 'COMPLETADO' ? 'btn-already-accepted' : ''}`}
                                onClick={handleAceptarFase}
                                disabled={isSaving || (loading && !progreso)}
                            >
                                {isSaving ? "Sincronizando..." : (
                                    (loading && !progreso) ? "Cargando..." :
                                        (progreso?.Capa_1_Sentido === 'COMPLETADO' || statusAsegurar
                                            ? (isDirectivo ? "Ir al Diagnóstico Directivo" : "Ir al Taller de Mejora")
                                            : "Activar Fase ASEGURAR")
                                )}
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
                                            <button
                                                onClick={() => handleNavegacionSegura('taller_asegurar')}
                                                className="btn-launch-mission"
                                                // Bloqueamos el botón si está cargando el fetch inicial o si ya hizo clic para navegar
                                                disabled={loading || isNavigating}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    minWidth: '200px', // Un poco más ancho para que el texto no salte
                                                    cursor: (loading || isNavigating) ? 'wait' : 'pointer',
                                                    opacity: (loading || isNavigating) ? 0.8 : 1,
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                {(loading || isNavigating) ? (
                                                    <>
                                                        {/* Spinner animado consistente con tu estilo global */}
                                                        <span className="spinner-mini" style={{
                                                            animation: 'spin 1s linear infinite',
                                                            border: '2px solid rgba(255,255,255,0.3)',
                                                            borderTop: '2px solid #fff',
                                                            borderRadius: '50%',
                                                            width: '14px',
                                                            height: '14px'
                                                        }}></span>
                                                        <span>Cargando datos...</span>
                                                    </>
                                                ) : (
                                                    /* Estado dinámico: Si existe registro en statusAsegurar significa que ya lo hizo */
                                                    statusAsegurar ? "Ver Mejora Realizada" : "Realizar Upgrade"
                                                )}
                                            </button>
                                    {statusAsegurar && <div className="badge-done">Completado</div>}
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