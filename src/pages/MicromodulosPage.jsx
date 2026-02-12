import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../Styles/Micromodulos.css";

export const MicromodulosPage = ({ userData, API_URL, onNavigate }) => {
    // CAMBIO 1: El loading inicia en false para evitar el bloqueo visual, 
    // pero usamos un estado de sincronización para la cápsula.
    const [loading, setLoading] = useState(false); 
    const [activeModulo, setActiveModulo] = useState(1);
    const [progresoData, setProgresoData] = useState([]);
    const [respuestasUsuarios, setRespuestasUsuarios] = useState([]);
    
    const [isSavingForo, setIsSavingForo] = useState(false);
    const [isSavingActividad, setIsSavingActividad] = useState(false);

    // CAMBIO 2: Estado para la cápsula de sincronización global
    const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);

    const [foroAporte, setForoAporte] = useState("");
    const [actividadTexto, setActividadTexto] = useState("");
    
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [preguntas, setPreguntas] = useState([]);
    const [currentResponses, setCurrentResponses] = useState({});
    const [isSyncingQuiz, setIsSyncingQuiz] = useState(false);

    // Mapeo exacto de IDs de formularios
    const FORM_IDS_MAP = {
        1: "FORM-1770840416708",
        2: "FORM-1770840694625",
        3: "FORM-1770840767445"
    };

    const contenidos = {
        1: {
            titulo: "Gobernanza Algorítmica y Agencia Humana (ATLAS – Fase A)",
            intro: "La inteligencia artificial no sustituye el juicio pedagógico. En el marco ATLAS, la primera responsabilidad del docente es ejercer supervisión crítica sobre cualquier sistema algorítmico que influya en decisiones académicas. Este módulo establece que la tecnología asiste, pero la decisión final es humana.",
            objetivos: [
                "Comprender el principio de Human-in-the-Loop como estándar ético obligatorio.",
                "Diferenciar automatización técnica de juicio pedagógico profesional.",
                "Identificar fuentes de sesgo algorítmico en sistemas educativos.",
                "Interpretar el concepto de 'Sistema de Alto Riesgo' según el AI Act UE 2024.",
                "Aplicar criterios de auditoría ética en escenarios educativos reales."
            ],
            marcoDetallado: (
                <div className="marco-narrativo">
                    <p>La gobernanza algorítmica en educación no implica rechazar la tecnología, sino establecer mecanismos claros de responsabilidad profesional. Según la <strong>UNESCO (2021)</strong> y la <strong>Comisión Europea</strong>, los entornos educativos son de alta sensibilidad ética, por lo que la agencia humana es innegociable.</p>

                    <h4>1️⃣ Agencia Humana (Human-in-the-Loop)</h4>
                    <p>El principio Human-in-the-Loop exige supervisión activa, crítica y con capacidad real de intervención. El docente no valida automáticamente una recomendación algorítmica: la analiza, la contrasta con evidencia contextual y puede invalidarla si no responde al perfil del estudiante.</p>

                    <h4>2️⃣ El Sesgo como Herencia Estadística</h4>
                    <p>Los algoritmos aprenden de datos históricos. Si esos datos contienen desigualdades sociales, lingüísticas o económicas, el modelo tenderá a reproducirlas. La auditoría docente es el mecanismo que evita que la automatización amplifique brechas de equidad.</p>

                    <h4>3️⃣ AI Act UE 2024 – Sistemas de Alto Riesgo</h4>
                    <p>El Reglamento Europeo de IA clasifica como <strong>Sistemas de Alto Riesgo</strong> aquellos que influyen en decisiones académicas que afectan el futuro del estudiante. Esto exige transparencia, trazabilidad y supervisión humana obligatoria.</p>
                </div>
            ),
            recursos: [
                { nombre: "The Ethics of artificial Intelligence", url: "https://drive.google.com/file/d/1oc-qJTBLiA6rYivEvZ_muEyPgcQSBVgG/view?usp=sharing" },
                { nombre: "Directrices eticas para una Ia fiable", url: "https://drive.google.com/file/d/1ihmnyJxFMfZzMyMM2CYqDL8rNoY7OJ5V/view?usp=sharing" }
            ],
            videoEmbed: "https://player.cloudinary.com/embed/?cloud_name=deafueoco&public_id=YTDown.com_YouTube_What-is-Explainable-AI_Media_jFHPEQi55Ko_001_1080p_vdhpcz",
            enunciadoForo: "Desde su experiencia profesional, ¿qué decisiones pedagógicas considera indelegables a un sistema de IA y por qué?",
            enunciadoActividad: "ESCENARIO: Una IA recomienda reprobar al 22% del curso por 'bajo vocabulario técnico'. TAREA: Redacte una auditoría ética (300–400 palabras) justificando su decisión profesional.",
            faseCodigo: "ATLAS-AE"
        },

        2: {
            titulo: "Soberanía Digital, Protección de Datos y Propiedad Intelectual (ATLAS – Fase A)",
            intro: "En el ecosistema educativo digital, cada dato tiene valor jurídico y ético. El marco ATLAS establece que la información estudiantil no es un insumo tecnológico, sino un activo protegido por principios de soberanía institucional y responsabilidad legal.",
            objetivos: [
                "Comprender el concepto de soberanía digital en educación.",
                "Identificar riesgos asociados al uso de IA pública o gratuita.",
                "Diferenciar propiedad intelectual humana de asistencia algorítmica.",
                "Aplicar criterios de minimización y protección de datos sensibles.",
                "Diseñar cláusulas básicas de uso responsable de IA en instituciones educativas."
            ],
            marcoDetallado: (
                <div className="marco-narrativo">
                    <p>La soberanía de datos implica que las instituciones educativas mantienen control sobre la información generada en procesos de enseñanza-apendizaje: almacenamiento, acceso y finalidad de uso.</p>

                    <h4>1️⃣ Soberanía Digital y Autonomía Institucional</h4>
                    <p>La dependencia tecnológica sin acuerdos contractuales claros puede comprometer la autonomía pedagógica. Según la UNESCO (2023), las instituciones deben conocer dónde se almacenan los datos y bajo qué condiciones se procesan.</p>

                    <h4>2️⃣ Propiedad Intelectual en la Co-creación Humano-IA</h4>
                    <p>La IA actúa como asistente técnico. La responsabilidad curricular, ética y jurídica del contenido recae en el profesional humano. El docente mantiene la autoría intelectual incluso cuando utiliza herramientas algorítmicas de apoyo.</p>

                    <h4>3️⃣ Riesgos de Plataformas Abiertas</h4>
                    <p>Muchas herramientas gratuitas utilizan datos ingresados para entrenamiento posterior. Subir informes con información identificable puede vulnerar normativas de protección de datos y comprometer la confidencialidad estudiantil.</p>
                </div>
            ),
            recursos: [
                { nombre: "UNESCO 2023 – Generative AI in Education", url: "https://drive.google.com/file/d/1w-2HFVT1CaqedYq0cSR7yEtfbkvTNQb9/view?usp=sharing" }
            ],
            videoEmbed: "https://player.cloudinary.com/embed/?cloud_name=deafueoco&public_id=ytdowncom-youtube-ethics-of-ai-challenges-and-governance-media-vqfqwiqob1g-001_yV2QMUB4_kgncjq",
            enunciadoForo: "¿Dónde deberían almacenarse los datos educativos generados por IA: en servidores externos o bajo control institucional? Argumente desde la soberanía digital.",
            enunciadoActividad: "TAREA: Identifique tres riesgos jurídicos del uso de IA pública y redacte una cláusula institucional de protección de datos (150 palabras).",
            faseCodigo: "ATLAS-AE"
        },

        3: {
            titulo: "Metacognición Profesional y Auditoría de Alucinaciones (ATLAS – Fase A)",
            intro: "Los modelos de lenguaje no 'saben'; predicen probabilidades. En el marco ATLAS, la competencia crítica del docente consiste en validar, triangular y auditar la veracidad de los contenidos generados por IA.",
            objetivos: [
                "Comprender el origen probabilístico de las alucinaciones algorítmicas.",
                "Detectar señales de citas o referencias inexistentes.",
                "Aplicar triangulación académica para validar contenidos.",
                "Diferenciar coherencia lingüística de veracidad factual.",
                "Desarrollar pensamiento crítico frente a resultados automatizados."
            ],
            marcoDetallado: (
                <div className="marco-narrativo">
                    <p>Los modelos de lenguaje funcionan mediante predicción estadística de palabras. Esto puede producir textos coherentes pero incorrectos, fenómeno conocido como alucinación algorítmica.</p>

                    <h4>1️⃣ Naturaleza Probabilística</h4>
                    <p>La IA no verifica hechos en tiempo real; genera respuestas basadas en patrones aprendidos durante el entrenamiento.</p>

                    <h4>2️⃣ Señales de Alucinación</h4>
                    <p>Citas inexistentes, referencias imposibles de rastrear, datos históricos contradictorios o exceso de confianza retórica son indicadores frecuentes.</p>

                    <h4>3️⃣ Triangulación como Método Profesional</h4>
                    <p>El estándar profesional implica contrastar información con currículo oficial, bases académicas verificadas y fuentes institucionales confiables.</p>
                </div>
            ),
            recursos: [
                { nombre: "Stanford HAI – AI Hallucinations Explained", url: "https://hai.stanford.edu/news/ai-trial-legal-models-hallucinate-1-out-6-or-more-benchmarking-queries" }
            ],
            videoEmbed: "https://player.cloudinary.com/embed/?cloud_name=deafueoco&public_id=YTDown.com_YouTube_AI-Hallucinations-Explained_Media_nLbaUhEAx5c_001_1080p_bdkpwe",
            enunciadoForo: "¿Puede un texto perfectamente redactado ser epistemológicamente falso? Analice un caso desde su disciplina.",
            enunciadoActividad: "TAREA: Solicite a una IA una biografía académica con cinco referencias. Verifique cuáles existen en bases reales y redacte un informe de auditoría (250 palabras).",
            faseCodigo: "ATLAS-AE"
        }
    };


    useEffect(() => { 
        const loadAll = async () => {
            // CAMBIO 3: Sincronización silenciosa en la carga inicial
            setIsSyncingGlobal(true);
            await fetchProgresoYRespuestas();
            setIsSyncingGlobal(false);
        };
        loadAll();
    }, [activeModulo]);

    const fetchProgresoYRespuestas = async () => {
        try {
            const [resProg, resResp] = await Promise.all([
                fetch(`${API_URL}?sheet=Progreso_Micromodulos&user_key=${userData.Teacher_Key}`),
                fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${userData.Teacher_Key}`)
            ]);
            const pData = await resProg.json();
            const rData = await resResp.json();

            setProgresoData(Array.isArray(pData) ? pData : []);
            setRespuestasUsuarios(Array.isArray(rData) ? rData : []);
            
            const actual = pData.find(m => m.Modulo_ID.toString() === activeModulo.toString());
            setForoAporte(actual?.Foro_Aporte || "");
            setActividadTexto(actual?.Actividad_Texto || "");
        } catch (e) { console.error("Error ATLAS:", e); }
    };

    const calcularNotaModulo = (moduloId) => {
        const idFormBuscado = FORM_IDS_MAP[moduloId];
        const respuestasDelModulo = respuestasUsuarios.filter(r =>
            r.Teacher_Key === userData.Teacher_Key && r.ID_Form === idFormBuscado
        );

        // 1. Cálculo del Examen (50%)
        const intentosMap = {};
        respuestasDelModulo.forEach(r => {
            const intentoKey = r.ID_Respuesta_Global;
            if (!intentosMap[intentoKey]) intentosMap[intentoKey] = 0;
            intentosMap[intentoKey] += (parseFloat(r.Puntos_Ganados) || 0);
        });

        const puntajesIntentos = Object.values(intentosMap);
        const ptsBrutosExamen = puntajesIntentos.length > 0 ? Math.max(...puntajesIntentos) : 0;
        const ptsExamenPonderado = (ptsBrutosExamen / 100) * 50;

        // 2. Cálculo de Foro y Actividad (25% cada uno)
        // BUSCAMOS EN LA DB:
        const actualDB = progresoData.find(m => m.Modulo_ID.toString() === moduloId.toString());

        // LÓGICA CORREGIDA: 
        // Si es el módulo activo, usamos lo que está escrito en el textarea (estado local).
        // Si es otro módulo, usamos lo que trajo la base de datos.
        let textForo, textAct;

        if (moduloId.toString() === activeModulo.toString()) {
            textForo = foroAporte;
            textAct = actividadTexto;
        } else {
            textForo = actualDB?.Foro_Aporte || "";
            textAct = actualDB?.Actividad_Texto || "";
        }

        // Si hay cualquier contenido (más de 10 caracteres para validez), otorgamos los 25 puntos
        const ptsForo = (textForo && textForo.trim().length >= 10) ? 25 : 0;
        const ptsActividad = (textAct && textAct.trim().length >= 10) ? 25 : 0;

        return Math.min(100, ptsExamenPonderado + ptsForo + ptsActividad);
    };

    const handleQuickSave = async (campo, valor, setLoader) => {
        // MEJORA: Validación de longitud
        if (!valor || valor.trim().length < 10) {
            return Swal.fire("Contenido Insuficiente", "Por favor, desarrolle su aporte con mayor detalle (mínimo 10 caracteres).", "warning");
        }
        
        setLoader(true);
        // CAMBIO 4: Sincronización silenciosa en el guardado
        setIsSyncingGlobal(true);
        const existe = progresoData.find(m => m.Modulo_ID.toString() === activeModulo.toString());
        const notaActualizada = calcularNotaModulo(activeModulo);

        const payload = {
            action: existe ? "update" : "create",
            sheet: "Progreso_Micromodulos",
            rowId: existe?.rowId || null,
            idField: "ID_Progreso_Micro",
            idValue: existe?.ID_Progreso_Micro || null,
            data: {
                ID_Progreso_Micro: existe?.ID_Progreso_Micro || `MIC-${Date.now()}`,
                Teacher_Key: userData.Teacher_Key,
                Modulo_ID: activeModulo,
                [campo]: valor,
                Nota_Quiz: notaActualizada,
                Status: notaActualizada >= 80 ? "COMPLETADO" : "EN_PROGRESO",
                Fecha_Finalizacion: new Date().toISOString()
            }
        };

        try {
            await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
            await fetchProgresoYRespuestas();
            Swal.fire({ 
                title: "Sincronizado con Éxito", 
                icon: "success", 
                timer: 1500, 
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (e) { 
            Swal.fire("Error", "Error al sincronizar datos.", "error"); 
        } finally { 
            setLoader(false); 
            setIsSyncingGlobal(false);
        }
    };

    const handleOpenQuiz = async () => {
        // MEJORA: Bloqueo de examen si no hay contenido previo
        if (foroAporte.trim().length < 10 || actividadTexto.trim().length < 10) {
            return Swal.fire({
                title: "Examen Bloqueado",
                text: "Debes completar primero el Foro y la Actividad con un aporte válido para realizar la evaluación.",
                icon: "lock",
                confirmButtonColor: "#b8860b"
            });
        }

        setIsSyncingQuiz(true);
        try {
            const idFormBuscado = FORM_IDS_MAP[activeModulo];
            const resForms = await fetch(`${API_URL}?sheet=Config_Formularios`);
            const forms = await resForms.json();
            const moduleForm = forms.find(f => f.ID_Form === idFormBuscado);

            if (moduleForm) {
                const resQ = await fetch(`${API_URL}?sheet=Config_Preguntas`);
                const allQ = await resQ.json();
                setPreguntas(allQ.filter(q => q.ID_Form === moduleForm.ID_Form));
                setSelectedForm(moduleForm);
                setShowQuizModal(true);
            } else {
                Swal.fire("Info", "No se encontró el formulario para este módulo.", "info");
            }
        } catch (e) { console.error(e); } finally { setIsSyncingQuiz(false); }
    };

    const handleSubmitQuiz = async (e) => {
        e.preventDefault();
        setIsSyncingQuiz(true);
        const batchTimestamp = new Date().toISOString();
        const globalID = `G-${Date.now()}`;

        // MEJORA: Generación del batch de respuestas
        const batchData = preguntas.map(q => {
            const rawValue = currentResponses[q.ID_Pregunta];
            let pts = 0;

            if (q.Tipo_Respuesta === "CHECKBOX" && Array.isArray(rawValue)) {
                pts = rawValue.reduce((acc, val) => {
                    const m = String(val).match(/\(([^)]+)\)$/);
                    return acc + (m ? parseFloat(m[1].replace(',', '.')) : 0);
                }, 0);
            } else if (["PARRAFO", "TEXTO"].includes(q.Tipo_Respuesta)) {
                pts = (rawValue && rawValue.trim().length > 10) ? 20 : 0; 
            } else {
                const match = String(rawValue).match(/\(([^)]+)\)$/);
                pts = match ? parseFloat(match[1].replace(',', '.')) : 0;
            }

            return {
                ID_Respuesta_Global: globalID,
                Teacher_Key: userData?.Teacher_Key,
                ID_Form: selectedForm.ID_Form,
                ID_Pregunta: q.ID_Pregunta,
                Valor_Respondido: Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue).replace(/\s*\([^)]+\)$/, "").trim(),
                Puntos_Ganados: pts,
                Fecha_Respuesta: batchTimestamp
            };
        });

        try {
            // MEJORA: ENVÍO EN BATCH (MÁS RÁPIDO)
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'create_batch', sheet: 'Respuestas_Usuarios', data: batchData })
            });

            await fetchProgresoYRespuestas();
            const notaFinal = calcularNotaModulo(activeModulo);
            const existe = progresoData.find(m => m.Modulo_ID.toString() === activeModulo.toString());
            
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: "update",
                    sheet: "Progreso_Micromodulos",
                    rowId: existe?.rowId,
                    idField: "ID_Progreso_Micro",
                    idValue: existe?.ID_Progreso_Micro,
                    data: { 
                        Nota_Quiz: notaFinal, 
                        Status: notaFinal >= 80 ? "COMPLETADO" : "EN_EVALUACION" 
                    }
                })
            });

            setShowQuizModal(false);

            // MEJORA: Felicitación final ATLAS
            if (activeModulo === 3 && notaFinal >= 80) {
                Swal.fire({
                    title: "¡ACADEMIA COMPLETADA!",
                    text: `Has finalizado con éxito todos los micro-módulos de ATLAS Framework. Puntaje final: ${notaFinal.toFixed(1)}/100.`,
                    icon: "success",
                    confirmButtonText: "Recibir Certificación",
                    confirmButtonColor: "#b8860b"
                });
            } else {
                Swal.fire("¡Evaluación Enviada!", `Puntaje total: ${notaFinal.toFixed(1)}/100`, "success");
            }

            await fetchProgresoYRespuestas();
        } catch (e) { Swal.fire("Error", "Error al procesar la evaluación.", "error"); } finally { setIsSyncingQuiz(false); }
    };

    const handleNavModulo = (n) => {
        if (n === 1) return setActiveModulo(1);
        const notaAnterior = calcularNotaModulo(n - 1);
        if (notaAnterior >= 80) {
            setActiveModulo(n);
        } else {
            Swal.fire("Módulo Bloqueado", `Para avanzar debes obtener al menos 80 puntos en el Módulo ${n-1}.`, "warning");
        }
    };

    if (loading) return <div className="loading-screen">Sincronizando Academia ATLAS...</div>;

    const mod = contenidos[activeModulo] || contenidos[1];
    const notaActual = calcularNotaModulo(activeModulo);
    const aprobado = notaActual >= 80;

    return (
        <div className="atlas-container-main micro-page-wrapper">
            {/* CÁPSULA FLOTANTE DE SINCRONIZACIÓN (CAMBIO 2) */}
            {isSyncingGlobal && (
                <div className="sync-capsule" style={{position:'fixed', top:'10px', right:'10px', backgroundColor:'var(--gold-atlas)', padding:'5px 15px', borderRadius:'20px', fontSize:'10px', fontWeight:'bold', zIndex:9999}}>
                    SINCRONIZANDO ATLAS...
                </div>
            )}

            <header className="atlas-header-static micro-nav-header-static">
                <button onClick={() => onNavigate('fase_auditar')} className="btn-back-atlas">← Volver a Auditoría</button>
                <div className="brand-center">
                    <span className="brand-tag">ACADEMIA DE AUDITORÍA</span>
                    <h1>ATLAS FRAMEWORK</h1>
                </div>
                <div className="user-badge-mini">
                    {userData.Nombre} | <span style={{ color: 'var(--gold-atlas)' }}>Nota: {notaActual.toFixed(1)} Pts</span>
                </div>
            </header>

            <div className="atlas-roadmap-wrapper micro-roadmap-top">
                {[1, 2, 3].map(n => {
                    const isDone = calcularNotaModulo(n) >= 80;
                    return (
                        <div key={n} className={`roadmap-node ${activeModulo === n ? 'active' : ''} ${isDone ? 'done' : ''}`} onClick={() => handleNavModulo(n)}>
                            <div className="node-circle">{isDone ? "✓" : n}</div>
                            <span className="node-label">Módulo {n}</span>
                        </div>
                    );
                })}
            </div>

            <main className="atlas-content-body micro-content-container">
                <section className="atlas-hero-section mod-hero">
                    <div className="hero-text">
                        <h2>{mod.titulo}</h2>
                        <p>{mod.intro}</p>
                        <div className="hero-goals">
                            {mod.objetivos.map((obj, i) => <span key={i} className="goal-tag">🎯 {obj}</span>)}
                        </div>
                    </div>
                </section>

                <div className="atlas-grid-layout main-grid-layout">
                    <div className="learning-column">
                        <article className="atlas-glass-card glass-card">
                            <h3>📚 Marco Conceptual y Teórico</h3>
                            {mod.marcoDetallado}
                        </article>

                        <article className="atlas-glass-card glass-card">
                            <h3>🎥 Auditoría Multimedia</h3>
                            <div className="video-main-container">
                                <iframe src={mod.videoEmbed} title="ATLAS Video" frameBorder="0" allowFullScreen></iframe>
                            </div>
                            <div className="links-deepen">
                                <h4>Profundizar en la materia (Drive):</h4>
                                <ul>{mod.recursos.map((r, i) => (<li key={i}><a href={r.url} target="_blank" rel="noreferrer">🔗 {r.nombre}</a></li>))}</ul>
                            </div>
                        </article>
                    </div>

                    <div className="action-column">
                        <div className="atlas-action-box action-card">
                            <div className="card-head">💬 Foro de Discusión</div>
                            <p className="enunciado">{mod.enunciadoForo}</p>
                            <textarea
                                value={foroAporte}
                                onChange={(e) => setForoAporte(e.target.value)}
                                disabled={aprobado}
                                placeholder="Escriba su aporte aquí (mínimo 10 caracteres)..."
                            />
                            {!aprobado && (
                                <button className="btn-save-mini" onClick={() => handleQuickSave("Foro_Aporte", foroAporte, setIsSavingForo)} disabled={isSavingForo}>
                                    {isSavingForo ? "Sincronizando..." : "Guardar Aporte Foro"}
                                </button>
                            )}
                        </div>

                        <div className="atlas-action-box action-card">
                            <div className="card-head">🛠 Actividad Aplicada</div>
                            <p className="enunciado">{mod.enunciadoActividad}</p>
                            <textarea
                                value={actividadTexto}
                                onChange={(e) => setActividadTexto(e.target.value)}
                                disabled={aprobado}
                                placeholder="Desarrolle su actividad aquí (mínimo 10 caracteres)..."
                            />
                            {!aprobado && (
                                <button className="btn-save-mini" onClick={() => handleQuickSave("Actividad_Texto", actividadTexto, setIsSavingActividad)} disabled={isSavingActividad}>
                                    {isSavingActividad ? "Sincronizando..." : "Guardar Actividad"}
                                </button>
                            )}
                        </div>

                        <div className="form-card-answerable-modern">
                            <div className="card-accent-blue" />
                            <span className="phase-badge">CERTIFICACIÓN ATLAS</span>
                            <h3>Examen Módulo {activeModulo}</h3>
                            <p>{aprobado ? "Has completado exitosamente esta evaluación técnica." : "Pon a prueba tus conocimientos. Requiere foro y actividad completos."}</p>

                            <div className="card-footer-layout">
                                <span className="pts-tag">50 Puntos</span>
                                {aprobado ? (
                                    <span className="badge-success-atlas">COMPLETADO ✓</span>
                                ) : (
                                    <button
                                        className="btn-respond-modern"
                                        onClick={handleOpenQuiz}
                                        disabled={isSyncingQuiz}
                                    >
                                        {isSyncingQuiz ? "Abriendo..." : "Responder Ahora"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {showQuizModal && (
                <div className="modal-overlay-atlas" onClick={() => setShowQuizModal(false)}>
                    <div className="modal-content-glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-atlas-header">
                            <div className="header-info">
                                <h2>{selectedForm?.Titulo_Form}</h2>
                                <span className="modal-subtitle">Certificación Técnica ATLAS</span>
                            </div>
                            <button className="close-btn-circle" onClick={() => setShowQuizModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmitQuiz} className="modal-atlas-body">
                            {preguntas.map((q, idx) => (
                                <div key={q.ID_Pregunta} className="question-card-minimal">
                                    <div className="q-number">{idx + 1}</div>
                                    <div className="q-content">
                                        <label className="q-text">{q.Texto_Pregunta}</label>
                                        {q.Tipo_Respuesta === "MULTIPLE" && (
                                            <div className="options-vertical">
                                                {q.Opciones_Seleccion.split(/(?<!\d),/).map(opt => (
                                                    <label key={opt} className="custom-radio-row">
                                                        <input
                                                            type="radio"
                                                            name={q.ID_Pregunta}
                                                            value={opt.trim()}
                                                            required
                                                            onChange={(e) => setCurrentResponses({ ...currentResponses, [q.ID_Pregunta]: e.target.value })}
                                                        />
                                                        <span className="radio-label-text">{opt.replace(/\s*\([^)]+\)$/, "").trim()}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {q.Tipo_Respuesta === "CHECKBOX" && (
                                            <div className="options-vertical">
                                                {q.Opciones_Seleccion.split(/(?<!\d),/).map(opt => (
                                                    <label key={opt} className="custom-radio-row">
                                                        <input
                                                            type="checkbox"
                                                            value={opt.trim()}
                                                            onChange={(e) => {
                                                                const prev = currentResponses[q.ID_Pregunta] || [];
                                                                const next = e.target.checked
                                                                    ? [...prev, e.target.value]
                                                                    : prev.filter(v => v !== e.target.value);
                                                                setCurrentResponses({ ...currentResponses, [q.ID_Pregunta]: next });
                                                            }}
                                                        />
                                                        <span className="radio-label-text">{opt.replace(/\s*\([^)]+\)$/, "").trim()}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {["PARRAFO", "TEXTO"].includes(q.Tipo_Respuesta) && (
                                            <textarea
                                                className="atlas-textarea"
                                                placeholder="Escriba su respuesta técnica aquí..."
                                                required
                                                onChange={(e) => setCurrentResponses({ ...currentResponses, [q.ID_Pregunta]: e.target.value })}
                                            />
                                        )}
                                        {q.Tipo_Respuesta === "ESCALA" && (
                                            <div className="scale-container-expert">
                                                <div className="scale-labels-top">
                                                    <span className="label-min">Bajo / Desacuerdo</span>
                                                    <span className="label-max">Alto / Acuerdo</span>
                                                </div>
                                                <div className="atlas-scale-row">
                                                    {[1, 2, 3, 4, 5].map(num => (
                                                        <label key={num} className="scale-item">
                                                            <input
                                                                type="radio"
                                                                name={q.ID_Pregunta}
                                                                value={`${num} (${num === 1 ? '1' : num === 5 ? '5' : '0'})`}
                                                                required
                                                                onChange={(e) => setCurrentResponses({ ...currentResponses, [q.ID_Pregunta]: e.target.value })}
                                                            />
                                                            <span className="scale-num">{num}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button type="submit" className="btn-respond-modern" style={{ width: '100%', marginTop: '30px' }} disabled={isSyncingQuiz}>
                                {isSyncingQuiz ? "Enviando Resultados..." : "Finalizar y Evaluar Módulo"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};