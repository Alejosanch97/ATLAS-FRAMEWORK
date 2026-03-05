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

    const descriptoresUNESCO = {
        transparency: [
            "No conozco cómo funciona la herramienta ni sus limitaciones. Caja negra.",
            "Sé que es IA, pero no puedo explicar cómo genera respuestas ni sus límites.",
            "Entiendo de manera general su lógica (generativa/predictiva), pero no explico límites.",
            "Puedo explicar su funcionamiento y límites. Informo a estudiantes cuando la uso.",
            "Integro explicación de funcionamiento, sesgos y trazabilidad como parte del aprendizaje."
        ],
        privacy: [
            "No he revisado políticas de datos. Se ingresan datos personales sin criterio.",
            "Sé que existen términos de uso, pero no los he analizado ni adaptado.",
            "Evito compartir datos sensibles, pero no tengo claridad total sobre el almacenamiento.",
            "Reviso términos, evito datos personales y explico a estudiantes qué se comparte.",
            "Protección estructurada: consentimiento informado y análisis previo de riesgos."
        ],
        bias: [
            "No considero la posibilidad de sesgos ni reviso resultados críticamente.",
            "Reconozco que podría haber sesgos, pero no los evalúo activamente.",
            "Reviso algunos resultados buscando posibles sesgos evidentes.",
            "Evalúo respuestas considerando diversidad cultural, género y contexto local.",
            "Diseño inclusivo: incorporo el análisis crítico de sesgos en el proceso pedagógico."
        ],
        agency: [
            "Riesgo alto: La herramienta reemplaza procesos cognitivos centrales sin mediación.",
            "Uso instrumental: Se utiliza principalmente para producir respuestas rápidas.",
            "Apoyo parcial: La herramienta apoya tareas, pero no siempre hay reflexión crítica.",
            "Mediación pedagógica: La IA es apoyo y el docente mantiene preguntas críticas.",
            "Agencia fortalecida: La IA amplifica el pensamiento y promueve metacognición."
        ],
        supervision: [
            "Riesgo alto: Las decisiones de la herramienta se aceptan sin revisión.",
            "Supervisión ocasional: Reviso resultados solo cuando parecen problemáticos.",
            "Supervisión regular: Reviso resultados antes de validarlos sin protocolo definido.",
            "Control estructurado: Existe revisión sistemática antes de influir en decisiones.",
            "Supervisión significativa: Control total, límites claros y justificación pedagógica."
        ]
    };

    // Función de cambio corregida
    const handleMatrizChange = (criterio, valor) => {
        const valInt = parseInt(valor);
        const nuevosPuntos = { ...puntosMatriz, [criterio]: valInt };
        setPuntosMatriz(nuevosPuntos);

        const total = Object.values(nuevosPuntos).reduce((a, b) => a + b, 0);

        // Determinación de Resultado UNESCO
        let resultado = { nivel: "", color: "", texto: "" };

        if (total <= 7) {
            resultado = {
                nivel: "Riesgo Alto",
                color: "🔴",
                texto: `Resultado: Riesgo alto en el uso pedagógico de la herramienta

Tu análisis indica que el uso actual presenta debilidades significativas en términos de transparencia, supervisión humana, agencia estudiantil o gestión de datos. Desde el AI Competency Framework for Teachers (UNESCO, 2024), el uso responsable de IA exige comprensión básica de funcionamiento, análisis de riesgos éticos y control humano significativo. En este momento, la herramienta podría estar influyendo en procesos pedagógicos sin suficiente mediación crítica.

Antes de implementarla, se recomienda rediseñar su uso, fortalecer la comprensión técnica básica y asegurar que no sustituya el juicio profesional docente.

Recuerda, la IA no debe reemplazar criterio pedagógico. Debe amplificarlo.`
            };

        } else if (total <= 13) {
            resultado = {
                nivel: "Riesgo Moderado",
                color: "🟠",
                texto: `Resultado: Uso con intención pedagógica, pero con ajustes necesarios

Tu evaluación muestra conciencia ética inicial y cierta supervisión, pero aún existen áreas que requieren fortalecimiento. El marco UNESCO (2024) señala que una práctica responsable debe integrar análisis explícito de sesgos, protección de datos y garantía de agencia estudiantil. Algunos de estos elementos aparecen de forma parcial en tu análisis.

La herramienta puede utilizarse, pero es recomendable ajustar criterios de transparencia, formalizar la supervisión y hacer explícitos los límites de la IA ante los estudiantes.

Estás en transición hacia una práctica más estructurada.`
            };

        } else if (total <= 17) {
            resultado = {
                nivel: "Riesgo Bajo",
                color: "🟡",
                texto: `Resultado: Uso pedagógicamente fundamentado con supervisión adecuada

Tu análisis refleja una integración consciente de principios éticos y control humano significativo. De acuerdo con el AI Competency Framework for Teachers (UNESCO, 2024), este nivel demuestra alineación con un enfoque human-centred: la tecnología apoya el aprendizaje sin sustituir la agencia docente ni estudiantil.

Existen prácticas claras de revisión, consideración de sesgos y manejo responsable de datos. Aun así, puedes seguir fortaleciendo la explicitación pedagógica de límites y riesgos como parte del aprendizaje crítico de tus estudiantes.

Tu uso de esta herramienta muestra criterio profesional.`
            };

        } else {
            resultado = {
                nivel: "Práctica Sólida",
                color: "🟢",
                texto: `Resultado: Práctica sólida alineada con estándares internacionales

Tu análisis evidencia un uso éticamente estructurado, con transparencia, supervisión humana significativa, protección de datos y fortalecimiento de la agencia estudiantil. Este nivel está claramente alineado con el AI Competency Framework for Teachers (UNESCO, 2024), especialmente en las dimensiones de ética de la IA, gobernanza responsable y pedagogía centrada en lo humano.

La herramienta que analizaste no sustituye tu juicio profesional: lo complementa dentro de un marco crítico y deliberado.

En este nivel, la IA se integra como parte de una arquitectura pedagógica consciente y responsable.`
            };
        }

        // Guardamos el resultado completo en el formData
        handleInputChange('analisisEticoTotal', total);
        handleInputChange('riesgoSugerido', `${resultado.color} ${resultado.nivel}: ${resultado.texto}`);
    };

    const saveReto = async (statusFinal = 'ENVIADO') => {
        // --- 1. VALIDACIONES DE RESPUESTAS CORRECTAS (SOLO SI ES ENVÍO FINAL) ---
        if (statusFinal === 'completed') {
            // --- VALIDACIÓN RETO 2 DIRECTIVO ---
            if (isDirectivo && parseInt(retoId) === 2) {
                const esCorrectaDecision = formData.decisionEscenario === 'Implementar con evaluación de impacto previa';
                const esCorrectoBiometricos = formData.sens_Datos_biométricos !== 'Baja';

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
                // --- MEJORA: Feedback rápido con timer ---
                await Swal.fire({
                    title: statusFinal === 'completed' ? "¡Misión Enviada!" : "Borrador Guardado",
                    text: "Sincronización exitosa con ATLAS.",
                    icon: "success",
                    confirmButtonColor: "#c5a059",
                    timer: 1500, // Se cierra en 1.5 segundos
                    showConfirmButton: false, // Oculta el botón para que sea más fluido
                    timerProgressBar: true
                });

                if (statusFinal === 'completed') {
                    // Navega de regreso a la zona de misiones
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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

    const calcularPatronUNESCO = (data) => {

        let indice = 0;

        // =============================
        // VARIABLES (9 preguntas reales)
        // =============================

        const I_IA = data.secuenciaInicioIA === 'Sí';
        const I_DOC = data.secuenciaInicioDocente === 'Sí';
        const I_EST = data.secuenciaInicioEstudiante === 'Sí';

        const D_IA = data.secuenciaDesarrolloIA === 'Sí';
        const D_DOC = data.secuenciaDesarrolloDocente === 'Sí';
        const D_EST = data.secuenciaDesarrolloEstudiante === 'Sí';

        const C_SINIA = data.secuenciaCierreSinIA === 'Sí';
        const META = data.secuenciaReflexionMeta === 'Sí';
        const C_IA = data.secuenciaCierreIA === 'Sí';

        const PROD_FINAL = data.intervencion === "Producción final";

        const conteoIA = [I_IA, D_IA, C_IA].filter(Boolean).length;

        // ==================================================
        // 🟢 1️⃣ INICIO (20 pts)
        // ==================================================

        indice += I_IA ? 5 : 8;              // IA en inicio suma poco
        indice += I_DOC ? 5 : -5;            // Docente debe aparecer
        indice += I_EST ? 10 : 0;            // Agencia temprana fuerte

        // ==================================================
        // 🔵 2️⃣ DESARROLLO (30 pts)
        // ==================================================

        indice += D_IA ? 10 : 0;
        indice += D_DOC ? 5 : -5;
        indice += D_EST ? 15 : -10;

        // ==================================================
        // 🟣 3️⃣ CIERRE (30 pts)
        // ==================================================

        indice += C_SINIA ? 15 : -15;
        indice += META ? 15 : -10;
        indice += C_IA ? 5 : 10;

        // ==================================================
        // 🔴 4️⃣ PRODUCCIÓN FINAL (20 pts)
        // ==================================================

        if (PROD_FINAL && (!META || !C_SINIA)) {
            indice -= 20;
        } else if (PROD_FINAL && META && C_SINIA) {
            indice += 5;
        } else if (!PROD_FINAL) {
            indice += 10;
        }

        // Penalización por sobreexposición IA total
        if (conteoIA === 3 && !C_SINIA) {
            indice -= 10;
        }

        // Normalizar
        indice = Math.max(0, Math.min(100, indice));

        // ==================================================
        // 🎯 CLASIFICACIÓN FINAL
        // ==================================================

        if (indice >= 85) {
            return construirRespuesta(
                1,
                "#16a34a",
                "🟢 Integración Human-Centred Sólida",
                indice,
                "La arquitectura pedagógica evidencia un equilibrio estructural robusto entre inteligencia artificial, mediación docente y autonomía estudiantil. La IA cumple una función estratégica claramente delimitada, potenciando procesos cognitivos específicos sin sustituir el juicio humano ni el pensamiento crítico.",
                "Para sostener este nivel de madurez, continúa explicitando los criterios de uso de IA y fortaleciendo la comparación entre producción humana y producción asistida.",
                "Este diseño se alinea de forma consistente con el nivel DEEPEN del marco UNESCO 2024, al demostrar integración crítica, ética y pedagógicamente fundamentada."
            );
        }

        if (indice >= 70) {
            return construirRespuesta(
                2,
                "#2563eb",
                "🔵 Uso Estratégico Consolidado",
                indice,
                "La secuencia presenta una integración intencional de la IA con predominio de agencia humana. Existen momentos claros de mediación docente y espacios de validación cognitiva que reducen el riesgo de dependencia.",
                "Podrías fortalecer aún más la metacognición estructurada para avanzar hacia un modelo plenamente human-centred.",
                "El diseño refleja coherencia con principios de andamiaje progresivo promovidos por UNESCO."
            );
        }

        if (indice >= 50) {
            return construirRespuesta(
                3,
                "#eab308",
                "🟡 Integración Funcional con Riesgos Moderados",
                indice,
                "La IA cumple un rol operativo relevante dentro de la secuencia, pero el equilibrio estructural aún no es completamente estable. Algunos momentos pueden favorecer dependencia si no se explicita la reflexión crítica.",
                "Se recomienda consolidar instancias obligatorias sin IA y reforzar análisis metacognitivo del proceso y del output generado.",
                "La competencia en IA implica comprensión crítica, no únicamente uso técnico."
            );
        }

        if (indice >= 30) {
            return construirRespuesta(
                4,
                "#f97316",
                "🟠 Dependencia Parcial en Desarrollo",
                indice,
                "La herramienta tecnológica comienza a estructurar decisiones cognitivas clave sin suficiente validación autónoma. La agencia estudiantil y la mediación docente requieren mayor presencia para equilibrar el ecosistema.",
                "Prioriza rediseñar el cierre incorporando evaluación sin IA y defensa argumentativa del proceso.",
                "Sin estos elementos, el diseño podría debilitar la autenticidad del aprendizaje."
            );
        }

        return construirRespuesta(
            5,
            "#dc2626",
            "🔴 Alta Dependencia Estructural",
            indice,
            "La IA organiza de manera predominante el flujo didáctico sin evidencias claras de autonomía cognitiva ni supervisión pedagógica suficiente. El riesgo de sustitución del pensamiento humano es elevado.",
            "Es imprescindible rediseñar la secuencia incorporando momentos sin IA, reflexión metacognitiva explícita y mayor intervención docente.",
            "Este escenario representa el nivel de mayor alerta dentro del marco UNESCO 2024."
        );
    };


    // ==================================================
    // FUNCIÓN AUXILIAR
    // ==================================================

    const construirRespuesta = (id, color, titulo, indice, resultado, recomendacion, mensaje) => {
        return {
            id,
            color,
            titulo,
            indiceUNESCO: indice,
            resultado,
            recomendacion,
            mensaje
        };
    };

    const BinarySelector = ({ label, value, onChange }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>{label}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
                {['Sí', 'No'].map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '10px',
                            border: '2px solid',
                            borderColor: value === opt ? 'var(--atlas-gold)' : '#e2e8f0',
                            background: value === opt ? 'var(--atlas-gold)' : 'white',
                            color: value === opt ? 'white' : '#64748b',
                            fontWeight: '800',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );

    const obtenerAnalisisInclusivo = () => {
        // 1. Nivel Cognitivo (Bloom)
        const nivelAlto = ['Analizar', 'Evaluar', 'Crear'];
        const nivelMedio = ['Aplicar'];
        const esNivelAlto = nivelAlto.includes(formData.bloom);
        const esNivelMedio = nivelMedio.includes(formData.bloom);
        const esNivelBajo = ['Recordar', 'Comprender'].includes(formData.bloom);

        // 2. Garantías de Equidad (Mapeado a mitigacion3)
        const garantias = formData.mitigacion3 || [];
        const numGarantias = garantias.length;
        const tieneEstandarComun = garantias.includes('Todas las variantes conducen al mismo estándar de evaluación.');
        const tieneObjetivoComun = garantias.includes('El objetivo cognitivo es común y visible para todo el grupo.');

        // 3. Comprobación de Impacto (Mapeado a validacionEstandares3)
        const tieneComprobacion = (formData.validacionEstandares3 || []).length > 0;

        // 4. Riesgos Sistémicos (Mapeado a riesgosIdent3)
        const riesgosSistemicosLista = ['Sesgo algorítmico', 'Perfilamiento', 'Dependencia diferencial', 'Invisibilización de fortalezas'];
        const identificaRiesgoSistemico = (formData.riesgosIdent3 || []).some(r => riesgosSistemicosLista.includes(r));

        // DETERMINACIÓN DE PATRONES
        if (esNivelAlto && numGarantias >= 4 && tieneComprobacion && identificaRiesgoSistemico) {
            return { patron: 1, titulo: "Diseño Inclusivo Estructural", color: "#2ecc71" };
        }
        if (esNivelAlto && numGarantias >= 4 && tieneComprobacion && !identificaRiesgoSistemico) {
            return { patron: 2, titulo: "Inclusión avanzada con oportunidad de mejora", color: "#27ae60" };
        }
        if ((esNivelAlto || esNivelMedio) && (numGarantias === 2 || numGarantias === 3) && tieneComprobacion) {
            return { patron: 3, titulo: "Inclusión Operativa en Desarrollo", color: "#f1c40f" };
        }
        if (esNivelBajo && numGarantias <= 3) {
            return { patron: 4, titulo: "Estrategia con riesgo de reducción cognitiva", color: "#e67e22" };
        }
        if (numGarantias >= 2 && !tieneComprobacion) {
            return { patron: 5, titulo: "Inclusión declarativa", color: "#3498db" };
        }
        if (numGarantias <= 1 && !tieneEstandarComun && !tieneObjetivoComun) {
            return { patron: 6, titulo: "Diferenciación con riesgo de segmentación", color: "#e74c3c" };
        }

        return { patron: 0, titulo: "Análisis en proceso...", color: "#95a5a6" };
    };

    const analizado = obtenerAnalisisInclusivo();

    return (
        <div className="atlas-unique-page-wrapper">
            {/* Solo sale el cartel si está cargando Y ya hay algo escrito (para no molestar en retos nuevos) */}
            {loading && (formData.toolName || formData.cumplimiento?.length > 0 || formData.claseRiesgo) && (
                <div className="atlas-sync-float">
                    <div className="atlas-sync-pill">
                        <span className="sync-icon">🔄</span>
                        <span className="sync-text">Sincronizando datos previos...</span>
                    </div>
                </div>
            )}
            <main className="atlas-unique-main-content">
                
                {/* CABECERA INTEGRADA */}
                <div className="atlas-unique-header-container">
                    <header className="reto-header-inline">
                        <div className="header-left">
                            <button className="btn-back-minimal" onClick={() => onNavigate('fase_transformar')}>⬅ Volver</button>
                            <div className="badge-reto-id">Mision {retoId}</div>
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
                                        {retoId === 1 && "Evaluación Ética para el Diseño Responsable con IA"}
                                        {retoId === 2 && "Rediseño curricular human-centred con IA"}
                                        {retoId === 3 && "Diseño inclusivo con IA para diversidad cognitiva y equidad "}
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
                        {/* --- BLOQUE DE ADVERTENCIA PARA RETO 2 DOCENTE --- */}
                        {!isDirectivo && parseInt(retoId) === 2 && (
                            <div className="pre-mission-notice">
                                <div className="notice-badge">LECTURA PREVIA</div>
                                <h4>Antes de comenzar</h4>
                                <p>Esta misión no está diseñada para resolverse en una sola sesión frente a tu dispositivo.</p>
                                <p>Se espera que primero <strong>planifiques tu clase e implementes la IA en el aula</strong>, y luego regreses a documentar tu rediseño con criterio profesional.</p>

                                <div className="notice-grid">
                                    <div className="notice-item">
                                        <strong>⏳ Tiempo</strong>
                                        <span>Tienes una semana para desarrollar esta misión.</span>
                                    </div>
                                    <div className="notice-item">
                                        <strong>💡 Propósito</strong>
                                        <span>Reflexionar sobre tu práctica real, no completar un formulario rápido.</span>
                                    </div>
                                </div>

                                <ul className="notice-list">
                                    <li>Diseñar con intención pedagógica.</li>
                                    <li>Observar la interacción estudiante-IA.</li>
                                    <li>Evaluar resultados y ajustar antes del análisis final.</li>
                                </ul>

                                <div className="notice-footer">
                                    <span>Puedes usar <strong>Guardar Borrador</strong> para registrar avances parciales.</span>
                                </div>
                            </div>
                        )}



                        {/* --- CARD 3: MISIÓN --- */}
                        <div className="narrative-card mission-card">
                            <h3>Tu Misión</h3>
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
                                <strong>Objetivos de aprendizaje</strong>
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
                                            {retoId === 3 && (<><li>Mantenga un objetivo cognitivo común.</li><li>Amplíe accesos sin etiquetar ni segmentar.</li><li>Proteja dignidad y agencia.</li><li>Sea replicable en otros contextos.</li></>)}
                                        </>
                                    )}
                                </ol>
                            </div>
                        </div>
                        {/* --- BLOQUE DE ADVERTENCIA PARA RETO 3 DOCENTE --- */}
                        {!isDirectivo && parseInt(retoId) === 3 && (
                            <div className="pre-mission-notice">
                                <div className="notice-badge">LECTURA PREVIA</div>
                                <h4>Antes de comenzar</h4>
                                <p>Esta misión no está diseñada para resolverse en una sola sesión frente a tu dispositivo.</p>
                                <p>Se espera que <strong>planifiques una estrategia inclusiva real, la implementes en tu aula</strong>, observes cómo interactúan distintos perfiles de estudiantes y luego regreses a documentar tu análisis.</p>

                                <div className="notice-grid">
                                    <div className="notice-item">
                                        <strong>⏳ Tiempo</strong>
                                        <span>Tienes alrededor de una semana para desarrollar esta misión.</span>
                                    </div>
                                    <div className="notice-item">
                                        <strong>💡 Propósito</strong>
                                        <span>No se espera rapidez, sino criterio pedagógico profundo.</span>
                                    </div>
                                </div>

                                <ul className="notice-list">
                                    <li>Diseñar una práctica transferible.</li>
                                    <li>Ampliar oportunidades de aprendizaje.</li>
                                    <li>Mantener la exigencia académica sin reducir el rigor.</li>
                                </ul>

                                <div className="notice-footer">

                                    <span>Puedes usar el botón <strong>Guardar</strong> en cualquier momento para registrar avances parciales.</span>
                                </div>
                            </div>
                        )}
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
                                            <label>Nombre de la herramienta de IA a analizar:</label>
                                            <input type="text" placeholder="Ej: ChatGPT, Canva Magic..." value={formData.toolName || ""} onChange={(e) => handleInputChange('toolName', e.target.value)} />
                                        </div>
                                        <div className="input-group">
                                            <label>Nivel educativo donde se usa:</label>
                                            <div className="options-vertical-premium">
                                                {['Preescolar','Primaria', 'Secundaria', 'Media', 'Educación superior', 'Otro'].map(n => (
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
                                                {/* Opciones fijas */}
                                                {['Generar contenido', 'Retroalimentar', 'Evaluar', 'Personalizar aprendizaje', 'Simular escenarios', 'Automatizar tareas'].map(f => (
                                                    <label key={f} className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.funciones || []).includes(f)}
                                                            onChange={() => handleChecklist('funciones', f)}
                                                        />
                                                        <span className="label-text">{f}</span>
                                                    </label>
                                                ))}

                                                {/* Sección "Otro" - Mantiene el contenedor principal para el ancho total */}
                                                <div className="otro-wrapper-premium" style={{ width: '100%' }}>
                                                    <label className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.habilitarOtro || false}
                                                            onChange={(e) => {
                                                                const estaActivado = e.target.checked;
                                                                handleInputChange('habilitarOtro', estaActivado);

                                                                if (!estaActivado) {
                                                                    handleInputChange('otroTexto', "");
                                                                    const opcionesFijas = ['Generar contenido', 'Retroalimentar', 'Evaluar', 'Personalizar aprendizaje', 'Simular escenarios', 'Automatizar tareas'];
                                                                    const funcionesLimpias = (formData.funciones || []).filter(f => opcionesFijas.includes(f));
                                                                    handleInputChange('funciones', funcionesLimpias);
                                                                }
                                                            }}
                                                        />
                                                        <span className="label-text">Otro</span>
                                                    </label>

                                                    {/* Input condicional: Ocupa el 100% del ancho del contenedor de la fase Transformar */}
                                                    {formData.habilitarOtro && (
                                                        <div style={{
                                                            padding: '0 5px 15px 5px', // Pequeño ajuste para no pegar al borde
                                                            animation: 'fadeIn 0.3s ease',
                                                            width: '100%'
                                                        }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Especifica tu función aquí..."
                                                                className="inline-input-premium"
                                                                autoFocus
                                                                style={{
                                                                    width: '100%',        // Esto asegura que sea tan largo como los botones de arriba
                                                                    minHeight: '45px',    // Le da altura premium
                                                                    padding: '12px 15px',
                                                                    borderRadius: '10px',
                                                                    border: '2px solid #e5e7eb', // Un borde más definido
                                                                    fontSize: '1rem',
                                                                    boxSizing: 'border-box' // Crucial para que el padding no lo estire de más
                                                                }}
                                                                value={formData.otroTexto || ""}
                                                                onChange={(e) => {
                                                                    const valor = e.target.value;
                                                                    handleInputChange('otroTexto', valor);

                                                                    const opcionesFijas = ['Generar contenido', 'Retroalimentar', 'Evaluar', 'Personalizar aprendizaje', 'Simular escenarios', 'Automatizar tareas'];
                                                                    let nuevasFunciones = (formData.funciones || []).filter(f => opcionesFijas.includes(f));

                                                                    if (valor.trim() !== "") {
                                                                        nuevasFunciones.push(valor);
                                                                    }
                                                                    handleInputChange('funciones', nuevasFunciones);
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">2. Uso real en contexto</div>
                                        <label className="group-main-label">¿Consideras que la herramienta impacta tus decisiones académicas?</label>
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
                                        <label className="group-main-label">Asigne un puntaje de 0 (riesgo alto) a 4 (práctica sólida). El descriptor se actualizará automáticamente.</label>

                                        {/* ESTRUCTURA NUEVA: FLEXBOX EN LUGAR DE TABLA */}
                                        <div className="unesco-matrix-grid">
                                            {[
                                                { id: 'transparency', label: 'Transparencia' },
                                                { id: 'privacy', label: 'Privacidad y Datos' },
                                                { id: 'bias', label: 'Sesgo y Equidad' },
                                                { id: 'agency', label: 'Agencia Estudiantil' },
                                                { id: 'supervision', label: 'Supervisión Humana' }
                                            ].map(c => (
                                                <div key={c.id} className="matrix-pill-row">
                                                    <div className="matrix-content-left">
                                                        <strong className="matrix-label">{c.label}</strong>
                                                        <div className="unesco-dynamic-descriptor">
                                                            {descriptoresUNESCO[c.id][puntosMatriz[c.id]]}
                                                        </div>
                                                    </div>

                                                    <div className="matrix-controls-right">
                                                        <input
                                                            type="range"
                                                            className="atlas-slider-premium"
                                                            min="0" max="4"
                                                            value={puntosMatriz[c.id]}
                                                            onChange={(e) => handleMatrizChange(c.id, e.target.value)}
                                                        />
                                                        <div className="matrix-score-badge">
                                                            <span className="level-label">NIVEL</span>
                                                            <span className="score-number">{puntosMatriz[c.id]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* PANEL DE RESULTADOS */}
                                        <div className="atlas-interpretation-panel">
                                            <div className="interpretation-header">
                                                Puntaje Total: <strong>{formData.analisisEticoTotal || 0} / 20</strong>
                                            </div>
                                            <div className="interpretation-content">
                                                {formData.riesgoSugerido || "Complete la matriz para obtener el diagnóstico UNESCO."}
                                            </div>
                                        </div>

                                        <hr className="atlas-hr-divider" />

                                        {/* SECCIÓN DE PREGUNTAS DE INTEGRIDAD (Se mantiene igual) */}
                                        <div className="integrity-questions-container">
                                            <label className="group-main-label">Evaluación de Integridad y Autenticidad:</label>
                                            {[
                                                { id: 'depCognitiva', q: '¿Esta herramienta podría generar dependencia cognitiva?' },
                                                { id: 'autenticidad', q: '¿Esta herramienta podría afectar la autenticidad del aprendizaje?' },
                                                { id: 'alineacion', q: '¿El uso está alineado con las políticas institucionales?' }
                                            ].map(item => (
                                                <div key={item.id} className="integrity-row">
                                                    <p className="integrity-text">{item.q}</p>
                                                    <div className="pills-container">
                                                        {['Sí', 'No', 'Posiblemente', 'No sé'].map(opt => (
                                                            <label key={opt} className={`pill-option ${formData[item.id] === opt ? 'selected' : ''}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={item.id}
                                                                    value={opt}
                                                                    checked={formData[item.id] === opt}
                                                                    onChange={() => handleInputChange(item.id, opt)}
                                                                />
                                                                <span>{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
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

                                    {/* --- SECCIÓN: COMPROMISO DE FORTALECIMIENTO RETO 1 --- */}
                                    <section className="form-card highlight">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> PROYECCIÓN DE DESARROLLO PROFESIONAL
                                        </div>

                                        <div className="input-group">
                                            <label className="group-main-label">
                                                A partir de esta misión, ¿en qué áreas te gustaría fortalecer tu práctica pedagógica?
                                            </label>

                                            <div className="options-vertical-premium">
                                                {[
                                                    'Uso ético de IA en aula',
                                                    'Supervisión humana en entornos IA',
                                                    'Identificación de riesgos sistémicos',
                                                    'Protección de datos y privacidad en IA educativa',
                                                    'Transparencia y explicabilidad de herramientas IA',
                                                    'Sesgo algorítmico y equidad',
                                                    'Marco UNESCO 2024 sobre IA en educación'
                                                ].map(item => (
                                                    <label key={item} className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.fortalecerMision1 || []).includes(item)}
                                                            onChange={(e) => {
                                                                const currentList = formData.fortalecerMision1 || [];
                                                                const newList = e.target.checked
                                                                    ? [...currentList, item]
                                                                    : currentList.filter(i => i !== item);
                                                                handleInputChange('fortalecerMision1', newList);
                                                            }}
                                                        />
                                                        <span className="label-text">{item}</span>
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
                                            <div className="input-group"><label>Grado o Nivel:</label><input type="text" value={formData.grado || ""} onChange={(e) => handleInputChange('grado', e.target.value)} /></div>
                                            <div className="input-group"><label>Asignatura:</label><input type="text" value={formData.asignatura || ""} onChange={(e) => handleInputChange('asignatura', e.target.value)} /></div>
                                        </div>
                                        <div className="input-group"><label>Tema:</label><input type="text" value={formData.tema || ""} onChange={(e) => handleInputChange('tema', e.target.value)} /></div>
                                        <div className="input-group"><label>Objetivo de aprendizaje (medible en tu sesión de clase)</label><input type="text" value={formData.objetivo || ""} onChange={(e) => handleInputChange('objetivo', e.target.value)} /></div>
                                    </section>

                                    <section className="form-card highlight">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 2. Competencia Cognitiva Principal
                                        </div>

                                        <div className="input-group">
                                            <label className="group-main-label">
                                                ¿Qué nivel de pensamiento deseas priorizar en este rediseño?
                                            </label>

                                            <div className="options-vertical-premium">
                                                {[
                                                    'Comprensión conceptual',
                                                    'Aplicación',
                                                    'Análisis',
                                                    'Evaluación crítica',
                                                    'Creación'
                                                ].map(competencia => (
                                                    <label key={competencia} className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            name="competenciaCognitiva"
                                                            checked={formData.competenciaCognitiva?.includes(competencia)}
                                                            onChange={(e) => {
                                                                const currentList = formData.competenciaCognitiva || [];
                                                                const newList = e.target.checked
                                                                    ? [...currentList, competencia]
                                                                    : currentList.filter(c => c !== competencia);
                                                                handleInputChange('competenciaCognitiva', newList);
                                                            }}
                                                        />
                                                        <span className="label-text">{competencia}</span>
                                                    </label>
                                                ))}

                                                {/* Espacio para "Otra competencia" si fuera necesario */}
                                                <div className="input-group-inline">
                                                    <input
                                                        type="text"
                                                        placeholder="Otra competencia específica..."
                                                        className="inline-input-premium"
                                                        value={formData.competenciaCognitivaOtro || ""}
                                                        onChange={(e) => handleInputChange('competenciaCognitivaOtro', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">3. Diseño original (sin IA)</div>
                                        <label>¿Cómo era tu secuencia didáctica antes de intergrar IA?</label>
                                        <div className="options-vertical-premium">
                                            {['Clase magistral', 'Estudio de caso', 'Debate', 'Proyecto', 'Taller práctico'].map(opt => (
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
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i>4. Análisis de Limitaciones
                                        </div>
                                        <div className="textarea-group-premium">
                                            <label>¿Qué limitación pedagógica tenía este diseño original?</label>
                                            <textarea
                                                maxLength={1000}
                                                placeholder="Ej: Falta de personalización, evaluación muy memorística, poca participación activa..."
                                                value={formData.limitacionPedagogica || ""}
                                                onChange={(e) => handleInputChange('limitacionPedagogica', e.target.value)}
                                                rows={4}
                                            />
                                            <span className="char-count">
                                                {formData.limitacionPedagogica?.length || 0} / 1000
                                            </span>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">5. Rediseño con IA</div>
                                        <div className="input-group">
                                            <label>Herramienta utilizada:</label>
                                            <div className="options-vertical-premium">
                                                {['Chat generativa', 'Generador de imágenes', 'Tutor adaptativo', 'Corrector automático', 'Plataforma LMS'].map(h => (
                                                    <label key={h} className="check-label-row"><input type="checkbox" checked={(formData.herramientas || []).includes(h)} onChange={() => handleChecklist('herramientas', h)} /><span className="label-text">{h}</span></label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Rol de la IA en la secuencia</label>
                                            <div className="options-vertical-premium">
                                                {['Generar ejemplos', 'Proporcionar retroalimentación', 'Proponer preguntas', 'Simular escenarios', 'Corregir borradores'].map(r => (
                                                    <label key={r} className="check-label-row"><input type="checkbox" checked={(formData.rolIA || []).includes(r)} onChange={() => handleChecklist('rolIA', r)} /><span className="label-text">{r}</span></label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                <label style={{ margin: 0 }}>Tipo de intervención:</label>
                                                <div className="atlas-info-icon" title="Pasa el cursor sobre las opciones para ver ayuda">
                                                    <i className="fas fa-info-circle" style={{ color: 'var(--atlas-gold)', cursor: 'pointer' }}></i>
                                                </div>
                                            </div>

                                            <select
                                                className="atlas-select-premium"
                                                value={formData.intervencion || ""}
                                                onChange={(e) => handleInputChange('intervencion', e.target.value)}
                                            >
                                                <option value="">Seleccione una categoría...</option>
                                                <option value="Andamiaje temporal">Andamiaje temporal</option>
                                                <option value="Apoyo conceptual">Apoyo conceptual</option>
                                                <option value="Simulación exploratoria">Simulación exploratoria</option>
                                                <option value="Producción final">Producción final</option>
                                            </select>

                                            {/* PANEL EXPLICATIVO DINÁMICO */}
                                            {formData.intervencion && (
                                                <div className="intervention-help-panel" style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease' }}>

                                                    {/* TOOLTIP BREVE (Siempre visible al seleccionar) */}
                                                    <div className="tooltip-brief-container" style={{ padding: '15px', background: 'rgba(197, 160, 89, 0.08)', borderRadius: '12px', borderLeft: '4px solid var(--atlas-gold)' }}>
                                                        <strong style={{ display: 'block', color: 'var(--atlas-gold)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>
                                                            Tooltip breve:
                                                        </strong>
                                                        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--atlas-dark)', fontSize: '0.95rem' }}>
                                                            {formData.intervencion === "Andamiaje temporal" && "“La IA actúa como apoyo provisional para ayudar al estudiante a avanzar en una tarea que aún no puede realizar solo. El control y la responsabilidad final permanecen en el estudiante.”"}
                                                            {formData.intervencion === "Apoyo conceptual" && "“La IA ayuda a clarificar conceptos, ofrecer explicaciones alternativas o ejemplos adicionales para fortalecer comprensión.”"}
                                                            {formData.intervencion === "Simulación exploratoria" && "“La IA permite explorar escenarios, casos o situaciones hipotéticas para promover pensamiento crítico y toma de decisiones.”"}
                                                            {formData.intervencion === "Producción final" && "“La IA interviene directamente en la elaboración del producto final evaluado. Este uso requiere justificar cómo se mantiene la autoría y el juicio humano.”"}
                                                        </p>
                                                    </div>

                                                    {/* ALERTA PEDAGÓGICA (Solo para Producción Final) */}
                                                    {formData.intervencion === "Producción final" && (
                                                        <div className="pedagogical-alert" style={{ margin: '15px 0', padding: '15px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#991b1b' }}>
                                                            <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                                                            <strong>Alerta pedagógica:</strong> “Según el enfoque UNESCO 2024, la IA no debe sustituir la autoría ni el juicio profesional. Justifica por qué esta decisión mantiene agencia humana.”
                                                        </div>
                                                    )}

                                                    {/* VERSIÓN AMPLIADA */}
                                                    <div className="expanded-version" style={{ marginTop: '15px', padding: '0 10px' }}>
                                                        <h5 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>Versión ampliada:</h5>
                                                        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.5' }}>
                                                            {formData.intervencion === "Andamiaje temporal" && "En este tipo de intervención, la IA cumple una función de apoyo gradual: ofrece ejemplos, preguntas guía, pistas o retroalimentación inicial. Su propósito es facilitar comprensión o desbloquear dificultades, pero no sustituye el proceso cognitivo. Desde el marco UNESCO 2024, este uso es coherente cuando fortalece autonomía progresiva y no genera dependencia permanente."}
                                                            {formData.intervencion === "Apoyo conceptual" && "Aquí la IA cumple una función explicativa o de ampliación conceptual. Puede reformular ideas, proporcionar analogías o presentar perspectivas adicionales. Debe utilizarse con supervisión docente para evitar simplificaciones incorrectas o información inexacta. Según UNESCO, este uso es pertinente cuando mejora comprensión sin sustituir el análisis crítico del estudiante."}
                                                            {formData.intervencion === "Simulación exploratoria" && "En este caso, la IA actúa como entorno interactivo para experimentar ideas, escenarios o problemas complejos. No produce el resultado final del estudiante, sino que amplía posibilidades de análisis y discusión. Este tipo de uso es altamente alineado con DEEPEN cuando promueve reflexión, argumentación y evaluación crítica."}
                                                            {formData.intervencion === "Producción final" && "Aquí la IA participa en la generación directa del producto que será evaluado (ensayo, informe, proyecto, solución). Este es el tipo de intervención de mayor riesgo en términos de agencia, autoría y pensamiento profundo. Desde el enfoque UNESCO 2024, solo es pedagógicamente justificable si: Existe supervisión docente clara, se evalúa el proceso, no solo el resultado, se mantiene evidencia de pensamiento propio del estudiante y hay instancia sin IA que demuestre comprensión."}
                                                        </p>

                                                        {/* PREGUNTA ORIENTADORA */}
                                                        <div className="orienting-question" style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                                                            <strong style={{ fontSize: '0.8rem', color: 'var(--atlas-gold)' }}>Pregunta orientadora:</strong>
                                                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', fontWeight: '600' }}>
                                                                {formData.intervencion === "Andamiaje temporal" && "¿La IA puede retirarse sin que el estudiante pierda capacidad de resolver la tarea?"}
                                                                {formData.intervencion === "Apoyo conceptual" && "¿El estudiante analiza y contrasta la explicación de la IA con otras fuentes?"}
                                                                {formData.intervencion === "Simulación exploratoria" && "¿La simulación genera debate, análisis o toma de decisiones fundamentadas?"}
                                                                {formData.intervencion === "Producción final" && "Justifique cómo esta decisión preserva agencia estudiantil y supervisión humana significativa."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* SECCIÓN 6: SECUENCIA DIDÁCTICA VISUAL */}
                                    <section className="form-card highlight">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 6. Secuencia Didáctica Visual (UNESCO DEEPEN)
                                        </div>

                                        <div className="secuencia-container" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                                            {/* MOMENTO 1: INICIO */}
                                            <div className="momento-card" style={{ background: '#fff', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h5 style={{ color: 'var(--atlas-gold)', fontWeight: '800', marginBottom: '15px', fontSize: '0.9rem' }}>EN EL INICIO (PLANEACIÓN)</h5>
                                                <div className="secuencia-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                                    <BinarySelector label="¿Interviene IA?" value={formData.secuenciaInicioIA} onChange={(v) => handleInputChange('secuenciaInicioIA', v)} />
                                                    <BinarySelector label="¿Interviene docente?" value={formData.secuenciaInicioDocente} onChange={(v) => handleInputChange('secuenciaInicioDocente', v)} />
                                                    <BinarySelector label="¿Interviene estudiante sin IA?" value={formData.secuenciaInicioEstudiante} onChange={(v) => handleInputChange('secuenciaInicioEstudiante', v)} />
                                                </div>
                                            </div>

                                            {/* MOMENTO 2: DESARROLLO */}
                                            <div className="momento-card" style={{ background: '#fff', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h5 style={{ color: 'var(--atlas-gold)', fontWeight: '800', marginBottom: '15px', fontSize: '0.9rem' }}>EN EL DESARROLLO (EJECUCIÓN)</h5>
                                                <div className="secuencia-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                                    <BinarySelector label="¿Interviene IA?" value={formData.secuenciaDesarrolloIA} onChange={(v) => handleInputChange('secuenciaDesarrolloIA', v)} />
                                                    <BinarySelector label="¿Interviene docente?" value={formData.secuenciaDesarrolloDocente} onChange={(v) => handleInputChange('secuenciaDesarrolloDocente', v)} />
                                                    <BinarySelector label="¿Interviene estudiante sin IA?" value={formData.secuenciaDesarrolloEstudiante} onChange={(v) => handleInputChange('secuenciaDesarrolloEstudiante', v)} />
                                                </div>
                                            </div>

                                            {/* MOMENTO 3: CIERRE */}
                                            <div className="momento-card" style={{ background: '#fff', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                                                <h5 style={{ color: 'var(--atlas-gold)', fontWeight: '800', marginBottom: '15px', fontSize: '0.9rem' }}>EN EL CIERRE</h5>
                                                <div className="secuencia-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                                    <BinarySelector label="¿Hay instancia sin IA obligatoria?" value={formData.secuenciaCierreSinIA} onChange={(v) => handleInputChange('secuenciaCierreSinIA', v)} />
                                                    <BinarySelector label="¿Hay reflexión metacognitiva?" value={formData.secuenciaReflexionMeta} onChange={(v) => handleInputChange('secuenciaReflexionMeta', v)} />
                                                    <BinarySelector label="¿Interviene IA?" value={formData.secuenciaCierreIA} onChange={(v) => handleInputChange('secuenciaCierreIA', v)} />
                                                </div>
                                            </div>

                                            {/* PANEL DE ANÁLISIS AUTOMÁTICO */}
                                            {calcularPatronUNESCO(formData) && (
                                                <div className="analysis-result-panel" style={{
                                                    marginTop: '20px',
                                                    padding: '25px',
                                                    borderRadius: '20px',
                                                    border: `2px solid ${calcularPatronUNESCO(formData).color}`,
                                                    background: `${calcularPatronUNESCO(formData).color}08`,
                                                    animation: 'fadeIn 0.5s ease'
                                                }}>
                                                    <h4 style={{ color: calcularPatronUNESCO(formData).color, fontWeight: '900', marginBottom: '15px' }}>
                                                        {calcularPatronUNESCO(formData).titulo}
                                                    </h4>
                                                    <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '15px' }}>{calcularPatronUNESCO(formData).resultado}</p>

                                                    {calcularPatronUNESCO(formData).recomendacion && (
                                                        <div style={{ marginBottom: '10px' }}>
                                                            <strong style={{ display: 'block', color: 'var(--atlas-dark)' }}>Recomendación:</strong>
                                                            <p style={{ margin: 0 }}>{calcularPatronUNESCO(formData).recomendacion}</p>
                                                        </div>
                                                    )}

                                                    {calcularPatronUNESCO(formData).sugerencia && (
                                                        <div style={{ marginBottom: '10px' }}>
                                                            <strong style={{ display: 'block', color: 'var(--atlas-dark)' }}>Sugerencia opcional:</strong>
                                                            <p style={{ margin: 0 }}>{calcularPatronUNESCO(formData).sugerencia}</p>
                                                        </div>
                                                    )}

                                                    {calcularPatronUNESCO(formData).mensaje && (
                                                        <div style={{ marginTop: '15px', padding: '10px', background: '#fff', borderRadius: '10px', fontStyle: 'italic' }}>
                                                            "{calcularPatronUNESCO(formData).mensaje}"
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                     <section className="form-card">
                                        <div className="form-section-title">7. Agencia estudiantil</div>
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
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 8. Protección de la Agencia Estudiantil
                                        </div>
                                        <div className="textarea-group-premium">
                                            <label>¿Cómo garantizas que la IA no sustituye el pensamiento del estudiante?</label>
                                            <textarea
                                                maxLength={1000}
                                                placeholder="Ej: Se requiere una defensa oral posterior, comparación crítica de versiones, o el uso de la IA es solo para estructurar ideas iniciales..."
                                                value={formData.garantiaPensamiento || ""}
                                                onChange={(e) => handleInputChange('garantiaPensamiento', e.target.value)}
                                                rows={4}
                                            />
                                            <span className="char-count">
                                                {formData.garantiaPensamiento?.length || 0} / 1000
                                            </span>
                                        </div>
                                    </section>

                                    <section className="form-card highlight">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 9. Transparencia y Metacognición (UNESCO DEEPEN)
                                        </div>

                                        <div className="input-group">
                                            <label className="group-main-label">
                                                Selecciona las acciones de transparencia y reflexión incorporadas en el diseño:
                                            </label>

                                            <div className="options-vertical-premium">
                                                {[
                                                    'Explicación de cómo funciona la herramienta y sus límites',
                                                    'Comparación humano vs IA',
                                                    'Defensa oral sin IA',
                                                    'Declaración obligatoria de uso',
                                                    'Reflexión metacognitiva estructurada',
                                                    'Análisis crítico del output',
                                                    'Identificación de sesgos'
                                                ].map(accion => (
                                                    <label key={accion} className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            name="checklistMetacognicion"
                                                            checked={(formData.checklistMetacognicion || []).includes(accion)}
                                                            onChange={(e) => {
                                                                const currentList = formData.checklistMetacognicion || [];
                                                                const newList = e.target.checked
                                                                    ? [...currentList, accion]
                                                                    : currentList.filter(item => item !== accion);
                                                                handleInputChange('checklistMetacognicion', newList);
                                                            }}
                                                        />
                                                        <span className="label-text">{accion}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 10. Actividad Metacognitiva Diseñada
                                        </div>
                                        <div className="textarea-group-premium">
                                            <label>Describe la pregunta o actividad en tu secuencia donde el estudiante reflexiona sobre el uso de IA:</label>
                                            <textarea
                                                maxLength={1500}
                                                placeholder="Ej: El estudiante debe responder: ¿Qué parte del ensayo fue generada por la IA y qué cambios críticos realicé yo para mejorar la precisión y el estilo?"
                                                value={formData.actividadMetacognitiva || ""}
                                                onChange={(e) => handleInputChange('actividadMetacognitiva', e.target.value)}
                                                rows={4}
                                            />
                                            <span className="char-count">
                                                {formData.actividadMetacognitiva?.length || 0} / 1500
                                            </span>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">11.  Riesgos y Mitigación </div>
                                        <label>Riesgos identificados:</label>
                                        <div className="options-vertical-premium">
                                            {['Dependencia', 'Sesgo', 'Información incorrecta', 'Pérdida de autoría', 'Superficialidad', 'Ninguno'].map(c => (
                                                <label key={c} className="check-label-row"><input type="checkbox" checked={(formData.checklistHuman || []).includes(c)} onChange={() => handleChecklist('checklistHuman', c)} /><span className="label-text">{c}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 12. Gestión de Riesgos Pedagógicos
                                        </div>
                                        <div className="textarea-group-premium">
                                            <label>¿Cuál es el riesgo pedagógico más relevante en esta secuencia?</label>
                                            <textarea
                                                maxLength={1000}
                                                placeholder="Ej: Posible sesgo en la información de la IA, riesgo de dependencia excesiva en la fase de desarrollo, o dificultad para validar la autoría individual..."
                                                value={formData.riesgoPedagogico || ""}
                                                onChange={(e) => handleInputChange('riesgoPedagogico', e.target.value)}
                                                rows={4}
                                            />
                                            <span className="char-count">
                                                {formData.riesgoPedagogico?.length || 0} / 1000
                                            </span>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">13. Estrategia de mitigación aplicada: </div>
                                        <label>Estrategias:</label>
                                        <div className="options-vertical-premium">
                                            {['Supervisión docente activa', 'Instancia sin IA', 'Rúbrica específica', 'Trabajo en etapas', 'Retroalimentación crítica', 'No se aplicó estrategia'].map(c => (
                                                <label key={c} className="check-label-row"><input type="checkbox" checked={(formData.checklistHuman || []).includes(c)} onChange={() => handleChecklist('checklistHuman', c)} /><span className="label-text">{c}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">14. Evaluación </div>
                                        <label>Tu evaluación de esta secuencia didáctica incluye:</label>
                                        <div className="options-vertical-premium">
                                            {['Declaración de uso de IA', 'Criterios de pensamiento crítico', 'Criterios de ética', 'Defensa oral', 'Evaluación comparativa', 'Ninguno'].map(c => (
                                                <label key={c} className="check-label-row"><input type="checkbox" checked={(formData.checklistHuman || []).includes(c)} onChange={() => handleChecklist('checklistHuman', c)} /><span className="label-text">{c}</span></label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 15. Evaluación del Proceso Cognitivo
                                        </div>
                                        <div className="textarea-group-premium">
                                            <label>¿Cómo evalúas la calidad del pensamiento más allá del producto generado?</label>
                                            <textarea
                                                maxLength={1200}
                                                placeholder="Ej: Evaluación del historial de prompts, rúbrica de análisis crítico, comparación de borradores manuales vs. asistidos, o entrevista de validación..."
                                                value={formData.evaluacionPensamiento || ""}
                                                onChange={(e) => handleInputChange('evaluacionPensamiento', e.target.value)}
                                                rows={4}
                                            />
                                            <span className="char-count">
                                                {formData.evaluacionPensamiento?.length || 0} / 1200
                                            </span>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">Reflexión Docente</div>
                                        <div className="textarea-group-premium">
                                            <label>La principal mejora pedagógica lograda fue:</label>
                                            <textarea maxLength={2000} placeholder="Describe la mejora..." value={formData.reflexionMejora || ""} onChange={(e) => handleInputChange('reflexionMejora', e.target.value)} />
                                            <label>El mayor riesgo que aún debo monitorear es:</label>
                                            <textarea maxLength={2000} placeholder="Describe el ajuste..." value={formData.reflexionAjuste || ""} onChange={(e) => handleInputChange('reflexionAjuste', e.target.value)} />
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 17. Validación de Autonomía (Prueba de Retiro)
                                        </div>
                                        <label className="group-main-label">
                                            Si retiro la IA de esta secuencia, el aprendizaje profundo:
                                        </label>
                                        <div className="options-vertical-premium">
                                            {[
                                                'Se mantiene',
                                                'Disminuye',
                                                'Desaparece',
                                                'No lo he evaluado'
                                            ].map(opt => (
                                                <label key={opt} className="check-label-row">
                                                    <input
                                                        type="radio"
                                                        name="impactoRetiroIA"
                                                        checked={formData.impactoRetiroIA === opt}
                                                        onChange={() => handleInputChange('impactoRetiroIA', opt)}
                                                    />
                                                    <span className="label-text">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    {/* --- SECCIÓN: COMPROMISO DE FORTALECIMIENTO RETO 2 --- */}
                                    <section className="form-card highlight">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> PROYECCIÓN DE DESARROLLO PROFESIONAL
                                        </div>

                                        <div className="input-group">
                                            <label className="group-main-label">
                                                A partir de esta misión, ¿en qué áreas te gustaría fortalecer tu práctica pedagógica?
                                            </label>

                                            <div className="options-vertical-premium">
                                                {[
                                                    'Taxonomía de Bloom aplicada a IA',
                                                    'Diseño de secuencias didácticas con IA',
                                                    'Agencia estudiantil y metacognición',
                                                    'Supervisión humana significativa',
                                                    'Evaluación con criterio común',
                                                    'Uso ético de IA en el diseño de clases',
                                                    'Análisis crítico de outputs generativos',
                                                    'Estrategias para evitar dependencia tecnológica'
                                                ].map(item => (
                                                    <label key={item} className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.fortalecerMision2 || []).includes(item)}
                                                            onChange={(e) => {
                                                                const currentList = formData.fortalecerMision2 || [];
                                                                const newList = e.target.checked
                                                                    ? [...currentList, item]
                                                                    : currentList.filter(i => i !== item);
                                                                handleInputChange('fortalecerMision2', newList);
                                                            }}
                                                        />
                                                        <span className="label-text">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                </>
                            )}

                            {/* --- FORMULARIO RETO 3 DOCENTE --- */}
                            {parseInt(retoId) === 3 && (
                                <>
                                    <section className="form-card">
                                        <div className="form-section-title">1. CONTEXTO DE LA CLASE INCLUSIVA</div>
                                        <div className="grid-2-col-premium">
                                            <input
                                                type="text"
                                                placeholder="Grado/Nivel"
                                                value={formData.grado3 || ""}
                                                onChange={(e) => handleInputChange('grado3', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Asignatura"
                                                value={formData.asig3 || ""}
                                                onChange={(e) => handleInputChange('asig3', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Tema"
                                                value={formData.top3 || ""}
                                                onChange={(e) => handleInputChange('top3', e.target.value)}
                                            />
                                        </div>
                                        <label className="group-main-label">NIVEL DE PENSAMIENTO A TRABAJAR:</label>
                                        <div className="options-vertical-premium">
                                            {['Recordar', 'Aplicar', 'Comprender', 'Analizar', 'Evaluar', 'Crear'].map(b => (
                                                <label key={b} className="check-label-row">
                                                    <input
                                                        type="radio"
                                                        name="bloom"
                                                        checked={formData.bloom === b}
                                                        onChange={() => handleInputChange('bloom', b)}
                                                    />
                                                    <span className="label-text">{b}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 2. IDENTIFICACIÓN DE BARRERAS
                                        </div>
                                        <div className="input-group">
                                            <label className="group-main-label">
                                                Selecciona las barreras observadas o identificadas ya sea desde tu percepción o desde un diagnóstico oficial de ajustes razonables:
                                            </label>
                                            <div className="options-vertical-premium">
                                                {[
                                                    'Barreras de lenguaje',
                                                    'Barreras de ritmo de procesamiento',
                                                    'Barreras atencionales',
                                                    'Barreras de representación (visual / auditiva)',
                                                    'Barreras socioemocionales'
                                                ].map(barrera => (
                                                    <label key={barrera} className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.barrerasIdentificadas || []).includes(barrera)}
                                                            onChange={() => handleChecklist('barrerasIdentificadas', barrera)}
                                                        />
                                                        <span className="label-text">{barrera}</span>
                                                    </label>
                                                ))}

                                                <div className="otro-wrapper-premium" style={{ width: '100%' }}>
                                                    <label className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.habilitarOtraBarrera || false}
                                                            onChange={(e) => {
                                                                const estaActivado = e.target.checked;
                                                                handleInputChange('habilitarOtraBarrera', estaActivado);
                                                                if (!estaActivado) {
                                                                    handleInputChange('otraBarreraTexto', "");
                                                                    const opcionesFijas = [
                                                                        'Barreras de lenguaje',
                                                                        'Barreras de ritmo de procesamiento',
                                                                        'Barreras atencionales',
                                                                        'Barreras de representación (visual / auditiva)',
                                                                        'Barreras socioemocionales'
                                                                    ];
                                                                    const limpias = (formData.barrerasIdentificadas || []).filter(b => opcionesFijas.includes(b));
                                                                    handleInputChange('barrerasIdentificadas', limpias);
                                                                }
                                                            }}
                                                        />
                                                        <span className="label-text">Otras</span>
                                                    </label>

                                                    {formData.habilitarOtraBarrera && (
                                                        <div style={{ padding: '0 5px 15px 5px', animation: 'fadeIn 0.3s ease', width: '100%' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Especifica otras barreras..."
                                                                className="inline-input-premium"
                                                                autoFocus
                                                                style={{
                                                                    width: '100%',
                                                                    minHeight: '45px',
                                                                    padding: '12px 15px',
                                                                    borderRadius: '10px',
                                                                    border: '2px solid var(--atlas-gold)',
                                                                    fontSize: '1rem',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                                value={formData.otraBarreraTexto || ""}
                                                                onChange={(e) => {
                                                                    const valor = e.target.value;
                                                                    handleInputChange('otraBarreraTexto', valor);
                                                                    const opcionesFijas = [
                                                                        'Barreras de lenguaje', 'Barreras de ritmo de procesamiento', 'Barreras atencionales',
                                                                        'Barreras de representación (visual / auditiva)', 'Barreras socioemocionales'
                                                                    ];
                                                                    let nuevasBarreras = (formData.barrerasIdentificadas || []).filter(b => opcionesFijas.includes(b));
                                                                    if (valor.trim() !== "") nuevasBarreras.push(valor);
                                                                    handleInputChange('barrerasIdentificadas', nuevasBarreras);
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">3. DISEÑO INCLUSIVO CON IA</div>
                                        <label>¿Cómo amplía la IA el acceso sin reducir la complejidad cognitiva?</label>
                                        <div className="options-vertical-premium">
                                            {['Múltiples formas de representación', 'Múltiples formas de expresión', 'Múltiples formas de participación', 'Andamiaje adaptable sin etiquetado', 'Ajuste dinámico de apoyo'].map(d => (
                                                <label key={d} className="check-label-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.tipoDif || []).includes(d)}
                                                        onChange={() => handleChecklist('tipoDif', d)}
                                                    />
                                                    <span className="label-text">{d}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">4. ROL DE LA IA EN EQUIDAD</div>
                                        <div className="options-vertical-premium">
                                            {[
                                                'Genera versiones adaptadas del contenido', 'Ofrece apoyos adicionales personalizados', 'Traduce o simplifica lenguaje',
                                                'Proporciona ejemplos contextualizados', 'Ajusta nivel de preguntas', 'No interviene directamente',
                                                'Permite múltiples caminos hacia el mismo estándar', 'Genera apoyos bajo demanda sin exposición pública',
                                                'Facilita práctica autónoma personalizada'
                                            ].map(d => (
                                                <label key={d} className="check-label-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.tipoDifIA || []).includes(d)}
                                                        onChange={() => handleChecklist('tipoDifIA', d)}
                                                    />
                                                    <span className="label-text">{d}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">5. PROTECCIÓN DE EQUIDAD Y DIGNIDAD</div>
                                        <label>Selecciona las acciones incorporadas:</label>
                                        <div className="options-vertical-premium">
                                            {[
                                                'Todas las variantes conducen al mismo estándar final', 'No se comunica públicamente quién recibe apoyo adicional',
                                                'Se mantienen expectativas altas para todos', 'Se evita etiquetamiento por nivel', 'Existe instancia común sin diferenciación',
                                                'Supervisión docente activa en todas las variantes'
                                            ].map(p => (
                                                <label key={p} className="check-label-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.proteccion || []).includes(p)}
                                                        onChange={() => handleChecklist('proteccion', p)}
                                                    />
                                                    <span className="label-text">{p}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 5.1 PROTECCIÓN DE EQUIDAD Y DIGNIDAD
                                        </div>
                                        <div className="textarea-group-premium">
                                            <label>¿Cómo evitarías que la IA etiquete o prediga capacidades de forma determinista?</label>
                                            <textarea
                                                maxLength={1000}
                                                placeholder="Ej: Manteniendo una observación docente activa que contraste los datos de la IA..."
                                                value={formData.mitigacionDeterminismo || ""}
                                                onChange={(e) => handleInputChange('mitigacionDeterminismo', e.target.value)}
                                                rows={4}
                                            />
                                            <span className="char-count">
                                                {formData.mitigacionDeterminismo?.length || 0} / 1000
                                            </span>
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">6. RIESGOS SISTEMICOS</div>
                                        <div className="options-vertical-premium">
                                            {[
                                                'Reducción de rigor académico', 'Sesgo algorítmico', 'Perfilamiento', 'Dependencia diferencial',
                                                'Invisibilización de fortalezas', 'Estigmatización implícita', 'Dependencia tecnológica',
                                                'Segmentación excesiva', 'No identifiqué riesgos'
                                            ].map(p => (
                                                <label key={p} className="check-label-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.riesgosIdent3 || []).includes(p)}
                                                        onChange={() => handleChecklist('riesgosIdent3', p)}
                                                    />
                                                    <span className="label-text">{p}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">7. GARANTÍAS DE EQUIDAD Y RIGOR</div>
                                        <label className="group-main-label">
                                            Selecciona las garantías que aseguran que tu estrategia amplía oportunidades sin reducir estándares:
                                        </label>
                                        <div className="options-vertical-premium">
                                            {[
                                                'El objetivo cognitivo es común y visible para todo el grupo.',
                                                'Todas las variantes conducen al mismo estándar de evaluación.',
                                                'Existe revisión humana activa antes de cualquier decisión académica relevante.',
                                                'Los apoyos no son permanentes ni asignados de forma fija (evita etiquetamiento).',
                                                'Se incluye reflexión estudiantil sobre el uso de IA y su impacto en el aprendizaje'
                                            ].map(p => (
                                                <label key={p} className="check-label-row">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.mitigacion3 || []).includes(p)}
                                                        onChange={() => handleChecklist('mitigacion3', p)}
                                                    />
                                                    <span className="label-text">{p}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="form-card">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 8. Reflexión y Mitigación
                                        </div>
                                        <div className="textarea-group-premium">
                                            <label>El principal aporte inclusivo de esta estrategia es:</label>
                                            <textarea
                                                maxLength={500}
                                                placeholder="Describe el impacto en la inclusión..."
                                                value={formData.aporte3 || ""}
                                                onChange={(e) => handleInputChange('aporte3', e.target.value)}
                                            />
                                            <span className="char-count">
                                                {formData.aporte3?.length || 0} / 500
                                            </span>

                                            <label style={{ marginTop: '15px' }}>El mayor riesgo que debo vigilar es:</label>
                                            <textarea
                                                maxLength={500}
                                                placeholder="Identifica el riesgo crítico..."
                                                value={formData.riesgoVigilar3 || ""}
                                                onChange={(e) => handleInputChange('riesgoVigilar3', e.target.value)}
                                            />
                                            <span className="char-count">
                                                {formData.riesgoVigilar3?.length || 0} / 500
                                            </span>

                                            <label style={{ marginTop: '15px' }}>¿Por qué esta estrategia podría replicarse en otro curso o institución?</label>
                                            <textarea
                                                maxLength={1000}
                                                placeholder="Ej: Por su bajo costo de implementación..."
                                                value={formData.escalabilidad3 || ""}
                                                onChange={(e) => handleInputChange('escalabilidad3', e.target.value)}
                                                rows={3}
                                            />
                                            <span className="char-count">
                                                {formData.escalabilidad3?.length || 0} / 1000
                                            </span>
                                        </div>
                                    </section>

                                    <section className="form-card highlight">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> 8.1. Validación de Impacto y Estándares
                                        </div>
                                        <div className="input-group">
                                            <label className="group-main-label">
                                                ¿Cómo comprobarás que la estrategia amplió oportunidades sin reducir los estándares académicos?
                                            </label>
                                            <div className="options-vertical-premium">
                                                {[
                                                    'Comparación de desempeño final',
                                                    'Evidencia de participación ampliada',
                                                    'Defensa oral común',
                                                    'Evaluación con mismo criterio final'
                                                ].map(metodo => (
                                                    <label key={metodo} className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.validacionEstandares3 || []).includes(metodo)}
                                                            onChange={() => handleChecklist('validacionEstandares3', metodo)}
                                                        />
                                                        <span className="label-text">{metodo}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {/* --- SECCIÓN FINAL: ANÁLISIS DE IMPACTO INCLUSIVO --- */}
                                    <section className={`form-card result-analysis-card patron-${analizado.patron}`}>
                                        <div className="form-section-title">
                                            <i className="fas fa-chart-line"></i> ANÁLISIS DE IMPACTO INCLUSIVO (UNESCO CREATE)
                                        </div>

                                        <div className="analysis-summary-grid">
                                            <div className="summary-item">
                                                <strong>Nivel cognitivo:</strong>
                                                <span>{formData.bloom || "No definido"}</span>
                                            </div>
                                            <div className="summary-item">
                                                <strong>Garantías de equidad:</strong>
                                                <span>{(formData.mitigacion3 || []).length} / 5</span>
                                            </div>
                                            <div className="summary-item">
                                                <strong>Comprobación de impacto:</strong>
                                                <span>{(formData.validacionEstandares3 || []).length > 0 ? "Sí" : "No"}</span>
                                            </div>
                                            <div className="summary-item">
                                                <strong>Riesgos sistémicos:</strong>
                                                <span>{(formData.riesgosIdent3 || []).some(r => ['Sesgo algorítmico', 'Perfilamiento', 'Dependencia diferencial', 'Invisibilización de fortalezas'].includes(r)) ? "Identificados" : "No identificados"}</span>
                                            </div>
                                        </div>

                                        <hr className="analysis-divider" />

                                        <div className="feedback-box-premium">
                                            <h4>Nivel alcanzado: {analizado.titulo}</h4>

                                            {analizado.patron === 1 && (
                                                <p>
                                                    Tu estrategia evidencia un diseño inclusivo mediado por IA con impacto estructural en equidad.
                                                    Se mantiene un objetivo cognitivo de alta complejidad, se amplían oportunidades sin reducción
                                                    de estándares y se activan garantías claras de rigor.
                                                    <br /><br />
                                                    Además, identificas riesgos sistémicos y defines mecanismos para comprobar impacto,
                                                    lo cual está alineado con:
                                                    <br />
                                                    • UNESCO AI Competency Framework for Teachers (CREATE, 2024)
                                                    <br />
                                                    • Principios de Diseño Universal para el Aprendizaje (DUA)
                                                    <br />
                                                    • Enfoque de equidad estructural (no segmentación)
                                                    <br /><br />
                                                    Tu estrategia es potencialmente transferible a otros contextos.
                                                </p>
                                            )}

                                            {analizado.patron === 2 && (
                                                <p>
                                                    Tu diseño mantiene rigor cognitivo y evidencia mecanismos claros de equidad y evaluación común.
                                                    Para consolidarse plenamente en nivel CREATE, sería recomendable fortalecer la identificación
                                                    de riesgos sistémicos (sesgo algorítmico, perfilamiento, dependencia diferencial),
                                                    tal como sugieren:
                                                    <br />
                                                    • UNESCO 2024 (dimensión ética avanzada)
                                                    <br />
                                                    • Recomendación UNESCO 2021 sobre IA y derechos humanos
                                                    <br /><br />
                                                    La innovación inclusiva requiere anticipar posibles efectos estructurales.
                                                </p>
                                            )}

                                            {analizado.patron === 3 && (
                                                <p>
                                                    Tu estrategia amplía oportunidades y mantiene cierta coherencia evaluativa.
                                                    Sin embargo, las garantías estructurales aún no son suficientes para asegurar
                                                    que la equidad sea sostenida y replicable.
                                                    <br /><br />
                                                    El marco CREATE invita a pasar de ajustes puntuales a diseño estructural.
                                                    <br /><br />
                                                    <strong>Sugerencia:</strong>
                                                    <br />
                                                    Fortalecer las garantías explícitas de estándar común y supervisión humana.
                                                </p>
                                            )}

                                            {analizado.patron === 4 && (
                                                <p>
                                                    Se observa intención inclusiva, pero el nivel de pensamiento trabajado podría
                                                    no sostener la exigencia académica común.
                                                    <br /><br />
                                                    El Diseño Universal para el Aprendizaje no implica simplificación del objetivo cognitivo,
                                                    sino diversificación del acceso al mismo estándar.
                                                    <br /><br />
                                                    Según UNESCO CREATE, la equidad no consiste en bajar la complejidad,
                                                    sino en ampliar oportunidades para alcanzarla.
                                                    <br /><br />
                                                    <strong>Recomendación:</strong>
                                                    <br />
                                                    Revisar el nivel cognitivo y explicitar cómo se mantiene la complejidad.
                                                </p>
                                            )}

                                            {analizado.patron === 5 && (
                                                <p>
                                                    Tu estrategia incorpora principios de equidad y dignidad.
                                                    Sin embargo, no se ha definido cómo comprobarás que la estrategia
                                                    amplió oportunidades sin reducir estándares.
                                                    <br /><br />
                                                    En el nivel CREATE, el diseño debe ser verificable y transferible.
                                                    <br /><br />
                                                    <strong>Sugerencia:</strong>
                                                    <br />
                                                    Incorporar evidencia comparativa, defensa común o evaluación con criterio compartido.
                                                </p>
                                            )}

                                            {analizado.patron === 6 && (
                                                <p>
                                                    Tu estrategia amplía apoyos, pero no se evidencian suficientes garantías
                                                    de estándar común.
                                                    <br /><br />
                                                    La inclusión estructural (UNESCO, UDL) requiere:
                                                    <br />
                                                    • Objetivo cognitivo común
                                                    <br />
                                                    • Criterio de evaluación compartido
                                                    <br />
                                                    • Evitar etiquetamiento implícito
                                                    <br /><br />
                                                    Se recomienda fortalecer las garantías de rigor.
                                                </p>
                                            )}
                                        </div>
                                    </section>

                                    {/* --- SECCIÓN: COMPROMISO DE FORTALECIMIENTO --- */}
                                    <section className="form-card highlight">
                                        <div className="form-section-title">
                                            <i className="form-section-title"></i> PROYECCIÓN DE DESARROLLO PROFESIONAL
                                        </div>
                                        <div className="input-group">
                                            <label className="group-main-label">
                                                A partir de esta misión, ¿en qué áreas te gustaría fortalecer tu práctica pedagógica?
                                            </label>
                                            <div className="options-vertical-premium">
                                                {[
                                                    'Diseño Universal para el Aprendizaje (DUA)',
                                                    'Diseño inclusivo estructural con IA',
                                                    'Estrategias de diferenciación sin segmentación',
                                                    'Neurodiversidad y ajustes razonables',
                                                    'Evaluación con mismo estándar para todos',
                                                    'Evidencia y medición de impacto en equidad',
                                                    'Prevención de perfilamiento y sesgo en inclusión mediada por IA',
                                                    'Transferibilidad de prácticas pedagógicas'
                                                ].map(item => (
                                                    <label key={item} className="check-label-row">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.fortalecerMision3 || []).includes(item)}
                                                            onChange={() => handleChecklist('fortalecerMision3', item)}
                                                        />
                                                        <span className="label-text">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
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
                            <p className="autoeval-desc">Certifico que esta estrategia:</p>
                            <div className="checklist-items-premium">
                                {(
                                    // --- LÓGICA DINÁMICA POR ROL Y RETO ---
                                    !isDirectivo ? (
                                        // Checklists para DOCENTES
                                        retoId === 1 ? [
                                            "He identificado riesgos reales y no solo supuestos generales de una herramienta de IA.", "He analizado el impacto en la agencia y autonomía estudiantil.", "He considerado explícitamente transparencia, sesgos y protección de datos.", "He definido el nivel de supervisión humana requerido.", "Mi reflexión final es coherente con el análisis realizado.", "Se promovió pensamiento de orden superior."
                                        ] : retoId === 2 ? [
                                            "La intención pedagógica es explícita.", " La IA no sustituye juicio docente.", " La agencia estudiantil se mantiene o fortalece.", "Se incorporó supervisión humana clara.", "Se abordaron riesgos éticos relevantes"
                                        ] : [
                                            "Mantiene objetivo cognitivo común.", "Amplía acceso sin etiquetar.", "No reduce nivel de exigencia.", "Incluye supervisión humana activa.", "Es replicable."
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
                                // Se deshabilita si faltan checks o si ya se está guardando
                                disabled={(formData.cumplimiento?.length < 3) || isSaving}
                                onClick={() => saveReto('completed')}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="spinner-mini"></span> Enviando respuestas...
                                    </>
                                ) : "ENVIAR MISIÓN"}
                            </button>
                        </div>
                    </section>
                </div>

            </main>
        </div>
    );
};