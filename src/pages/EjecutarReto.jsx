import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/ejecutarReto.css";

export const EjecutarReto = ({ userData, API_URL, retoId, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
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
        setIsSaving(true);

        // Identificamos el nombre del reto para el Excel
        const nombresRetos = ["", "Evaluación Ética", "Rediseño Human-Centred", "Diferenciación Inclusiva"];
        
        // El payload usa la acción genérica 'update' con idField para mayor seguridad
        // Si no existe, el Apps Script creará uno nuevo si usas 'create' o si modificamos a 'update' con lógica de búsqueda
        const payload = {
            action: "create", // Usamos create para nuevos registros o update si ya tienes el rowId
            sheet: "Retos_Transformar_ATLAS",
            data: {
                ID_Registro_Reto: `RET-${userData.Teacher_Key}-${retoId}`,
                Teacher_Key: userData.Teacher_Key,
                Numero_Reto: parseInt(retoId),
                Nombre_Reto: nombresRetos[retoId],
                Nivel_UNESCO: retoId === 1 ? "Acquire" : retoId === 2 ? "Deepen" : "Create",
                Fecha_Creacion: new Date().toISOString(),
                // Guardamos TODO el objeto formData como string en Datos_JSON
                Datos_JSON: JSON.stringify({ ...formData, puntosMatriz }), 
                Status_Reto: statusFinal === 'completed' ? "COMPLETADO" : "BORRADOR",
                Autoevaluacion_Status: formData.cumplimiento.length >= 5 ? "COMPLETADO" : "PENDIENTE"
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                mode: "cors", // Importante
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.status === "success") {
                Swal.fire({
                    title: statusFinal === 'completed' ? "¡Misión Enviada!" : "Borrador Guardado",
                    text: "Tu progreso ha sido sincronizado con el Sistema ATLAS.",
                    icon: "success",
                    confirmButtonColor: "#c5a059"
                });

                if (statusFinal === 'completed') {
                    onNavigate('fase_transformar');
                }
            }
        } catch (e) {
            console.error("Error en saveReto:", e);
            Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
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
                                {retoId === 1 && "Evaluación ética y regulatoria de una herramienta IA"}
                                {retoId === 2 && "Rediseño curricular human-centred con IA"}
                                {retoId === 3 && "Diseño de estrategia de diferenciación inclusiva con IA"}
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
                        <div className="narrative-card context-card">
                            <h3>Contexto AI for Teachers</h3>
                            {retoId === 1 && (
                                <div className="unesco-text">
                                    <p>Según el AI Competency Framework for Teachers (UNESCO, 2024):</p>
                                    <ul>
                                        <li> El docente debe comprender principios éticos y fundamentos de la IA antes de integrarla pedagógicamente.</li>
                                        <li> La IA debe utilizarse respetando derechos humanos y dignidad.</li>
                                        <li> La supervisión humana es indispensable.</li>
                                        <li> El nivel “Adquirir (Acquire)” implica desarrollar comprensión crítica básica sobre riesgos, límites y responsabilidades.</li>
                                    </ul>
                                    <p><strong>El enfoque human-centred exige que:</strong> La tecnología respete derechos y privacidad, no sustituya agencia humana, no amplifique desigualdades o sesgos y permita trazabilidad.</p>
                                </div>
                            )}
                            {retoId === 2 && (
                                <div className="unesco-text">
                                    <p>Según el AI Competency Framework for Teachers (UNESCO, 2024):</p>
                                    <ul>
                                        <li> La integración de IA debe preservar la agencia humana.</li>
                                        <li> El docente debe dominar la dimensión de AI pedagogy.</li>
                                        <li> La IA no reemplaza el juicio profesional docente.</li>
                                        <li> La progresión “Profundizar (Deepen)” implica integrar IA de manera reflexiva y crítica.</li>
                                    </ul>
                                    <p><strong>El enfoque human-centred exige:</strong> Que la tecnología potencie el aprendizaje, no reduzca el esfuerzo cognitivo y no erosione la autonomía del estudiante.</p>
                                </div>
                            )}
                            {retoId === 3 && (
                                <div className="unesco-text">
                                    <p>Según el AI Competency Framework for Teachers (UNESCO, 2024):</p>
                                    <ul>
                                        <li> En el nivel “Crear (Create)” el docente diseña prácticas innovadoras transferibles.</li>
                                        <li> La IA debe emplearse para ampliar oportunidades, no para segmentar o etiquetar.</li>
                                        <li> La diferenciación debe preservar agencia y expectativas altas.</li>
                                    </ul>
                                    <p><strong>Marcos regulatorios:</strong> UNESCO 2021 enfatiza la inclusión de grupos vulnerables. El AI Act europeo advierte sobre sistemas que refuerzan desigualdades.</p>
                                </div>
                            )}
                        </div>
                        <div className="narrative-card info-card">
                            <h3>Preguntas orientadoras:</h3>
                            <ul className="narrative-list">
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
                            </ul>
                            
                            <div className="concepts-tag-box">
                               <strong>Conceptos relacionados (UNESCO 2024):</strong>
                               <div className="tags-container">
                                    {retoId === 1 && ["Human-centred mindset", "Ethics of AI", "Agency", "Accountability", "Transparencia", "Sesgo"].map(t => <span key={t} className="tag">{t}</span>)}
                                    {retoId === 2 && ["Human-centred mindset", "Agency", "AI pedagogy"].map(t => <span key={t} className="tag">{t}</span>)}
                                    {retoId === 3 && ["Human-centred mindset", "AI pedagogy", "Inclusión y equidad", "Agency", "Accountability", "Fairness"].map(t => <span key={t} className="tag">{t}</span>)}
                               </div>
                            </div>
                        </div>

                        <div className="narrative-card mission-card">
                            <h3>El Reto: Tu Misión</h3>
                            {retoId === 1 && <p>Aplicar una matriz de análisis ético y regulatorio a una herramienta de IA que utilices (o planees utilizar), para determinar si su uso es pedagógicamente justificable.</p>}
                            {retoId === 2 && <p>Rediseñar una práctica de aula incorporando IA bajo un enfoque human-centred, demostrando que la IA no sustituye pensamiento, mantiene supervisión docente y fortalece metacognición.</p>}
                            {retoId === 3 && <p>Diseñar una estrategia de diferenciación inclusiva mediada por IA que amplíe el acceso sin reducir nivel de exigencia, evite etiquetamiento y sea transferible.</p>}
                            
                            <div className="condiciones-box">
                                <strong>Condiciones del reto:</strong>
                                <ol className="mission-list">
                                    {retoId === 1 && (<><li>Identificar la función pedagógica real.</li><li>Analizar riesgos (sesgo, privacidad, agencia).</li><li>Determinar supervisión humana requerida.</li></>)}
                                    {retoId === 2 && (<><li>IA como andamiaje, no producto final.</li><li>Instancia sin IA (defensa oral).</li><li>Explicitar competencia cognitiva.</li><li>Justificar protección de agencia.</li></>)}
                                    {retoId === 3 && (<><li>Objetivo común para todo el grupo.</li><li>Dos variantes de acceso mediadas por IA.</li><li>Evitar reducción de expectativas.</li><li>Instancia común de convergencia.</li></>)}
                                </ol>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="atlas-unique-form-wrapper">
                    {/* --- FORMULARIO RETO 1 --- */}
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
                                                    <td className="desc-cell"><strong>{c.label}</strong><br/><small>{c.desc}</small></td>
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

                    {/* --- FORMULARIO RETO 2 --- */}
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
                                            {/* NAME ÚNICO: disenoOriginal */}
                                            <input
                                                type="radio"
                                                name="disenoOriginal"
                                                checked={formData.disenoOriginal === opt}
                                                onChange={() => handleInputChange('disenoOriginal', opt)}
                                            />
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
                                            {/* NAME CORREGIDO: agenciaEstudiantil */}
                                            <input
                                                type="radio"
                                                name="agenciaEstudiantil"
                                                checked={formData.agenciaEstudiantil === opt}
                                                onChange={() => handleInputChange('agenciaEstudiantil', opt)}
                                            />
                                            <span className="label-text">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            <section className="form-card">
                                <div className="form-section-title">6.	Riesgos y Mitigación </div>
                                <label>Riesgos identificados:</label>
                                <div className="options-vertical-premium">
                                    {['Dependencia', 'Sesgo', 'Información incorrecta', 'Pérdida de autoría', 'Superficialidad', 'Ninguno'].map(c => (
                                        <label key={c} className="check-label-row"><input type="checkbox" checked={(formData.checklistHuman || []).includes(c)} onChange={() => handleChecklist('checklistHuman', c)} /><span className="label-text">{c}</span></label>
                                    ))}
                                </div>
                            </section>

                            <section className="form-card">
                                <div className="form-section-title">7. Estrategia de mitigación aplicada: </div>
                                <label>Riesgos identificados:</label>
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

                    {/* --- FORMULARIO RETO 3 --- */}
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
                                    {['Por nivel de complejidad', 'Por formato', 'Por ritmo', 'Por tipo de andamiaje', 'Por interés contextual','Combinada'].map(d => (
                                        <label key={d} className="check-label-row"><input type="checkbox" checked={(formData.tipoDif || []).includes(d)} onChange={() => handleChecklist('tipoDif', d)} /><span className="label-text">{d}</span></label>
                                    ))}
                                </div>
                            </section>

                            <section className="form-card">
                                <div className="form-section-title">3. Rol de la IA en la diferenciación</div>
                                <div className="options-vertical-premium">
                                    {['Genera versiones adaptadas del contenido', 'Ofrece apoyos adicionales personalizados', 'Traduce o simplifica lenguaje', 'Proporciona ejemplos contextualizados', 'Ajusta nivel de preguntas','No interviene directamente'].map(d => (
                                        <label key={d} className="check-label-row"><input type="checkbox" checked={(formData.tipoDif || []).includes(d)} onChange={() => handleChecklist('tipoDif', d)} /><span className="label-text">{d}</span></label>
                                    ))}
                                </div>
                            </section>

                            <section className="form-card">
                                <div className="form-section-title">4. Protección de Equidad y Dignidad</div>
                                <div className="options-vertical-premium">
                                    {[
                                        'Todas las variantes conducen al mismo estándar final',
                                        'No se comunica públicamente quién recibe apoyo adicional',
                                        'Se mantienen expectativas altas para todos',
                                        'Se evita etiquetamiento por nivel',
                                        'Existe instancia común sin diferenciación',
                                        'Supervisión docente activa en todas las variantes'
                                    ].map(p => (
                                        <label key={p} className="check-label-row"><input type="checkbox" checked={(formData.proteccion || []).includes(p)} onChange={() => handleChecklist('proteccion', p)} /><span className="label-text">{p}</span></label>
                                    ))}
                                </div>
                            </section>

                            <section className="form-card">
                                <div className="form-section-title">5. Riesgos identificados</div>
                                <div className="options-vertical-premium">
                                    {[
                                        'Reducción de rigor académico',
                                        'Estigmatización implícita',
                                        'Dependencia tecnológica',
                                        'Segmentación excesiva',
                                        'No identifiqué riesgos'
                            
                                    ].map(p => (
                                        <label key={p} className="check-label-row"><input type="checkbox" checked={(formData.proteccion || []).includes(p)} onChange={() => handleChecklist('proteccion', p)} /><span className="label-text">{p}</span></label>
                                    ))}
                                </div>
                            </section>

                            <section className="form-card">
                                <div className="form-section-title">6. Mecanismos de mitigación</div>
                                <div className="options-vertical-premium">
                                    {[
                                        'Objetivo común explícito',
                                        'Evaluación con mismo criterio final',
                                        'Revisión humana obligatoria',
                                        'Rotación de apoyos',
                                        'Reflexión estudiantil sobre uso de IA'
                            
                                    ].map(p => (
                                        <label key={p} className="check-label-row"><input type="checkbox" checked={(formData.proteccion || []).includes(p)} onChange={() => handleChecklist('proteccion', p)} /><span className="label-text">{p}</span></label>
                                    ))}
                                </div>
                            </section>

                            <section className="form-card">
                                <div className="form-section-title">4. Reflexión y Mitigación</div>
                                <div className="textarea-group-premium">
                                    <label>Principal aporte inclusivo:</label>
                                    <textarea maxLength={500} placeholder="Escribe aquí..." value={formData.aporte3 || ""} onChange={(e) => handleInputChange('aporte3', e.target.value)} />
                                    <label>Mayor riesgo que vigilar:</label>
                                    <textarea maxLength={500} placeholder="Escribe aquí..." value={formData.riesgoVigilar3 || ""} onChange={(e) => handleInputChange('riesgoVigilar3', e.target.value)} />
                                </div>
                            </section>
                        </>
                    )}
                </div>

                {/* --- SECCIÓN DE AUTOEVALUACIÓN FINAL --- */}
                <div className="atlas-unique-footer-section">
                    <section className="autoevaluacion-final-section">
                        <div className="autoeval-card">
                            <h3>AUTOEVALUACIÓN DE LOGRO</h3>
                            <p className="autoeval-desc">Marca cada ítem para certificar que tu reto cumple con los estándares exigidos:</p>
                            <div className="checklist-items-premium">
                                {(retoId === 1 ? [
                                    "Se identifican riesgos reales", "Se analiza impacto en agencia", "Se considera transparencia y privacidad", "Se determina nivel de supervisión humana", "Se emite decisión argumentada"
                                ] : retoId === 2 ? [
                                    "Intencionalidad pedagógica explícita", "Protección de agencia humana", "Mitigación de riesgos éticos", "Evaluación coherente", "Supervisión humana clara"
                                ] : [
                                    "Existe objetivo común claro", "La diferenciación no reduce estándares", "Se protege dignidad y agencia", "Se identifican y mitigan riesgos", "Estrategia replicable"
                                ]).map((check, idx) => (
                                    <label key={idx} className="atlas-checkbox-row-premium">
                                        <input type="checkbox" checked={formData.cumplimiento.includes(check)} onChange={() => handleChecklist('cumplimiento', check)} />
                                        <span className="label-text">{check}</span>
                                    </label>
                                ))}
                            </div>
                            <button 
                                className="btn-finalizar-mision" 
                                disabled={formData.cumplimiento.length < 5 || isSaving}
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