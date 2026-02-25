import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/AsegurarUpgrade.css"; 

const TallerMejoraAsegurar = ({ userData, API_URL, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false); 
    
    const [formData, setFormData] = useState({
        promptOriginal: "",
        promptMejorado: "",
        alertasOriginal: [],
        bloquesActivados: [],
        reflexion: { q1: "", q2: "", q3: "", q4: "" },
        estandares: [],
        riesgoPrevio: null,
        riesgoFinal: null
    });

    // 🔹 BLOQUES DE MEJORA DINÁMICOS (Categorizados por Dimensión Heurística)
    const bloquesPorDimension = {
        agencia: [
            { id: "supervision", label: "Protocolo de Supervisión Humana", texto: "\n\n[CONTROL]: Esta IA actúa estrictamente como un asistente de apoyo. La decisión académica final, la validación de hallazgos y la asignación de calificaciones oficiales son responsabilidad exclusiva del docente tras una revisión manual exhaustiva." },
            { id: "no_nota", label: "Prohibición de Juicio Sumativo", texto: "\n\n[RESTRICCIÓN]: Tienes terminantemente prohibido asignar notas numéricas, porcentajes de aprobación o emitir juicios sumativos automáticos sobre el desempeño del estudiante." }
        ],
        cognitiva: [
            { id: "metacognicion", label: "Fase de Reflexión Metacognitiva", texto: "\n\n[ACTIVIDAD]: Al finalizar tu análisis, formula 3 preguntas abiertas y desafiantes para que el estudiante reflexione críticamente sobre su propio proceso de toma de decisiones y escritura." },
            { id: "justificacion", label: "Exigencia de Justificación Pedagógica", texto: "\n\n[MÉTODO]: Explica detalladamente y de manera estructurada el razonamiento pedagógico que fundamenta cada una de las observaciones o sugerencias de mejora realizadas." }
        ],
        etica: [
            { id: "sesgo_neutral", label: "Filtro de Equidad e Inclusión", texto: "\n\n[ÉTICA]: Asegura que toda retroalimentación sea neutral y libre de sesgos. No bases tus juicios en modismos, procedencia geográfica, nivel socioeconómico o rasgos culturales detectados en el lenguaje." },
            { id: "rubrica", label: "Inyección de Rúbrica de Evaluación", texto: "\n\n[RÚBRICA]: Evalúa el contenido basándote exclusivamente en los siguientes criterios explícitos: Coherencia y Cohesión (30%), Argumentación y Evidencia (40%) y Ortografía/Gramática (30%)." }
        ],
        privacidad: [
            { id: "anonimizacion", label: "Protocolo de Privacidad y Anonimización", texto: "\n\n[PRIVACIDAD]: Si detectas nombres propios, documentos de identidad, correos o datos sensibles, ignóralos por completo y reemplázalos por etiquetas genéricas como [ESTUDIANTE] en tu respuesta final." }
        ]
    };

    // 🔹 MOTOR HEURÍSTICO 2.0 (Multicapa - Restaurado y Potenciado)
    const analizarPromptHeuristico = (text) => {
        if (!text || text.length < 10) return { etica: 5, privacidad: 5, agencia: 5, cognitiva: 5, hallazgos: [] };

        const quitarTildes = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalText = quitarTildes(text.toLowerCase());

        // CAPA 1: Riesgo Explícito (Verbos Críticos Originales)
        const verbosCriticos = {
            agencia: {
                total: [
                    "decide", "determina", "asigna", "define", "califica", "pon la nota", "aprueba", "reprueba",
                    "autoriza", "validar", "valida", "certifica", "evalua", "evaluar", "dictamina", "ordena",
                    "impone", "establece", "selecciona", "elige", "decidir por mi", "toma la decision",
                    "resuelve por mi", "gestiona", "administra", "controla", "supervisa",
                    "clasifica automaticamente", "categoriza", "prioriza", "aprueba automaticamente", 
                    "rechaza automaticamente", "descarta", "filtra", "define criterios", "determina criterios",
                    "impide", "bloquea", "sanciona", "castiga", "otorga", "niega", "concede", "adjudica",
                    "designa", "asigna nota", "calcula la nota", "evalua desempeno", "decide admision",
                    "decide contratacion", "aprueba solicitud", "rechaza solicitud", "valora automaticamente",
                    "estima", "dicta", "formula juicio", "emite concepto", "dicta sentencia",
                    "autoriza acceso", "revoca acceso", "habilita", "deshabilita", "define resultado", "establece resultado"
                ],
                automatizacion: [
                    "automaticamente", "sin revision", "sin mi intervencion", "sin supervision", "sin revision humana", 
                    "sin intervencion humana", "de forma automatica", "automaticamente decide", "decide solo", 
                    "que el sistema decida", "que la ia decida", "sin consultar", "sin aprobacion previa", 
                    "sin validacion", "sin control humano", "sin revision docente", "sin revision manual", 
                    "proceso automatico", "automatiza la decision", "toma el control", "sin preguntar", 
                    "sin confirmacion", "sin autorizacion humana", "autoaprueba", "autoevalua", "autocalifica",
                    "proceso autonomo", "decision autonoma", "ejecuta sin validar", "opera solo", "sin mi permiso", 
                    "sin consentimiento", "autoasigna", "autoselecciona", "autogestiona", "autorregula",
                    "sin filtro humano", "sin intervencion del profesor", "sin mediacion", "resuelve automaticamente",
                    "evalua automaticamente", "dictamina automaticamente", "aprueba sin revisar", "rechaza sin revisar",
                    "genera nota automatica", "calificacion automatica", "sin auditoria", "sin control externo",
                    "sin verificacion", "sin revision academica", "sin analisis humano", "decide por defecto",
                    "asignacion automatica", "evaluacion automatica", "resolucion automatica", "sin criterio humano",
                    "sin revision etica", "sin evaluacion humana", "proceso robotizado", "proceso automatizado",
                    "sin comprobacion", "sin revision previa", "ejecucion automatica", "modelo autonomo",
                    "sin intervencion manual", "sin validacion humana", "sin supervision docente",
                    "actua de forma independiente", "actua sin control", "decision inmediata automatica"
                ]
            },
            cognitiva: {
                sustitucion: [
                    "haz la tarea", "resuelve", "escribe el ensayo", "dame el trabajo", "haz mi proyecto", 
                    "completa mi tarea", "resuelve el examen", "contesta por mi", "escribe todo", "redacta completo",
                    "dame las respuestas", "respuestas exactas", "sin explicacion", "sin procedimiento",
                    "solo la respuesta", "no expliques", "hazlo todo", "termina mi trabajo", "haz mi informe", 
                    "haz mi investigacion", "genera mi ensayo completo", "haz mi presentacion", "prepara mi exposicion",
                    "resuelve el taller", "contesta el cuestionario", "dame el trabajo listo", "solo copia y pega",
                    "hazlo como si fuera yo", "simula que soy yo", "responde como estudiante", "responde como profesor",
                    "haz el analisis completo", "entrega lista", "solucion directa"
                ],
                evasion: [
                    "listo para entregar", "sustituye el analisis", "sin que se note", "que no detecten",
                    "evita deteccion", "indetectable", "que parezca humano", "para que no sospechen",
                    "sin plagio detectable", "que el profesor no se de cuenta"
                ]
            },
            etica: {
                sesgos: [
                    "zona rural", "estrato", "pobre", "bajo rendimiento", "etnico", "genero", "inteligencia baja", 
                    "capacidad limitada", "menos capaz", "mas capaz por genero", "rendimiento por raza",
                    "nivel socioeconomico", "clase social", "ninos pobres", "ninos ricos", "discriminacion",
                    "preferir hombres", "preferir mujeres", "descartar por edad", "descartar por origen",
                    "mejor por barrio", "peor por barrio", "estereotipo", "grupo vulnerable", "minoria",
                    "mayoria dominante", "aptitud genetica", "limitacion mental", "perfil racial",
                    "perfil socioeconomico", "clasificar por origen", "segmentar por estrato", "evaluar por contexto social"
                ],
                perfilado: [
                    "perfil psicologico", "personalidad", "clasifica", "etiqueta", "segmenta", "categoriza personas",
                    "determina comportamiento", "predice conducta", "analiza rasgos mentales"
                ]
            },
            privacidad: {
                identificadores: [
                    "nombre", "apellido", "documento", "cedula", "id", "correo", "fecha de nacimiento", "direccion",
                    "telefono", "numero celular", "historia clinica", "registro medico", "datos personales", 
                    "informacion confidencial", "expediente", "codigo estudiantil", "matricula", "ubicacion",
                    "coordenadas", "familia", "padres", "acudiente", "contrasena", "usuario", "credenciales", 
                    "datos biometricos", "huella", "reconocimiento facial", "foto personal", "imagen personal",
                    "grabacion", "voz", "datos financieros", "cuenta bancaria"
                ],
                sensibles: [
                    "diagnostico", "salud", "discapacidad", "trastorno", "enfermedad mental", "condicion medica",
                    "antecedentes medicos", "historial clinico", "estado psicologico"
                ]
            }
        };

        let puntosRiesgo = { etica: 0, privacidad: 0, agencia: 0, cognitiva: 0 };
        let encontrados = [];

        // CAPA 1 y 2: Léxico y Delegación Funcional Implícita
        Object.keys(verbosCriticos).forEach(dim => {
            Object.keys(verbosCriticos[dim]).forEach(sub => {
                verbosCriticos[dim][sub].forEach(v => {
                    const regex = new RegExp(`\\b${v}\\b`, "i");
                    if (regex.test(normalText)) {
                        // Multiplicador por Capa 2 (Automatización/Sustitución pesan más)
                        let multiplicador = (sub === 'automatizacion' || sub === 'sustitucion') ? 4.5 : 3;
                        puntosRiesgo[dim] += multiplicador;
                        encontrados.push(v);
                    }
                });
            });
        });

        // CAPA 3: Gobernanza (Penalizar si no existe declaración de supervisión humana)
        const supervisiónExpresiones = ["revision humana", "el docente", "el profesor", "supervision", "manual", "validara"];
        const tieneSupervision = supervisiónExpresiones.some(exp => normalText.includes(exp));
        if (!tieneSupervision && puntosRiesgo.agencia > 0) {
            puntosRiesgo.agencia *= 1.5; // Penalización por falta de gobernanza
        }

        // CAPA 4: Dependencia Cognitiva
        const complejidadCognitiva = ["genera argumentos", "redacta estructura", "optimiza ensayo", "escribe version final"];
        complejidadCognitiva.forEach(exp => {
            if (normalText.includes(exp)) {
                puntosRiesgo.cognitiva += 4;
                encontrados.push(exp);
            }
        });

        const normalizar = (p) => p >= 15 ? 1 : p >= 10 ? 2 : p >= 5 ? 3 : p >= 1 ? 4 : 5;

        return {
            etica: normalizar(puntosRiesgo.etica),
            privacidad: normalizar(puntosRiesgo.privacidad),
            agencia: normalizar(puntosRiesgo.agencia),
            cognitiva: normalizar(puntosRiesgo.cognitiva),
            hallazgos: [...new Set(encontrados)]
        };
    };

    // 🔹 EFECTO DE CARGA INICIAL
    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            try {
                const resExistente = await fetch(`${API_URL}?sheet=ASEGURAR_Docentes&user_key=${userData.Teacher_Key}`);
                const dataExistente = await resExistente.json();

                if (Array.isArray(dataExistente) && dataExistente.length > 0) {
                    const reg = dataExistente[dataExistente.length - 1];
                    setIsReadOnly(true); 
                    setFormData({
                        promptOriginal: reg.Prompt_Original,
                        promptMejorado: reg.Prompt_Mejorado,
                        alertasOriginal: reg.Alertas_Detectadas ? reg.Alertas_Detectadas.split(", ") : [],
                        bloquesActivados: reg.Bloques_Activados ? reg.Bloques_Activados.split(", ") : [],
                        reflexion: {
                            q1: reg.Reflexion_1_Cambios, q2: reg.Reflexion_2_Riesgos,
                            q3: reg.Reflexion_3_Supervision, q4: reg.Reflexion_4_Cognicion
                        },
                        estandares: reg.Estandar_Seleccionado ? reg.Estandar_Seleccionado.split(" | ") : [],
                        riesgoPrevio: reg.Riesgo_Previo ? JSON.parse(reg.Riesgo_Previo) : null,
                        riesgoFinal: reg.Riesgo_Final ? JSON.parse(reg.Riesgo_Final) : null
                    });
                } else {
                    const resOriginal = await fetch(`${API_URL}?sheet=Liderar_Prompts_Docentes&user_key=${userData.Teacher_Key}`);
                    const dataOriginal = await resOriginal.json();
                    if (Array.isArray(dataOriginal) && dataOriginal.length > 0) {
                        const original = dataOriginal[dataOriginal.length - 1].Prompt_Original;
                        const analisis = analizarPromptHeuristico(original);
                        setFormData(prev => ({
                            ...prev,
                            promptOriginal: original,
                            promptMejorado: original,
                            alertasOriginal: analisis.hallazgos,
                            riesgoPrevio: analisis,
                            riesgoFinal: analisis
                        }));
                    }
                }
            } catch (e) {
                console.error("Error al cargar historial:", e);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, [API_URL, userData.Teacher_Key]);

    // 🔹 MANEJO DE BLOQUES DE MEJORA DINÁMICA
    const toggleBloque = (bloqueId) => {
        if (isReadOnly) return;
        let nuevosBloques = formData.bloquesActivados.includes(bloqueId)
            ? formData.bloquesActivados.filter(id => id !== bloqueId)
            : [...formData.bloquesActivados, bloqueId];

        let nuevoPrompt = formData.promptOriginal;
        
        // Unificar todos los bloques disponibles para inyectar el texto correcto
        const todosLosBloques = Object.values(bloquesPorDimension).flat();
        todosLosBloques.forEach(b => {
            if (nuevosBloques.includes(b.id)) {
                nuevoPrompt += b.texto;
            }
        });

        const nuevoAnalisis = analizarPromptHeuristico(nuevoPrompt);
        setFormData(prev => ({
            ...prev,
            bloquesActivados: nuevosBloques,
            promptMejorado: nuevoPrompt,
            riesgoFinal: nuevoAnalisis
        }));
    };

    // 🔹 GUARDAR EN EXCEL
    const handleFinalizar = async () => {
        if (isReadOnly) return onNavigate('fase_asegurar');

        const { reflexion, estandares } = formData;
        if (!reflexion.q1 || !reflexion.q2 || !reflexion.q3 || !reflexion.q4 || estandares.length === 0) {
            return Swal.fire("Atención", "Por favor completa todas las reflexiones y selecciona al menos un estándar personal.", "warning");
        }

        setIsSaving(true);
        const payload = {
            action: "create",
            sheet: "ASEGURAR_Docentes",
            data: {
                Teacher_Key: userData.Teacher_Key,
                Status: "Completed",
                Fecha_Finalizacion: new Date().toLocaleString(),
                Prompt_Original: formData.promptOriginal,
                Alertas_Detectadas: formData.alertasOriginal.join(", "),
                Bloques_Activados: formData.bloquesActivados.join(", "),
                Prompt_Mejorado: formData.promptMejorado,
                Riesgo_Previo: JSON.stringify(formData.riesgoPrevio),
                Riesgo_Final: JSON.stringify(formData.riesgoFinal),
                Reflexion_1_Cambios: reflexion.q1,
                Reflexion_2_Riesgos: reflexion.q2,
                Reflexion_3_Supervision: reflexion.q3,
                Reflexion_4_Cognicion: reflexion.q4,
                Estandar_Seleccionado: estandares.join(" | "),
                URL_Doc_Exportable: "GENERADO_LOGBOOK"
            }
        };

        try {
            await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
            Swal.fire("Misión Cumplida", "Has asegurado tu práctica docente con éxito.", "success");
            onNavigate('fase_asegurar');
        } catch (error) {
            Swal.fire("Error", "No pudimos conectar con el servidor.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="asegurar-upgrade-loading">Analizando riesgos de la práctica previa...</div>;

    // Filtrar bloques sugeridos basados en las dimensiones donde el riesgo es bajo (puntaje <= 3)
    const bloquesSugeridosFiltrados = Object.keys(bloquesPorDimension)
        .filter(dim => formData.riesgoPrevio && formData.riesgoPrevio[dim] <= 3)
        .flatMap(dim => bloquesPorDimension[dim]);

    return (
        <div className="asegurar-upgrade-wrapper">
            <header className="asegurar-upgrade-header">
                <div className="asegurar-upgrade-brand">
                    <button className="asegurar-upgrade-back-btn" onClick={() => onNavigate('fase_asegurar')}>←</button>
                    <h1>ASEGURAR: Taller de Mejora de Prácticas</h1>
                </div>
                <button className="asegurar-upgrade-save-btn" onClick={handleFinalizar} disabled={isSaving}>
                    {isSaving ? "Guardando..." : isReadOnly ? "Ver Mejora Realizada" : "Finalizar Asegurar"}
                </button>
            </header>

            <main className="asegurar-upgrade-main">
                {/* PASO 1: VISUALIZACIÓN */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 1</div>
                    <h3 className="asegurar-upgrade-title">Visualización Comparativa y Hallazgos</h3>
                    <div className="asegurar-upgrade-grid-split">
                        <div className="asegurar-upgrade-panel original">
                            <label>Prompt Original (Identificado en Liderar)</label>
                            <div className="asegurar-upgrade-box">
                                {formData.promptOriginal}
                                <div className="asegurar-upgrade-tags">
                                    {formData.alertasOriginal.length > 0 ? 
                                        formData.alertasOriginal.map(a => <span key={a} className="asegurar-upgrade-alert-tag">⚠ {a}</span>) :
                                        <span className="asegurar-upgrade-safe-tag">Sin alertas críticas detectadas</span>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="asegurar-upgrade-panel mejorado">
                            <label>Prompt Mejorado (Evolución Ética)</label>
                            <div className="asegurar-upgrade-box gold">
                                {formData.promptMejorado}
                            </div>
                        </div>
                    </div>
                </section>

                {/* PASO 2: BLOQUES DINÁMICOS */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 2</div>
                    <h3 className="asegurar-upgrade-title">Inyectar Capas de Protección (Heurística Aplicada)</h3>
                    <p className="asegurar-upgrade-subtitle">Selecciona los bloques para mitigar los riesgos detectados estructuralmente:</p>
                    <div className="asegurar-upgrade-blocks-container">
                        {(bloquesSugeridosFiltrados.length > 0 ? bloquesSugeridosFiltrados : Object.values(bloquesPorDimension).flat()).map(b => (
                            <button 
                                key={b.id} 
                                className={`asegurar-upgrade-block-item ${formData.bloquesActivados.includes(b.id) ? 'active' : ''}`}
                                onClick={() => toggleBloque(b.id)}
                                disabled={isReadOnly}
                            >
                                <span className="asegurar-upgrade-check">{formData.bloquesActivados.includes(b.id) ? "✅" : "➕"}</span>
                                <div className="asegurar-upgrade-block-info">
                                    <span className="asegurar-upgrade-block-label">{b.label}</span>
                                    <small className="asegurar-upgrade-block-preview">{b.texto.substring(0, 60)}...</small>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* PASO 3: RIESGO MULTICAPA */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 3</div>
                    <h3 className="asegurar-upgrade-title">Impacto en la Gobernanza y Calidad Ética</h3>
                    
                    <div className="asegurar-upgrade-risk-meter">
                        <div className="asegurar-upgrade-risk-box">
                            <span>Riesgo Estructural Inicial</span>
                            <div className="asegurar-upgrade-risk-val high">VULNERABILIDAD ALTA</div>
                        </div>
                        <div className="asegurar-upgrade-risk-arrow">➔</div>
                        <div className="asegurar-upgrade-risk-box">
                            <span>Riesgo Residual Actual</span>
                            <div className={`asegurar-upgrade-risk-val ${formData.bloquesActivados.length >= 3 ? 'low' : 'mid'}`}>
                                {formData.bloquesActivados.length >= 3 ? "PRÁCTICA ASEGURADA" : "RIESGO EN MITIGACIÓN"}
                            </div>
                        </div>
                    </div>
                </section>

                {/* PASO 4: REFLEXIÓN */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 4</div>
                    <h3 className="asegurar-upgrade-title">Análisis de la Evolución Pedagógica</h3>
                    <div className="asegurar-upgrade-form-group">
                        <div className="asegurar-upgrade-input">
                            <label>1️⃣ ¿Cómo los cambios realizados protegen tu autonomía frente a la delegación funcional?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q1} onChange={(e) => setFormData({...formData, reflexion: {...formData.reflexion, q1: e.target.value}})} />
                        </div>
                        <div className="asegurar-upgrade-input">
                            <label>2️⃣ ¿Qué vulnerabilidades de gobernanza (supervisión humana) detectaste gracias al motor?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q2} onChange={(e) => setFormData({...formData, reflexion: {...formData.reflexion, q2: e.target.value}})} />
                        </div>
                        <div className="asegurar-upgrade-input">
                            <label>3️⃣ ¿De qué manera el prompt asegurado garantiza una evaluación más equitativa?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q3} onChange={(e) => setFormData({...formData, reflexion: {...formData.reflexion, q3: e.target.value}})} />
                        </div>
                        <div className="asegurar-upgrade-input">
                            <label>4️⃣ ¿Qué procesos cognitivos profundos recupera el estudiante con este nuevo diseño?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q4} onChange={(e) => setFormData({...formData, reflexion: {...formData.reflexion, q4: e.target.value}})} />
                        </div>
                    </div>
                </section>

                {/* PASO 5: ESTÁNDAR */}
                <section className="asegurar-upgrade-section gold-card">
                    <div className="asegurar-upgrade-badge">Paso 5</div>
                    <h3 className="asegurar-upgrade-title">Declaración de Estándar Profesional Docente</h3>
                    <p>{isReadOnly ? "Compromisos adquiridos:" : "Selecciona los principios éticos que regirán esta práctica académica:"}</p>
                    <div className="asegurar-upgrade-checklist">
                        {[
                            "No delegaré el juicio sumativo ni la calificación final a sistemas automatizados.",
                            "Garantizaré siempre la transparencia sobre el uso de IA en los procesos de aprendizaje.",
                            "Inyectaré rúbricas y criterios de equidad para mitigar sesgos algorítmicos.",
                            "Diseñaré actividades que prioricen el esfuerzo cognitivo humano sobre la sustitución técnica."
                        ].map(std => (
                            <label key={std} className="asegurar-upgrade-check-row">
                                <input 
                                    type="checkbox" 
                                    disabled={isReadOnly}
                                    checked={formData.estandares.includes(std)}
                                    onChange={(e) => {
                                        const items = e.target.checked ? [...formData.estandares, std] : formData.estandares.filter(i => i !== std);
                                        setFormData({...formData, estandares: items});
                                    }}
                                />
                                <span>{std}</span>
                            </label>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default TallerMejoraAsegurar;