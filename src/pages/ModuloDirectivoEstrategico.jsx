import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Radar } from "react-chartjs-2";
import "../Styles/ModuloDirectivo.css";
import "../Styles/analisis.css";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const ModuloDirectivoEstrategico = ({ userData, API_URL, onNavigate }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [viewModeReal, setViewModeReal] = useState('stats'); // 'stats' o 'survey'
    
    // --- DATOS HEREDADOS E INSTITUCIONALES ---
    const [selectedFormReal, setSelectedFormReal] = useState(null);
    const [statsPrompt, setStatsPrompt] = useState({
        totalDocentes: 0,
        distribucionRiesgo: { alto: 0, moderado: 0, responsable: 0 },
        riesgosPromedio: { etica: 0, privacidad: 0, agencia: 0, cognitiva: 0 },
        distribucionPorcentaje: { alto: 0, moderado: 0, responsable: 0 }
    });
    
    // --- ESTADOS DIRECTIVOS (ETAPA 1) ---
    const [panoramaVistos, setPanoramaVistos] = useState({ b1: false, b2: false, b3: false, b4: false });
    
    // --- ESTADOS DIAGNÓSTICO (ETAPA 2 - 20 PREGUNTAS) ---
    const [respuestasDiag, setRespuestasDiag] = useState({
        q1:1, q2:1, q3:1, q4:1, q5:1, q6:1, q7:1, q8:1, q9:1, q10:1,
        q11:1, q12:1, q13:1, q14:1, q15:1, q16:1, q17:1, q18:1, q19:1, q20:1
    });

    const [stepsCompleted, setStepsCompleted] = useState({
        panorama: false,
        diagnostico: false,
        plan: false
    });

    const [isSyncing, setIsSyncing] = useState(false);

    const guardarEnSheet = async (nombreSheet, objetoData, callback) => {
        setIsSyncing(true);

        const payload = {
            action: "create",
            sheet: nombreSheet,
            data: {
                Teacher_Key: userData.Teacher_Key,
                Status: "COMPLETADO",
                ...objetoData
            }
        };

        if (callback) callback();

        try {
            await fetch(API_URL, {
                method: "POST",
                mode: "cors",
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error("Error al guardar:", error);
        } finally {
            setTimeout(() => setIsSyncing(false), 1000);
        }
    };

    const [planAccion, setPlanAccion] = useState({
        objetivo: "",
        acciones: "",
        responsables: "",
        cronograma: "",
        indicadores: "",
        prioridad: "Alta" // Valor por defecto
    });

    useEffect(() => {
        fetchData();
    }, []);

    const obtenerAnalisisInteligente = (promedio) => {
        const p = parseFloat(promedio);
        if (p >= 90) return { nivel: "Capacidad ATLAS demostrada", color: "#d69e2e", parrafo: "La distribución del COMPASS ubica al grupo mayoritariamente en niveles de práctica alineada y consciente. Este resultado evidencia un uso intencional de la inteligencia artificial, acompañado de reflexión pedagógica, criterios éticos claros y comprensión del rol docente. El escenario es favorable para procesos de liderazgo pedagógico, modelaje institucional y aseguramiento de buenas prácticas." };
        if (p >= 80) return { nivel: "Práctica alineada en consolidación", color: "#3182ce", parrafo: "Los resultados indican que el grupo ha integrado la inteligencia artificial de manera consistente en tareas como planificación, diseño de actividades y retroalimentación. Existe claridad pedagógica en su uso, aunque aún se identifican oportunidades para fortalecer la sistematicidad institucional, la documentación de decisiones y la alineación con lineamientos comunes." };
        if (p >= 70) return { nivel: "Práctica consciente emergente", color: "#38a169", parrafo: "El grupo reconoce el potencial de la inteligencia artificial para apoyar el aprendizaje con intención pedagógica y optimizar procesos docentes. Al mismo tiempo, se evidencian preocupaciones legítimas sobre el esfuerzo cognitivo del estudiante y la automatización excesiva, lo que refleja una actitud crítica y responsable frente a su implementación." };
        if (p >= 40) return { nivel: "Uso emergente y exploratorio", color: "#dd6b20", parrafo: "La evidencia sugiere un uso inicial o exploratorio de la inteligencia artificial, caracterizado por aproximaciones puntuales y una reflexión en construcción. El grupo se encuentra en una fase clave para clarificar criterios pedagógicos, fortalecer la alfabetización en IA y definir principios comunes antes de escalar su uso institucionalmente." };
        return { nivel: "Exploración inicial", color: "#e53e3e", parrafo: "Los resultados muestran una presencia limitada de la inteligencia artificial en la práctica docente y una percepción significativa de riesgos asociados, como la dependencia, los sesgos y la falta de criterios claros. Este escenario refuerza la importancia de la fase AUDITAR como punto de partida para construir acompañamiento institucional, lineamientos éticos y procesos formativos progresivos." };
    };

    const fetchData = async () => {
        try {
            const tKey = userData.Teacher_Key;
            const [
                resRespuestas,
                resConfigPreguntas,
                resConfigFormularios,
                resPrompts,
                resPano, // Nueva
                resDiag, // Nueva
                resPlan  // Nueva
            ] = await Promise.all([
                fetch(`${API_URL}?sheet=Respuestas_Usuarios`),
                fetch(`${API_URL}?sheet=Config_Preguntas`),
                fetch(`${API_URL}?sheet=Config_Formularios`),
                fetch(`${API_URL}?sheet=Liderar_Prompts_Docentes`),
                fetch(`${API_URL}?sheet=ASEGURAR_Directivos_Panorama&user_key=${tKey}`),
                fetch(`${API_URL}?sheet=ASEGURAR_Directivos_Diagnostico&user_key=${tKey}`),
                fetch(`${API_URL}?sheet=ASEGURAR_Directivos_Plan_Accion&user_key=${tKey}`)
            ]);

            const dataRespuestas = await resRespuestas.json();
            const dataConfigPreguntas = await resConfigPreguntas.json();
            const dataConfigFormularios = await resConfigFormularios.json();
            const dataPrompts = await resPrompts.json();

            // Datos guardados previamente por el directivo
            const prevPano = await resPano.json();
            const prevDiag = await resDiag.json();
            const prevPlan = await resPlan.json();

            // 1. Cargar Panorama previo
            if (Array.isArray(prevPano) && prevPano.length > 0) {
                const ultimo = prevPano[prevPano.length - 1]; // Tomamos el más reciente
                setPanoramaVistos({
                    b1: ultimo.Visto_Bloque_1_Regulatorio === "SÍ",
                    b2: ultimo.Visto_Bloque_2_Competencias === "SÍ",
                    b3: ultimo.Visto_Bloque_3_Etica === "SÍ",
                    b4: ultimo.Visto_Bloque_4_Cultura === "SÍ"
                });
                setStepsCompleted(prev => ({ ...prev, panorama: true }));
            }

            // 2. Cargar Diagnóstico previo (Mapeo inverso de columnas a q1...q20)
            if (Array.isArray(prevDiag) && prevDiag.length > 0) {
                const uD = prevDiag[prevDiag.length - 1];
                setRespuestasDiag({
                    q1: uD.Gobernanza_1_Politica || 1, q2: uD.Gobernanza_2_Responsable || 1,
                    q3: uD.Gobernanza_3_Evaluacion_Htas || 1, q4: uD.Gobernanza_4_Protocolo_Incidentes || 1,
                    q5: uD.Competencia_1_Etica || 1, q6: uD.Competencia_2_UNESCO_Levels || 1,
                    q7: uD.Competencia_3_Plan_Progresivo || 1, q8: uD.Competencia_4_Reflexion_Critica || 1,
                    q9: uD.Datos_1_Protocolo_Estudiantes || 1, q10: uD.Datos_2_Anonimizacion || 1,
                    q11: uD.Datos_3_Terminos_Htas || 1, q12: uD.Datos_4_Almacenamiento || 1,
                    q13: uD.Supervision_1_Decision_Humana || 1, q14: uD.Supervision_2_No_Automatizada || 1,
                    q15: uD.Supervision_3_Monitoreo_IA || 1, q16: uD.Supervision_4_Revision_Practicas || 1,
                    q17: uD.Transparencia_1_Informa_Estud || 1, q18: uD.Transparencia_2_Lineamientos_Uso || 1,
                    q19: uD.Transparencia_3_Alfabetizacion || 1, q20: uD.Transparencia_4_Declaracion_Pub || 1
                });
                setStepsCompleted(prev => ({ ...prev, diagnostico: true }));
            }

            // 3. Cargar Plan previo
            if (Array.isArray(prevPlan) && prevPlan.length > 0) {
                const uP = prevPlan[prevPlan.length - 1];
                setPlanAccion({
                    objetivo: uP.Objetivo_Estrategico || "",
                    acciones: uP.Acciones_Seleccionadas || "",
                    responsables: uP.Responsables_Asignados || "",
                    cronograma: uP.Cronograma_Estimado || "",
                    indicadores: uP.Indicadores_Exito || "",
                    prioridad: uP.Dimension_Prioridad_1 || "Alta"
                });
                setStepsCompleted(prev => ({ ...prev, plan: true }));
            }

            // Procesar datos generales de otros docentes
            if (Array.isArray(dataRespuestas)) {
                procesarDatosHeredados(dataRespuestas, dataConfigPreguntas, dataConfigFormularios);
            }
            if (Array.isArray(dataPrompts)) {
                procesarDatosPrompts(dataPrompts);
            }

        } catch (e) {
            console.error("Error cargando datos", e);
        } finally {
            setLoading(false);
        }
    };

   const procesarDatosPrompts = (prompts) => {
        let sumaRiesgos = { etica: 0, priv: 0, agen: 0, cogn: 0, count: 0 };
        let dist = { alto: 0, moderado: 0, responsable: 0 };

        prompts.forEach(p => {
            if (p.Status === 'completed') {
                const e = Number(p.Puntaje_Etica || 0);
                const pr = Number(p.Puntaje_Privacidad || 0);
                const a = Number(p.Puntaje_Agencia || 0);
                const c = Number(p.Puntaje_Dependencia || 0);
                const avg = (e + pr + a + c) / 4;

                sumaRiesgos.etica += e; 
                sumaRiesgos.priv += pr;
                sumaRiesgos.agen += a; 
                sumaRiesgos.cogn += c;
                sumaRiesgos.count++;

                if (avg < 2.5) dist.alto++;
                else if (avg < 3.8) dist.moderado++;
                else dist.responsable++;
            }
        });

        const total = sumaRiesgos.count || 1;

        setStatsPrompt({
            totalDocentes: total,
            distribucionRiesgo: {
                alto: dist.alto,
                moderado: dist.moderado,
                responsable: dist.responsable
            },
            distribucionPorcentaje: {
                alto: Math.round((dist.alto / total) * 100),
                moderado: Math.round((dist.moderado / total) * 100),
                responsable: Math.round((dist.responsable / total) * 100)
            },
            riesgosPromedio: {
                etica: (sumaRiesgos.etica / total).toFixed(1),
                privacidad: (sumaRiesgos.priv / total).toFixed(1),
                agencia: (sumaRiesgos.agen / total).toFixed(1),
                cognitiva: (sumaRiesgos.cogn / total).toFixed(1)
            }
        });
    };

    const procesarDatosHeredados = (respuestas, configPreguntas, configFormularios) => {
        const mapaFormularios = {};
        configFormularios.forEach(f => { if (f.ID_Form) mapaFormularios[f.ID_Form.toString().trim()] = f.Titulo_Form; });

        const mapaPreguntas = {};
        configPreguntas.forEach(p => { 
            const id = p.ID_Pregunta?.toString().trim();
            if (id) mapaPreguntas[id] = { texto: p.Texto_Pregunta, bloque: p.Pregunta };
        });

        const agrupado = respuestas.reduce((acc, resp) => {
            const formId = resp.ID_Form;
            const envioId = `${resp.ID_Form}_${resp.Teacher_Key}_${resp.ID_Respuesta_Global}`;
            if (!acc[formId]) acc[formId] = { id: formId, nombre: mapaFormularios[formId] || "Formulario", envios: {}, preguntas: {} };
            
            if (!acc[formId].envios[envioId]) acc[formId].envios[envioId] = 0;
            acc[formId].envios[envioId] += parseFloat(resp.Puntos_Ganados || 0);

            const qId = resp.ID_Pregunta?.toString().trim();
            if (!acc[formId].preguntas[qId]) {
                acc[formId].preguntas[qId] = { idPregunta: qId, texto: mapaPreguntas[qId]?.texto || `Pregunta ${qId}`, respuestas: [], conteoOpciones: {}, tipo: "" };
            }
            
            const valor = resp.Valor_Respondido || "";
            acc[formId].preguntas[qId].respuestas.push(valor);

            if (valor && valor.includes(",")) {
                acc[formId].preguntas[qId].tipo = "CHECKBOX";
                valor.split(",").forEach(op => { const c = op.trim(); acc[formId].preguntas[qId].conteoOpciones[c] = (acc[formId].preguntas[qId].conteoOpciones[c] || 0) + 1; });
            } else if (!isNaN(valor) && valor !== "" && valor.length < 4) {
                acc[formId].preguntas[qId].tipo = "ESCALA";
                acc[formId].preguntas[qId].conteoOpciones[valor] = (acc[formId].preguntas[qId].conteoOpciones[valor] || 0) + 1;
            } else {
                acc[formId].preguntas[qId].tipo = valor?.length > 70 ? "ABIERTA" : "MULTIPLE";
                if (acc[formId].preguntas[qId].tipo === "MULTIPLE") acc[formId].preguntas[qId].conteoOpciones[valor] = (acc[formId].preguntas[qId].conteoOpciones[valor] || 0) + 1;
            }
            return acc;
        }, {});

        const faseA = Object.values(agrupado).find(f => f.nombre.includes("IA") || f.id.includes("AUDITAR"));
        if (faseA) {
            const puntajes = Object.values(faseA.envios);
            const n = puntajes.length;
            const promedio = (puntajes.reduce((a, b) => a + b, 0) / n).toFixed(2);
            const frecuencias = {};
            puntajes.forEach(p => frecuencias[p] = (frecuencias[p] || 0) + 1);
            const modaValue = Object.keys(frecuencias).reduce((a, b) => frecuencias[a] > frecuencias[b] ? a : b);
            const desviacion = Math.sqrt(puntajes.reduce((a, b) => a + Math.pow(b - promedio, 2), 0) / n).toFixed(2);
            const analisis = obtenerAnalisisInteligente(parseFloat(promedio));

            setSelectedFormReal({ ...faseA, promedio, modaValue, desviacion, n, analisis });
        }
    };

    const calcEje = (start, end) => {
        let suma = 0;
        for(let i=start; i<=end; i++) suma += respuestasDiag[`q${i}`] || 1;
        return (suma / 4); 
    };

    const radarData = {
        labels: ["Gobernanza", "Competencia Docente", "Gestión de Datos", "Supervisión Humana", "Transparencia"],
        datasets: [
            {
                label: "Autoevaluación Directiva",
                data: [calcEje(1,4), calcEje(5,8), calcEje(9,12), calcEje(13,16), calcEje(17,20)],
                backgroundColor: "rgba(197, 160, 89, 0.2)",
                borderColor: "#c5a059",
                borderWidth: 2,
            },
            {
                label: "Realidad Docente (Prompting)",
                data: [
                    (selectedFormReal?.promedio / 25) || 0,
                    statsPrompt.riesgosPromedio.agencia,
                    statsPrompt.riesgosPromedio.privacidad,
                    statsPrompt.riesgosPromedio.etica,
                    statsPrompt.riesgosPromedio.cognitiva
                ],
                backgroundColor: "rgba(26, 35, 126, 0.1)",
                borderColor: "#1a237e",
                borderDash: [5, 5],
            }
        ]
    };

    const getClasificacionFinal = () => {
        const ejes = [calcEje(1,4), calcEje(5,8), calcEje(9,12), calcEje(13,16), calcEje(17,20)];
        const avg = ejes.reduce((a, b) => a + b, 0) / 5;
        if (avg >= 3.6) return { nivel: "REFERENTE", color: "#d69e2e" };
        if (avg >= 3.0) return { nivel: "ESTRATÉGICO", color: "#3182ce" };
        if (avg >= 2.0) return { nivel: "EN DESARROLLO", color: "#38a169" };
        return { nivel: "EMERGENTE", color: "#e53e3e" };
    };

    if (loading) return <div className="loader-directivo">Sincronizando Inteligencia Institucional...</div>;

    return (
        <div className="directivo-wrapper">
            {/* PÍLDORA DE SINCRONIZACIÓN FLOTANTE */}
            {isSyncing && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#1a237e',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.8rem',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <div className="spinner-mini"></div>
                    <span>Sincronizando con Excel ATLAS...</span>
                </div>
            )}
            <header className="directivo-header-main">
                <div className="brand">
                    <h2>Módulo de Gobernanza ATLAS</h2>
                    <span>Fase: ASEGURAR | Directivo: {userData.Teacher_Name}</span>
                </div>
                <div className="progress-bar-dir">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Panorama</div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Diagnóstico</div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Plan</div>
                </div>
            </header>

            <main className="directivo-content">
                {/* --- ETAPA 1: PANORAMA (RESTAURADA) --- */}
                {step === 1 && (
                    <div className="section-fade">
                        <div className="panorama-cards">
                            <BloqueReflexion 
                                title="RIESGOS REGULATORIOS" icon="⚖️" check={panoramaVistos.b1} 
                                onClick={() => setPanoramaVistos({...panoramaVistos, b1: !panoramaVistos.b1})}
                                fundamento="El AI Act establece un enfoque basado en riesgo y supervisión humana. Las instituciones son responsables (deployers)."
                                preguntas={["¿Hay decisiones automatizadas sin supervisión humana?", "¿Existe protocolo de datos estudiantiles?", "¿Se evalúan herramientas antes de adoptarlas?"]}
                                alertas={["Sin política formal de IA", "Uso de herramientas sin revisión técnica"]}
                            />
                            <BloqueReflexion 
                                title="COMPETENCIAS DOCENTES" icon="🎓" check={panoramaVistos.b2} 
                                onClick={() => setPanoramaVistos({...panoramaVistos, b2: !panoramaVistos.b2})}
                                fundamento="UNESCO 2024 define niveles Acquire (Básico), Deepen (Integración) y Create (Innovación)."
                                preguntas={["¿Hay formación estructurada en ética y pedagogía?", "¿Existe evaluación de nivel competencial?", "¿Se fomenta la reflexión crítica?"]}
                                alertas={["Formación solo técnica sin ética", "No hay diferenciación de niveles"]}
                            />
                            <BloqueReflexion 
                                title="ÉTICA Y AGENCIA HUMANA" icon="🧠" check={panoramaVistos.b3} 
                                onClick={() => setPanoramaVistos({...panoramaVistos, b3: !panoramaVistos.b3})}
                                fundamento="Enfoque humanocéntrico de la UNESCO. El AI Act exige supervisión humana significativa."
                                preguntas={["¿La decisión final es siempre humana?", "¿Se informa el uso de IA en procesos académicos?", "¿Hay transparencia en evaluación asistida?"]}
                                alertas={["Evaluación IA sin declaración explícita", "Sin lineamientos de supervisión"]}
                            />
                            <BloqueReflexion 
                                title="CULTURA INSTITUCIONAL" icon="🌐" check={panoramaVistos.b4} 
                                onClick={() => setPanoramaVistos({...panoramaVistos, b4: !panoramaVistos.b4})}
                                fundamento="La transformación es cultural. Requiere aprendizaje continuo y experimentación segura."
                                preguntas={["¿Hay narrativa clara del propósito de la IA?", "¿Se promueve experimentación (sandbox)?", "¿Existe un comité de gobernanza IA?"]}
                                alertas={["Adopción reactiva, no estratégica", "Sin responsables institucionales claros"]}
                            />
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button
                                className="btn-next"
                                disabled={!Object.values(panoramaVistos).every(Boolean)}
                                onClick={() => {
                                    // Guardamos y pasamos al paso 2 sin esperar
                                    const dataPanorama = {
                                        Visto_Bloque_1_Regulatorio: panoramaVistos.b1 ? "SÍ" : "NO",
                                        Visto_Bloque_2_Competencias: panoramaVistos.b2 ? "SÍ" : "NO",
                                        Visto_Bloque_3_Etica: panoramaVistos.b3 ? "SÍ" : "NO",
                                        Visto_Bloque_4_Cultura: panoramaVistos.b4 ? "SÍ" : "NO",
                                        Feedback_Opcional_Panorama: "Completado desde Módulo ATLAS"
                                    };

                                    guardarEnSheet("ASEGURAR_Directivos_Panorama", dataPanorama, () => {
                                        setStepsCompleted(prev => ({ ...prev, panorama: true }));
                                        setStep(2);
                                    });
                                }}
                            >
                                {stepsCompleted.panorama ? "✅ Panorama Guardado" : "Guardar y Continuar →"}
                            </button>
                            {!Object.values(panoramaVistos).every(Boolean) && (
                                <p style={{color: '#e53e3e', fontSize: '0.8rem', marginTop: '10px'}}>
                                    * Por favor valide los 4 bloques para continuar
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* --- ETAPA 2: DIAGNÓSTICO ESTRATÉGICO --- */}
                {step === 2 && (
                    <div className="section-fade">
                        <div className="grid-diagnostico-full">
                            
                            {/* COLUMNA IZQUIERDA: EVIDENCIAS (AUDITAR + PROMPTING) */}
                            <div className="panel-realidad-docente">
                                <div className="atl-an-modal-head">
                                    <h3>Evidencia Institucional Real</h3>
                                    <div className="modal-tabs">
                                        <button className={viewModeReal === 'stats' ? 'active' : ''} onClick={() => setViewModeReal('stats')}>📊 Adopción</button>
                                        <button className={viewModeReal === 'survey' ? 'active' : ''} onClick={() => setViewModeReal('survey')}>📝 Riesgos Prompts</button>
                                        <button className={viewModeReal === 'questions' ? 'active' : ''} onClick={() => setViewModeReal('questions')}>🔍 Respuestas Auditar</button>
                                    </div>
                                </div>

                                <div className="scroll-evidencias-directivo">
                                    {selectedFormReal && viewModeReal === 'stats' && (
                                        <div className="stats-view animate-fade-in">
                                            <div className="atl-an-metrics-grid">
                                                <div className="atl-an-mini-box dark"><span className="atl-an-val blue">{selectedFormReal.promedio}%</span><span className="atl-an-lbl">MEDIA</span></div>
                                                <div className="atl-an-mini-box dark"><span className="atl-an-val green">{selectedFormReal.modaValue}%</span><span className="atl-an-lbl">MODA</span></div>
                                                <div className="atl-an-mini-box dark"><span className="atl-an-val gold">{selectedFormReal.desviacion}</span><span className="atl-an-lbl">DESV.</span></div>
                                            </div>
                                            <div className="atl-an-insight-card" style={{marginTop: '15px'}}>
                                                <p style={{color: selectedFormReal.analisis.color, fontWeight:'bold'}}>{selectedFormReal.analisis.nivel}</p>
                                                <p className="atl-an-desc" style={{fontSize: '0.9rem'}}>{selectedFormReal.analisis.parrafo}</p>
                                            </div>
                                        </div>
                                    )}

                                    {viewModeReal === 'survey' && (
                                        <div className="survey-view animate-fade-in">
                                            <div className="riesgo-dist-container">
                                                <h6>Distribución de Riesgo Real:</h6>
                                                {/* Barra de Distribución Visual Corregida */}
                                                <div className="riesgo-bar-global" style={{
                                                    display: 'flex',
                                                    height: '22px', // Un poco más alta para que luzca mejor
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    margin: '20px 0',
                                                    background: '#f1f5f9', // Color de fondo si está vacía
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    <div style={{
                                                        width: `${statsPrompt.distribucionPorcentaje.alto}%`,
                                                        background: '#ef4444',
                                                        transition: 'width 0.8s ease'
                                                    }}></div>
                                                    <div style={{
                                                        width: `${statsPrompt.distribucionPorcentaje.moderado}%`,
                                                        background: '#f59e0b',
                                                        transition: 'width 0.8s ease'
                                                    }}></div>
                                                    <div style={{
                                                        width: `${statsPrompt.distribucionPorcentaje.responsable}%`,
                                                        background: '#10b981',
                                                        transition: 'width 0.8s ease'
                                                    }}></div>
                                                </div>
                                                {/* Etiquetas de Porcentaje y Conteo */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '25px' }}>
                                                    <div className="item-riesgo-detalle" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff5f5', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>🔴 Riesgo Alto (Crítico)</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{statsPrompt.distribucionPorcentaje.alto}% ({statsPrompt.distribucionRiesgo.alto} Docentes)</strong>
                                                    </div>
                                                    <div className="item-riesgo-detalle" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fffbeb', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>🟡 Riesgo Moderado</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{statsPrompt.distribucionPorcentaje.moderado}% ({statsPrompt.distribucionRiesgo.moderado} Docentes)</strong>
                                                    </div>
                                                    <div className="item-riesgo-detalle" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>🟢 Uso Responsable</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{statsPrompt.distribucionPorcentaje.responsable}% ({statsPrompt.distribucionRiesgo.responsable} Docentes)</strong>
                                                    </div>
                                                </div>

                                                <h6 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                                    Promedios por Dimensión (Escala 1-5):
                                                </h6>
                                                <ul className="prompt-list-metrics">
                                                    <li><span>⚖️ Ética:</span> <strong>{statsPrompt.riesgosPromedio.etica}</strong></li>
                                                    <li><span>🔒 Privacidad:</span> <strong>{statsPrompt.riesgosPromedio.privacidad}</strong></li>
                                                    <li><span>👤 Agencia:</span> <strong>{statsPrompt.riesgosPromedio.agencia}</strong></li>
                                                    <li><span>🧠 Andamiaje:</span> <strong>{statsPrompt.riesgosPromedio.cognitiva}</strong></li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {viewModeReal === 'questions' && (
                                        <div className="survey-view animate-fade-in">
                                            {Object.values(selectedFormReal.preguntas).map((q) => (
                                                <div key={q.idPregunta} className="pregunta-detalle-card">
                                                    <h6>{q.texto}</h6>
                                                    {Object.entries(q.conteoOpciones).map(([opcion, count]) => {
                                                        const pct = ((count / q.respuestas.length) * 100).toFixed(1);
                                                        return (
                                                            <div key={opcion} className="atl-an-bar-container">
                                                                <div className="atl-an-bar-label-row"><span>{opcion}</span><span>{pct}%</span></div>
                                                                <div className="atl-an-bar-bg"><div className="atl-an-bar-fill" style={{width: `${pct}%`}}></div></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: RADAR + AUTOEVALUACION 20 ITEMS */}
                            <div className="panel-comparativo-directivo">
                                <div className="radar-box">
                                    <div className="clasificacion-pill" style={{backgroundColor: getClasificacionFinal().color, padding:'5px 15px', borderRadius:'20px', color:'white', fontSize:'0.7rem', fontWeight:'bold', marginBottom:'10px', display:'inline-block'}}>
                                        SISTEMA: {getClasificacionFinal().nivel}
                                    </div>
                                    <Radar data={radarData} options={{ scales: { r: { min: 0, max: 4, ticks: { display: false } } } }} />
                                </div>
                                
                                <div className="form-directivo-likert-scroll" style={{maxHeight:'350px', overflowY:'auto', paddingRight:'10px'}}>
                                    <SeccionLikertGroup 
                                        titulo="1. GOBERNANZA" 
                                        items={[
                                            {id: 1, txt: "Existe política institucional formal sobre IA."},
                                            {id: 2, txt: "Hay responsable/comité designado para gobernanza IA."},
                                            {id: 3, txt: "Se evalúan herramientas antes de su adopción oficial."},
                                            {id: 4, txt: "Existe protocolo de revisión ante incidentes de IA."}
                                        ]}
                                        values={respuestasDiag} onChange={setRespuestasDiag}
                                    />
                                    <SeccionLikertGroup 
                                        titulo="2. COMPETENCIA DOCENTE" 
                                        items={[
                                            {id: 5, txt: "Docentes formados en ética y uso pedagógico de IA."},
                                            {id: 6, txt: "Se evalúa el nivel (Acquire–Deepen–Create) del staff."},
                                            {id: 7, txt: "Existe un plan de capacitación docente progresivo."},
                                            {id: 8, txt: "Se promueve la reflexión crítica institucionalmente."}
                                        ]}
                                        values={respuestasDiag} onChange={setRespuestasDiag}
                                    />
                                    <SeccionLikertGroup 
                                        titulo="3. GESTIÓN DE DATOS" 
                                        items={[
                                            {id: 9, txt: "Protocolo formal para datos estudiantiles en IA."},
                                            {id: 10, txt: "Se exige anonimización de datos en prompts."},
                                            {id: 11, txt: "Se revisan términos legales de herramientas externas."},
                                            {id: 12, txt: "Hay lineamientos sobre almacenamiento de outputs."}
                                        ]}
                                        values={respuestasDiag} onChange={setRespuestasDiag}
                                    />
                                    <SeccionLikertGroup 
                                        titulo="4. SUPERVISIÓN HUMANA" 
                                        items={[
                                            {id: 13, txt: "Decisión final académica es siempre de un humano."},
                                            {id: 14, txt: "No hay decisiones automatizadas sin revisión."},
                                            {id: 15, txt: "Se monitorea la evaluación asistida por IA periódicamente."},
                                            {id: 16, txt: "Hay auditoría de prácticas docentes con IA."}
                                        ]}
                                        values={respuestasDiag} onChange={setRespuestasDiag}
                                    />
                                    <SeccionLikertGroup 
                                        titulo="5. TRANSPARENCIA" 
                                        items={[
                                            {id: 17, txt: "Se informa a estudiantes sobre el uso de IA en clase."},
                                            {id: 18, txt: "Existen lineamientos de uso ético para estudiantes."},
                                            {id: 19, txt: "Se promueve la alfabetización en IA institucional."},
                                            {id: 20, txt: "Existe declaración pública de uso responsable IA."}
                                        ]}
                                        values={respuestasDiag} onChange={setRespuestasDiag}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn-save-draft" onClick={() => guardarEnSheet("Diagnostico_Provisional", respuestasDiag)}>
                                        💾 Guardar Borrador
                                    </button>
                                    <button className="btn-next w-100" onClick={() => {
                                        // Dentro del onClick del Paso 2:
                                        const dataDiagnostico = {
                                            Gobernanza_1_Politica: respuestasDiag.q1,
                                            Gobernanza_2_Responsable: respuestasDiag.q2,
                                            Gobernanza_3_Evaluacion_Htas: respuestasDiag.q3,
                                            Gobernanza_4_Protocolo_Incidentes: respuestasDiag.q4,
                                            Competencia_1_Etica: respuestasDiag.q5,
                                            Competencia_2_UNESCO_Levels: respuestasDiag.q6,
                                            Competencia_3_Plan_Progresivo: respuestasDiag.q7,
                                            Competencia_4_Reflexion_Critica: respuestasDiag.q8,
                                            Datos_1_Protocolo_Estudiantes: respuestasDiag.q9,
                                            Datos_2_Anonimizacion: respuestasDiag.q10,
                                            Datos_3_Terminos_Htas: respuestasDiag.q11,
                                            Datos_4_Almacenamiento: respuestasDiag.q12,
                                            Supervision_1_Decision_Humana: respuestasDiag.q13,
                                            Supervision_2_No_Automatizada: respuestasDiag.q14,
                                            Supervision_3_Monitoreo_IA: respuestasDiag.q15,
                                            Supervision_4_Revision_Practicas: respuestasDiag.q16,
                                            Transparencia_1_Informa_Estud: respuestasDiag.q17,
                                            Transparencia_2_Lineamientos_Uso: respuestasDiag.q18,
                                            Transparencia_3_Alfabetizacion: respuestasDiag.q19,
                                            Transparencia_4_Declaracion_Pub: respuestasDiag.q20,
                                            Puntaje_Total_Radar: (Object.values(respuestasDiag).reduce((a, b) => a + b, 0) / 5).toFixed(2),
                                            Clasificacion_Final: getClasificacionFinal().nivel
                                        };

                                        guardarEnSheet("ASEGURAR_Directivos_Diagnostico", dataDiagnostico, () => {
                                            setStepsCompleted(prev => ({ ...prev, diagnostico: true }));
                                            setStep(3);
                                        });
                                    }}>
                                        Finalizar y Crear Plan →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="section-fade">
                        <div className="canvas-plan" style={{ maxWidth: '900px', margin: '0 auto' }}>
                            <div className="canvas-header" style={{ borderBottom: '2px solid var(--gold-atlas)', marginBottom: '20px', paddingBottom: '10px' }}>
                                <h3 style={{ color: 'var(--primary-atlas)', margin: 0 }}>🏗️ Constructor de Plan Estratégico IA (6 meses)</h3>
                                <p style={{ fontSize: '0.85rem', color: '#666' }}>Fase: Asegurar | Horizonte: Semestral</p>
                            </div>

                            <div className="canvas-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                                {/* SECCIÓN IZQUIERDA: OBJETIVO Y ACCIONES */}
                                <div className="canvas-col">
                                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>🎯 Objetivo Estratégico</label>
                                    <textarea
                                        className="canvas-input"
                                        placeholder="Ej: Formalizar política de uso de IA en evaluación académica..."
                                        style={{ width: '100%', height: '80px', marginBottom: '15px' }}
                                        onChange={(e) => setPlanAccion({ ...planAccion, objetivo: e.target.value })}
                                    />

                                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>🛠️ Acciones Prediseñadas / Seleccionadas</label>
                                    <textarea
                                        className="canvas-input"
                                        placeholder="□ Crear comité IA&#10;□ Capacitación nivel Acquire&#10;□ Protocolo de crisis..."
                                        style={{ width: '100%', height: '120px' }}
                                        onChange={(e) => setPlanAccion({ ...planAccion, acciones: e.target.value })}
                                    />
                                </div>

                                {/* SECCIÓN DERECHA: LOGÍSTICA */}
                                <div className="canvas-col">
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>👤 Responsables Asignados</label>
                                        <input
                                            type="text"
                                            className="canvas-input"
                                            placeholder="Ej: Coordinación Académica, TI"
                                            style={{ width: '100%', padding: '10px' }}
                                            onChange={(e) => setPlanAccion({ ...planAccion, responsables: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>📅 Cronograma</label>
                                            <input
                                                type="text"
                                                placeholder="Ene - Jun 2026"
                                                style={{ width: '100%', padding: '10px' }}
                                                onChange={(e) => setPlanAccion({ ...planAccion, cronograma: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>⚡ Prioridad</label>
                                            <select
                                                style={{ width: '100%', padding: '10px' }}
                                                onChange={(e) => setPlanAccion({ ...planAccion, prioridad: e.target.value })}
                                            >
                                                <option value="Alta">Alta</option>
                                                <option value="Media">Media</option>
                                                <option value="Baja">Baja</option>
                                            </select>
                                        </div>
                                    </div>

                                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>📈 Indicadores de Éxito</label>
                                    <textarea
                                        className="canvas-input"
                                        placeholder="Ej: 100% de docentes capacitados, Política aprobada por consejo..."
                                        style={{ width: '100%', height: '70px' }}
                                        onChange={(e) => setPlanAccion({ ...planAccion, indicadores: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="canvas-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <button className="btn-draft" onClick={() => guardarEnSheet("Plan_Borrador", planAccion)}>
                                    ☁️ Guardar Borrador (Seguir luego)
                                </button>
                                <button className="btn-save-final" onClick={() => {
                                    // Dentro del onClick del Paso 3:
                                    const dataPlan = {
                                        Objetivo_Estrategico: planAccion.objetivo,
                                        Acciones_Seleccionadas: planAccion.acciones,
                                        Responsables_Asignados: planAccion.responsables,
                                        Cronograma_Estimado: planAccion.cronograma,
                                        Indicadores_Exito: planAccion.indicadores,
                                        Dimension_Prioridad_1: planAccion.prioridad, // Usamos prioridad como valor
                                        Dimension_Prioridad_2: "Alta" // Opcional o fijo según tu necesidad
                                    };

                                    guardarEnSheet("ASEGURAR_Directivos_Plan_Accion", dataPlan, () => {
                                        setStepsCompleted(prev => ({ ...prev, plan: true }));
                                        onNavigate('overview');
                                    });
                                }}>
                                    💾 Guardar Plan Estratégico ATLAS
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- SUBCOMPONENTES ---

const BloqueReflexion = ({ title, icon, check, onClick, fundamento, preguntas, alertas }) => (
    <div className={`card-reflexion ${check ? 'active' : ''}`} onClick={onClick} style={{ textAlign: 'left', padding: '20px', cursor:'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>{icon}</span>
            <span style={{ 
                background: check ? '#38a169' : '#cbd5e0', 
                color: 'white', 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '0.7rem',
                fontWeight:'bold'
            }}>
                {check ? 'VALIDADO' : 'PENDIENTE'}
            </span>
        </div>
        <h4 style={{ margin: '15px 0 10px 0', color: '#1a237e', fontSize: '1rem' }}>{title}</h4>
        <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '10px' }}>
            Fundamento: <span style={{ fontWeight: 'normal' }}>{fundamento}</span>
        </p>
        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
            <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '0.75rem' }}>
                {preguntas.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
        </div>
        <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
            {alertas.map((a, i) => (
                <div key={i} style={{ fontSize: '0.7rem', color: '#e53e3e', display: 'flex', gap: '5px' }}>
                    <span>⚠️</span> {a}
                </div>
            ))}
        </div>
    </div>
);

const SeccionLikertGroup = ({ titulo, items, values, onChange }) => (
    <div style={{marginBottom:'20px', background:'#f8f9fa', padding:'10px', borderRadius:'8px'}}>
        <p style={{fontSize:'0.7rem', fontWeight:'bold', color:'#c5a059', marginBottom:'10px'}}>{titulo}</p>
        {items.map(item => (
            <div key={item.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <span style={{fontSize:'0.75rem', flex:1, paddingRight:'10px'}}>{item.txt}</span>
                <div style={{display:'flex', gap:'4px'}}>
                    {[1, 2, 3, 4].map(v => (
                        <button 
                            key={v} 
                            style={{
                                width:'26px', height:'26px', borderRadius:'4px', border:'1px solid #ddd',
                                fontSize:'0.7rem', cursor:'pointer',
                                background: values[`q${item.id}`] === v ? '#c5a059' : 'white',
                                color: values[`q${item.id}`] === v ? 'white' : '#333'
                            }}
                            onClick={() => onChange(prev => ({...prev, [`q${item.id}`]: v}))}
                        >{v}</button>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default ModuloDirectivoEstrategico;