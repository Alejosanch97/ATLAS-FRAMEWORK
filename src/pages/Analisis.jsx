import React, { useState, useEffect } from "react";
import "../Styles/analisis.css";

export const Analisis = ({ userData, API_URL }) => {
    const [formulariosAgrupados, setFormulariosAgrupados] = useState({});
    const [selectedForm, setSelectedForm] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState('stats'); // 'stats' o 'survey'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Realizamos las tres peticiones en paralelo: Respuestas, Config de Preguntas y Config de Formularios
            const [resRespuestas, resConfigPreguntas, resConfigFormularios] = await Promise.all([
                fetch(`${API_URL}?sheet=Respuestas_Usuarios&Teacher_Key=${userData.Teacher_Key}`),
                fetch(`${API_URL}?sheet=Config_Preguntas`),
                fetch(`${API_URL}?sheet=Config_Formularios`)
            ]);

            const dataRespuestas = await resRespuestas.json();
            const dataConfigPreguntas = await resConfigPreguntas.json();
            const dataConfigFormularios = await resConfigFormularios.json();

            if (Array.isArray(dataRespuestas)) {
                procesarDatos(
                    dataRespuestas, 
                    Array.isArray(dataConfigPreguntas) ? dataConfigPreguntas : [],
                    Array.isArray(dataConfigFormularios) ? dataConfigFormularios : []
                );
            }
        } catch (e) {
            console.error("Error al cargar datos del análisis", e);
        }
    };

    const procesarDatos = (respuestas, configuracionPreguntas, configuracionFormularios) => {
        // 1️⃣ Paso 1: Crear Mapa de Títulos de Formularios (Hoja Config_Formularios)
        const mapaFormularios = {};
        configuracionFormularios.forEach(f => {
            const idForm = f.ID_Form?.toString().trim();
            if (idForm) {
                mapaFormularios[idForm] = f.Titulo_Form || "Formulario sin título";
            }
        });

        // 2️⃣ Paso 2: Crear Mapa de Preguntas (Hoja Config_Preguntas)
        const mapaPreguntas = {};
        configuracionPreguntas.forEach(p => {
            const id = p.ID_Pregunta?.toString().trim();
            if (id) {
                mapaPreguntas[id] = {
                    texto: p.Texto_Pregunta?.toString().trim() || "Texto no definido",
                    tipoOriginal: p.Tipo_Respuesta || "",
                    bloque: p.Pregunta || ""
                };
            }
        });

        // 3️⃣ Paso 3: Procesar las respuestas cruzando con ambos mapas
        const agrupado = respuestas.reduce((acc, resp) => {
            const formId = resp.ID_Form;
            const envioId = `${resp.ID_Form}_${resp.Teacher_Key}_${resp.ID_Respuesta_Global}`;

            if (!acc[formId]) {
                acc[formId] = {
                    id: formId,
                    // CORRECCIÓN: Buscamos el nombre en el mapa de formularios usando el ID_Form
                    nombre: mapaFormularios[formId] || resp.Titulo_Form || "Cargando título...", 
                    envios: {},
                    preguntas: {}
                };
            }

            // Acumular puntos para la media
            if (!acc[formId].envios[envioId]) acc[formId].envios[envioId] = 0;
            acc[formId].envios[envioId] += parseFloat(resp.Puntos_Ganados || 0);

            const qId = resp.ID_Pregunta?.toString().trim();
            
            if (!acc[formId].preguntas[qId]) {
                const infoMaestra = mapaPreguntas[qId];
                
                acc[formId].preguntas[qId] = {
                    idPregunta: qId,
                    texto: infoMaestra ? infoMaestra.texto : `Pregunta ${qId}`,
                    respuestas: [],
                    conteoOpciones: {},
                    tipo: "" 
                };
            }
            
            const valor = resp.Valor_Respondido || "";
            acc[formId].preguntas[qId].respuestas.push(valor);

            // Lógica de detección de tipo para gráficas
            if (valor && valor.includes(",")) {
                acc[formId].preguntas[qId].tipo = "CHECKBOX";
                valor.split(",").forEach(opcion => {
                    const cleanOp = opcion.trim();
                    if(cleanOp) acc[formId].preguntas[qId].conteoOpciones[cleanOp] = (acc[formId].preguntas[qId].conteoOpciones[cleanOp] || 0) + 1;
                });
            } else if (!isNaN(valor) && valor !== "" && valor.length < 4) {
                acc[formId].preguntas[qId].tipo = "ESCALA";
                acc[formId].preguntas[qId].conteoOpciones[valor] = (acc[formId].preguntas[qId].conteoOpciones[valor] || 0) + 1;
            } else {
                acc[formId].preguntas[qId].tipo = valor?.length > 70 ? "ABIERTA" : "MULTIPLE";
                if (acc[formId].preguntas[qId].tipo === "MULTIPLE") {
                    acc[formId].preguntas[qId].conteoOpciones[valor] = (acc[formId].preguntas[qId].conteoOpciones[valor] || 0) + 1;
                }
            }
            return acc;
        }, {});

        setFormulariosAgrupados(agrupado);
    };

    const obtenerAnalisisInteligente = (promedio) => {
        if (promedio >= 90) {
            return {
                nivel: "Capacidad ATLAS demostrada",
                color: "#d69e2e",
                parrafo: "La distribución del COMPASS ubica al grupo mayoritariamente en niveles de práctica alineada y consciente. Este resultado evidencia un uso intencional de la inteligencia artificial, acompañado de reflexión pedagógica, criterios éticos claros y comprensión del rol docente. El escenario es favorable para procesos de liderazgo pedagógico, modelaje institucional y aseguramiento de buenas prácticas."
            };
        } else if (promedio >= 80) {
            return {
                nivel: "Práctica alineada en consolidación",
                color: "#3182ce",
                parrafo: "Los resultados indican que el grupo ha integrado la inteligencia artificial de manera consistente en tareas como planificación, diseño de actividades y retroalimentación. Existe claridad pedagógica en su uso, aunque aún se identifican oportunidades para fortalecer la sistematicidad institucional, la documentación de decisiones y la alineación con lineamientos comunes."
            };
        } else if (promedio >= 70) {
            return {
                nivel: "Práctica consciente emergente",
                color: "#38a169",
                parrafo: "El grupo reconoce el potencial de la inteligencia artificial para apoyar el aprendizaje con intención pedagógica y optimizar procesos docentes. Al mismo tiempo, se evidencian preocupaciones legítimas sobre el esfuerzo cognitivo del estudiante y la automatización excesiva, lo que refleja una actitud crítica y responsable frente a su implementación."
            };
        } else if (promedio >= 40) {
            return {
                nivel: "Uso emergente y exploratorio",
                color: "#dd6b20",
                parrafo: "La evidencia sugiere un uso inicial o exploratorio de la inteligencia artificial, caracterizado por aproximaciones puntuales y una reflexión en construcción. El grupo se encuentra en una fase clave para clarificar criterios pedagógicos, fortalecer la alfabetización en IA y definir principios comunes antes de escalar su uso institucionalmente."
            };
        } else {
            return {
                nivel: "Exploración inicial y necesidad de alineación institucional",
                color: "#e53e3e",
                parrafo: "Los resultados muestran una presencia limitada de la inteligencia artificial en la práctica docente y una percepción significativa de riesgos asociados, como la dependencia, los sesgos y la falta de criterios claros. Este escenario refuerza la importancia de la fase AUDITAR como punto de partida para construir acompañamiento institucional, lineamientos éticos y procesos formativos progresivos."
            };
        }
    };


    const abrirAnalisis = (formId) => {
        const form = formulariosAgrupados[formId];
        const puntajes = Object.values(form.envios);
        const n = puntajes.length;
        const promedio = (puntajes.reduce((a, b) => a + b, 0) / n).toFixed(2);
        
        const frecuencias = {};
        puntajes.forEach(p => frecuencias[p] = (frecuencias[p] || 0) + 1);
        const modaValue = Object.keys(frecuencias).reduce((a, b) => frecuencias[a] > frecuencias[b] ? a : b);
        const desviacion = Math.sqrt(puntajes.reduce((a, b) => a + Math.pow(b - promedio, 2), 0) / n).toFixed(2);

        const analisis = obtenerAnalisisInteligente(parseFloat(promedio));

        setSelectedForm({
            ...form,
            promedio, modaValue, desviacion, n, analisis
        });
        setViewMode('stats');
        setShowModal(true);
    };

    return (
        <div className="atl-an-container">
            <div className="atl-an-grid">
                {Object.values(formulariosAgrupados).map(form => {
                    const puntajes = Object.values(form.envios);
                    const mediaLocal = (puntajes.reduce((a,b)=>a+b,0) / puntajes.length).toFixed(0);
                    return (
                        <div key={form.id} className="atl-an-card">
                            <div className="atl-an-card-info">
                                <h4>{form.nombre}</h4>
                                <small className="user-key-tag">FASE: AUDITAR</small>
                            </div>
                            <div className="atl-an-stats-row">
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-val">{puntajes.length}</span>
                                    <span className="atl-an-lbl">MUESTRAS (N)</span>
                                </div>
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-val">{mediaLocal}%</span>
                                    <span className="atl-an-lbl">MEDIA (M)</span>
                                </div>
                            </div>
                            <button className="atl-an-btn-main" onClick={() => abrirAnalisis(form.id)}>
                                Ver Diagnóstico Grupal
                            </button>
                        </div>
                    );
                })}
            </div>

            {showModal && selectedForm && (
                <div className="atl-an-overlay">
                    <div className="atl-an-modal wide animate-fade-in">
                        <div className="atl-an-modal-head">
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <h3>Reporte ATLAS: {selectedForm.nombre}</h3>
                                <button className="atl-an-close" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <div className="modal-tabs">
                                <button className={viewMode === 'stats' ? 'active' : ''} onClick={() => setViewMode('stats')}>📊 Interpretación Grupal</button>
                                <button className={viewMode === 'survey' ? 'active' : ''} onClick={() => setViewMode('survey')}>📝 Evidencias por Pregunta</button>
                            </div>
                        </div>

                        <div className="atl-an-modal-body">
                            {viewMode === 'stats' ? (
                                <div className="stats-view">
                                    <div className="atl-an-metrics-grid">
                                        <div className="atl-an-mini-box dark">
                                            <span className="atl-an-val blue">{selectedForm.promedio}%</span>
                                            <span className="atl-an-lbl">MEDIA (M)</span>
                                        </div>
                                        <div className="atl-an-mini-box dark">
                                            <span className="atl-an-val green">{selectedForm.modaValue}%</span>
                                            <span className="atl-an-lbl">MODA (MO)</span>
                                        </div>
                                        <div className="atl-an-mini-box dark">
                                            <span className="atl-an-val gold">{selectedForm.desviacion}</span>
                                            <span className="atl-an-lbl">DESV. (Σ)</span>
                                        </div>
                                    </div>

                                    <div className="atl-an-progress-section">
                                        <div className="atl-an-bar-label-row">
                                            <span className="atl-an-lbl">POSICIONAMIENTO EN CURVA</span>
                                            <span className="atl-an-lbl">{selectedForm.promedio}%</span>
                                        </div>
                                        <div className="atl-an-bar-bg">
                                            <div className="atl-an-bar-fill" style={{ width: `${selectedForm.promedio}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="atl-an-insight-card">
                                        <p className="atl-an-nivel" style={{color: selectedForm.analisis.color, fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px'}}>
                                            {selectedForm.analisis.nivel}
                                        </p>
                                        <p className="atl-an-desc">
                                            {selectedForm.analisis.parrafo}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="survey-view">
                                    {Object.values(selectedForm.preguntas).map((q) => (
                                        <div key={q.idPregunta} className="pregunta-detalle-card">
                                            <div style={{marginBottom: '15px'}}>
                                                <h5 style={{marginTop: '0px', marginBottom: '8px', color: '#1a202c', fontSize: '1.05rem', lineHeight: '1.4'}}>
                                                    {q.texto}
                                                </h5>
                                                <small style={{color: '#718096', fontSize: '0.7rem'}}>{q.idPregunta}</small>
                                            </div>
                                            
                                            {q.tipo === "ABIERTA" ? (
                                                <div className="sintesis-narrativa">
                                                    {q.respuestas.filter(r => r).map((r, idx) => (
                                                        <p key={idx} style={{fontSize: '0.85rem', marginBottom: '8px'}}>• "{r}"</p>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="frecuencia-grafica-container">
                                                    {Object.entries(q.conteoOpciones).map(([opcion, count]) => {
                                                        const pct = ((count / q.respuestas.length) * 100).toFixed(1);
                                                        return (
                                                            <div key={opcion} className="atl-an-bar-container">
                                                                <div className="atl-an-bar-label-row">
                                                                    <span className="f-text">{opcion}</span>
                                                                    <span className="f-pct">{pct}%</span>
                                                                </div>
                                                                <div className="atl-an-bar-bg">
                                                                    <div className="atl-an-bar-fill" style={{width: `${pct}%`}}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-footer">
                             <button className="atl-an-btn-main" onClick={() => setShowModal(false)}>Cerrar Reporte</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};