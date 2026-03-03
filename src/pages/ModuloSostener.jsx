import React, { useState, useEffect } from "react";
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostener.css"; 

const ModuloSostener = ({ userData, API_URL, onNavigate, datosExistentes }) => {
    const [view, setView] = useState("menu"); 
    const [respuestas, setRespuestas] = useState({});
    const [loading, setLoading] = useState(false);
    const [historial, setHistorial] = useState(datosExistentes || []);
    
    // Estados para la integración de Retos y Prompts
    const [retos, setRetos] = useState([]);
    const [promptData, setPromptData] = useState(null);
    const [viewModeModal, setViewModeModal] = useState('stats'); // 'stats' o 'survey'
    const [showModal, setShowModal] = useState(false);

    const [selectedFormReal, setSelectedFormReal] = useState(null);
    const [viewModeReal, setViewModeReal] = useState('stats'); // 'stats' o 'survey'

    const [showModalReal, setShowModalReal] = useState(false);

    
    const [balanceGlobal, setBalanceGlobal] = useState({
        antes: { nivel: "Cargando...", dimensionBaja: "...", puntaje: 0 },
        ahora: { nivel: "...", dimensionAlta: "...", puntaje: 0 },
        evidencias: { retos: 0, notasLiderar: null },
        crecimiento: 0
    });

    const dimensiones = [
        { id: "D1", nombre: "Uso Pedagógico Estratégico", preguntas: [
            { id: 1, text: "Utilizo IA con un propósito pedagógico claramente definido." },
            { id: 2, text: "La IA apoya objetivos de aprendizaje explícitos, no solo tareas administrativas." },
            { id: 3, text: "Reviso críticamente los resultados generados por la IA antes de usarlos." },
            { id: 4, text: "Ajusto el uso de IA según el perfil y necesidades de mis estudiantes." },
            { id: 5, text: "Integro la IA como complemento, no como reemplazo de mi criterio profesional." },
            { id: 6, text: "Evalúo si el uso de IA realmente mejora la experiencia de aprendizaje." }
        ]},
        { id: "D2", nombre: "Ética y Protección de Datos", preguntas: [
            { id: 7, text: "Verifico que las herramientas de IA respeten principios de privacidad." },
            { id: 8, text: "Evito compartir datos sensibles de estudiantes en plataformas externas." },
            { id: 9, text: "Informo a mis estudiantes cuando utilizo IA en procesos pedagógicos." },
            { id: 10, text: "Identifico posibles sesgos en los resultados generados por IA." },
            { id: 11, text: "Intervengo cuando detecto contenido potencialmente inadecuado." },
            { id: 12, text: "Conozco las políticas institucionales sobre uso de IA." }
        ]},
        { id: "D3", nombre: "Impacto en el Aprendizaje", preguntas: [
            { id: 13, text: "La IA me permite ofrecer retroalimentación más personalizada." },
            { id: 14, text: "He observado mejoras en autonomía estudiantil gracias al uso de IA." },
            { id: 15, text: "Uso IA para diferenciar actividades según niveles." },
            { id: 16, text: "La IA reduce carga operativa sin afectar calidad pedagógica." },
            { id: 17, text: "Evalúo periódicamente si el uso de IA está generando resultados positivos." },
            { id: 18, text: "Ajusto mi práctica cuando la IA no aporta valor real." }
        ]},
        { id: "D4", nombre: "Desarrollo Profesional", preguntas: [
            { id: 19, text: "Me actualizo sobre nuevas aplicaciones educativas de IA." },
            { id: 20, text: "Participo en conversaciones o comunidades sobre uso responsable de IA." },
            { id: 21, text: "Reflexiono sobre mi dependencia o equilibrio frente a la tecnología." },
            { id: 22, text: "Comparto buenas prácticas con otros docentes." },
            { id: 23, text: "Documento experiencias significativas de uso." },
            { id: 24, text: "Busco formación adicional cuando identifico vacíos en mi competencia." }
        ]}
    ];

    const getCompassData = (score) => {
        if (score >= 90) return {
            nivel: "Gobernanza madura",
            rango: "90–100",
            desc: `Tu integración de IA va más allá del aula.
            
Estás aplicando supervisión humana significativa, documentando decisiones, evaluando impacto y contribuyendo a lineamientos institucionales.

Tu práctica está alineada con principios internacionales de IA confiable, ética y gobernanza educativa. No solo usas IA con intención pedagógica. Participas en la construcción de una cultura institucional responsable.

El desafío en este nivel no es usar más IA, sino sostener calidad, coherencia y liderazgo. Puedes avanzar las demás fases y convertirte en un gran referente en el ecosistema ATLAS.`
        };

        if (score >= 75) return {
            nivel: "Integración estratégica",
            rango: "75–89",
            desc: `La IA está integrada de manera coherente y estratégica en tu práctica.
            
No solo la utilizas con intención curricular, sino que también incorporas criterios de uso responsable, supervisión humana explícita y evaluación ajustada. Existe conciencia institucional en tu práctica. Posiblemente ya influyes en otros colegas y contribuyes a conversaciones sobre lineamientos.

Tu resto ahora es avanzar hacia gobernanza:
• Documentar procesos.
• Escalar dilemas éticos cuando sea necesario.
• Contribuir activamente a la construcción de criterios institucionales.

Tu práctica es consistente y replicable.`
        };

        if (score >= 60) return {
            nivel: "Integración pedagógica",
            rango: "60–74",
            desc: `La IA ya forma parte de tu diseño pedagógico con intención clara.
            
Estás vinculando su uso con objetivos curriculares específicos y realizando ajustes en evaluación. Además, demuestras conciencia sobre riesgos éticos y aplicas supervisión humana en tus decisiones. Tu práctica refleja alineación con estándares internacionales de integración pedagógica responsable.

Sin embargo, aún puedes fortalecer:
• La documentación de tus decisiones.
• La articulación con lineamientos institucionales.
• La evaluación del impacto real del uso de IA en el aprendizaje.

Ya no estás experimentando. Estás integrando.`
        };

        if (score >= 40) return {
            nivel: "Uso incipiente",
            rango: "40–59",
            desc: `Ya estás utilizando IA en tu práctica, pero principalmente de forma instrumental u ocasional.
            
Tu uso muestra intención, aunque aún no es completamente sistemático en términos de evaluación, documentación o criterios éticos explícitos. Probablemente ya reconoces algunos riesgos y tienes nociones básicas de supervisión humana, pero todavía no hay una integración estructurada con lineamientos institucionales o impacto medible.

Tu siguiente paso es avanzar de la eficiencia a la coherencia pedagógica. Pregúntate:
• ¿Estoy ajustando mis criterios de evaluación cuando uso IA?
• ¿Estoy comunicando claramente límites y riesgos a mis estudiantes?
• ¿Estoy documentando mis decisiones?

Estás construyendo bases importantes.`
        };

        return {
            nivel: "Exploración",
            rango: "0–39",
            desc: `Hoy te encuentras en una etapa inicial de aproximación a la inteligencia artificial en educación.
            
Esto significa que el uso de IA en tu práctica es limitado o aún no está integrado de manera estructurada al currículo, la evaluación o los principios éticos. Puede que exista interés o curiosidad, pero todavía no se evidencia una integración pedagógica planificada ni una comprensión sólida de los riesgos y responsabilidades asociados.

Este resultado no es una debilidad.

Estás en el inicio del camino ATLAS.`
        };
    };

    // Asegúrate de tener este estado declarado arriba de tus funciones
    const [respuestasAuditarReal, setRespuestasAuditarReal] = useState([]);

    const generarDiagnostico = (puntaje) => {
        const p = parseFloat(puntaje);

        if (p >= 90) return {
            nivel: "Referente Institucional de Vanguardia",
            texto: `
Tu perfil refleja una integración madura, ética y estratégicamente documentada de la inteligencia artificial.

No solo utilizas IA con intención pedagógica clara, sino que ejerces supervisión humana explícita, evalúas impacto en aprendizaje y contribuyes activamente a la gobernanza institucional.

Tu práctica ya no es instrumental: es sistémica. Existe coherencia entre propósito curricular, protección de datos, evaluación crítica y desarrollo profesional continuo.

Este nivel indica que tu uso de IA es sostenible en el tiempo y puede convertirse en modelo replicable dentro de tu institución.
        `,
            implicacion: `
La institución puede apoyarse en tu experiencia para fortalecer lineamientos, acompañar a otros docentes y consolidar procesos de certificación o validación externa.
        `,
            accion: `
• Liderar comunidades de práctica.
• Documentar casos de impacto medible.
• Diseñar microformaciones internas.
• Participar en construcción de política institucional de IA.
        `
        };

        if (p >= 80) return {
            nivel: "Docente Estratégico Consolidado",
            texto: `
Tu integración de IA es sólida y coherente con objetivos de aprendizaje. 

Existe intención pedagógica clara, revisión crítica de resultados generados y conciencia ética en el manejo de datos y posibles sesgos.

Estás operando en un nivel donde la IA deja de ser herramienta aislada y se convierte en recurso estratégico dentro de tu diseño didáctico.
        `,
            implicacion: `
El siguiente paso no es usar más tecnología, sino medir con mayor precisión el impacto en autonomía, pensamiento crítico y diferenciación pedagógica.
        `,
            accion: `
• Implementar métricas comparativas antes/después.
• Profundizar en personalización avanzada.
• Sistematizar evidencias de mejora.
        `
        };

        if (p >= 60) return {
            nivel: "Integrador en Evolución",
            texto: `
Has superado la fase meramente instrumental. La IA ya forma parte de tu práctica con intención pedagógica identificable.

Sin embargo, aún existen oportunidades para fortalecer la dimensión ética, la documentación de impacto y la sistematicidad del proceso.

Tu integración es funcional, pero puede volverse más estratégica y medible.
        `,
            implicacion: `
El crecimiento en este nivel depende de consolidar supervisión humana explícita, fortalecer protección de datos y evaluar resultados de aprendizaje más allá de la eficiencia operativa.
        `,
            accion: `
• Diseñar secuencias didácticas donde la IA tenga rol definido y evaluable.
• Revisar políticas institucionales de protección de datos.
• Iniciar registro estructurado de experiencias.
        `
        };

        if (p >= 40) return {
            nivel: "Explorador Inicial",
            texto: `
Te encuentras en una fase de aproximación activa a la inteligencia artificial.

El uso actual muestra interés y apertura, pero aún predomina un enfoque funcional u ocasional. La integración no es completamente sistemática ni alineada con objetivos curriculares explícitos.

Existe riesgo de automatización sin evaluación profunda del impacto pedagógico.
        `,
            implicacion: `
El desafío en esta etapa no es incorporar más herramientas, sino comprender mejor cuándo, cómo y para qué usarlas dentro de un marco ético y estratégico.
        `,
            accion: `
• Formular objetivos de aprendizaje antes de usar IA.
• Practicar revisión crítica sistemática de resultados generados.
• Participar en formación específica sobre ética y sesgos.
        `
        };

        return {
            nivel: "Fase de Alfabetización Instrumental",
            texto: `
Actualmente el uso de IA en tu práctica es limitado o principalmente operativo.

No se evidencia aún una integración pedagógica estructurada ni una conciencia consolidada sobre riesgos de privacidad, sesgos o dependencia automatizada.

Este resultado no representa una debilidad, sino un punto de partida claro para iniciar un proceso formativo consciente.
        `,
            implicacion: `
El progreso dependerá de fortalecer comprensión conceptual antes de escalar el uso con estudiantes.
        `,
            accion: `
• Comprender principios básicos de protección de datos.
• Explorar casos de uso pedagógico con acompañamiento.
• Reflexionar sobre el rol insustituible del criterio docente.
        `
        };
    };

    useEffect(() => {
        if (datosExistentes) {
            setHistorial([datosExistentes]);
            const mapaRespuestas = {};
            for (let i = 1; i <= 24; i++) {
                const dimPrefix = i <= 6 ? "D1_P" : i <= 12 ? "D2_P" : i <= 18 ? "D3_P" : "D4_P";
                const valor = datosExistentes[`${dimPrefix}${i}`];
                if (valor) mapaRespuestas[i] = Number(valor);
            }
            setRespuestas(mapaRespuestas);
        }
    }, [datosExistentes]);

    useEffect(() => {
        const integrarFases = async () => {
            const tKey = userData?.Teacher_Key;
            if (!tKey) return;

            try {
                const [resAuditar, resRetos, resLiderar] = await Promise.all([
                    fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${tKey}`),
                    fetch(`${API_URL}?sheet=Retos_Transformar_ATLAS&Teacher_Key=${tKey}`),
                    fetch(`${API_URL}?sheet=Liderar_Prompts_Docentes&Teacher_Key=${tKey}`)
                ]);

                const dAuditar = await resAuditar.json();
                const dRetos = await resRetos.json();
                const dLiderar = await resLiderar.json();

                // 1. Auditoría Real (Filtro por ID de formulario específico)
                const idAuditarCorrecto = "FORM-1770684713222";
                const misDatosReales = Array.isArray(dAuditar) ? dAuditar.filter(r => r.ID_Form === idAuditarCorrecto) : [];
                setRespuestasAuditarReal(misDatosReales);

                // Variables para el balance global
                let scoreIniBase5 = 0;

                if (misDatosReales.length > 0) {
                    // Convertimos Puntos_Ganados a números (manejando comas si existen)
                    const puntajes = misDatosReales.map(r => {
                        const p = String(r.Puntos_Ganados || "0").replace(',', '.');
                        return parseFloat(p);
                    });

                    const n = puntajes.length;

                    // MEDIA REAL (0-5)
                    const mediaPuntos = puntajes.reduce((a, b) => a + b, 0) / n;
                    scoreIniBase5 = mediaPuntos;

                    // MODA REAL (El valor de puntos más frecuente)
                    const frecuencias = {};
                    puntajes.forEach(p => frecuencias[p] = (frecuencias[p] || 0) + 1);
                    const moda = Object.keys(frecuencias).reduce((a, b) => frecuencias[a] > frecuencias[b] ? a : b);

                    // DESVIACIÓN ESTÁNDAR REAL
                    const varianza = puntajes.reduce((acc, p) => acc + Math.pow(p - mediaPuntos, 2), 0) / n;
                    const desviacion = Math.sqrt(varianza);

                    // Guardamos para el Modal Real
                    setSelectedFormReal({
                        puntosMedia: mediaPuntos.toFixed(2),
                        puntosModa: parseFloat(moda).toFixed(2),
                        promedioEscala100: (mediaPuntos * 20).toFixed(1), // Para getCompassData
                        desviacion: desviacion.toFixed(2),
                        totalItems: n,
                        analisis: { nivel: "Evidencia de Auditoría", color: "#4c51bf" }
                    });
                }

                // 2. Procesamiento de Retos
                if (Array.isArray(dRetos)) {
                    const misRetosFiltrados = dRetos.filter(r => r.Teacher_Key === tKey);
                    setRetos(misRetosFiltrados);
                }

                // 3. Procesamiento de Liderar (Prompts)
                if (Array.isArray(dLiderar)) {
                    setPromptData(dLiderar.find(p => p.Status === 'completed') || dLiderar[0]);
                }

                // 4. Cálculo de Balance Global (Comparativa Antes vs Ahora)
                const ultimoSostener = historial[0];
                const scoreActualBase5 = ultimoSostener ? parseFloat(ultimoSostener.Promedio_Global) : scoreIniBase5;

                setBalanceGlobal({
                    antes: {
                        nivel: scoreIniBase5 >= 4 ? "Estratégico" : scoreIniBase5 >= 2.5 ? "Integrador" : "Exploratorio",
                        puntaje: (scoreIniBase5 * 20).toFixed(1)
                    },
                    ahora: {
                        nivel: ultimoSostener?.Nivel_Calculado || "En Proceso",
                        puntaje: (scoreActualBase5 * 20).toFixed(1)
                    },
                    evidencias: {
                        retos: Array.isArray(dRetos) ? dRetos.filter(r => r.Status_Reto === 'COMPLETADO').length : 0,
                        notasLiderar: dLiderar[0] || null
                    },
                    crecimiento: ((scoreActualBase5 * 20) - (scoreIniBase5 * 20)).toFixed(1)
                });

            } catch (e) {
                console.error("Error integrando balance:", e);
            }
        };
        integrarFases();
    }, [API_URL, userData, historial]);

    // --- LÓGICA HEURÍSTICA PROMPTING INDIVIDUAL ---
    const analizarPromptIndiv = (p) => {
        if (!p) return null;
        const etica = parseFloat(p.Puntaje_Etica || 0);
        const priv = parseFloat(p.Puntaje_Privacidad || 0);
        const agen = parseFloat(p.Puntaje_Agencia || 0);
        const cogn = parseFloat(p.Puntaje_Dependencia || 0);
        const promedio = (etica + priv + agen + cogn) / 4;
        let diagnostico = promedio >= 4 ? "Excelente equilibrio ético." : "Se sugiere mayor supervisión humana.";
        let color = promedio >= 4 ? "#22c55e" : "#f59e0b";
        return { etica, priv, agen, cogn, promedio, diagnostico, color };
    };
    const statsPrompt = analizarPromptIndiv(promptData);

    const calcularResultados = () => {
        const valores = Object.values(respuestas);
        if (valores.length < 24) return null;
        const sumaTotal = valores.reduce((a, b) => a + b, 0);
        const promedioGlobal = sumaTotal / 24;
        const promediosD = dimensiones.map(d => {
            const sumaD = d.preguntas.reduce((acc, p) => acc + (respuestas[p.id] || 0), 0);
            return { id: d.id, nombre: d.nombre, promedio: (sumaD / 6).toFixed(2) };
        });

        let nivel = "";
        if (promedioGlobal >= 4.3) nivel = "Nivel 4: Referente Institucional";
        else if (promedioGlobal >= 3.5) nivel = "Nivel 3: Docente Estratégico";
        else if (promedioGlobal >= 2.5) nivel = "Nivel 2: Integrador Inicial";
        else nivel = "Nivel 1: Uso Instrumental";

        const alertas = [];
        if (respuestas[3] <= 2 && respuestas[5] <= 2) alertas.push("Automatización sin supervisión");
        if (respuestas[7] <= 2 || respuestas[8] <= 2) alertas.push("Riesgo de protección de datos");
        if (parseFloat(promediosD[2].promedio) < 2.5) alertas.push("Bajo impacto pedagógico");

        return { promedioGlobal, promediosD, nivel, alertas };
    };

    const handleSave = async () => {
        const res = calcularResultados();
        if (!res) return Swal.fire("Incompleto", "Responde todas las preguntas.", "warning");
        
        setLoading(true);
        const tKey = userData?.Teacher_Key || "KEY-NOT-FOUND";
        
        // Si ya hay un historial, usamos ese ID para que la base de datos sepa que es una actualización
        const esUpdate = historial.length > 0;
        const idAUsar = esUpdate ? historial[0].ID_Sostener : `SOS-${tKey}-${Date.now()}`;

        const respuestasMapeadas = {};
        for (let i = 1; i <= 24; i++) {
            let dimPrefix = i <= 6 ? "D1_P" : i <= 12 ? "D2_P" : i <= 18 ? "D3_P" : "D4_P";
            respuestasMapeadas[`${dimPrefix}${i}`] = respuestas[i] || 0;
        }

        const excelData = {
            ID_Sostener: idAUsar, 
            Teacher_Key: tKey, 
            Fecha_Evaluacion: new Date().toLocaleDateString('es-ES'),
            Periodo: "2026-1", 
            Institucion_Key: userData?.Institucion_Key || "INST-GENERAL", 
            ...respuestasMapeadas,
            Promedio_Global: res.promedioGlobal.toFixed(2), 
            Nivel_Calculado: res.nivel,
            "Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4": `${res.promediosD[0].promedio}, ${res.promediosD[1].promedio}, ${res.promediosD[2].promedio}, ${res.promediosD[3].promedio}`,
            Alertas_Activas: res.alertas.join(" | ") || "Sin Alertas",
            Porcentaje_Crecimiento: `${balanceGlobal.crecimiento}%`, 
            Reflexion_Antes: "", Reflexion_Despues: "", Aprendizaje_Clave: "", 
            Prioridad_Sostener: "Media", Compromiso_Accion: "", Evidencia_Mejora: "", Fecha_Revision_Plan: ""
        };

        try {
            await fetch(API_URL, { 
                method: "POST", 
                headers: { "Content-Type": "text/plain;charset=utf-8" }, 
                body: JSON.stringify({ 
                    action: esUpdate ? "update" : "create", 
                    sheet: "SOSTENER_Docentes", 
                    idField: "ID_Sostener",
                    idValue: idAUsar,
                    data: excelData 
                }) 
            });
            
            setHistorial([excelData]); // Actualizamos el historial local
            setView("dashboard");
            Swal.fire("Éxito", "Evaluación sincronizada.", "success");
        } catch (e) { 
            Swal.fire("Error", "Error al guardar en la nube.", "error"); 
        } finally { 
            setLoading(false); 
        }
    };

    const toPct = (val) => ((val / 5) * 100).toFixed(1);
    const pD = historial[0]?.["Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4"]?.split(',').map(v => parseFloat(v)) || [0,0,0,0];

    return (
        <div className="sostener-page-wrapper">
            {view === "menu" && (
                <div className="sostener-menu animate-fade-in">
                    <div className="sostener-header">
                        <button className="btn-back-atlas" onClick={() => onNavigate('overview')}>⬅ Mapa ATLAS</button>
                        <h2>Misiones de Sostenibilidad</h2>
                    </div>
                    <div className="sostener-grid-menu">
                        <div className={`sos-card-main ${historial.length > 0 ? 'is-done' : ''}`}>
                            <div className="sos-icon">📊</div>
                            <h3>Radar de Autoevaluación</h3>
                            <p>Análisis de dimensiones pedagógicas y éticas 2026.</p>
                            <div className="sos-actions">
                                {historial.length > 0 ? (
                                    <>
                                        <button onClick={() => setView("dashboard")} className="btn-sos-primary">
                                            Ver Mi Análisis
                                        </button>
                                        <button onClick={() => setView("cuestionario")} className="btn-sos-secondary">
                                            Revisar Autoevaluación
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setView("cuestionario")} className="btn-sos-primary">
                                        Iniciar Autoevaluación
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className={`sos-card-main ${historial.length > 0 ? '' : 'is-locked'}`}>
                            <div className="sos-icon">🔄</div>
                            <h3>Cierre de Ciclo</h3>
                            <p>Compara tu evolución Antes vs Después.</p>
                            <button disabled={historial.length === 0} className="btn-sos-primary">Acceder</button>
                        </div>
                    </div>
                </div>
            )}

            {view === "cuestionario" && (
                <div className="sostener-cuestionario animate-fade-in">
                    <button className="btn-sos-back" onClick={() => setView("menu")}>⬅ Volver</button>
                    <div className="sos-form-container">
                        <h2>Autoevaluación Docente IA</h2>
                        {dimensiones.map(dim => (
                            <div key={dim.id} className="sos-dim-group">
                                <h3>{dim.nombre}</h3>
                                {dim.preguntas.map(p => (
                                    <div key={p.id} className="sos-q-item">
                                        <span>{p.text}</span>
                                        <div className="sos-likert">
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <button
                                                    key={v}
                                                    className={respuestas[p.id] === v ? 'active' : ''}
                                                    onClick={() => setRespuestas({ ...respuestas, [p.id]: v })}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <button className="btn-sos-submit" onClick={handleSave} disabled={loading}>
                            {loading ? "Sincronizando..." : "Finalizar Evaluación"}
                        </button>
                    </div>
                </div>
            )}

            {view === "dashboard" && historial.length > 0 && (
                <div className="sostener-dashboard animate-fade-in">
                    <button className="btn-sos-back" onClick={() => setView("menu")}>⬅ Menú Principal</button>
                    <div className="sos-dash-layout">
                        {/* PANEL 1: AUDITORÍA INDIVIDUAL */}
                        <div className="sos-dash-top">
                            <div className="sos-stat-card gold">
                                <span className="dash-lider-2026-panel-id">Panel 1</span>
                                <h4>Índice de Sostenibilidad</h4>
                                <div className="sos-big-val">
                                    {toPct(historial[0].Promedio_Global)}%
                                </div>

                                <button
                                    className="atl-an-btn-main"
                                    onClick={() => setShowModal(true)}
                                >
                                    Ver Análisis Maestro
                                </button>
                            </div>

                            <div className="sos-stat-card radar-cont">
                                <h4>Radar de Sostenibilidad</h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <RadarChart data={[
                                        { s: 'Uso', A: pD[0] },
                                        { s: 'Ética', A: pD[1] },
                                        { s: 'Impacto', A: pD[2] },
                                        { s: 'Desarrollo', A: pD[3] }
                                    ]}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="s" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Radar
                                            name="Nivel Actual"
                                            dataKey="A"
                                            stroke="var(--primary)"
                                            fill="var(--primary)"
                                            fillOpacity={0.5}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* PANEL 1.2: EVIDENCIA INSTITUCIONAL REAL (CARD BOTÓN) */}
                        <div className="sos-stat-card real-evidence" onClick={() => setShowModalReal(true)}>
                            <span className="dash-lider-2026-panel-id">Panel 2: Fase: AUDITAR</span>
                            <h4>Diagnóstico Pedagógico Institucional</h4>

                            <div className="atl-an-metrics-grid">
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-mini-box-val">
                                        {respuestasAuditarReal.length}
                                    </span>
                                    <span className="atl-an-mini-box-lbl">Preguntas</span>
                                </div>
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-mini-box-val">
                                        {selectedFormReal?.puntosMedia || "0.00"}
                                    </span>
                                    <span className="atl-an-mini-box-lbl">
                                        Puntos Media ({selectedFormReal?.promedioEscala100 || 0}%)
                                    </span>
                                </div>
                            </div>

                            <button className="atl-an-btn-main-alt">
                                Ver Diagnóstico
                            </button>
                        </div>

                        {/* MODAL ESPECÍFICO PARA AUDITORÍA REAL */}
                        {showModalReal && (
                            <div className="atl-an-overlay">
                                <div className="audit-modal-container animate-fade-in">
                                    <div className="audit-modal-head">
                                        <div className="audit-modal-header-top">
                                            <div>
                                                <h3>Reporte ATLAS: Diagnóstico de Auditoría</h3>
                                                <p className="audit-modal-sub">Basado en {selectedFormReal?.totalItems} evidencias reales</p>
                                            </div>
                                            <button className="audit-modal-close" onClick={() => setShowModalReal(false)}>✕</button>
                                        </div>
                                        <div className="audit-modal-tabs">
                                            <button className={viewModeReal === 'stats' ? 'active' : ''} onClick={() => setViewModeReal('stats')}>📊 Estadísticas</button>
                                            <button className={viewModeReal === 'survey' ? 'active' : ''} onClick={() => setViewModeReal('survey')}>📝 Puntos por Ítem</button>
                                            <button className={`compass-tab-unique ${viewModeReal === 'compass' ? 'active' : ''}`} onClick={() => setViewModeReal('compass')}>🧭 Análisis Compass</button>
                                        </div>
                                    </div>

                                    <div className="audit-modal-body">
                                        {viewModeReal === 'stats' && (
                                            <div className="audit-stats-view">
                                                <div className="audit-metrics-grid">
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val blue">{selectedFormReal?.puntosMedia}</span>
                                                        <span className="audit-lbl">MEDIA (0-5)</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val green">{selectedFormReal?.puntosModa}</span>
                                                        <span className="audit-lbl">MODA (PUNTOS)</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val orange">{selectedFormReal?.desviacion}</span>
                                                        <span className="audit-lbl">DESVIACIÓN (Σ)</span>
                                                    </div>
                                                </div>
                                                <div className="audit-insight-card">
                                                    <h4>Interpretación de Consistencia</h4>
                                                    <p>
                                                        Una desviación de <strong>{selectedFormReal?.desviacion}</strong> indica que su práctica docente con IA
                                                        {parseFloat(selectedFormReal?.desviacion) < 1.0 ? " es altamente consistente entre los diferentes indicadores." : " presenta variaciones notables dependiendo del área evaluada."}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {viewModeReal === 'survey' && (
                                            <div className="audit-survey-scroll">
                                                {respuestasAuditarReal.map((q, idx) => {
                                                    const puntos = parseFloat(String(q.Puntos_Ganados || "0").replace(',', '.'));
                                                    return (
                                                        <div key={idx} className="audit-item-row">
                                                            <div className="audit-item-info">
                                                                <span className="audit-item-text">{q.Valor_Respondido || `Indicador ${idx + 1}`}</span>
                                                                <span className="audit-item-score">{puntos.toFixed(1)} / 5</span>
                                                            </div>
                                                            <div className="audit-progress-bg">
                                                                <div className="audit-progress-fill" style={{
                                                                    width: `${(puntos / 5) * 100}%`,
                                                                    backgroundColor: puntos >= 4 ? '#48bb78' : puntos >= 2.5 ? '#ecc94b' : '#f56565'
                                                                }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {viewModeReal === 'compass' && (
                                            <div className="audit-compass-view animate-slide-up">
                                                <div className="audit-compass-badge">
                                                    {getCompassData(selectedFormReal?.porcentajeGlobal).nivel}
                                                </div>
                                                <div className="audit-compass-box">
                                                    <h4>Diagnóstico Compass (Auditoría)</h4>
                                                    <p>{getCompassData(selectedFormReal?.porcentajeGlobal).desc}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="audit-modal-footer">
                                        <button className="audit-btn-close-full" onClick={() => setShowModalReal(false)}>
                                            Cerrar Diagnóstico
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PANEL 2: DICTAMEN DE AUDITORÍA ÉTICA (LIDERAZGO) */}
                        <div className={`sos-history-chart audit-ethic-border`} style={{ borderLeftColor: statsPrompt?.color }}>
                            <span className="dash-lider-2026-panel-id">Panel 3: Fase Liderar</span>
                            <h4>Dictamen de Liderazgo Pedagógico e IA</h4>

                            {promptData ? (
                                <div className="sos-audit-content">
                                    <div className="sos-audit-head-row">
                                        <div>
                                            <h5 className="sos-audit-title" style={{ color: statsPrompt?.color }}>
                                                {promptData.Clasificacion_Riesgo?.split('|')[0] || "Análisis en curso"}
                                            </h5>
                                            <small>Auditoría bajo Marco UNESCO 2024 & AI Act</small>
                                        </div>
                                    </div>

                                    <div className="sos-mini-grid-bars">
                                        {[
                                            { l: 'Ética', v: promptData.Puntaje_Etica, c: '#8b5cf6' },
                                            { l: 'Privacidad', v: promptData.Puntaje_Privacidad, c: '#06b6d4' },
                                            { l: 'Agencia', v: promptData.Puntaje_Agencia, c: '#f59e0b' },
                                            { l: 'Cognición', v: promptData.Puntaje_Dependencia, c: '#ec4899' }
                                        ].map(d => (
                                            <div key={d.l} className="sos-mini-bar-item">
                                                <div className="sos-mini-bar-labels">
                                                    <span>{d.l}</span>
                                                    <strong>{d.v}/5</strong>
                                                </div>
                                                <div className="sos-mini-bar-bg">
                                                    <div className="sos-mini-bar-fill" style={{ width: `${(d.v / 5) * 100}%`, backgroundColor: d.c }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="sos-dictamen-box">
                                        <strong className="sos-dictamen-tag">🔍 Hallazgos de la Auditoría:</strong>
                                        <p className="sos-prompt-preview">
                                            "{promptData.Prompt_Original?.substring(0, 800)}"
                                        </p>
                                        <p className="sos-dictamen-text">
                                            {promptData.Puntaje_Agencia <= 2
                                                ? "⚠️ Alerta crítica: Se detecta una delegación excesiva del juicio docente. La IA está asumiendo roles evaluativos sin supervisión suficiente."
                                                : "✅ Se mantiene una agencia humana adecuada en el diseño de la interacción."}
                                            <br /><br />
                                            En términos de <strong>Privacidad</strong>, el nivel {promptData.Puntaje_Privacidad} indica que
                                            {promptData.Puntaje_Privacidad >= 4 ? " aplicas protocolos seguros de minimización de datos." : " existen riesgos de exposición de datos sensibles."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="sos-empty-state">
                                    <p>No se han encontrado registros de auditoría ética. <br /> Completa la Fase Liderar para activar este panel.</p>
                                </div>
                            )}
                        </div>

                        {/* PANEL 3: RETOS (TRANSFORMACIÓN) */}
                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 4</span>
                            <h4>Misiones de Transformación</h4>
                            <div className="retos-summary-grid">
                                {retos.length > 0 ? retos.map((r, i) => (
                                    <div key={i} className="reto-mini-card">
                                        <h5>{r.Nombre_Reto}</h5>
                                        <span className={`status-pill ${r.Status_Reto}`}>{r.Status_Reto}</span>
                                        <small>{r.Nivel_UNESCO}</small>
                                    </div>
                                )) : <p>No hay retos registrados.</p>}
                            </div>
                        </div>

                        {/* EVOLUCIÓN */}
                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 5</span>
                            <h4>Evolución Histórica ATLAS</h4>
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={[...historial].reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="Fecha_Evaluacion" />
                                    <YAxis domain={[0, 5]} hide />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="Promedio_Global" stroke="#c5a059" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE DIAGNÓSTICO INDIVIDUAL */}
            {showModal && (
                <div className="atl-an-overlay">
                    <div className="atl-an-modal wide animate-fade-in">
                        <div className="atl-an-modal-head">
                            <div className="atl-an-modal-head-flex">
                                <div>
                                    <h3>Reporte Individual: {userData.Nombre}</h3>
                                    <p className="atl-an-modal-sub">Marco COMPASS - Ciclo Sostener 2026</p>
                                </div>
                                <button className="atl-an-close" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <div className="modal-tabs-margin">
                                <button className={viewModeModal === 'stats' ? 'active' : ''} onClick={() => setViewModeModal('stats')}>Análisis</button>
                                <button className={viewModeModal === 'survey' ? 'active' : ''} onClick={() => setViewModeModal('survey')}>Dimensiones</button>
                            </div>
                        </div>
                        <div className="atl-an-modal-body">
                            {viewModeModal === 'stats' ? (
                                <div className="stats-view">
                                    <div className="atl-an-metrics-grid">
                                        <div className="atl-an-mini-box-dark">
                                            <span className="atl-an-val-primary">{toPct(historial[0].Promedio_Global)}%</span>
                                            <span className="atl-an-lbl">MEDIA GLOBAL</span>
                                        </div>
                                        <div className="atl-an-mini-box-dark">
                                            <span className="atl-an-val-small">{generarDiagnostico(toPct(historial[0].Promedio_Global)).nivel}</span>
                                            <span className="atl-an-lbl">NIVEL ACTUAL</span>
                                        </div>
                                    </div>

                                    <div className="atl-an-insight-card-individual">
                                        <h4 className="insight-title">💡 Diagnóstico Pedagógico</h4>
                                        <p className="insight-text">
                                            {generarDiagnostico(toPct(historial[0].Promedio_Global)).texto}
                                        </p>

                                        <h4 className="insight-sub-title">🔍 Implicación</h4>
                                        <p className="insight-sub-text">
                                            {generarDiagnostico(toPct(historial[0].Promedio_Global)).implicacion}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="survey-view">
                                    {dimensiones.map((d, i) => (
                                        <div key={d.id} className="atl-an-bar-container-margin">
                                            <div className="atl-an-bar-label-row-bold">
                                                <span>{d.nombre}</span>
                                                <span>{toPct(pD[i])}%</span>
                                            </div>
                                            <div className="atl-an-bar-bg-light">
                                                <div className="atl-an-bar-fill-primary" style={{ width: `${toPct(pD[i])}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="atl-an-btn-full" onClick={() => setShowModal(false)}>Cerrar Reporte de Sostenibilidad</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuloSostener;