import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseTransformar.css"; // Reutilizamos los estilos base por consistencia visual

const FaseSostener = ({ userData, API_URL, onNavigate, onRefreshProgreso, datosExistentes, existingResponses }) => {
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [statusSostener, setStatusSostener] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const isDirectivo = userData.Rol === "DIRECTIVO";

    // --- CAMBIO TÉCNICO: SINCRONIZACIÓN REFORZADA ---
    useEffect(() => {
        const sincronizarDatos = async () => {
            setLoading(true);
            let datosCargados = false;

            // 1. Prioridad: Datos que vienen por Props (Carga instantánea)
            if (datosExistentes && Object.keys(datosExistentes).length > 0) {
                setStatusSostener(datosExistentes);
                datosCargados = true;
            }

            if (existingResponses && Array.isArray(existingResponses)) {
                const registro = existingResponses.find(item => item.Fase === "SOSTENER");
                if (registro) {
                    setProgreso(registro);
                    if (registro.Capa_1_Sentido === 'COMPLETADO') setShowIntro(false);
                }
            }

            // 2. Respaldo: Si no hay datos (por refresco), forzamos fetchData sin bloqueos
            await fetchData();
        };

        sincronizarDatos();
    }, [userData.Teacher_Key]); // Dependencia clave para identificar al usuario

    // --- CAMBIO TÉCNICO: FETCH SIN BLOQUEOS ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [resProgreso, resStatus] = await Promise.all([
                fetch(`${API_URL}?sheet=Progreso_Fases_ATLAS&user_key=${userData.Teacher_Key}`),
                fetch(`${API_URL}?sheet=${isDirectivo ? "SOSTENER_Institucional" : "SOSTENER_Docentes"}&user_key=${userData.Teacher_Key}`)
            ]);

            const dataProgreso = await resProgreso.json();
            const dataStatus = await resStatus.json();

            const registro = Array.isArray(dataProgreso)
                ? dataProgreso.find(item => item.Fase === "SOSTENER" && item.Teacher_Key === userData.Teacher_Key)
                : null;

            if (registro) {
                setProgreso(registro);
                if (registro.Capa_1_Sentido === 'COMPLETADO') setShowIntro(false);
            }

            if (Array.isArray(dataStatus) && dataStatus.length > 0) {
                const userStatus = dataStatus.find(d => d.Teacher_Key === userData.Teacher_Key);
                if (userStatus) setStatusSostener(userStatus);
            }
        } catch (e) {
            console.error("Error cargando Sostener:", e);
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
        const nuevoID = progreso?.ID_Progreso || `PROG-SOS-${Date.now()}`;
        
        const dataPayload = {
            action: progreso ? "update" : "create",
            sheet: "Progreso_Fases_ATLAS",
            idField: "ID_Progreso",
            idValue: nuevoID,
            data: {
                Teacher_Key: userData.Teacher_Key,
                Fase: "SOSTENER",
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
                title: isDirectivo ? "Estrategia de Sostenibilidad" : "Radar de Desarrollo Activo",
                text: isDirectivo ? "Iniciando proceso de consolidación institucional." : "Has iniciado tu proceso de autoevaluación y cierre de ciclo.",
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
        setIsNavigating(true);
        // Usamos un timeout más eficiente que el setInterval anterior
        setTimeout(() => {
            setIsNavigating(false);
            onNavigate(destino, id, statusSostener);
            window.scrollTo(0, 0);
        }, 500);
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
                        <span className="badge-fase-pill">Fase: Sostener</span>
                        <h1>{isDirectivo ? "Cierre Institucional ATLAS" : "Autoevaluación Docente IA"}</h1>
                        <p className="hero-subtitle">
                            {isDirectivo ? 
                                "Institucionalice la gobernanza de la IA y consolide la arquitectura estratégica que permitirá la sostenibilidad y escalabilidad de su proyecto educativo." : 
                                "Un espacio de reflexión para acompañarte en el desarrollo consciente, ético y estratégico de tu práctica."}
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
                                "Consolidar los pilares que ya operan. En esta fase, evaluará la madurez institucional acumulada para decidir la ruta definitiva: el sostenimiento de estándares o el escalamiento hacia la Certificación Internacional ATLAS." : 
                                "Analizar cómo usas la IA, identificar fortalezas y visualizar tu evolución. La sostenibilidad depende de la reflexión constante."}
                            </p>
                            <div className="unesco-stack">
                                <div className="u-item">Sostenibilidad Ética</div>
                                <div className="u-item">Mejora Continua</div>
                            </div>
                        </div>

                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">02</span>
                                <h3>Factores Críticos</h3>
                            </div>
                            <ul className="bullet-list-minimal">
                                <li>• <strong>Privacidad:</strong> Resultados confidenciales y protegidos.</li>
                                <li>• <strong>Historial:</strong> Visualización de progreso semestral.</li>
                                <li>• <strong>Acción:</strong> De la reflexión al compromiso real de mejora.</li>
                                {isDirectivo && <li>• <strong>Gobernanza:</strong> Institucionalización de buenas prácticas.</li>}
                            </ul>
                        </div>
                    </section>

                    <section className="video-full-section">
                        <div className="section-title-box">
                            <span className="icon-badge">📊</span>
                            <div>
                                <h3>{isDirectivo ? "Proyección de Madurez" : "Radar de Crecimiento Profesional"}</h3>
                                <p className="text-muted-liderar">
                                    {isDirectivo ? 
                                    "Analice la distribución de niveles docentes, reduzca alertas institucionales y genere su hoja de ruta anual." : 
                                    "Obtén un análisis por dimensiones (Pedagogía, Ética, Impacto y Desarrollo) y recomendaciones personalizadas."}
                                </p>
                            </div>
                        </div>
                        
                        <div className="liderar-full-width-container">
                            <div className="liderar-protocols-card-canvas">
                                <h4>{isDirectivo ? "Indicadores de Sostenimiento:" : "Beneficios de la Evaluación:"}</h4>
                                <div className="liderar-commitments">
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Radar Longitudinal" : "Nivel de Integración"}</p>
                                            <small>{isDirectivo ? "Comparativa semestre actual vs anterior." : "Identificación automática de tu perfil docente IA."}</small>
                                        </div>
                                    </div>
                                    <div className="commit-item">
                                        <div className="dot-gold"></div>
                                        <div className="commit-text-box">
                                            <p>{isDirectivo ? "Alertas de Riesgo" : "Plan de Mejora"}</p>
                                            <small>{isDirectivo ? "Detección de patrones críticos en la institución." : "Hoja de ruta clara para avanzar al siguiente nivel."}</small>
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
                                        (progreso?.Capa_1_Sentido === 'COMPLETADO' 
                                            ? (isDirectivo ? "Ir al Dashboard Estratégico" : "Ir al Radar de Desarrollo")
                                            : "Activar Fase SOSTENER")
                                )}
                            </button>
                            <p className="helper-text">
                                {isDirectivo ? "Accederá al radar longitudinal y proyecciones institucionales." : "Accederá al sistema de autoevaluación y diario reflexivo."}
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
                            <h2>{isDirectivo ? "Gestión de Sostenibilidad Institucional" : "Desarrollo y Mejora Continua"}</h2>
                        </div>
                        <div className="level-badge-status">
                            {statusSostener?.Status === 'Completed' ? "Ciclo Cerrado" : "Fase Activa"}
                        </div>
                    </div>

                    <div className="retos-roadmap-v2">
                        {isDirectivo ? (
                            /* RUTA PARA DIRECTIVOS: ModuloSostenerDirectivo */
                            <>
                                <div className={`reto-card-premium active`} style={{ gridColumn: "1 / -1" }}>
                                    <div className="reto-icon-box">🏛️</div>
                                    <span className="reto-label">Directivo</span>
                                    <h3>Cierre Institucional COMPASS</h3>
                                    <p style={{fontSize: '0.9rem', color: '#666', marginTop: '10px'}}>
                                        Gestione el radar longitudinal, analice riesgos estructurales y defina la ruta hacia la certificación ATLAS.
                                    </p>
                                    <button 
                                        onClick={() => handleNavegacionSegura('modulo_sostener_directivo')}
                                        className="btn-launch-mission" 
                                        disabled={loading || isNavigating}
                                    >
                                        {isNavigating ? "Cargando..." : (statusSostener ? "Revisar Hoja de Ruta" : "Construir Hoja de Mejora")}
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* RUTA PARA DOCENTES: ModuloSostener */
                            <>
                                <div className={`reto-card-premium ${statusSostener ? 'completed' : 'active'}`}>
                                    <div className="reto-icon-box">📈</div>
                                    <span className="reto-label">Reto Final</span>
                                    <h3>Radar Docente y Autoevaluación</h3>
                                    <p style={{fontSize: '0.85rem', color: '#666', margin: '10px 0'}}>
                                        Realice su evaluación semestral de dimensiones y visualice su evolución histórica.
                                    </p>
                                    <button
                                        onClick={() => handleNavegacionSegura('modulo_sostener')}
                                        className="btn-launch-mission"
                                        disabled={loading || isNavigating}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            minWidth: '200px',
                                            cursor: (loading || isNavigating) ? 'wait' : 'pointer',
                                            opacity: (loading || isNavigating) ? 0.8 : 1,
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {(loading || isNavigating) ? (
                                            <>
                                                <span className="spinner-mini" style={{
                                                    animation: 'spin 1s linear infinite',
                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                    borderTop: '2px solid #fff',
                                                    borderRadius: '50%',
                                                    width: '14px',
                                                    height: '14px'
                                                }}></span>
                                                <span>Cargando...</span>
                                            </>
                                        ) : (
                                            statusSostener ? "Ver Mi Evolución" : "Iniciar Autoevaluación"
                                        )}
                                    </button>
                                    {statusSostener && <div className="badge-done">Completado</div>}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaseSostener;