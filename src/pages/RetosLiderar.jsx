import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/LaboratorioEtico.css"; 

const RetosLiderar = ({ userData, API_URL, retoId, onNavigate, datosIniciales }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [esPublico, setEsPublico] = useState(false); 
    const isDirectivo = userData.Rol === "DIRECTIVO";
    
    // Control de interacción para mostrar análisis
    const [haInteractuadoP2, setHaInteractuadoP2] = useState(false);

    const [formData, setFormData] = useState({
        promptReal: "",
        analisisAuto: null,
        rubricaAuto: { etica: 3, privacidad: 3, agencia: 3, cognitiva: 3 },
        respuestasSimulador: { q1: null, q2: null, q3: null, q4: null, q5: null },
    });

    const [analisisFinal, setAnalisisFinal] = useState(null);

    // --- FUNCIÓN AUXILIAR DE LIMPIEZA DE RESPUESTAS ---
    // Esta función quita los prefijos como "R1: ", "R2: ", etc., que vienen del Excel
    const limpiarTextoRespuesta = (texto) => {
        if (!texto) return null;
        return texto.replace(/^R\d+:\s*/, "").trim();
    };

    // --- LÓGICA DE ANÁLISIS PASO 2 ---
    const getEstadoRubrica = () => {
        if (!haInteractuadoP2) return null;
        const valores = Object.values(formData.rubricaAuto);
        const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
        
        if (promedio >= 4.5) return { texto: "Liderazgo Responsable", color: "#22c55e", desc: "Tu enfoque prioriza la ética y la autonomía humana de forma ejemplar. El prompt minimiza riesgos significativamente." };
        if (promedio >= 3.5) return { texto: "Uso Seguro", color: "#84cc16", desc: "El prompt es sólido y sigue lineamientos institucionales, pero tiene margen de mejora en transparencia o declaración de autoría." };
        if (promedio >= 2.5) return { texto: "Riesgo Moderado", color: "#f59e0b", desc: "Atención: Hay elementos que podrían comprometer la privacidad o la agencia docente. Se recomienda revisar la delegación de juicio." };
        return { texto: "Riesgo Crítico", color: "#ef4444", desc: "Requiere rediseño: El prompt delega demasiado juicio académico, usa datos sensibles o fomenta una alta dependencia cognitiva." };
    };

    const indicadoresRubrica = {
        etica: {
            titulo: "1. Ética y No Discriminación",
            niveles: [
                "Nivel 1: Crítico. Contiene lenguaje estereotipado o criterios de exclusión.",
                "Nivel 2: Alto. Puede inducir sesgos implícitos por falta de objetividad.",
                "3. Moderado: No discrimina explícitamente pero carece de estructura neutral.",
                "4. Bajo: Usa lenguaje inclusivo y define estándares objetivos.",
                "5. Ejemplar: Promueve equidad y declara explícitamente revisión anti-sesgo."
            ]
        },
        privacidad: {
            titulo: "2. Privacidad y Protección de Datos",
            niveles: [
                "Nivel 1: Crítico. Solicita nombres, documentos o datos sensibles reales.",
                "Nivel 2: Alto. Usa información que permite identificar parcialmente al sujeto.",
                "3. Moderado: Datos anonimizados pero incluye contexto personal irrelevante.",
                "4. Bajo: Aplica minimización de datos; solo usa lo estrictamente necesario.",
                "5. Ejemplar: Solo usa datos simulados, abstractos o ficticios."
            ]
        },
        agencia: {
            titulo: "3. Agencia Docente y Supervisión",
            niveles: [
                "Nivel 1: Crítico. Delegación total del juicio académico a la IA.",
                "Nivel 2: Alto. La IA determina resultados vinculantes sin validación previa.",
                "3. Moderado: IA sugiere resultados; la revisión humana es solo implícita.",
                "4. Bajo: IA genera borradores; se declara responsabilidad docente final.",
                "5. Ejemplar: IA como apoyo analítico; promueve el juicio crítico del docente."
            ]
        },
        cognitiva: {
            titulo: "4. Dependencia Cognitiva y Estudiante",
            niveles: [
                "Nivel 1: Crítico. La IA realiza la tarea completa sin esfuerzo del alumno.",
                "Nivel 2: Alto. Produce respuesta final con mínima transformación requerida.",
                "3. Moderado: Genera base de trabajo pero no incluye fase metacognitiva.",
                "4. Bajo: Apoya el proceso; exige reformulación o análisis obligatorio.",
                "5. Ejemplar: Actúa como detonador de pensamiento crítico y autonomía."
            ]
        }
    };

    // --- MOTOR DE AUDITORÍA HEURÍSTICA ---
    const analizarPromptHeuristico = (text) => {
        if (!text || text.length < 10) return null;

        // 🔹 Normalización avanzada (minúsculas + sin tildes)
        const quitarTildes = (str) =>
            str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const normalText = quitarTildes(text.toLowerCase());

        const verbosCriticos = {
            agencia: {
                total: [
                    "decide", "determina", "asigna", "define", "califica", "pon la nota", "aprueba", "reprueba",
                    "autoriza", "validar", "valida", "certifica", "evalua", "evaluar", "dictamina", "ordena",
                    "impone", "establece", "selecciona", "elige", "decidir por mi", "toma la decision",
                    "resuelve por mi", "gestiona", "administra", "controla", "supervisa",
                    "clasifica automaticamente", "categoriza", "prioriza",
                    "aprueba automaticamente", "rechaza automaticamente", "descarta",
                    "filtra", "define criterios", "determina criterios",
                    "impide", "bloquea", "sanciona", "castiga",
                    "otorga", "niega", "concede", "adjudica",
                    "designa", "asigna nota", "calcula la nota",
                    "evalua desempeno", "decide admision",
                    "decide contratacion", "aprueba solicitud",
                    "rechaza solicitud", "valora automaticamente",
                    "estima", "dicta", "formula juicio",
                    "emite concepto", "dicta sentencia",
                    "autoriza acceso", "revoca acceso",
                    "habilita", "deshabilita",
                    "define resultado", "establece resultado"
                ],
                automatizacion: [
                    "automaticamente", "sin revision", "sin mi intervencion",
                    "sin supervision", "sin revision humana", "sin intervencion humana",
                    "de forma automatica", "automaticamente decide",
                    "decide solo", "que el sistema decida", "que la ia decida",
                    "sin consultar", "sin aprobacion previa", "sin validacion",
                    "sin control humano", "sin revision docente",
                    "sin revision manual", "proceso automatico",
                    "automatiza la decision", "toma el control",
                    "sin preguntar", "sin confirmacion",
                    "sin autorizacion humana", "autoaprueba",
                    "autoevalua", "autocalifica",
                    "proceso autonomo", "decision autonoma",
                    "ejecuta sin validar", "opera solo",
                    "sin mi permiso", "sin consentimiento",
                    "autoasigna", "autoselecciona",
                    "autogestiona", "autorregula",
                    "sin filtro humano", "sin intervencion del profesor",
                    "sin mediacion", "resuelve automaticamente",
                    "evalua automaticamente", "dictamina automaticamente",
                    "aprueba sin revisar", "rechaza sin revisar",
                    "genera nota automatica", "calificacion automatica",
                    "sin auditoria", "sin control externo",
                    "sin verificacion", "sin revision academica",
                    "sin analisis humano", "decide por defecto",
                    "asignacion automatica", "evaluacion automatica",
                    "resolucion automatica", "sin criterio humano",
                    "sin revision etica", "sin evaluacion humana",
                    "proceso robotizado", "proceso automatizado",
                    "sin comprobacion", "sin revision previa",
                    "ejecucion automatica", "modelo autonomo",
                    "sin intervencion manual", "sin validacion humana",
                    "sin supervision docente",
                    "actua de forma independiente", "actua sin control",
                    "decision inmediata automatica"
                ]
            },

            cognitiva: {
                sustitucion: [
                    "haz la tarea", "resuelve", "escribe el ensayo", "dame el trabajo",
                    "haz mi proyecto", "completa mi tarea",
                    "resuelve el examen", "contesta por mi",
                    "escribe todo", "redacta completo",
                    "dame las respuestas", "respuestas exactas",
                    "sin explicacion", "sin procedimiento",
                    "solo la respuesta", "no expliques",
                    "hazlo todo", "termina mi trabajo",
                    "haz mi informe", "haz mi investigacion",
                    "genera mi ensayo completo",
                    "haz mi presentacion", "prepara mi exposicion",
                    "resuelve el taller", "contesta el cuestionario",
                    "dame el trabajo listo",
                    "solo copia y pega",
                    "hazlo como si fuera yo",
                    "simula que soy yo",
                    "responde como estudiante",
                    "responde como profesor",
                    "haz el analisis completo",
                    "entrega lista",
                    "solucion directa"
                ],
                evasion: [
                    "listo para entregar", "sustituye el analisis",
                    "sin que se note", "que no detecten",
                    "evita deteccion", "indetectable",
                    "que parezca humano", "para que no sospechen",
                    "sin plagio detectable",
                    "que el profesor no se de cuenta"
                ]
            },

            etica: {
                sesgos: [
                    "zona rural", "estrato", "pobre", "bajo rendimiento", "etnico", "genero",
                    "inteligencia baja", "capacidad limitada",
                    "menos capaz", "mas capaz por genero",
                    "rendimiento por raza",
                    "nivel socioeconomico",
                    "clase social",
                    "ninos pobres",
                    "ninos ricos",
                    "discriminacion",
                    "preferir hombres",
                    "preferir mujeres",
                    "descartar por edad",
                    "descartar por origen",
                    "mejor por barrio",
                    "peor por barrio",
                    "estereotipo",
                    "grupo vulnerable",
                    "minoria",
                    "mayoria dominante",
                    "aptitud genetica",
                    "limitacion mental",
                    "perfil racial",
                    "perfil socioeconomico",
                    "clasificar por origen",
                    "segmentar por estrato",
                    "evaluar por contexto social"
                ],
                perfilado: [
                    "perfil psicologico", "personalidad",
                    "clasifica", "etiqueta",
                    "segmenta", "categoriza personas",
                    "determina comportamiento",
                    "predice conducta",
                    "analiza rasgos mentales"
                ]
            },

            privacidad: {
                identificadores: [
                    "nombre", "apellido", "documento", "cedula", "id", "correo",
                    "fecha de nacimiento", "direccion",
                    "telefono", "numero celular",
                    "historia clinica", "registro medico",
                    "datos personales", "informacion confidencial",
                    "expediente", "codigo estudiantil",
                    "matricula", "ubicacion",
                    "coordenadas", "familia",
                    "padres", "acudiente",
                    "contrasena", "usuario",
                    "credenciales", "datos biometricos",
                    "huella", "reconocimiento facial",
                    "foto personal", "imagen personal",
                    "grabacion", "voz",
                    "datos financieros", "cuenta bancaria"
                ],
                sensibles: [
                    "diagnostico", "salud", "discapacidad", "trastorno",
                    "enfermedad mental", "condicion medica",
                    "antecedentes medicos",
                    "historial clinico",
                    "estado psicologico"
                ]
            }
        };

        let puntosRiesgo = { etica: 0, privacidad: 0, agencia: 0, cognitiva: 0 };
        let hallazgos = { etica: [], privacidad: [], agencia: [], cognitiva: [] };

        // 🔹 Búsqueda con regex robusto
        Object.keys(verbosCriticos).forEach(dim => {
            Object.keys(verbosCriticos[dim]).forEach(sub => {
                verbosCriticos[dim][sub].forEach(v => {
                    const regex = new RegExp(`\\b${v}\\b`, "i");
                    if (regex.test(normalText)) {
                        puntosRiesgo[dim] += 3;
                        hallazgos[dim].push(v);
                    }
                });
            });
        });

        const normalizar = (p) =>
            p >= 12 ? 1 :
                p >= 8 ? 2 :
                    p >= 4 ? 3 :
                        p >= 1 ? 4 : 5;

        const getColor = (s) =>
            s <= 2 ? "#ef4444" :
                s <= 3 ? "#f59e0b" :
                    "#22c55e";

        const resultados = {};

        Object.keys(puntosRiesgo).forEach(dim => {
            const score = normalizar(puntosRiesgo[dim]);
            resultados[dim] = {
                score,
                color: getColor(score),
                alerta: hallazgos[dim].length > 0
                    ? `Detectado: ${[...new Set(hallazgos[dim])].join(", ")}`
                    : "Cumplimiento responsable."
            };
        });

        return resultados;
    };
    // --- LÓGICA DE ANÁLISIS PASO 3 ---
    const getAnalisisRiesgo = () => {
        const r = formData.respuestasSimulador;
        if (!r || Object.values(r).some(v => v === null)) return null;
        
        const puntos = { 
            q1: {'IA Automática': 3, 'IA propone, yo acepto': 2, 'IA propone, yo reviso': 1, 'Decisión 100% mía': 0}, 
            q2: {'Datos personales': 3, 'Parcialmente identificable': 2, 'Anonimizados': 1, 'Simulados/Ficticios': 0}, 
            q3: {'No, directo': 3, 'Revisión superficial': 2, 'Análisis previo': 1, 'Insumo crítico': 0}, 
            q4: {'No lo sabe': 3, 'Implícito': 2, 'Mencionado': 1, 'Reflexión conjunta': 0}, 
            q5: {'Sin alternativa': 2, 'No evaluada': 1, 'Comparada': 0, 'IA complemento': 0} 
        };
        
        let total = 0;
        Object.keys(r).forEach(key => { 
            if(puntos[key] && puntos[key][r[key]] !== undefined) {
                total += puntos[key][r[key]]; 
            }
        });

        if (total >= 9) return { 
            texto: "🔴 ALTO RIESGO OPERATIVO", 
            color: "#ef4444", 
            score: total,
            mensaje: "Este prompt delega decisiones críticas a la IA con datos sensibles o nula transparencia. Se requiere intervención humana obligatoria y rediseño del flujo."
        };
        if (total >= 4) return { 
            texto: "🟡 RIESGO MODERADO", 
            color: "#f59e0b", 
            score: total,
            mensaje: "Uso aceptable bajo supervisión. Existen puntos ciegos en la validación o en la comunicación de que se está usando una IA con el usuario final."
        };
        return { 
            texto: "🟢 BAJO RIESGO / SEGURO", 
            color: "#22c55e", 
            score: total,
            mensaje: "Configuración ejemplar. Mantienes el control docente, proteges la identidad de los sujetos y promueves un uso ético de la tecnología."
        };
    };

    // --- PERSISTENCIA Y CARGA (CORREGIDO PARA MARCAR RESPUESTAS) ---
    // 1. FUNCIÓN MAESTRA DE CARGA (Para reutilizar lógica)
    const cargarDatosEnFormulario = (registro) => {
        if (!registro) return;

        setAnalisisFinal(registro);
        setEsPublico(registro.Es_Publico === "SÍ");
        setHaInteractuadoP2(true);

        let respuestasCargadas = { q1: null, q2: null, q3: null, q4: null, q5: null };
        
        // Limpieza de respuestas (JSON o String)
        if (registro.Detalle_Respuestas) {
            try {
                const parsed = JSON.parse(registro.Detalle_Respuestas);
                if (parsed.respuestas) {
                    Object.keys(parsed.respuestas).forEach(key => {
                        respuestasCargadas[key] = limpiarTextoRespuesta(parsed.respuestas[key]);
                    });
                }
            } catch (e) { console.error("Error parseando respuestas JSON:", e); }
        } else if (registro.Clasificacion_Riesgo && registro.Clasificacion_Riesgo.includes("|")) {
            const partes = registro.Clasificacion_Riesgo.split("|");
            partes.forEach(p => {
                if (p.includes("R1:")) respuestasCargadas.q1 = limpiarTextoRespuesta(p.split("R1:")[1]);
                if (p.includes("R2:")) respuestasCargadas.q2 = limpiarTextoRespuesta(p.split("R2:")[1]);
                if (p.includes("R3:")) respuestasCargadas.q3 = limpiarTextoRespuesta(p.split("R3:")[1]);
                if (p.includes("R4:")) respuestasCargadas.q4 = limpiarTextoRespuesta(p.split("R4:")[1]);
                if (p.includes("R5:")) respuestasCargadas.q5 = limpiarTextoRespuesta(p.split("R5:")[1]);
            });
        }

        setFormData({
            promptReal: registro.Prompt_Original || "",
            analisisAuto: analizarPromptHeuristico(registro.Prompt_Original || ""),
            rubricaAuto: {
                etica: parseInt(registro.Puntaje_Etica) || 3,
                privacidad: parseInt(registro.Puntaje_Privacidad) || 3,
                agencia: parseInt(registro.Puntaje_Agencia) || 3,
                cognitiva: parseInt(registro.Puntaje_Dependencia) || 3,
            },
            respuestasSimulador: respuestasCargadas
        });
    };

    // 2. EFECTO DE CARGA INICIAL (Prioriza datos de Props)
    useEffect(() => {
        const fetchDatos = async () => {
            // SI YA TENEMOS DATOS INICIALES DEL PADRE, NO HACEMOS FETCH
            if (datosIniciales) {
                cargarDatosEnFormulario(datosIniciales);
                setLoading(false);
                return;
            }

            // SOLO SI NO HAY PROPS, BUSCAMOS EN LA DB
            setLoading(true);
            try {
                const params = new URLSearchParams({ sheet: "Liderar_Prompts_Docentes", user_key: userData.Teacher_Key });
                const res = await fetch(`${API_URL}?${params.toString()}`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const registro = data.find(r => r.Teacher_Key === userData.Teacher_Key);
                    if (registro) cargarDatosEnFormulario(registro);
                }
            } catch (e) { 
                console.error("Error en Fetch Retos:", e); 
            } finally { 
                setLoading(false); 
            }
        };

        if (userData?.Teacher_Key) fetchDatos();
    }, [userData.Teacher_Key, API_URL, datosIniciales]); // Agregamos datosIniciales aquí

    // 3. EFECTO DEL TIMER (Se mantiene igual)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.promptReal) {
                setFormData(prev => ({ 
                    ...prev, 
                    analisisAuto: analizarPromptHeuristico(formData.promptReal) 
                }));
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [formData.promptReal]);
    // --- FUNCIÓN DE GUARDADO ---
    const handleSave = async (statusFinal = 'non completed') => {
        if (isSaving) return; 
        
        setIsSaving(true);
        const riesgo = getAnalisisRiesgo();
        const r = formData.respuestasSimulador;
        
        // Aquí concatenamos los prefijos para que se guarden ordenados en el Excel
        const detalleTextoRiesgo = riesgo 
            ? `${riesgo.texto} (${riesgo.score}/14) | R1: ${r.q1 || 'N/A'} | R2: ${r.q2 || 'N/A'} | R3: ${r.q3 || 'N/A'} | R4: ${r.q4 || 'N/A'} | R5: ${r.q5 || 'N/A'}`
            : "Pendiente";

        const payload = {
            action: "create",
            sheet: "Liderar_Prompts_Docentes",
            data: {
                ID_Prompt: analisisFinal?.ID_Prompt || `PR-${Date.now()}`,
                Teacher_Key: userData.Teacher_Key,
                Prompt_Original: formData.promptReal,
                Puntaje_Etica: formData.rubricaAuto.etica,
                Puntaje_Privacidad: formData.rubricaAuto.privacidad,
                Puntaje_Agencia: formData.rubricaAuto.agencia,
                Puntaje_Dependencia: formData.rubricaAuto.cognitiva,
                Clasificacion_Riesgo: detalleTextoRiesgo,
                Detalle_Respuestas: JSON.stringify({ respuestas: formData.respuestasSimulador }),
                Es_Publico: esPublico ? "SÍ" : "NO",
                Status: statusFinal,
                Fecha_Registro: new Date().toLocaleString()
            }
        };

        Swal.fire({
            title: "ATLAS",
            text: statusFinal === 'completed' ? "Misión Finalizada con éxito" : "Borrador guardado localmente",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });

        if (statusFinal === 'completed') {
            onNavigate('fase_liderar');
        }

        fetch(API_URL, { 
            method: "POST", 
            mode: "cors", 
            body: JSON.stringify(payload) 
        })
        .then(res => res.json())
        .then(result => {
            console.log("Sincronización finalizada:", result);
            setIsSaving(false);
        })
        .catch(e => {
            console.error("Error en sincronización:", e);
            setIsSaving(false);
        });
    };

    const infoRubrica = getEstadoRubrica();
    const riesgoGlobal = getAnalisisRiesgo();

    return (
        <div className="latlab-unique-wrapper">
            {loading && formData.promptReal && (
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🔄</span>
                        <span className="sync-text">Sincronizando Laboratorio...</span>
                    </div>
                </div>
            )}
            <header className="latlab-main-header">
                <div className="latlab-header-brand">
                    <button className="latlab-btn-back" onClick={() => onNavigate('fase_liderar')}>← Atras</button>
                    <h1>{isDirectivo ? "Gobernanza Institucional" : "Laboratorio de Prompt Ético"}</h1>
                </div>
                <div className="latlab-header-actions">
                    <button 
                        className="latlab-btn-finish" 
                        onClick={() => handleSave('completed')} 
                        disabled={isSaving}
                        style={{ opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                    >
                        {isSaving ? "Guardando..." : "Finalizar Misión"}
                    </button>
                </div>
            </header>

            <main className="latlab-vertical-container">
                {/* PASO 1 */}
                <section className="latlab-card">
                    <div className="latlab-card-title-row">
                        <span className="latlab-step-badge">Paso 1</span>
                        <h3>Input del Prompt</h3>
                    </div>
                    <textarea 
                        className="latlab-textarea"
                        value={formData.promptReal}
                        onChange={(e) => setFormData({...formData, promptReal: e.target.value})}
                        placeholder="Pega aquí el prompt que quieres auditar éticamente..."
                    />
                </section>

                {/* PASO 2 */}
                <section className="latlab-card">
                    <div className="latlab-card-title-row">
                        <span className="latlab-step-badge">Paso 2</span>
                        <h3>Rúbrica de Autoevaluación</h3>
                    </div>
                    <div className="latlab-rubric-stack">
                        {Object.entries(indicadoresRubrica).map(([key, info]) => (
                            <div key={key} className="latlab-rubric-item">
                                <div className="latlab-rubric-info">
                                    <label>{info.titulo}</label>
                                    <span className="latlab-level-tag">Nivel: {formData.rubricaAuto[key]}</span>
                                </div>
                                <input type="range" min="1" max="5" value={formData.rubricaAuto[key]} 
                                    onChange={(e) => {
                                        setHaInteractuadoP2(true);
                                        setFormData({...formData, rubricaAuto: {...formData.rubricaAuto, [key]: parseInt(e.target.value)}});
                                    }} 
                                />
                                <p className="latlab-level-desc">{info.niveles[formData.rubricaAuto[key] - 1]}</p>
                            </div>
                        ))}
                    </div>
                    {infoRubrica && (
                        <div style={{ backgroundColor: infoRubrica.color + '22', borderLeft: `5px solid ${infoRubrica.color}`, padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                            <h4 style={{ margin: 0, color: infoRubrica.color }}>{infoRubrica.texto}</h4>
                            <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#334155' }}>{infoRubrica.desc}</p>
                        </div>
                    )}
                </section>

                {/* PASO 3 */}
                <section className="latlab-card">
                    <div className="latlab-card-title-row">
                        <span className="latlab-step-badge">Paso 3</span>
                        <h3>Simulador de Riesgo Operativo</h3>
                    </div>
                    <div className="latlab-sim-vertical-stack">
                        {[
                            {id: 'q1', label: '1. ¿Quién toma la decisión final?', opts: ['IA Automática', 'IA propone, yo acepto', 'IA propone, yo reviso', 'Decisión 100% mía']},
                            {id: 'q2', label: '2. ¿Qué datos se introducen?', opts: ['Datos personales', 'Parcialmente identificable', 'Anonimizados', 'Simulados/Ficticios']},
                            {id: 'q3', label: '3. ¿Validación del resultado?', opts: ['No, directo', 'Revisión superficial', 'Análisis previo', 'Insumo crítico']},
                            {id: 'q4', label: '4. ¿Transparencia con el usuario?', opts: ['No lo sabe', 'Implícito', 'Mencionado', 'Reflexión conjunta']},
                            {id: 'q5', label: '5. ¿Existencia de alternativa humana?', opts: ['Sin alternativa', 'No evaluada', 'Comparada', 'IA complemento']}
                        ].map(q => (
                            <div key={q.id} className="latlab-sim-box">
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>{q.label}</label>
                                <div className="latlab-opt-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {q.opts.map(o => (
                                        <button key={o} className={`latlab-opt-btn ${formData.respuestasSimulador[q.id] === o ? 'is-active' : ''}`}
                                            onClick={() => setFormData({...formData, respuestasSimulador: {...formData.respuestasSimulador, [q.id]: o}})}>{o}</button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {riesgoGlobal && (
                        <div style={{ border: `2px solid ${riesgoGlobal.color}`, padding: '15px', borderRadius: '10px', marginTop: '20px', textAlign: 'center', backgroundColor: '#fff' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: riesgoGlobal.color }}>{riesgoGlobal.texto} (Puntaje: {riesgoGlobal.score}/14)</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{riesgoGlobal.mensaje}</p>
                        </div>
                    )}
                </section>

                {/* PASO 4 */}
                <section className="latlab-card">
                    <div className="latlab-card-title-row">
                        <span className="latlab-step-badge">Paso 4</span>
                        <h3>Contra-Auditoría Heurística</h3>
                    </div>
                    {formData.analisisAuto ? (
                        <div className="latlab-audit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            {Object.entries(formData.analisisAuto).map(([key, data]) => (
                                <div key={key} style={{ padding: '15px', borderRadius: '8px', borderLeft: `5px solid ${data.color}`, background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <strong style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{key}</strong>
                                        <span style={{ fontWeight: 'bold', color: data.color }}>{data.score}/5</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>{data.alerta}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="latlab-empty-text">Escribe en el Paso 1 para activar la auditoría en tiempo real.</p>
                    )}
                </section>

                {/* PASO 5 */}
                <section className="latlab-card" style={{ border: '2px solid #c5a059' }}>
                    <div className="latlab-card-title-row">
                        <span className="latlab-step-badge">Paso 5</span>
                        <h3>Privacidad de la Misión</h3>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                        <p>¿Deseas compartir este prompt en la Galería de Inspiración ATLAS?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
                            <span style={{ color: !esPublico ? '#1e293b' : '#94a3b8' }}>Privado</span>
                            <label className="atlas-switch">
                                <input type="checkbox" checked={esPublico} onChange={(e) => setEsPublico(e.target.checked)} />
                                <span className="atlas-slider round"></span>
                            </label>
                            <span style={{ color: esPublico ? '#c5a059' : '#94a3b8', fontWeight: 'bold' }}>Público</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default RetosLiderar;