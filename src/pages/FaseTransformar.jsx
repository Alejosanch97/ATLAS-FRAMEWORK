import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/faseTransformar.css";

export const FaseTransformar = ({ userData, API_URL, onNavigate }) => {
    // Inicializamos con valores que permitan renderizar la interfaz de inmediato
    const [progreso, setProgreso] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retosCompletados, setRetosCompletados] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    
    // Estado para alternar entre intro y dashboard
    const [showIntro, setShowIntro] = useState(true);

    // Identificación de Rol
    const isDirectivo = userData.Rol === "DIRECTIVO";

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Obtener progreso general de la fase
            const resProgreso = await fetch(`${API_URL}?sheet=Progreso_Fases_ATLAS&user_key=${userData.Teacher_Key}`);
            const dataProgreso = await resProgreso.json();
            const registro = Array.isArray(dataProgreso) ? dataProgreso.find(item => item.Fase === "TRANSFORMAR") : null;
            setProgreso(registro);

            // 2. Obtener retos específicos de la nueva hoja
            const resRetos = await fetch(`${API_URL}?sheet=Retos_Transformar_ATLAS&user_key=${userData.Teacher_Key}`);
            const dataRetos = await resRetos.json();
            
            if (Array.isArray(dataRetos)) {
                // Filtramos por el string 'COMPLETADO' que es el que envía ejecutarReto
                const completados = dataRetos
                    .filter(r => r.Status_Reto === 'COMPLETADO')
                    .map(r => parseInt(r.Numero_Reto));
                setRetosCompletados(completados);
            }
        } catch (e) {
            console.error("Error cargando Transformar:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAceptarFase = async () => {
        // Si ya está completado, el botón simplemente nos lleva al dashboard
        if (progreso?.Capa_1_Sentido === 'COMPLETADO') {
            setShowIntro(false);
            return;
        }

        setIsSaving(true);
        const nuevoID = progreso?.ID_Progreso || `PROG-T-${Date.now()}`;
        
        const dataPayload = {
            action: progreso ? "update" : "create",
            sheet: "Progreso_Fases_ATLAS",
            idField: "ID_Progreso",
            idValue: nuevoID,
            data: {
                Teacher_Key: userData.Teacher_Key,
                Fase: "TRANSFORMAR",
                Capa_1_Sentido: "COMPLETADO",
                Fecha_Actualizacion: new Date().toISOString()
            }
        };

        try {
            // Usamos text/plain para evitar problemas de CORS en el POST
            await fetch(API_URL, { 
                method: "POST", 
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(dataPayload) 
            });

            setProgreso({ ...progreso, Capa_1_Sentido: 'COMPLETADO', ID_Progreso: nuevoID });
            setShowIntro(false); // Al aceptar, vamos al dashboard
            
            Swal.fire({
                title: isDirectivo ? "¡Liderazgo Activado!" : "¡Marco Activado!",
                text: isDirectivo 
                    ? "Has formalizado tu inicio en las decisiones de gobernanza responsable." 
                    : "Has formalizado tu inicio en la fase TRANSFORMAR. Los retos están listos.",
                icon: "success",
                confirmButtonColor: "#c5a059"
            });
        } catch (e) {
            Swal.fire("Error", "No se pudo registrar el progreso.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Lógica de renderizado: 
    const renderIntro = showIntro;

    return (
        <div className="transformar-master-container">
            {/* LOADER FLOTANTE (Imagen 3) - No bloquea la carga del contenido */}
            {loading && (
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🔄</span>
                        <span className="sync-text">Sincronizando Sistema...</span>
                    </div>
                </div>
            )}

            {/* Renderizado condicional de Vistas */}
            {renderIntro ? (
                // --- VISTA 1: BIENVENIDA Y CONTEXTO EXTENDIDO ---
                <div className="transformar-intro-container animate-fade-in">
                    <header className="intro-hero">
                        <div className="top-nav-intro">
                            {/* CORREGIDO: Este vuelve al mapa principal */}
                            <button
                                className="btn-back-atlas-minimal"
                                onClick={() => onNavigate('overview')}
                            >
                                ⬅ Volver
                            </button>
                        </div>
                        <span className="badge-fase-pill">Fase 2: Transformar</span>
                        <h1>{isDirectivo ? "Te damos la bienvenida a la fase TRANSFORMAR" : "Te damos la bienvenida a la fase TRANSFORMAR"}</h1>
                        
                        {isDirectivo ? (
                            <p className="hero-subtitle">
                                En la fase anterior analizaste escenarios, identificaste riesgos institucionales y reflexionaste sobre el impacto ético y regulatorio del uso de la IA en educación. Ahora comienza el paso más importante: <strong>convertir ese análisis en decisiones de gobernanza responsables.</strong>
                            </p>
                        ) : (
                            <p className="hero-subtitle">
                                En la fase anterior analizaste herramientas e identificaste riesgos. 
                                Ahora comienza el paso más importante: <strong>convertir ese análisis en acción pedagógica responsable.</strong>
                            </p>
                        )}
                    </header>

                    <section className="narrative-grid">
                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">01</span>
                                <h3>¿Qué significa TRANSFORMAR?</h3>
                            </div>
                            
                            {isDirectivo ? (
                                <>
                                    <p>Significa pasar de comprender el riesgo… a <strong>liderar con criterio.</strong> En esta etapa empezarás a desarrollar los retos directivos que te permitirán:</p>
                                    <ul className="bullet-list-minimal">
                                        <li>• Clasificar y gestionar riesgos institucionales asociados al uso de IA.</li>
                                        <li>• Proteger derechos fundamentales de estudiantes y comunidad educativa.</li>
                                        <li>• Fortalecer mecanismos de supervisión humana y rendición de cuentas.</li>
                                        <li>• Diseñar estructuras de gobernanza responsables y sostenibles.</li>
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <p>Significa pasar de evaluar la IA… a <strong>diseñar con criterio.</strong> En esta etapa desarrollarás retos que te permitirán:</p>
                                    <ul className="bullet-list-minimal">
                                        <li>• Integrar IA con intención pedagógica clara.</li>
                                        <li>• Proteger la agencia y dignidad estudiantil.</li>
                                        <li>• Evitar dependencia tecnológica.</li>
                                        <li>• Diseñar experiencias centradas en lo humano.</li>
                                    </ul>
                                </>
                            )}
                        </div>

                        <div className="info-card-step">
                            <div className="step-header">
                                <span className="step-number">02</span>
                                <h3>{isDirectivo ? "Marcos de Liderazgo" : "Marco UNESCO (2024)"}</h3>
                            </div>
                            
                            {isDirectivo ? (
                                <>
                                    <p>Esta fase está alineada con los marcos internacionales que orientan el liderazgo en IA en educación:</p>
                                    <div className="unesco-stack">
                                        <div className="u-item"><strong>EU AI Act 2024:</strong> Enfoque basado en riesgo.</div>
                                        <div className="u-item"><strong>OCDE:</strong> Responsabilidad, robustez y transparencia.</div>
                                        <div className="u-item"><strong>UNESCO:</strong> Dignidad, equidad y protección de derechos.</div>
                                    </div>
                                    <p className="small-context">Para el rol directivo, esta fase implica identificar riesgos estructurales y diseñar protocolos institucionales.</p>
                                </>
                            ) : (
                                <>
                                    <p>Esta fase está alineada con el <em>AI Competency Framework for Teachers</em>, que propone una progresión clara:</p>
                                    <div className="unesco-stack">
                                        <div className="u-item"><strong>Adquirir:</strong> Comprender riesgos y fundamentos.</div>
                                        <div className="u-item"><strong>Profundizar:</strong> Integrar de manera crítica.</div>
                                        <div className="u-item"><strong>Crear:</strong> Diseñar prácticas innovadoras.</div>
                                    </div>
                                    <p className="small-context">Ahora iniciarás el recorrido por estos niveles a través de los retos.</p>
                                </>
                            )}
                        </div>
                    </section>

                    <section className="video-full-section">
                        <div className="section-title-box">
                            <span className="icon-badge">📺</span>
                            <div>
                                <h3>Antes de comenzar</h3>
                                {isDirectivo ? (
                                    <p>Debes visualizar el video explicativo sobre el <strong>marco regulatorio y de gobernanza en IA</strong> aplicado a educación.</p>
                                ) : (
                                    <p>Debes visualizar el video explicativo del <strong>AI Competency Framework for Teachers – UNESCO (2024)</strong>. Este video es la base conceptual de tus retos.</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="video-grid-content">
                            <iframe
                                src={isDirectivo
                                    ? "https://player.cloudinary.com/embed/?cloud_name=deafueoco&public_id=La_Ley_de_IA_de_la_Unio%CC%81n_Europea_qfj6aw&profile=cld-looping"
                                    : "https://player.cloudinary.com/embed/?cloud_name=deafueoco&public_id=UNESCO_VIDEO_xt1z8v&profile=cld-looping"
                                }
                                width="100%"
                                height="100%"
                                style={{ border: "none", backgroundColor: "#000" }}
                                allow="fullscreen; encrypted-media"
                                title="Framework Video"
                            ></iframe>
                            <div className="video-points-card">
                                <h4>En este video encontrarás:</h4>
                                {isDirectivo ? (
                                    <ul>
                                        <li>✔ El enfoque basado en riesgo del EU AI Act.</li>
                                        <li>✔ Qué significa un sistema de alto riesgo en educación.</li>
                                        <li>✔ Las obligaciones de supervisión humana y accountability.</li>
                                        <li>✔ La importancia de la gobernanza de datos.</li>
                                        <li>✔ El rol estratégico del liderazgo directivo en la era de la IA.</li>
                                    </ul>
                                ) : (
                                    <ul>
                                        <li>✔ Las dimensiones del marco.</li>
                                        <li>✔ El enfoque human-centred.</li>
                                        <li>✔ La importancia de la agencia.</li>
                                        <li>✔ El rol de la supervisión humana.</li>
                                        <li>✔ La progresión competencial.</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="final-action-section">
                        <div className="expectations-header">
                            <h3>¿Qué se espera en esta fase?</h3>
                            {isDirectivo ? (
                                <p>No se trata de implementar más tecnología. Se trata de <strong>gobernarla con criterio estratégico.</strong></p>
                            ) : (
                                <p>No se trata de usar más IA. Se trata de usarla con <strong>criterio profesional.</strong></p>
                            )}
                        </div>
                        
                        <div className="expectations-grid-styled">
                            {isDirectivo ? (
                                <>
                                    <div className="exp-card">✔ Tomes decisiones basadas en análisis de riesgo y no en presión tecnológica.</div>
                                    <div className="exp-card">✔ Establezcas criterios claros de aprobación y supervisión de herramientas IA.</div>
                                    <div className="exp-card">✔ Protejas derechos fundamentales y privacidad estudiantil.</div>
                                    <div className="exp-card">✔ Diseñes protocolos ante errores, incidentes y vulneraciones.</div>
                                    
                                </>
                            ) : (
                                <>
                                    <div className="exp-card">✔ Diseñar con intención, no por moda.</div>
                                    <div className="exp-card">✔ Justificar pedagógicamente el uso de IA.</div>
                                    <div className="exp-card">✔ Mantener expectativas altas para todos.</div>
                                    <div className="exp-card">✔ Integrar principios de equidad.</div>
                                </>
                            )}
                        </div>
                        
                        <div className="action-button-wrapper">
                            <button 
                                className="btn-start-transformar-large" 
                                onClick={handleAceptarFase}
                                disabled={isSaving}
                            >
                                {isSaving ? "Registrando..." : (progreso?.Capa_1_Sentido === 'COMPLETADO' ? "Ver Misiones de Retos" : "Aceptar Marco y Comenzar Retos")}
                            </button>
                            {progreso?.Capa_1_Sentido !== 'COMPLETADO' && (
                                <p className="helper-text">Al aceptar, certificas que has comprendido la base ética y conceptual de la fase.</p>
                            )}
                        </div>
                    </section>
                </div>
            ) : (
                // --- VISTA 2: DASHBOARD DE RETOS ---
                <div className="transformar-dashboard animate-fade-in">
                    <div className="dashboard-header-flex">
                            <div className="title-area">
                                {/* CORREGIDO: Este te regresa a la sección del video (Intro) */}
                                <button
                                    className="btn-back-atlas"
                                    onClick={() => setShowIntro(true)}
                                >
                                    ⬅ Volver
                                </button>
                                <h2>{isDirectivo ? "Misiones de Liderazgo y Gobernanza" : "Misiones de Transformación Pedagógica"}</h2>
                            </div>
                        <div className="level-badge-status">
                            {isDirectivo ? "Estatus: " : "Nivel: "} 
                            {retosCompletados.length === 3 ? " Experto" : retosCompletados.length === 2 ? (isDirectivo ? " Estratega" : " Deepen") : retosCompletados.length === 1 ? (isDirectivo ? " Gestor" : " Adquirir") : "🌱 Iniciando"}
                        </div>
                    </div>

                    <div className="retos-roadmap-v2">
                        {(isDirectivo ? [
                            { id: 1, title: "Uso de Alto Riesgo", level: "EU AI Act", icon: "⚖️", desc: "Clasificar un caso según el enfoque basado en riesgo y tomar una decisión." },
                            { id: 2, title: "Protocolo Privacidad", level: "Gobernanza", icon: "🔐", desc: "Diseñar la estructura de un protocolo institucional de privacidad de datos." },
                            { id: 3, title: "Gestión de Crisis", level: "Accountability", icon: "🚨", desc: "Gestionar un incidente crítico generado por un sistema de IA." }
                        ] : [
                            { id: 1, title: "Evaluación Ética", level: "Adquirir", icon: "⚖️", desc: "Comprender riesgos y fundamentos iniciales." },
                            { id: 2, title: "Rediseño Human-Centred", level: "Profundizar", icon: "🧠", desc: "Integrar la IA de manera crítica en tu planeación." },
                            { id: 3, title: "Diferenciación Inclusiva", level: "Crear", icon: "🌍", desc: "Diseñar prácticas innovadoras y responsables." }
                        ]).map((reto) => {
                            const isCompleted = retosCompletados.includes(reto.id);
                            const isLocked = reto.id > 1 && !retosCompletados.includes(reto.id - 1);

                            return (
                                <div key={reto.id} className={`reto-card-premium ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : 'active'}`}>
                                    <div className="reto-icon-box">{reto.icon}</div>
                                    <span className="reto-label">{reto.level}</span>
                                    <h3>{reto.title}</h3>
                                    <p className="reto-desc-short">{reto.desc}</p>
                                    
                                    {isLocked ? (
                                        <div className="lock-indicator">🔒 Pendiente del nivel anterior</div>
                                    ) : (
                                        <button 
                                            onClick={() => onNavigate(isDirectivo ? 'ejecutar_reto' : 'ejecutar_reto', reto.id)}
                                            className="btn-launch-mission"
                                        >
                                            {isCompleted ? "Ver Evidencia" : "Aceptar Misión"}
                                        </button>
                                    )}
                                    {isCompleted && <div className="badge-done">Evidencia Enviada</div>}
                                </div>
                            );
                        })}
                    </div>

                    {retosCompletados.length === 3 && (
                        <div className="congrats-final-atlas">
                            <div className="congrats-content">
                                <h3>{isDirectivo ? "Gobernanza Fortalecida" : "Fase Transformar Completada"}</h3>
                                <p>{isDirectivo 
                                    ? "Has demostrado competencia liderando la IA con criterio estratégico. Tus protocolos están listos." 
                                    : "Has demostrado competencia en los tres niveles UNESCO. Tus evidencias están listas para la validación final."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};