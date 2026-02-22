import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/ejecutarReto.css";

export const EjecutarReto = ({ userData, API_URL, retoId, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // AGREGA ESTA LÍNEA AQUÍ:
    const isDirectivo = userData.Rol === "DIRECTIVO";
    
    // Estado inicial del formulario
    const [formData, setFormData] = useState({
        cumplimiento: []
    });
    
    // Estado para la matriz de puntos (específico del Reto 1)
    const [puntosMatriz, setPuntosMatriz] = useState({ 
        transparency: 0, privacy: 0, bias: 0, agency: 0, supervision: 0 
    });

    useEffect(() => {
        fetchRetoData();
        window.scrollTo(0, 0);
    }, [retoId]);

    const fetchRetoData = async () => {
        setLoading(true);
        try {
            // GET para traer el registro existente de este reto
            const params = new URLSearchParams({
                sheet: "Retos_Transformar_ATLAS",
                user_key: userData.Teacher_Key
            });

            const res = await fetch(`${API_URL}?${params.toString()}`);
            const data = await res.json();
            
            if (Array.isArray(data)) {
                // Buscamos específicamente el reto por su número
                const registro = data.find(r => parseInt(r.Numero_Reto) === parseInt(retoId));
                
                if (registro) {
                    // Mapeamos los datos guardados en el JSON_Data al estado del formulario
                    if (registro.Datos_JSON) {
                        const savedData = JSON.parse(registro.Datos_JSON);
                        setFormData(savedData);
                        // Si hay puntos guardados en el objeto, los restauramos
                        if (savedData.puntosMatriz) setPuntosMatriz(savedData.puntosMatriz);
                    }
                }
            }
        } catch (e) {
            console.error("Error al cargar:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleChecklist = (field, value) => {
        const current = formData[field] || [];
        const nuevo = current.includes(value) 
            ? current.filter(item => item !== value) 
            : [...current, value];
        handleInputChange(field, nuevo);
    };

    const handleMatrizChange = (criterio, valor) => {
        const nuevosPuntos = { ...puntosMatriz, [criterio]: parseInt(valor) };
        setPuntosMatriz(nuevosPuntos);
        
        if (retoId === 1) {
            const total = Object.values(nuevosPuntos).reduce((a, b) => a + b, 0);
            let sugerencia = "";
            if (total < 10) sugerencia = "Riesgo ALTO: La herramienta carece de transparencia o protección de agencia.";
            else if (total < 18) sugerencia = "Riesgo MEDIO: Requiere supervisión docente estricta.";
            else sugerencia = "Riesgo BAJO: La herramienta es transparente y apoya la agencia humana.";
            handleInputChange('riesgoSugerido', sugerencia);
        }
    };

    const saveReto = async (statusFinal = 'ENVIADO') => {
        // --- 1. VALIDACIONES DE RESPUESTAS CORRECTAS (SOLO SI ES ENVÍO FINAL) ---
        if (statusFinal === 'completed') {

            // --- VALIDACIÓN RETO 2 DIRECTIVO ---
            if (isDirectivo && parseInt(retoId) === 2) {
                const esCorrectaDecision = formData.decisionEscenario === 'Implementar con evaluación de impacto previa';
                const esCorrectoBiometricos = formData.sens_Datos_biométricos !== 'Baja';

                // Verificamos el matching (basado en tu contexto técnico)
                const esCorrectoMatching =
                    formData.match_Transparencia === "Comunicar uso a familias" &&
                    formData["match_Supervisión humana"] === "Designar responsable institucional";

                if (!esCorrectaDecision || !esCorrectoBiometricos || !esCorrectoMatching) {
                    Swal.fire({
                        title: "Revisión técnica necesaria",
                        text: "Algunas respuestas no coinciden con el marco regulatorio (EU AI Act). Por favor, revisa la sensibilidad de datos biométricos, la decisión del escenario o el emparejamiento de obligaciones.",
                        icon: "error",
                        confirmButtonColor: "#c5a059"
                    });
                    return; // Bloquea el envío
                }
            }

            // --- VALIDACIÓN RETO 3 DIRECTIVO ---
            if (isDirectivo && parseInt(retoId) === 3) {
                const esCorrectaAccionInmediata = formData.decisionCrisis === 'Activar revisión humana urgente del caso';

                if (!esCorrectaAccionInmediata) {
                    Swal.fire({
                        title: "Protocolo de Crisis Erróneo",
                        text: "Ante un error crítico, la normativa exige activar la revisión humana como primera acción institucional. Por favor, rectifica.",
                        icon: "warning",
                        confirmButtonColor: "#c5a059"
                    });
                    return; // Bloquea el envío
                }
            }
        }

        // --- 2. INICIO DEL PROCESO DE GUARDADO ---
        setIsSaving(true);

        // Nombres de retos dinámicos por Rol
        const nombresRetosDocente = ["", "Evaluación Ética", "Rediseño Human-Centred", "Diferenciación Inclusiva"];
        const nombresRetosDirectivo = ["", "Simulación de Riesgo", "Protocolo de Privacidad", "Gestión de Error Crítico"];

        const nombreActual = isDirectivo ? nombresRetosDirectivo[retoId] : nombresRetosDocente[retoId];

        const payload = {
            action: "create",
            sheet: "Retos_Transformar_ATLAS",
            data: {
                ID_Registro_Reto: `RET-${userData.Teacher_Key}-${retoId}`,
                Teacher_Key: userData.Teacher_Key,
                Numero_Reto: parseInt(retoId),
                Nombre_Reto: nombreActual,
                Nivel_UNESCO: retoId === 1 ? "Acquire" : retoId === 2 ? "Deepen" : "Create",
                Fecha_Creacion: new Date().toISOString(),
                Datos_JSON: JSON.stringify({ ...formData, puntosMatriz }),
                Status_Reto: statusFinal === 'completed' ? "COMPLETADO" : "BORRADOR",
                // Se marca completado en el Excel si tiene 3 o más checks
                Autoevaluacion_Status: (formData.cumplimiento && formData.cumplimiento.length >= 3) ? "COMPLETADO" : "PENDIENTE"
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.status === "success") {
                Swal.fire({
                    title: statusFinal === 'completed' ? "¡Misión Enviada!" : "Borrador Guardado",
                    text: statusFinal === 'completed'
                        ? "Tu reto ha sido validado y sincronizado exitosamente."
                        : "Tu progreso ha sido guardado. Puedes continuar después.",
                    icon: "success",
                    confirmButtonColor: "#c5a059"
                });

                if (statusFinal === 'completed') {
                    onNavigate('fase_transformar');
                }
            } else {
                throw new Error("Error en respuesta del servidor");
            }
        } catch (e) {
            console.error("Error en saveReto:", e);
            Swal.fire({
                title: "Error de Sincronización",
                text: "No se pudo conectar con el servidor ATLAS. Revisa tu conexión.",
                icon: "error",
                confirmButtonColor: "#d33"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="atlas-loading-overlay">
            <div className="atlas-sync-pill">
                <span className="sync-icon">🔄</span>
                <span className="sync-text">Preparando Consigna de Misión...</span>
            </div>
        </div>
    );

    return (
        <div className="atlas-unique-page-wrapper">
            <main className="atlas-unique-main-content">
                
                {/* CABECERA INTEGRADA */}
                <div className="atlas-unique-header-container">
                    <header className="reto-header-inline">
                        <div className="header-left">
                            <button className="btn-back-minimal" onClick={() => onNavigate('fase_transformar')}>⬅ Volver</button>
                            <div className="badge-reto-id">RETO {retoId}</div>
                        </div>
                        <div className="atlas-unique-title-box">
                            <h2>
                                {isDirectivo ? (
                                    <>
                                        {retoId === 1 && "Simulación de uso de alto riesgo en entorno educativo"}
                                        {retoId === 2 && "Protocolo de privacidad estudiantil en uso de IA"}
                                        {retoId === 3 && "Simulación de error crítico de IA"}
                                    </>
                                ) : (
                                    <>
                                        {retoId === 1 && "Evaluación ética y regulatoria de una herramienta IA"}
                                        {retoId === 2 && "Rediseño curricular human-centred con IA"}
                                        {retoId === 3 && "Diseño de estrategia de diferenciación inclusiva con IA"}
                                    </>
                                )}
                            </h2>
                        </div>
                        <button className="btn-save-draft-premium" onClick={() => saveReto('draft')} disabled={isSaving}>
                            {isSaving ? "..." : " Guardar"}
                        </button>
                    </header>
                </div>

                {/* --- SECCIÓN NARRATIVA (UNESCO) --- */}
                <div className="atlas-unique-section-narrative">
                    <section className="narrative-hero-section">
                        {/* --- CARD 1: CONTEXTO --- */}
                        <div className="narrative-card context-card">
                            <h3>{isDirectivo ? "Contexto" : "Contexto AI for Teachers"}</h3>
                            {isDirectivo ? (
                                <div className="unesco-text">
                                    {retoId === 1 && (
                                        <>
                                            <p>El EU AI Act 2024 establece un enfoque basado en riesgo que clasifica los sistemas de IA en:</p>
                                            <ul>
                                                <li>Riesgo inaceptable</li>
                                                <li>Alto riesgo</li>
                                                <li>Riesgo limitado</li>
                                                <li>Riesgo mínimo</li>
                                            </ul>
                                            <p>En el ámbito educativo, ciertos usos pueden considerarse alto riesgo, especialmente cuando:</p>
                                            <ul>
                                                <li>Impactan decisiones académicas o de admisión.</li>
                                                <li>Afectan evaluación o clasificación de estudiantes.</li>
                                                <li>Influyen en acceso a oportunidades educativas.</li>
                                            </ul>
                                            <p>El Act exige: Supervisión humana obligatoria, Documentación de decisiones, Evaluación de impacto en derechos fundamentales y Gobernanza y trazabilidad institucional. Este reto simula un escenario donde el directivo debe aplicar ese marco.</p>
                                        </>
                                    )}
                                    {retoId === 2 && (
                                        <>
                                            <p>El EU AI Act 2024 establece obligaciones diferenciadas según el nivel de riesgo y el tipo de datos procesados.</p>
                                            <p>La Recomendación UNESCO 2021 enfatiza protección de derechos fundamentales, privacidad y dignidad.</p>
                                            <p>En educación, el problema no es solo usar IA, sino cómo se gobiernan los datos que la alimentan.</p>
                                        </>
                                    )}
                                    {retoId === 3 && (
                                        <>
                                            <p>El EU AI Act exige que los sistemas de IA cuenten con mecanismos de:</p>
                                            <ul>
                                                <li>Supervisión humana efectiva.</li>
                                                <li>Mitigación de riesgos.</li>
                                                <li>Documentación de incidentes.</li>
                                                <li>Corrección o suspensión ante fallas.</li>
                                            </ul>
                                            <p>OCDE enfatiza robustez y responsabilidad institucional cuando la IA afecta decisiones relevantes. En educación, un error puede impactar: Calificaciones, Admisiones, Reputación institucional y Confianza de familias.</p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="unesco-text">
                                    {retoId === 1 && (
                                        <>
                                            <p>Según el AI Competency Framework for Teachers (UNESCO, 2024):</p>
                                            <ul>
                                                <li> El docente debe comprender principios éticos y fundamentos de la IA antes de integrarla pedagógicamente.</li>
                                                <li> La IA debe utilizarse respetando derechos humanos y dignidad.</li>
                                                <li> La supervisión humana es indispensable.</li>
                                                <li> El nivel “Adquirir” implica desarrollar comprensión crítica básica sobre riesgos, límites y responsabilidades.</li>
                                            </ul>
                                            <p><strong>El enfoque human-centred exige que:</strong> La tecnología respete derechos y privacidad, no sustituya agencia humana, no amplifique desigualdades o sesgos y permita trazabilidad.</p>
                                        </>
                                    )}
                                    {retoId === 2 && (
                                        <>
                                            <p>Según el AI Competency Framework for Teachers (UNESCO, 2024):</p>
                                            <ul>
                                                <li> La integración de IA debe preservar la agencia humana.</li>
                                                <li> El docente debe dominar la dimensión de AI pedagogy.</li>
                                                <li> La IA no reemplaza el juicio profesional docente.</li>
                                                <li> La progresión “Profundizar” implica integrar IA de manera reflexiva y crítica.</li>
                                            </ul>
                                            <p><strong>El enfoque human-centred exige:</strong> Que la tecnología potencie el aprendizaje, no reduzca el esfuerzo cognitivo y no erosione la autonomía del estudiante.</p>
                                        </>
                                    )}
                                    {retoId === 3 && (
                                        <>
                                            <p>Según el AI Competency Framework for Teachers (UNESCO, 2024):</p>
                                            <ul>
                                                <li> En el nivel “Crear” el docente diseña prácticas innovadoras transferibles.</li>
                                                <li> La IA debe emplearse para ampliar oportunidades, no para segmentar o etiquetar.</li>
                                                <li> La diferenciación debe preservar agencia y expectativas altas.</li>
                                            </ul>
                                            <p><strong>Marcos regulatorios:</strong> UNESCO 2021 enfatiza la inclusión de grupos vulnerables. El AI Act europeo advierte sobre sistemas que refuerzan desigualdades.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* --- CARD 2: PREGUNTAS --- */}
                        <div className="narrative-card info-card">
                            <h3>Preguntas orientadoras:</h3>
                            <ul className="narrative-list">
                                {isDirectivo ? (
                                    <>
                                        {retoId === 1 && (
                                            <>
                                                <li> ¿Sabes cuándo el uso de IA en tu institución podría considerarse de alto riesgo según el EU AI Act?</li>
                                                <li> ¿Podrías justificar ante una autoridad regulatoria la clasificación de riesgo de un sistema de IA usado en tu institución?</li>
                                                <li> ¿Existe en tu institución un criterio claro para aprobar o restringir herramientas de IA?</li>
                                            </>
                                        )}
                                        {retoId === 2 && (
                                            <>
                                                <li> ¿Qué tipo de datos realmente circulan cuando usamos IA en educación?</li>
                                                <li> ¿Todos los datos tienen el mismo nivel de riesgo?</li>
                                                <li> ¿Mi institución distingue entre datos académicos y datos sensibles?</li>
                                            </>
                                        )}
                                        {retoId === 3 && (
                                            <>
                                                <li> ¿Qué haría tu institución si una IA genera información incorrecta que afecta a un estudiante?</li>
                                                <li> ¿Existe un protocolo de respuesta ante daño reputacional o académico causado por IA?</li>
                                                <li> ¿Quién asume responsabilidad cuando la IA se equivoca?</li>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {retoId === 1 && (
                                            <>
                                                <li> ¿Conoces realmente cómo funcionan la herramientas de IA que se pueden usar en clase?</li>
                                                <li> ¿Has pensado en evaluar el impacto en derechos, privacidad y agencia estudiantil antes de integrar alguna?</li>
                                                <li> ¿Podrías justificar su uso frente a una familia o directivo desde un enfoque ético y pedagógico?</li>
                                            </>
                                        )}
                                        {retoId === 2 && (
                                            <>
                                                <li> ¿La IA está ampliando la agencia y el pensamiento crítico de tus estudiantes… o simplemente está haciendo el trabajo por ellos?</li>
                                                <li> Si retiraras la IA mañana, ¿tu diseño de clase seguiría desarrollando pensamiento profundo?</li>
                                            </>
                                        )}
                                        {retoId === 3 && (
                                            <>
                                                <li> ¿La IA en tu aula amplía oportunidades de aprendizaje o puede estar reforzando brechas?</li>
                                                <li> ¿Tu estrategia de diferenciación mantiene altas expectativas para todos?</li>
                                                <li> ¿La personalización que propones protege dignidad y agencia estudiantil?</li>
                                            </>
                                        )}
                                    </>
                                )}
                            </ul>

                            <div className="concepts-tag-box">
                                <strong>{isDirectivo ? "Conceptos relacionados:" : "Conceptos relacionados (UNESCO 2024):"}</strong>
                                <div className="tags-container">
                                    {isDirectivo ? (
                                        <>
                                            {retoId === 1 && ["Risk-based approach", "High-risk AI systems", "Governance framework", "Human oversight", "Accountability", "Fundamental rights"].map(t => <span key={t} className="tag">{t}</span>)}
                                            {retoId === 2 && ["EU AI Act 2024", "UNESCO 2021", "Privacidad", "Gobernanza de datos"].map(t => <span key={t} className="tag">{t}</span>)}
                                            {retoId === 3 && ["Accountability", "Robustness", "Risk mitigation", "Human oversight", "Incident response", "Governance under uncertainty"].map(t => <span key={t} className="tag">{t}</span>)}
                                        </>
                                    ) : (
                                        <>
                                            {retoId === 1 && ["Human-centred mindset", "Ethics of AI", "Agency", "Accountability", "Transparencia", "Sesgo"].map(t => <span key={t} className="tag">{t}</span>)}
                                            {retoId === 2 && ["Human-centred mindset", "Agency", "AI pedagogy"].map(t => <span key={t} className="tag">{t}</span>)}
                                            {retoId === 3 && ["Human-centred mindset", "AI pedagogy", "Inclusión y equidad", "Agency", "Accountability", "Fairness"].map(t => <span key={t} className="tag">{t}</span>)}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- CARD 3: MISIÓN --- */}
                        <div className="narrative-card mission-card">
                            <h3>El Reto: Tu Misión</h3>
                            {isDirectivo ? (
                                <>
                                    {retoId === 1 && <p>Clasificar un caso hipotético de uso de IA en tu institución según el enfoque basado en riesgo del EU AI Act 2024 y tomar una decisión de gobernanza argumentada.</p>}
                                    {retoId === 2 && <p>Diseñar la estructura base de un protocolo institucional de privacidad mediante actividades de clasificación, priorización y gobernanza.</p>}
                                    {retoId === 3 && <p>Gestionar un incidente crítico generado por un sistema de IA y diseñar el protocolo institucional de respuesta.</p>}
                                </>
                            ) : (
                                <>
                                    {retoId === 1 && <p>Aplicar una matriz de análisis ético y regulatorio a una herramienta de IA que utilices (o planees utilizar), para determinar si su uso es pedagógicamente justificable.</p>}
                                    {retoId === 2 && <p>Rediseñar una práctica de aula incorporando IA bajo un enfoque human-centred, demostrando que la IA no sustituye pensamiento, mantiene supervisión docente y fortalece metacognición.</p>}
                                    {retoId === 3 && <p>Diseñar una estrategia de diferenciación inclusiva mediada por IA que amplíe el acceso sin reducir nivel de exigencia, evite etiquetamiento y sea transferible.</p>}
                                </>
                            )}

                            <div className="condiciones-box">
                                <strong>Condiciones del reto:</strong>
                                <ol className="mission-list">
                                    {isDirectivo ? (
                                        <>
                                            {retoId === 1 && (<><li>Identificar el tipo de sistema y su finalidad.</li><li>Determinar si impacta decisiones educativas relevantes.</li><li>Clasificar el nivel de riesgo.</li><li>Identificar obligaciones regulatorias asociadas.</li><li>Emitir una decisión institucional (aprobar, condicionar o restringir).</li></>)}
                                            {retoId === 2 && (<><li>Distinguir niveles de sensibilidad de datos.</li><li>Comprender obligaciones regulatorias.</li><li>Priorizar acciones de gobernanza.</li><li>Tomar decisión fundamentada.</li></>)}
                                            {retoId === 3 && (<><li>Activar supervisión humana inmediata.</li><li>Identificar responsabilidades claras.</li><li>Implementar medidas estructurales.</li><li>Diseñar protocolo de respuesta.</li><li>Priorizar transparencia institucional.</li></>)}
                                        </>
                                    ) : (
                                        <>
                                            {retoId === 1 && (<><li>Identificar la función pedagógica real.</li><li>Analizar riesgos (sesgo, privacidad, agencia).</li><li>Determinar supervisión humana requerida.</li></>)}
                                            {retoId === 2 && (<><li>IA como andamiaje, no producto final.</li><li>Instancia sin IA (defensa oral).</li><li>Explicitar competencia cognitiva.</li><li>Justificar protección de agencia.</li></>)}
                                            {retoId === 3 && (<><li>Objetivo común para todo el grupo.</li><li>Dos variantes de acceso mediadas por IA.</li><li>Evitar reducción de expectativas.</li><li>Instancia común de convergencia.</li></>)}
                                        </>
                                    )}
                                </ol>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="atlas-unique-form-wrapper">
                    {/* ---------------- SECCIÓN EXCLUSIVA DOCENTES ---------------- */}
                    {!isDirectivo && (
                        <>
                            {/* --- FORMULARIO RETO 1 DOCENTE --- */}
                            {retoId === 1 && (
                                <>
                                    <section className="form-card">
                                        <div className="form-section-title">1. Contexto de la Herramienta</div>
                                        <div className="input-group">
                                            <label>Nombre de la herramienta:</label>
                                            <input type="text" placeholder="Ej: ChatGPT, Canva Magic..." value={formData.toolName || ""} onChange={(e) => handleInputChange('toolName', e.target.value)} />
                                        </div>
                                        <div className="input-group">
                                            <label>Nivel educativo donde se usa:</label>
                                            <div className="options-vertical-premium">
                                                {['Primaria', 'Secundaria', 'Media', 'Educación superior'].map(n => (
                                                    <label key={n} className="check-label-row">
                                                        <input type="radio" name="nivel" checked={formData.nivel === n} onChange={() => handleInputChange('nivel', n)} />
                                                        <span className="label-text">{n}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Función principal en clase:</label>
                                            <div className="options-vertical-premium">
                                                {['Generar contenido', 'Retroalimentar', 'Evaluar', 'Personalizar aprendizaje', 'Simular escenarios', 'Automatizar tareas'].map(f => (
                                                    <label key={f} className="check-label-row">
                                                        <input type="checkbox" checked={(formData.funciones || []).includes(f)} onChange={() => handleChecklist('funciones', f)} />
                                                        <span className="label-text">{f}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">2. Uso real en contexto</div>
                                        <label className="group-main-label">¿La herramienta impacta decisiones académicas?</label>
                                        <div className="options-vertical-premium">
                                            {['Sí, influye en calificaciones', 'Sí, influye en retroalimentación', 'No influye directamente', 'No lo he determinado'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="radio" name="impacto" checked={formData.impacto === opt} onChange={() => handleInputChange('impacto', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card highlight">
                                        <div className="form-section-title">3. MATRIZ DE ANÁLISIS ÉTICO – ATLAS (UNESCO)</div>
                                        <div className="table-responsive">
                                            <table className="matriz-table">
                                                <thead>
                                                    <tr>
                                                        <th>Criterio</th>
                                                        <th>Puntaje (0-4)</th>
                                                        <th>Nivel</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { id: 'transparency', label: 'Transparencia', desc: '¿Cómo funciona y cuáles son sus límites?' },
                                                        { id: 'privacy', label: 'Privacidad y Datos', desc: '¿Cómo protege la info personal?' },
                                                        { id: 'bias', label: 'Sesgo y Equidad', desc: '¿Existen sesgos culturales o de género?' },
                                                        { id: 'agency', label: 'Agencia Estudiantil', desc: '¿Sustituye el pensamiento o lo apoya?' },
                                                        { id: 'supervision', label: 'Supervisión Humana', desc: '¿Qué tanto control tiene el docente?' }
                                                    ].map(c => (
                                                        <tr key={c.id}>
                                                            <td className="desc-cell"><strong>{c.label}</strong><br /><small>{c.desc}</small></td>
                                                            <td className="range-cell">
                                                                <input type="range" min="0" max="4" value={puntosMatriz[c.id]} onChange={(e) => handleMatrizChange(c.id, e.target.value)} />
                                                            </td>
                                                            <td className="score-cell">{puntosMatriz[c.id]}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">Reflexión Docente</div>
                                        <div className="input-group">
                                            <label>1. Riesgo principal identificado (Sugerencia automática):</label>
                                            <textarea maxLength={2000} value={formData.riesgoSugerido || ""} onChange={(e) => handleInputChange('riesgoSugerido', e.target.value)} />
                                            <span className="char-count">{formData.riesgoSugerido?.length || 0}/2000</span>
                                        </div>
                                        <div className="input-group">
                                            <label>2. Ajuste necesario antes de implementarla:</label>
                                            <textarea maxLength={2000} value={formData.ajuste || ""} onChange={(e) => handleInputChange('ajuste', e.target.value)} placeholder="Ej: Explicar sesgos a estudiantes..." />
                                        </div>
                                        <div className="input-group">
                                            <label>3. Decisión pedagógica final:</label>
                                            <div className="options-vertical-premium">
                                                {['Es pedagógicamente justificable', 'Es viable con condiciones', 'Requiere rediseño de uso', 'No debería utilizarse'].map(d => (
                                                    <label key={d} className="check-label-row">
                                                        <input type="radio" name="decision" checked={formData.decision === d} onChange={() => handleInputChange('decision', d)} />
                                                        <span className="label-text">{d}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                </>
                            )}

                            {/* --- FORMULARIO RETO 2 DOCENTE --- */}
                            {retoId === 2 && (
                                <>
                                    <section className="form-card">
                                        <div className="form-section-title">1. Contexto de la Clase</div>
                                        <div className="grid-2-col-premium">
                                            <div className="input-group"><label>Grado:</label><input type="text" value={formData.grado || ""} onChange={(e) => handleInputChange('grado', e.target.value)} /></div>
                                            <div className="input-group"><label>Asignatura:</label><input type="text" value={formData.asignatura || ""} onChange={(e) => handleInputChange('asignatura', e.target.value)} /></div>
                                        </div>
                                        <div className="input-group"><label>Tema:</label><input type="text" value={formData.tema || ""} onChange={(e) => handleInputChange('tema', e.target.value)} /></div>
                                        <div className="input-group"><label>Objetivo de aprendizaje:</label><input type="text" value={formData.objetivo || ""} onChange={(e) => handleInputChange('objetivo', e.target.value)} /></div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">2. Diseño original (sin IA)</div>
                                        <label>¿Cómo era tu clase antes?</label>
                                        <div className="options-vertical-premium">
                                            {['Clase magistral', 'Trabajo en grupo', 'Estudio de caso', 'Debate', 'Proyecto', 'Taller práctico'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="radio" name="disenoOriginal" checked={formData.disenoOriginal === opt} onChange={() => handleInputChange('disenoOriginal', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                            <div className="input-group-inline">
                                                <input type="text" placeholder="Otro diseño..." className="inline-input-premium" value={formData.disenoOriginalOtro || ""} onChange={(e) => handleInputChange('disenoOriginalOtro', e.target.value)} />
                                            </div>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">3. Rediseño con IA</div>
                                        <div className="input-group">
                                            <label>Herramienta utilizada:</label>
                                            <div className="options-vertical-premium">
                                                {['Chat generativa', 'Generador de imágenes', 'Tutor adaptativo', 'Corrector automático', 'Plataforma LMS'].map(h => (
                                                    <label key={h} className="check-label-row"><input type="checkbox" checked={(formData.herramientas || []).includes(h)} onChange={() => handleChecklist('herramientas', h)} /><span className="label-text">{h}</span></label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Rol de la IA:</label>
                                            <div className="options-vertical-premium">
                                                {['Generar ejemplos', 'Proporcionar retroalimentación', 'Proponer preguntas', 'Simular escenarios', 'Corregir borradores', 'Resolver tareas completas'].map(r => (
                                                    <label key={r} className="check-label-row"><input type="checkbox" checked={(formData.rolIA || []).includes(r)} onChange={() => handleChecklist('rolIA', r)} /><span className="label-text">{r}</span></label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Tipo de intervención:</label>
                                            <select className="atlas-select-premium" value={formData.intervencion || ""} onChange={(e) => handleInputChange('intervencion', e.target.value)}>
                                                <option value="">Seleccione una categoría...</option>
                                                <option value="Andamiaje temporal">Andamiaje temporal</option>
                                                <option value="Apoyo conceptual">Apoyo conceptual</option>
                                                <option value="Producción final">Producción final</option>
                                                <option value="Simulación exploratoria">Simulación exploratoria</option>
                                            </select>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">4. Enfoque Human-Centred (Checklist)</div>
                                        <div className="options-vertical-premium">
                                            {['Comparación humano vs IA', 'Defensa oral sin IA', 'Declaración obligatoria de uso', 'Reflexión metacognitiva', 'Evaluación sin IA', 'Análisis crítico del output', 'Identificación de sesgos', 'Ninguna de las anteriores'].map(c => (
                                                <label key={c} className="check-label-row"><input type="checkbox" checked={(formData.checklistHuman || []).includes(c)} onChange={() => handleChecklist('checklistHuman', c)} /><span className="label-text">{c}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">5. Agencia estudiantil</div>
                                        <label>La IA en mi clase:</label>
                                        <div className="options-vertical-premium">
                                            {['Reduce esfuerzo cognitivo', 'Mantiene esfuerzo cognitivo', 'Incrementa complejidad cognitiva', 'No lo he medido'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="radio" name="agenciaEstudiantil" checked={formData.agenciaEstudiantil === opt} onChange={() => handleInputChange('agenciaEstudiantil', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">6.  Riesgos y Mitigación </div>
                                        <label>Riesgos identificados:</label>
                                        <div className="options-vertical-premium">
                                            {['Dependencia', 'Sesgo', 'Información incorrecta', 'Pérdida de autoría', 'Superficialidad', 'Ninguno'].map(c => (
                                                <label key={c} className="check-label-row"><input type="checkbox" checked={(formData.checklistHuman || []).includes(c)} onChange={() => handleChecklist('checklistHuman', c)} /><span className="label-text">{c}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">7. Estrategia de mitigación aplicada: </div>
                                        <label>Estrategias:</label>
                                        <div className="options-vertical-premium">
                                            {['Supervisión docente activa', 'Instancia sin IA', 'Rúbrica específica', 'Trabajo en etapas', 'Retroalimentación crítica', 'No se aplicó estrategia'].map(c => (
                                                <label key={c} className="check-label-row"><input type="checkbox" checked={(formData.checklistHuman || []).includes(c)} onChange={() => handleChecklist('checklistHuman', c)} /><span className="label-text">{c}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">8. Evaluación </div>
                                        <label>¿Tu evaluación incluye?</label>
                                        <div className="options-vertical-premium">
                                            {['Declaración de uso de IA', 'Criterios de pensamiento crítico', 'Criterios de ética', 'Defensa oral', 'Evaluación comparativa', 'Ninguno'].map(c => (
                                                <label key={c} className="check-label-row"><input type="checkbox" checked={(formData.checklistHuman || []).includes(c)} onChange={() => handleChecklist('checklistHuman', c)} /><span className="label-text">{c}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">Reflexión Docente</div>
                                        <div className="textarea-group-premium">
                                            <label>Mejora pedagógica principal:</label>
                                            <textarea maxLength={2000} placeholder="Describe la mejora..." value={formData.reflexionMejora || ""} onChange={(e) => handleInputChange('reflexionMejora', e.target.value)} />
                                            <label>Mayor ajuste necesario:</label>
                                            <textarea maxLength={2000} placeholder="Describe el ajuste..." value={formData.reflexionAjuste || ""} onChange={(e) => handleInputChange('reflexionAjuste', e.target.value)} />
                                        </div>
                                    </section>
                                </>
                            )}

                            {/* --- FORMULARIO RETO 3 DOCENTE --- */}
                            {retoId === 3 && (
                                <>
                                    <section className="form-card">
                                        <div className="form-section-title">1. Contexto de la Clase Inclusiva</div>
                                        <div className="grid-2-col-premium">
                                            <input type="text" placeholder="Grado" value={formData.grado3 || ""} onChange={(e) => handleInputChange('grado3', e.target.value)} />
                                            <input type="text" placeholder="Asignatura" value={formData.asig3 || ""} onChange={(e) => handleInputChange('asig3', e.target.value)} />
                                            <input type="text" placeholder="Tema" value={formData.top3 || ""} onChange={(e) => handleInputChange('top3', e.target.value)} />
                                        </div>
                                        <label className="group-main-label">Objetivo cognitivo común (Taxonomía Bloom):</label>
                                        <div className="options-vertical-premium">
                                            {['Aplicar', 'Comprender', 'Analizar', 'Evaluar', 'Crear'].map(b => (
                                                <label key={b} className="check-label-row"><input type="radio" name="bloom" checked={formData.bloom === b} onChange={() => handleInputChange('bloom', b)} /><span className="label-text">{b}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">2. Estrategia de Diferenciación</div>
                                        <div className="options-vertical-premium">
                                            {['Por nivel de complejidad', 'Por formato', 'Por ritmo', 'Por tipo de andamiaje', 'Por interés contextual', 'Combinada'].map(d => (
                                                <label key={d} className="check-label-row"><input type="checkbox" checked={(formData.tipoDif || []).includes(d)} onChange={() => handleChecklist('tipoDif', d)} /><span className="label-text">{d}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">3. Rol de la IA en la diferenciación</div>
                                        <div className="options-vertical-premium">
                                            {['Genera versiones adaptadas del contenido', 'Ofrece apoyos adicionales personalizados', 'Traduce o simplifica lenguaje', 'Proporciona ejemplos contextualizados', 'Ajusta nivel de preguntas', 'No interviene directamente'].map(d => (
                                                <label key={d} className="check-label-row"><input type="checkbox" checked={(formData.tipoDifIA || []).includes(d)} onChange={() => handleChecklist('tipoDifIA', d)} /><span className="label-text">{d}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">4. Protección de Equidad y Dignidad</div>
                                        <div className="options-vertical-premium">
                                            {['Todas las variantes conducen al mismo estándar final', 'No se comunica públicamente quién recibe apoyo adicional', 'Se mantienen expectativas altas para todos', 'Se evita etiquetamiento por nivel', 'Existe instancia común sin diferenciación', 'Supervisión docente activa en todas las variantes'].map(p => (
                                                <label key={p} className="check-label-row"><input type="checkbox" checked={(formData.proteccion || []).includes(p)} onChange={() => handleChecklist('proteccion', p)} /><span className="label-text">{p}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">5. Riesgos identificados</div>
                                        <div className="options-vertical-premium">
                                            {['Reducción de rigor académico', 'Estigmatización implícita', 'Dependencia tecnológica', 'Segmentación excesiva', 'No identifiqué riesgos'].map(p => (
                                                <label key={p} className="check-label-row"><input type="checkbox" checked={(formData.riesgosIdent3 || []).includes(p)} onChange={() => handleChecklist('riesgosIdent3', p)} /><span className="label-text">{p}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">6. Mecanismos de mitigación</div>
                                        <div className="options-vertical-premium">
                                            {['Objetivo común explícito', 'Evaluación con mismo criterio final', 'Revisión humana obligatoria', 'Rotación de apoyos', 'Reflexión estudiantil sobre uso de IA'].map(p => (
                                                <label key={p} className="check-label-row"><input type="checkbox" checked={(formData.mitigacion3 || []).includes(p)} onChange={() => handleChecklist('mitigacion3', p)} /><span className="label-text">{p}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">7. Reflexión y Mitigación</div>
                                        <div className="textarea-group-premium">
                                            <label>Principal aporte inclusivo:</label>
                                            <textarea maxLength={500} placeholder="Escribe aquí..." value={formData.aporte3 || ""} onChange={(e) => handleInputChange('aporte3', e.target.value)} />
                                            <label>Mayor riesgo que vigilar:</label>
                                            <textarea maxLength={500} placeholder="Escribe aquí..." value={formData.riesgoVigilar3 || ""} onChange={(e) => handleInputChange('riesgoVigilar3', e.target.value)} />
                                        </div>
                                    </section>
                                </>
                            )}
                        </>
                    )}

                    {/* ---------------- SECCIÓN EXCLUSIVA DIRECTIVOS ---------------- */}
                    {isDirectivo && (
                        <div className="directivo-forms-container">
                            {/* RETO 1 DIRECTIVO */}
                            {retoId === 1 && (
                                <>
                                    <section className="form-card">
                                        <div className="form-section-title">1. Caso hipotético</div>
                                        <p className="form-subtitle">El sistema de IA propuesto:</p>
                                        <div className="options-vertical-premium">
                                            {['Predice bajo rendimiento estudiantil', 'Clasifica estudiantes por probabilidad de deserción', 'Asiste en calificación automática', 'Filtra candidatos en proceso de admisión', 'Personaliza contenidos sin impacto evaluativo'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="checkbox" checked={(formData.casoHipo || []).includes(opt)} onChange={() => handleChecklist('casoHipo', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                            <div className="input-group-inline">
                                                <input type="text" placeholder="Otro caso..." className="inline-input-premium" value={formData.casoHipoOtro || ""} onChange={(e) => handleInputChange('casoHipoOtro', e.target.value)} />
                                            </div>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">2. Impacto en decisiones institucionales</div>
                                        <div className="options-vertical-premium">
                                            {['Influye directamente en calificaciones', 'Influye en admisión o promoción', 'Influye en acceso a apoyos o recursos', 'Solo brinda apoyo informativo', 'No está claro su impacto'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="radio" name="impactoInst" checked={formData.impactoInst === opt} onChange={() => handleInputChange('impactoInst', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card highlight">
                                        <div className="form-section-title">3. Clasificación de riesgo (según EU AI Act)</div>
                                        <div className="options-vertical-premium">
                                            {['Riesgo mínimo', 'Riesgo limitado', 'Alto riesgo', 'Riesgo inaceptable'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="radio" name="claseRiesgo" checked={formData.claseRiesgo === opt} onChange={() => handleInputChange('claseRiesgo', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">4. Derechos potencialmente afectados</div>
                                        <div className="options-vertical-premium">
                                            {['No discriminación', 'Igualdad de oportunidades', 'Privacidad', 'Acceso a educación', 'Debido proceso', 'No he identificado riesgos en derechos'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="checkbox" checked={(formData.derechosAfectados || []).includes(opt)} onChange={() => handleChecklist('derechosAfectados', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">5. Obligaciones de gobernanza identificadas</div>
                                        <div className="options-vertical-premium">
                                            {['Supervisión humana obligatoria', 'Documentación de decisiones', 'Evaluación de impacto', 'Transparencia ante estudiantes y familias', 'Registro institucional del sistema', 'Ninguna obligación identificada'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="checkbox" checked={(formData.obligacionesGob || []).includes(opt)} onChange={() => handleChecklist('obligacionesGob', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                     <section className="form-card">
                                        <div className="form-section-title">6. Decisión institucional</div>
                                        <div className="options-vertical-premium">
                                            <label>Principal aporte inclusivo:</label>
                                            {['Aprobación sin condiciones', 'Aprobación con condiciones de supervisión', 'Implementación piloto controlada', 'Suspensión hasta evaluación adicional', 'No implementación'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="checkbox" checked={(formData.obligacionesGob || []).includes(opt)} onChange={() => handleChecklist('obligacionesGob', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">7. Reflexión Directiva</div>
                                        <div className="textarea-group-premium">
                                            <label>1.	El principal riesgo institucional identificado es:</label>
                                            <textarea maxLength={500} placeholder="Escribe aquí..." value={formData.aporte3 || ""} onChange={(e) => handleInputChange('aporte3', e.target.value)} />
                                            <span className="char-count">{(formData.aporte3?.length || 0)} / 500</span>
                                            <label>2.	La medida de gobernanza más urgente es:</label>
                                            <textarea maxLength={500} placeholder="Escribe aquí..." value={formData.riesgoVigilar3 || ""} onChange={(e) => handleInputChange('riesgoVigilar3', e.target.value)} />
                                            <span className="char-count">{(formData.riesgoVigilar3?.length || 0)} / 500</span>   
                                        </div>
                                    </section>
                                </>
                            )}

                            {/* RETO 2 DIRECTIVO: Protocolo de privacidad */}
                            {retoId === 2 && (
                                <>
                                    <section className="form-card">
                                        <div className="form-section-title">1. Clasificación de Sensibilidad de Datos</div>
                                        <p className="form-subtitle">Asigne el nivel de sensibilidad adecuado según el impacto en derechos:</p>
                                        {['Calificaciones', 'Historial disciplinario', 'Dirección y contacto', 'Datos biométricos', 'Perfil socioeconómico', 'Respuestas escritas', 'Predicción de desempeño', 'Grabaciones de voz'].map(dato => (
                                            <div key={dato} className="input-group-row-premium">
                                                <label className="label-text-small">{dato}</label>
                                                <select
                                                    className="atlas-select-small"
                                                    value={formData[`sens_${dato}`] || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        handleInputChange(`sens_${dato}`, val);

                                                        // LÓGICA DE ALERTAS AUTOMÁTICAS
                                                        if (dato === 'Datos biométricos' && val === 'Baja') {
                                                            Swal.fire("❌ Error Crítico", "Los datos biométricos afectan derechos fundamentales. No pueden ser de sensibilidad baja.", "error");
                                                        }
                                                        if (dato === 'Perfil socioeconómico' && val !== 'Alta') {
                                                            Swal.fire("⚠ Advertencia", "El perfil socioeconómico puede generar discriminación; el EU AI Act sugiere sensibilidad alta.", "warning");
                                                        }
                                                        if (dato === 'Predicción de desempeño' && val === 'Baja') {
                                                            Swal.fire("⚠ Riesgo no reconocido", "Las predicciones impactan el futuro académico; considere un nivel moderado o alto.", "info");
                                                        }
                                                    }}
                                                >
                                                    <option value="">Nivel...</option>
                                                    <option value="Baja">Baja 🟢</option>
                                                    <option value="Moderada">Moderada 🟡</option>
                                                    <option value="Alta">Alta 🔴</option>
                                                </select>
                                            </div>
                                        ))}
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">2. Actividad de Matching (Obligación vs Acción)</div>
                                        <label>Relaciona cada obligación regulatoria con su acción institucional correcta.</label>

                                        {[
                                            { ob: "Transparencia", correct: "Comunicar uso a familias", opts: ["Comunicar uso a familias", "Designar responsable", "Auditoría periódica", "Revisar contratos", "Registro interno"] },
                                            { ob: "Supervisión humana", correct: "Designar responsable institucional", opts: ["Designar responsable institucional", "Comunicar familias", "Auditoría periódica", "Revisar contratos", "Registro interno"] },
                                            { ob: "Evaluación de impacto", correct: "Establecer auditoría periódica", opts: ["Establecer auditoría periódica", "Comunicar familias", "Designar responsable", "Revisar contratos", "Registro interno"] },
                                            { ob: "Protección de datos", correct: "Revisar contratos y políticas", opts: ["Revisar contratos y políticas", "Comunicar familias", "Designar responsable", "Auditoría periódica", "Registro interno"] },
                                            { ob: "Accountability", correct: "Crear registro interno de herramientas", opts: ["Crear registro interno de herramientas", "Comunicar familias", "Designar responsable", "Auditoría periódica", "Revisar contratos"] }
                                        ].map(item => (
                                            <div key={item.ob} className="input-group-row-premium">
                                                <label><strong>{item.ob}:</strong></label>
                                                <select
                                                    className="atlas-select-small"
                                                    value={formData[`match_${item.ob}`] || ""}
                                                    onChange={(e) => {
                                                        handleInputChange(`match_${item.ob}`, e.target.value);
                                                        if (e.target.value !== item.correct && e.target.value !== "") {
                                                            // Opcional: Feedback inmediato si se equivoca
                                                            console.log(`Incongruencia en ${item.ob}`);
                                                        }
                                                    }}
                                                >
                                                    <option value="">Seleccione acción...</option>
                                                    {item.opts.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">3. Priorización Estratégica</div>
                                        <label>Ordena según prioridad (1 = Más urgente / 5 = Menos urgente):</label>

                                        {[
                                            { id: 'contratos', label: 'Revisar contratos vigentes' },
                                            { id: 'registro', label: 'Crear registro institucional IA' },
                                            { id: 'comite', label: 'Establecer comité de aprobación' },
                                            { id: 'protocolo', label: 'Diseñar protocolo ante incidente' },
                                            { id: 'docentes', label: 'Capacitar docentes en privacidad' }
                                        ].map(acc => (
                                            <div key={acc.id} className="input-group-row-premium">
                                                <span>{acc.label}</span>
                                                <input
                                                    type="number"
                                                    min="1" max="5"
                                                    className="inline-input-premium"
                                                    style={{ width: '60px' }}
                                                    value={formData[`prioridad_${acc.id}`] || ""}
                                                    onChange={(e) => handleInputChange(`prioridad_${acc.id}`, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                        </section>

                                    <section className="form-card highlight">
                                        <div className="form-section-title">4. Escenario de Decisión</div>
                                        <p className="bold-text">Caso: Una plataforma solicita historial académico y datos socioemocionales para predecir rendimiento.</p>
                                        <div className="options-vertical-premium">
                                            {[
                                                'Implementar inmediatamente',
                                                'Implementar con evaluación de impacto previa',
                                                'Realizar piloto controlado',
                                                'Suspender hasta revisión legal',
                                                'Rechazar uso'
                                            ].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input
                                                        type="radio"
                                                        name="decisionEscenario"
                                                        checked={formData.decisionEscenario === opt}
                                                        onChange={() => {
                                                            handleInputChange('decisionEscenario', opt);
                                                            if (opt === 'Implementar con evaluación de impacto previa') {
                                                                Swal.fire("¡Correcto!", "El EU AI Act exige evaluación de impacto en sistemas de alto riesgo.", "success");
                                                            }
                                                        }}
                                                    />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">Reflexión Directiva</div>
                                        <label>El mayor riesgo de privacidad para nuestra institución es:</label>
                                        <textarea
                                            maxLength={500}
                                            value={formData.refPrivacidad || ""}
                                            placeholder="Ej: La fuga de datos sensibles en plataformas no auditadas..."
                                            onChange={(e) => handleInputChange('refPrivacidad', e.target.value)}
                                        />
                                        <span className="char-count">{(formData.refPrivacidad?.length || 0)} / 500</span>
                                    </section>
                                </>
                            )}

                            {/* RETO 3 DIRECTIVO: Simulación de error crítico */}
                            {retoId === 3 && (
                                <>
                                    <section className="form-card">
                                        <div className="form-section-title">FASE 1: Escenario</div>
                                        <p>Caso: Un sistema de IA utilizado para predecir bajo rendimiento genera una alerta incorrecta sobre un estudiante.
                                            La información se comunica a docentes y familia antes de ser verificada.
                                            La familia presenta queja formal.
                                        </p>
        
                                    </section>
                                    <section className="form-card">
                                        <div className="form-section-title">FASE 2: Decisión Inmediata (Tiempo limitado)</div>
                                        <p>Selecciona tu primera acción (solo una):</p>
                                        <div className="options-vertical-premium">
                                            {['Suspender inmediatamente el sistema', 'Comunicar públicamente que fue error técnico', 'Activar revisión humana urgente del caso', 'Esperar confirmación del proveedor', 'No intervenir hasta investigación completa'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="radio" name="decisionCrisis" checked={formData.decisionCrisis === opt} onChange={() => {
                                                        handleInputChange('decisionCrisis', opt);
                                                        if (opt === 'Activar revisión humana urgente del caso') Swal.fire("Respuesta Esperada", "Correcto. El EU AI Act exige supervisión humana efectiva antes de acciones públicas.", "success");
                                                        else if (opt === 'Esperar confirmación del proveedor') Swal.fire("Atención", "La responsabilidad primaria es institucional, no del proveedor.", "warning");
                                                    }} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">FASE 3: Análisis de Responsabilidad</div>
                                        <p>Arrastra cada actor a su nivel de responsabilidad:</p>
                                        
                                        {['Directivo', 'Docente', 'Proveedor tecnológico', 'Comité académico', 'Área jurídica'].map(actor => (
                                            <div key={actor} className="input-group-row-premium">
                                                <label>{actor}:</label>
                                                <select className="atlas-select-small" onChange={(e) => handleInputChange(`resp_${actor}`, e.target.value)}>
                                                    <option value="">Rol...</option>
                                                    <option value="Principal">Responsable Principal</option>
                                                    <option value="Compartido">Responsable Compartido</option>
                                                    <option value="Consultivo">Rol Consultivo</option>
                                                </select>
                                            </div>
                                        ))}
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">FASE 4: Medidas de Mitigación Estructural</div>
                                        <div className="options-vertical-premium">
                                            {['Revisión del contrato con proveedor', 'Implementar doble validación humana', 'Suspender uso en decisiones académicas', 'Diseñar protocolo formal de incidentes IA', 'Capacitar docentes en verificación', 'Notificación pública transparente'].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input type="checkbox" checked={(formData.mitigacionIncidente || []).includes(opt)} onChange={() => handleChecklist('mitigacionIncidente', opt)} />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card highlight">
                                        <div className="form-section-title">FASE 5: Diseño de Protocolo de Respuesta (Orden)</div>
                                        <p>Indique el orden de los pasos (1 al 6):</p>
                                        {['Recepción de queja', 'Activación de revisión técnica', 'Suspensión temporal del sistema', 'Comunicación a familia', 'Evaluación de impacto', 'Documentación formal'].map(paso => (
                                            <div key={paso} className="input-group-row-premium">
                                                <span>{paso}</span>
                                                <input type="number" min="1" max="6" className="inline-input-premium" style={{ width: '60px' }} onChange={(e) => handleInputChange(`orden_proto_${paso}`, e.target.value)} />
                                            </div>
                                        ))}
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">Reflexión Directiva</div>
                                        <label>El mayor riesgo institucional ante error de IA es:</label>
                                        <textarea maxLength={400} value={formData.refErrorRiesgo || ""} onChange={(e) => handleInputChange('refErrorRiesgo', e.target.value)} />
                                        <span className="char-count">{(formData.refErrorRiesgo?.length || 0)} / 400</span><label>La mejora estructural más urgente es:</label>
                                        <textarea maxLength={400} value={formData.refErrorMejora || ""} onChange={(e) => handleInputChange('refErrorMejora', e.target.value)} />
                                        <span className="char-count">{(formData.refErrorMejora?.length || 0)} / 400</span>
                                    </section>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* --- SECCIÓN DE AUTOEVALUACIÓN FINAL --- */}
                <div className="atlas-unique-footer-section">
                    <section className="autoevaluacion-final-section">
                        <div className="autoeval-card">
                            <h3>AUTOEVALUACIÓN DE LOGRO</h3>
                            <p className="autoeval-desc">Marca cada ítem para certificar que tu reto cumple con los estándares exigidos:</p>
                            <div className="checklist-items-premium">
                                {(
                                    // --- LÓGICA DINÁMICA POR ROL Y RETO ---
                                    !isDirectivo ? (
                                        // Checklists para DOCENTES
                                        retoId === 1 ? [
                                            "Se identifican riesgos reales", "Se analiza impacto en agencia", "Se considera transparencia y privacidad", "Se determina nivel de supervisión humana", "Se emite decisión argumentada"
                                        ] : retoId === 2 ? [
                                            "Intencionalidad pedagógica explícita", "Protección de agencia humana", "Mitigación de riesgos éticos", "Evaluación coherente", "Supervisión humana clara"
                                        ] : [
                                            "Existe objetivo común claro", "La diferenciación no reduce estándares", "Se protege dignidad y agencia", "Se identifican y mitigan riesgos", "Estrategia replicable"
                                        ]
                                    ) : (
                                        // Checklists para DIRECTIVOS
                                        retoId === 1 ? [
                                            "Se clasifica el sistema según enfoque basado en riesgo", "Se identifican derechos potencialmente afectados", "Se determinan obligaciones de supervisión humana", "Se adopta decisión institucional argumentada", "Se evidencia comprensión del marco regulatorio"
                                        ] : retoId === 2 ? [
                                            "Distingo niveles de sensibilidad de datos", "Comprendo obligaciones regulatorias", "Priorizo acciones de gobernanza", "Puedo tomar decisión fundamentada"
                                        ] : [
                                            "Se activa supervisión humana inmediata", "Se identifican responsabilidades claras", "Se implementan medidas estructurales", "Se diseña protocolo de respuesta", "Se prioriza transparencia institucional"
                                        ]
                                    )
                                ).map((check, idx) => (
                                    <label key={idx} className="atlas-checkbox-row-premium">
                                        <input
                                            type="checkbox"
                                            checked={(formData.cumplimiento || []).includes(check)}
                                            onChange={() => handleChecklist('cumplimiento', check)}
                                        />
                                        <span className="label-text">{check}</span>
                                    </label>
                                ))}
                            </div>
                            <button
                                className="btn-finalizar-mision"
                                // Se habilita si hay 3 o más elementos en cumplimiento
                                disabled={(formData.cumplimiento?.length < 3) || isSaving}
                                onClick={() => saveReto('completed')}
                            >
                                ENVIAR MISIÓN
</button>
                        </div>
                    </section>
                </div>

            </main>
        </div>
    );
};