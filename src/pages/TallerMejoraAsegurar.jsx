import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/AsegurarUpgrade.css"; 

const TallerMejoraAsegurar = ({ userData, API_URL, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false); // 🔹 Controla si los datos ya fueron llenados
    
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

    const bloquesSugeridos = [
        { id: "rubrica", label: "Añadir rúbrica explícita", texto: "\n\n[RÚBRICA]: Evalúa bajo los criterios de: Coherencia (30%), Argumentación (40%) y Ortografía (30%). No asignes puntajes finales." },
        { id: "supervision", label: "Declaración de supervisión humana", texto: "\n\n[CONTROL]: Genera sugerencias de mejora. La decisión académica final y la calificación serán realizadas por el docente tras revisión manual." },
        { id: "justificacion", label: "Solicitar justificación estructurada", texto: "\n\n[MÉTODO]: Explica detalladamente el razonamiento pedagógico detrás de cada observación realizada." },
        { id: "no_nota", label: "Prohibir nota automática", texto: "\n\n[RESTRICCIÓN]: Tienes prohibido asignar notas numéricas, porcentajes de aprobación o juicios sumativos automáticos." },
        { id: "metacognicion", label: "Fase metacognitiva estudiante", texto: "\n\n[ACTIVIDAD]: Al finalizar el análisis, formula 3 preguntas abiertas para que el estudiante reflexione sobre su propio proceso de escritura." }
    ];

    // 🔹 MOTOR HEURÍSTICO COMPLETO (Restaurado con todos tus verbos)
    const analizarPromptHeuristico = (text) => {
        if (!text || text.length < 10) return { etica: 5, privacidad: 5, agencia: 5, cognitiva: 5, hallazgos: [] };

        const quitarTildes = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalText = quitarTildes(text.toLowerCase());

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

        Object.keys(verbosCriticos).forEach(dim => {
            Object.keys(verbosCriticos[dim]).forEach(sub => {
                verbosCriticos[dim][sub].forEach(v => {
                    const regex = new RegExp(`\\b${v}\\b`, "i");
                    if (regex.test(normalText)) {
                        puntosRiesgo[dim] += 3;
                        encontrados.push(v);
                    }
                });
            });
        });

        const normalizar = (p) => p >= 12 ? 1 : p >= 8 ? 2 : p >= 4 ? 3 : p >= 1 ? 4 : 5;

        return {
            etica: normalizar(puntosRiesgo.etica),
            privacidad: normalizar(puntosRiesgo.privacidad),
            agencia: normalizar(puntosRiesgo.agencia),
            cognitiva: normalizar(puntosRiesgo.cognitiva),
            hallazgos: [...new Set(encontrados)]
        };
    };

    // 🔹 EFECTO DE CARGA INICIAL (Corregido para traer datos guardados)
    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            try {
                // 1. Intentamos buscar si ya completó ASEGURAR para ver sus datos
                const resExistente = await fetch(`${API_URL}?sheet=ASEGURAR_Docentes&user_key=${userData.Teacher_Key}`);
                const dataExistente = await resExistente.json();

                if (Array.isArray(dataExistente) && dataExistente.length > 0) {
                    const reg = dataExistente[dataExistente.length - 1];
                    setIsReadOnly(true); // 🔹 Activamos modo vista
                    setFormData({
                        promptOriginal: reg.Prompt_Original,
                        promptMejorado: reg.Prompt_Mejorado,
                        alertasOriginal: reg.Alertas_Detectadas ? reg.Alertas_Detectadas.split(", ") : [],
                        bloquesActivados: reg.Bloques_Activados ? reg.Bloques_Activados.split(", ") : [],
                        reflexion: {
                            q1: reg.Reflexion_1_Cambios,
                            q2: reg.Reflexion_2_Riesgos,
                            q3: reg.Reflexion_3_Supervision,
                            q4: reg.Reflexion_4_Cognicion
                        },
                        estandares: reg.Estandar_Seleccionado ? reg.Estandar_Seleccionado.split(" | ") : [],
                        riesgoPrevio: reg.Riesgo_Previo ? JSON.parse(reg.Riesgo_Previo) : null,
                        riesgoFinal: reg.Riesgo_Final ? JSON.parse(reg.Riesgo_Final) : null
                    });
                } else {
                    // 2. Si no hay nada, cargamos el prompt original de LIDERAR para iniciar el taller
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

    // 🔹 MANEJO DE BLOQUES DE MEJORA
    const toggleBloque = (bloque) => {
        if (isReadOnly) return; // 🔹 No permitir cambios si es modo lectura
        let nuevosBloques = formData.bloquesActivados.includes(bloque.id)
            ? formData.bloquesActivados.filter(id => id !== bloque.id)
            : [...formData.bloquesActivados, bloque.id];

        let nuevoPrompt = formData.promptOriginal;
        bloquesSugeridos.forEach(b => {
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
        if (isReadOnly) return onNavigate('fase_asegurar'); // 🔹 Si ya existe, solo salimos

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
                    <h3 className="asegurar-upgrade-title">Visualización Comparativa</h3>
                    <div className="asegurar-upgrade-grid-split">
                        <div className="asegurar-upgrade-panel original">
                            <label>Prompt Original (Identificado en Liderar)</label>
                            <div className="asegurar-upgrade-box">
                                {formData.promptOriginal}
                                <div className="asegurar-upgrade-tags">
                                    {formData.alertasOriginal.length > 0 ? 
                                        formData.alertasOriginal.map(a => <span key={a} className="asegurar-upgrade-alert-tag">⚠ {a}</span>) :
                                        <span className="asegurar-upgrade-safe-tag">Sin alertas graves identificadas</span>
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

                {/* PASO 2: BLOQUES */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 2</div>
                    <h3 className="asegurar-upgrade-title">Activar Sugerencias de Control Humano</h3>
                    <div className="asegurar-upgrade-blocks-container">
                        {bloquesSugeridos.map(b => (
                            <button 
                                key={b.id} 
                                className={`asegurar-upgrade-block-item ${formData.bloquesActivados.includes(b.id) ? 'active' : ''}`}
                                onClick={() => toggleBloque(b)}
                                disabled={isReadOnly}
                            >
                                <span className="asegurar-upgrade-check">{formData.bloquesActivados.includes(b.id) ? "✅" : "➕"}</span>
                                {b.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* PASO 3: RIESGO */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 3</div>
                    <h3 className="asegurar-upgrade-title">Impacto en la Calidad Ética</h3>
                    <div className="asegurar-upgrade-risk-meter">
                        <div className="asegurar-upgrade-risk-box">
                            <span>Estado Anterior</span>
                            <div className="asegurar-upgrade-risk-val high">RIESGO ALTO</div>
                        </div>
                        <div className="asegurar-upgrade-risk-arrow">➔</div>
                        <div className="asegurar-upgrade-risk-box">
                            <span>Estado Actual</span>
                            <div className={`asegurar-upgrade-risk-val ${formData.bloquesActivados.length >= 3 ? 'low' : 'mid'}`}>
                                {formData.bloquesActivados.length >= 3 ? "RIESGO BAJO" : "RIESGO MODERADO"}
                            </div>
                        </div>
                    </div>
                </section>

                {/* PASO 4: REFLEXIÓN */}
                <section className="asegurar-upgrade-section">
                    <div className="asegurar-upgrade-badge">Paso 4</div>
                    <h3 className="asegurar-upgrade-title">Reflexión Crítica {isReadOnly ? "Realizada" : "Obligatoria"}</h3>
                    <div className="asegurar-upgrade-form-group">
                        <div className="asegurar-upgrade-input">
                            <label>1️⃣ ¿Qué cambiaste específicamente en el prompt y por qué?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q1} onChange={(e) => setFormData({...formData, reflexion: {...formData.reflexion, q1: e.target.value}})} />
                        </div>
                        <div className="asegurar-upgrade-input">
                            <label>2️⃣ ¿Qué riesgo ético o de privacidad no habías notado antes?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q2} onChange={(e) => setFormData({...formData, reflexion: {...formData.reflexion, q2: e.target.value}})} />
                        </div>
                        <div className="asegurar-upgrade-input">
                            <label>3️⃣ ¿Cómo garantizarás que la decisión final sea siempre humana?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q3} onChange={(e) => setFormData({...formData, reflexion: {...formData.reflexion, q3: e.target.value}})} />
                        </div>
                        <div className="asegurar-upgrade-input">
                            <label>4️⃣ ¿Qué actividad cognitiva realizará el estudiante que antes se omitía?</label>
                            <textarea readOnly={isReadOnly} value={formData.reflexion.q4} onChange={(e) => setFormData({...formData, reflexion: {...formData.reflexion, q4: e.target.value}})} />
                        </div>
                    </div>
                </section>

                {/* PASO 5: ESTÁNDAR */}
                <section className="asegurar-upgrade-section gold-card">
                    <div className="asegurar-upgrade-badge">Paso 5</div>
                    <h3 className="asegurar-upgrade-title">Declaración de Estándar Profesional</h3>
                    <p>{isReadOnly ? "Estándares cumplidos:" : "Selecciona los principios que guiarán tu práctica a partir de ahora:"}</p>
                    <div className="asegurar-upgrade-checklist">
                        {[
                            "Nunca delegaré la calificación final a una IA.",
                            "Siempre incluiré una rúbrica explícita en mis instrucciones.",
                            "Siempre informaré a mis estudiantes sobre el uso de herramientas IA.",
                            "Siempre incorporaré una fase de revisión crítica de lo generado por la IA."
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