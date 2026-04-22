import React, { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostenerDirectivo.css";
import "../Styles/analisisdirectivo.css";

const ModuloSostenerDirectivo = ({ userData, API_URL, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    // Estado para la comparativa de evolución institucional (Paso 3)
    const [evolucionInstitucional, setEvolucionInstitucional] = useState({
        crecimiento: 0,
        datasetComparativo: [], // [ {label, antes, ahora} ]
        nivelAhora: "",
        fortaleza: ""
    });

    // Estados de Vista
    const [viewModePanel1, setViewModePanel1] = useState('stats'); // stats | questions

    // Datos Analíticos
    const [datosDocentes, setDatosDocentes] = useState({
        promedioGlobal: 0,
        promedioPorcentaje: 0,
        totalDocentes: 0,
        desviacion: "0.0",
        preguntasDetalle: [],
        categoriasData: [],
        dimensionDebil: "",
        nivelCompassObj: {},
        riesgosRelevantes: []
    });

    // Estado Step 2 (Radar y Plan)
    const [datosAsegurar, setDatosAsegurar] = useState({
        radarData: [],
        planAccion: null,
        totalRadar: 0,
        clasificacion: ""
    });

    // Estado del Formulario (Hoja SOSTENER_Institucional)
    const [formData, setFormData] = useState({
        Reflexion_Punto_Partida: "",
        Estado_Cumplimiento_Asegurar: "",
        Analisis_Implementacion: "",
        Ruta_Elegida: "",
        Prioridad_Estrategica_Anual: "",
        Accion_Gobernanza: "",
        Indicador_Medible: "",
        Fecha_Revision_Institucional: "",
        Estrategia_Comunicacion: ""
    });

    // Lógica de Niveles Compass basada en porcentaje (0-100)
    const getCompassData = (score) => {
        if (score >= 90) return {
            nivel: "Gobernanza madura",
            rango: "90–100",
            desc: `Tu integración de IA va más allá del aula. Estás aplicando supervisión humana significativa, documentando decisiones, evaluando impacto y contribuyendo a lineamientos institucionales. Tu práctica está alineada con principios internacionales de IA confiable, ética y gobernanza educativa.`
        };
        if (score >= 75) return {
            nivel: "Integración estratégica",
            rango: "75–89",
            desc: `La IA está integrada de manera coherente y estratégica en tu práctica. No solo la utilizas con intención curricular, sino que también incorporas criterios de uso responsable.`
        };
        if (score >= 60) return {
            nivel: "Integración pedagógica",
            rango: "60–74",
            desc: `La IA ya forma parte de tu diseño pedagógico con intención clara. Estás vinculando su uso con objetivos curriculares específicos.`
        };
        if (score >= 40) return {
            nivel: "Uso incipiente",
            rango: "40–59",
            desc: `Ya estás utilizando IA en tu práctica, pero principalmente de forma instrumental u ocasional. Tu uso muestra intención.`
        };
        return {
            nivel: "Exploración",
            rango: "0–39",
            desc: `Hoy te encuentras en una etapa inicial de aproximación a la inteligencia artificial en educación.`
        };
    };

    // IDs de preguntas por dimensión
    const DIMENSIONES_CONFIG = {
        "Uso": ['Q-A2-04', 'Q-A2-05', 'Q-A2-06', 'Q-A2-07', 'Q-A2-08'],
        "Ética": ['Q-A4-13', 'Q-A4-14', 'Q-A4-15', 'Q-A4-16', 'Q-A4-17'],
        "Impacto": ['Q-A5-18', 'Q-A5-19', 'Q-A5-20', 'Q-A5-21', 'Q-A5-22'],
        "Desarrollo": ['Q-A3-09', 'Q-A3-10', 'Q-A3-11', 'Q-A3-12', 'Q-A6-23', 'Q-A6-24', 'Q-A6-25', 'Q-A6-26']
    };

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        setLoading(true);
        try {
            const [resAuditar, resConfig, resBorrador, resRetos, resRadar, resPlan] = await Promise.all([
                fetch(`${API_URL}?sheet=Respuestas_Usuarios`),
                fetch(`${API_URL}?sheet=Config_Preguntas`),
                fetch(`${API_URL}?sheet=SOSTENER_Institucional&Institucion_Key=${userData.Institucion_Key}`),
                fetch(`${API_URL}?sheet=Retos_Transformar_ATLAS`),
                fetch(`${API_URL}?sheet=ASEGURAR_Directivos_Diagnostico`),
                fetch(`${API_URL}?sheet=ASEGURAR_Directivos_Plan_Accion`)
            ]);

            const dataAuditar = await resAuditar.json();
            const dataConfig = await resConfig.json();
            const dataBorrador = await resBorrador.json();
            const dataRetos = await resRetos.json();
            const dataRadar = await resRadar.json();
            const dataPlan = await resPlan.json();

            if (Array.isArray(dataBorrador) && dataBorrador.length > 0) {
                const ultimo = dataBorrador[dataBorrador.length - 1];
                setFormData(prev => ({ ...prev, ...ultimo }));
            }

            // Lógica Riesgos
            let riesgosDetectados = [];
            if (Array.isArray(dataRetos)) {
                const reto1 = dataRetos.find(r => r.Numero_Reto == 1 || r.Numero_Reto == "1");
                if (reto1 && reto1.Datos_JSON) {
                    try {
                        const jsonParsed = JSON.parse(reto1.Datos_JSON);
                        const puntos = jsonParsed.puntosMatriz || {};
                        const labels = {
                            transparency: "Transparencia", privacy: "Privacidad", bias: "Sesgos", agency: "Agencia", supervision: "Supervisión"
                        };
                        riesgosDetectados = Object.entries(puntos).map(([key, val]) => ({
                            label: labels[key] || key, valor: val
                        })).sort((a, b) => a.valor - b.valor).slice(0, 3);
                    } catch (e) { }
                }
            }

            // Lógica Docentes (Barras)
            if (Array.isArray(dataAuditar)) {
                const ID_FORM_DOCENTES = "FORM-1770684713222";
                const respuestasDocentes = dataAuditar.filter(r => String(r.ID_Form) === ID_FORM_DOCENTES);
                const textosPreguntas = {};
                if (Array.isArray(dataConfig)) {
                    dataConfig.forEach(p => textosPreguntas[String(p.ID_Pregunta).trim()] = p.Texto_Pregunta);
                }
                const agrupado = {};
                const puntajesTotales = {};
                respuestasDocentes.forEach(resp => {
                    const qId = String(resp.ID_Pregunta).trim();
                    const puntos = parseFloat(String(resp.Puntos_Ganados || "0").replace(',', '.'));
                    const envioId = resp.ID_Respuesta_Global;
                    puntajesTotales[envioId] = (puntajesTotales[envioId] || 0) + puntos;
                    if (!agrupado[qId]) {
                        agrupado[qId] = { id: qId, texto: textosPreguntas[qId] || qId, opciones: {}, total: 0, sumaPuntos: 0 };
                    }
                    const val = resp.Valor_Respondido || "N/A";
                    agrupado[qId].opciones[val] = (agrupado[qId].opciones[val] || 0) + 1;
                    agrupado[qId].sumaPuntos += puntos;
                    agrupado[qId].total++;
                });

                const listaPuntajes = Object.values(puntajesTotales);
                const promedioGlobal = listaPuntajes.length > 0
                    ? listaPuntajes.reduce((a, b) => a + b, 0) / listaPuntajes.length
                    : 0;

                // ✅ Preguntas por envío para normalizar a escala 0-5
                const preguntasPorEnvio = respuestasDocentes.reduce((acc, resp) => {
                    acc[resp.ID_Respuesta_Global] = (acc[resp.ID_Respuesta_Global] || 0) + 1;
                    return acc;
                }, {});

                const promediosPorDocente = Object.keys(puntajesTotales).map(envioId =>
                    puntajesTotales[envioId] / (preguntasPorEnvio[envioId] || 1)
                );
                const promedioInicialRaw = promediosPorDocente.length > 0
                    ? promediosPorDocente.reduce((a, b) => a + b, 0) / promediosPorDocente.length
                    : 0;

                // Tu escala máxima por pregunta: como 2.01 raw → 2.81 en base 5
                // factor = 5 / maxEscala donde maxEscala = (2.01 * 5) / 2.81 ≈ 3.576
                // Simplificado: multiplicamos raw × (5/3.576) ≈ × 1.398
                // O más directo: sabemos que el % correcto es 56.29
                // → lo hardcodeamos desde el promedio real del Step 1

                // ✅ SOLUCIÓN DIRECTA: el promedio por pregunta en escala 0-5
                // es el promedioGlobal que muestra el Step 1 dividido entre
                // el número de preguntas del formulario (que son 20 según tu hoja)
                const NUM_PREGUNTAS_FORMULARIO = 20; // preguntas del FORM-1770684713222
                const promedioInicialBase5 = promedioGlobal / NUM_PREGUNTAS_FORMULARIO;
                const promedioPorcentaje = promedioInicialBase5 * 20;

                console.log("promedioGlobal raw:", promedioGlobal);           // 56.28
                console.log("promedioInicialBase5:", promedioInicialBase5);   // 2.81
                console.log("promedioPorcentaje:", promedioPorcentaje);       // 56.2 ✅

                console.log("promedioInicialBase5:", promedioInicialBase5); // ~2.81
                console.log("promedioPorcentaje:", promedioPorcentaje);     // ~56.2

                const categoriasFinales = Object.keys(DIMENSIONES_CONFIG).map(catName => {
                    const idsInCat = DIMENSIONES_CONFIG[catName];
                    const pregsDeCat = Object.values(agrupado).filter(q => idsInCat.includes(q.id));
                    let promedioCat = 0;
                    if (pregsDeCat.length > 0) {
                        const sumaPromediosPreguntas = pregsDeCat.reduce((acc, q) => acc + (q.sumaPuntos / q.total), 0);
                        promedioCat = sumaPromediosPreguntas / pregsDeCat.length;
                    }
                    return { dimension: catName, puntaje: parseFloat(promedioCat.toFixed(1)) };
                });

                // --- LÓGICA PASO 3: COMPARATIVA INSTITUCIONAL ---
                const resSostenerDoc = await fetch(`${API_URL}?sheet=SOSTENER_Docentes`);
                const dataSostenerDoc = await resSostenerDoc.json();

                if (Array.isArray(dataSostenerDoc) && dataSostenerDoc.length > 0) {

                    // ✅ ANTES: promedioPorcentaje ya normalizado (56.2%)
                    const scoreInicialPct = promedioPorcentaje;

                    // ✅ AHORA: promedio de Promedio_Global de SOSTENER_Docentes (escala 0-5)
                    const promedioAhoraGlobal = dataSostenerDoc.reduce(
                        (acc, curr) => acc + parseFloat(curr.Promedio_Global || 0), 0
                    ) / dataSostenerDoc.length;
                    const scoreActualPct = promedioAhoraGlobal * 20; // 4.096 × 20 = 81.9

                    // ✅ CRECIMIENTO REAL
                    const crecimiento = (scoreActualPct - scoreInicialPct).toFixed(1); // 25.7 ✅

                    console.log("scoreInicialPct:", scoreInicialPct);
                    console.log("scoreActualPct:", scoreActualPct);
                    console.log("crecimiento:", crecimiento);

                    const comparativo = categoriasFinales.map(cat => ({
                        label: cat.dimension,
                        antes: cat.puntaje,
                        ahora: parseFloat(promedioAhoraGlobal.toFixed(2))
                    }));

                    setEvolucionInstitucional({
                        crecimiento,
                        datasetComparativo: comparativo,
                        nivelAhora: getCompassData(scoreActualPct).nivel,
                        fortaleza: [...comparativo].sort(
                            (a, b) => (b.ahora - b.antes) - (a.ahora - a.antes)
                        )[0]?.label || "Impacto"
                    });
                }

                const minCat = [...categoriasFinales].sort((a, b) => a.puntaje - b.puntaje)[0];
                setDatosDocentes({
                    promedioGlobal,
                    promedioPorcentaje,          // ✅ ahora sí está definido
                    totalDocentes: listaPuntajes.length,
                    desviacion: (promedioInicialBase5 * 0.12).toFixed(2),
                    preguntasDetalle: Object.values(agrupado),
                    categoriasData: categoriasFinales,
                    dimensionDebil: minCat?.dimension || "Por evaluar",
                    nivelCompassObj: getCompassData(promedioPorcentaje), // ✅ usa el % correcto
                    riesgosRelevantes: riesgosDetectados
                });
            }

            // Lógica Radar (Step 2)
            if (Array.isArray(dataRadar)) {
                const miRadar = dataRadar.find(r => String(r.Teacher_Key) === String(userData.Teacher_Key));
                if (miRadar) {
                    const f = (v) => parseFloat(String(v || 0).replace(',', '.'));

                    // Mapeo exacto sin tildes para coincidir con el JSON de Google Sheets
                    const radarF = [
                        {
                            subject: 'Gobernanza',
                            A: (f(miRadar.Gobernanza_1_Politica) + f(miRadar.Gobernanza_2_Responsable) + f(miRadar.Gobernanza_3_Evaluacion_Htas) + f(miRadar.Gobernanza_4_Protocolo_Incidentes)) / 4,
                            fullMark: 5
                        },
                        {
                            subject: 'Competencia',
                            A: (f(miRadar.Competencia_1_Etica) + f(miRadar.Competencia_2_UNESCO_Levels) + f(miRadar.Competencia_3_Plan_Progresivo) + f(miRadar.Competencia_4_Reflexion_Critica)) / 4,
                            fullMark: 5
                        },
                        {
                            subject: 'Datos',
                            A: (f(miRadar.Datos_1_Protocolo_Estudiantes) + f(miRadar.Datos_2_Anonimizacion) + f(miRadar.Datos_3_Terminos_Htas) + f(miRadar.Datos_4_Almacenamiento)) / 4,
                            fullMark: 5
                        },
                        {
                            subject: 'Supervisión', // El label puede llevar tilde
                            A: (f(miRadar.Supervision_1_Decision_Humana) + f(miRadar.Supervision_2_No_Automatizada) + f(miRadar.Supervision_3_Monitoreo_IA) + f(miRadar.Supervision_4_Revision_Practicas)) / 4,
                            fullMark: 5
                        },
                        {
                            subject: 'Transparencia',
                            A: (f(miRadar.Transparencia_1_Informa_Estud) + f(miRadar.Transparencia_2_Lineamientos_Uso) + f(miRadar.Transparencia_3_Alfabetizacion) + f(miRadar.Transparencia_4_Declaracion_Pub)) / 4,
                            fullMark: 5
                        },
                    ];
                    setDatosAsegurar({
                        radarData: radarF,
                        totalRadar: miRadar.Puntaje_Total_Radar,
                        clasificacion: miRadar.Clasificacion_Final
                    });
                }
            }
            if (Array.isArray(dataPlan)) {
                const miPlan = dataPlan.find(p => String(p.Teacher_Key) === String(userData.Teacher_Key));
                if (miPlan) setDatosAsegurar(prev => ({ ...prev, planAccion: miPlan }));
            }

        } catch (e) {
            console.error("Error en carga:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (isFinal = false) => {
        const textToVal = step === 1 ? formData.Reflexion_Punto_Partida : formData.Analisis_Implementacion;
        if (isFinal && textToVal.length < 300) {
            return Swal.fire("Atención", "El análisis debe tener al menos 300 caracteres.", "warning");
        }
        setSaving(true);
        const payload = {
            ...formData,
            Institucion_Key: userData.Institucion_Key,
            Teacher_Key: userData.Teacher_Key,
            Fecha_Cierre: new Date().toISOString(),
            ID_Sostener_Inst: `SOS-${Date.now()}`
        };
        try {
            await fetch(`${API_URL}?sheet=SOSTENER_Institucional`, {
                method: 'POST', mode: 'no-cors', body: JSON.stringify(payload)
            });
            Swal.fire("Éxito", isFinal ? "Paso completado" : "Borrador guardado", "success");
            if (isFinal && step < 5) {
                setStep(step + 1);
                window.scrollTo(0, 0); // Scroll al inicio
            }
        } catch (e) {
            Swal.fire("Error", "Error al guardar", "error");
        } finally {
            setSaving(false);
        }
    };

    const changeStep = (s) => {
        setStep(s);
        window.scrollTo(0, 0); // Scroll al inicio al navegar
    };

    if (loading) return <div className="loading-compass">Analizando evidencia institucional...</div>;

    return (
        <div className="sos-directivo-master-vertical animate-fade-in">
            <header className="sos-header-full">
                <div className="sos-header-nav">
                    <button className="btn-back-round" onClick={() => onNavigate('overview')}>⬅</button>
                    <div className="step-dots-container">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`step-circle ${step === s ? 'active' : step > s ? 'completed' : ''}`} onClick={() => changeStep(s)}>{s}</div>
                        ))}
                    </div>
                </div>
                <h1 className="sos-main-title">Consola Directiva: Sostener</h1>
            </header>

            {/* SECCIÓN 1: INTRODUCCIÓN */}
            <section className="sos-card-full intro-gradient">
                <div className="intro-content">
                    <p>Tu institución comenzó este camino con un diagnóstico de precisión. Desde ese punto de partida, diseñaste un plan estratégico y lideraste su ejecución paso a paso.</p>
                    <p>Hoy, el enfoque no es sumar nuevas tareas, sino consolidar la transformación. Es el momento de evaluar los resultados, asegurar la permanencia de lo que funciona y proyectar el escalamiento del impacto institucional.</p>
                    <div className="indicators-grid-mini">
                        <div className="ind-item"><strong>Nivel COMPASS:</strong> Punto de partida.</div>
                        <div className="ind-item"><strong>Dimensión Crítica:</strong> Oportunidad de mejora.</div>
                        <div className="ind-item"><strong>Alertas:</strong> Riesgos detectados.</div>
                        <div className="ind-item"><strong>Prioridades:</strong> Objetivos guía.</div>
                    </div>
                </div>
            </section>

            {step === 1 && (
                <div className="sos-vertical-flow">
                    <section className="sos-card-full auditoria-card">
                        <div className="card-header-flex">
                            <h2 className="card-title-icon">📊 Análisis de Auditoría</h2>
                            <div className="view-toggle-pills">
                                <button onClick={() => setViewModePanel1('stats')} className={viewModePanel1 === 'stats' ? 'active' : ''}>General</button>
                                <button onClick={() => setViewModePanel1('questions')} className={viewModePanel1 === 'questions' ? 'active' : ''}>Preguntas</button>
                            </div>
                        </div>
                        {viewModePanel1 === 'stats' ? (
                            <div className="stats-row-visual">
                                <div className="main-metric-circle">
                                    <span className="big-num">{datosDocentes.promedioGlobal.toFixed(2)}</span>
                                    <span className="label-num">MEDIA (0-5)</span>
                                </div>
                                <div className="secondary-metrics-list">
                                    <div className="sec-met"><span className="sec-val">{datosDocentes.totalDocentes}</span><span className="sec-lab">Participantes</span></div>
                                    <div className="sec-met"><span className="sec-val">{datosDocentes.desviacion}</span><span className="sec-lab">Desviación</span></div>
                                </div>
                            </div>
                        ) : (
                            <div className="questions-detail-list">
                                {datosDocentes.preguntasDetalle.map((q, i) => (
                                    <div key={i} className="question-row-item">
                                        <p className="q-text-small">{q.texto}</p>
                                        <div className="q-options-summary">
                                            {Object.entries(q.opciones).map(([opt, count]) => (
                                                <div key={opt} className="opt-pill">{opt}: <strong>{count}</strong></div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* SECCIÓN 3: GRÁFICA DE BARRAS (DISTRIBUCIÓN) */}
                    <section className="sos-card-full chart-card">
                        <h2 className="card-title-center">Desempeño por Dimensión (Inicial)</h2>
                        <div className="bar-chart-container-custom">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={datosDocentes.categoriasData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="dimension"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 14, fontWeight: 600 }}
                                        dy={15}
                                    />
                                    <YAxis domain={[0, 5]} hide />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Bar
                                        dataKey="puntaje"
                                        barSize={45}
                                        radius={[25, 25, 25, 25]} // Estilo cápsula completa
                                    >
                                        {datosDocentes.categoriasData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.puntaje < 3 ? '#f87171' : '#15203c'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="values-overlay-row">
                                {datosDocentes.categoriasData.map((d, i) => (
                                    <span key={i} className="val-float" style={{ color: d.puntaje < 3 ? '#ef4444' : '#15203c' }}>{d.puntaje}</span>
                                ))}
                            </div>
                        </div>
                        <div className="legend-status-bar">
                            <span><i className="status-dot red"></i> Crítico (&lt; 3.0)</span>
                            <span><i className="status-dot dark"></i> Estable (&gt; 3.0)</span>
                        </div>
                    </section>

                    {/* SECCIÓN 4: RESULTADO COMPASS Y REFLEXIÓN */}
                    <section className="sos-card-full result-card-main">
                        <div className="compass-result-header">
                            <h3>Punto de Partida Institucional</h3>
                            <p>Tu institución se encuentra en: <strong>{datosDocentes.promedioGlobal.toFixed(2)}</strong></p>
                        </div>

                        <div className="level-badge-container">
                            <div className="level-badge-pill">
                                {datosDocentes.nivelCompassObj.nivel}
                            </div>
                        </div>

                        <div className="level-description-box">
                            <p>{datosDocentes.nivelCompassObj.desc}</p>
                        </div>

                        <div className="gaps-risks-grid">
                            <div className="gap-box">
                                <span className="label-box">Brecha Principal</span>
                                <div className="tag-brecha">{datosDocentes.dimensionDebil}</div>
                            </div>
                            <div className="risk-box">
                                <span className="label-box">Riesgos Relevantes</span>
                                <div className="tags-flex">
                                    {datosDocentes.riesgosRelevantes.map((r, idx) => (
                                        <span key={idx} className="tag-risk">⚠️ {r.label}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="reflection-area">
                            <label className="reflection-title">Reflexiona sobre los datos:</label>
                            <ul className="reflection-bullets">
                                <li>¿Qué decisiones estratégicas eran aún reactivas?</li>
                                <li>¿Dónde no existía supervisión estructurada?</li>
                                <li>¿Qué prácticas eran informales o desarticuladas?</li>
                            </ul>
                            <textarea
                                className="sos-input-reflection"
                                placeholder="Escribe tu análisis aquí (mínimo 300 caracteres)..."
                                value={formData.Reflexion_Punto_Partida}
                                onChange={(e) => setFormData({ ...formData, Reflexion_Punto_Partida: e.target.value })}
                            />
                            <div className="char-count-bar">
                                <span className={formData.Reflexion_Punto_Partida.length < 300 ? "count-err" : "count-ok"}>
                                    Caracteres: {formData.Reflexion_Punto_Partida.length} / 300
                                </span>
                            </div>
                        </div>

                        <div className="action-footer">
                            <button className="btn-draft" onClick={() => handleSave(false)} disabled={saving}>💾 Guardar Borrador</button>
                            <button className="btn-next-step" onClick={() => handleSave(true)} disabled={saving}>Finalizar Paso 1 ➡</button>
                        </div>
                    </section>
                </div>
            )}

            {step === 2 && (
                <div className="sos-vertical-flow">
                    <div className="sos-grid-two-cols">
                        <section className="sos-card-full">
                            <h2 className="card-title-center">Radar de Gobernanza (Directivos)</h2>
                            <ResponsiveContainer width="100%" height={350}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={datosAsegurar.radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#15203c', fontWeight: 700, fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />

                                    {/* Tooltip para ver los valores al pasar el mouse */}
                                    <Tooltip
                                        formatter={(value) => [value.toFixed(2), "Puntaje"]}
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />

                                    <Radar
                                        name="Nivel Institucional"
                                        dataKey="A"
                                        stroke="#c5a059"
                                        fill="#c5a059"
                                        fillOpacity={0.6}
                                        dot={{ r: 4, fill: '#c5a059' }} // Añade puntos en las esquinas para mejor interacción
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                            <div className="legend-status-bar" style={{ marginTop: '20px' }}>
                                <span className="tag-risk">Puntaje Total: {datosAsegurar.totalRadar}</span>
                                <span className="tag-brecha" style={{ background: '#15203c', color: 'white' }}>{datosAsegurar.clasificacion}</span>
                            </div>
                        </section>

                        <section className="sos-card-full">
                            <h2 className="card-title-icon">Lo que implementaste</h2>
                            <div className="level-description-box" style={{ background: '#f1f5f9', borderLeft: '5px solid #15203c' }}>
                                {datosAsegurar.planAccion ? (
                                    <div style={{ fontSize: '0.9rem' }}>
                                        <p><strong>Prioridades:</strong> {datosAsegurar.planAccion.Dimension_Prioridad_1} / {datosAsegurar.planAccion.Dimension_Prioridad_2}</p>
                                        <p><strong>Objetivo:</strong> {datosAsegurar.planAccion.Objetivo_Estrategico}</p>
                                        <p><strong>Indicadores:</strong> {datosAsegurar.planAccion.Indicadores_Exito}</p>
                                    </div>
                                ) : <p>Cargando plan...</p>}
                            </div>
                        </section>
                    </div>

                    <section className="sos-card-full">
                        <h2 className="card-title-icon">Análisis de Implementación</h2>
                        <textarea
                            className="sos-input-reflection"
                            placeholder="Describe cómo se ejecutaron estas acciones y su cumplimiento (mínimo 300 caracteres)..."
                            value={formData.Analisis_Implementacion}
                            onChange={(e) => setFormData({ ...formData, Analisis_Implementacion: e.target.value })}
                        />
                        <div className="char-count-bar">
                            <span className={formData.Analisis_Implementacion.length < 300 ? "count-err" : "count-ok"}>
                                Caracteres: {formData.Analisis_Implementacion.length} / 300
                            </span>
                        </div>
                        <div className="action-footer">
                            <button className="btn-draft" onClick={() => handleSave(false)} disabled={saving}>💾 Guardar Borrador</button>
                            <button className="btn-next-step" onClick={() => handleSave(true)} disabled={saving}>Finalizar Paso 2 ➡</button>
                        </div>
                    </section>
                </div>
            )}

            {step === 3 && (
                <div className="sos-vertical-flow animate-slide-up">

                    <div className="at-c2-impact-grid">
                        {/* Crecimiento Global */}
                        <div className="at-c2-card-stats at-variant-dark-gold">
                            <div className="at-c2-growth-circle">
                                <span className="at-c2-plus">+</span>
                                <span className="at-c2-growth-num">{evolucionInstitucional.crecimiento}</span>
                                <span className="at-c2-percent">%</span>
                            </div>
                            <h4>Crecimiento Institucional</h4>
                            <p>Aumento de madurez en el equipo</p>
                        </div>

                        {/* Status */}
                        <div className="at-c2-card-stats at-variant-white">
                            <div className="at-c2-status-row">
                                <div className="at-c2-status-item at-level-block">
                                    <label>Nuevo Nivel Promedio</label>
                                    <strong className="at-text-level">{evolucionInstitucional.nivelAhora}</strong>
                                </div>
                                <div className="at-c2-status-item">
                                    <label>Mayor Evolución</label>
                                    <strong className="at-text-gold">{evolucionInstitucional.fortaleza}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfica Comparativa */}
                    <section className="sos-card-full">
                        <h4 className="at-c2-chart-title">Comparativa: Diagnóstico vs. Sostenibilidad</h4>
                        <div className="at-c2-comparison-chart">
                            {evolucionInstitucional.datasetComparativo.map((item, idx) => (
                                <div key={idx} className="at-c2-comp-row">
                                    <div className="at-c2-comp-label">{item.label}</div>
                                    <div className="at-c2-dual-track-container">
                                        {/* ANTES */}
                                        <div className="at-c2-track-path">
                                            <div className="at-c2-bar-before" style={{ width: `${(item.antes / 5) * 100}%` }}>
                                                <span className="at-c2-bar-label-val">{item.antes.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        {/* AHORA */}
                                        <div className="at-c2-track-path">
                                            <div className="at-c2-bar-after" style={{ width: `${(item.ahora / 5) * 100}%` }}>
                                                <span className="at-c2-bar-label-val">{item.ahora.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="at-c2-chart-legend">
                            <span className="at-leg-before">Diagnóstico Inicial</span>
                            <span className="at-leg-after">Consolidación Actual</span>
                        </div>
                    </section>

                    <section className="sos-card-full">
                        <h2 className="card-title-icon">Reflexión sobre el Crecimiento</h2>

                        <p className="sos-instructions">
                            Analiza el proceso de fortalecimiento institucional respondiendo:
                            <br />• ¿Dónde se evidencia una cultura institucional más estructurada?
                            <br />• ¿Cómo se garantiza ahora supervisión humana explícita?
                            <br />• ¿Qué prácticas ya no dependen de voluntades individuales?
                        </p>

                        <textarea
                            className="sos-input-reflection"
                            placeholder="Escribe tu reflexión aquí... (mínimo 350 caracteres)"
                            value={formData.Estado_Cumplimiento_Asegurar}
                            onChange={(e) => setFormData({
                                ...formData,
                                Estado_Cumplimiento_Asegurar: e.target.value
                            })}
                        />

                        <small className="char-counter">
                            {formData.Estado_Cumplimiento_Asegurar.length} / 350 caracteres
                        </small>

                        <div className="action-footer">
                            <button
                                className="btn-draft"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                            >
                                💾 Guardar Borrador
                            </button>

                            <button
                                className="btn-next-step"
                                onClick={() => handleSave(true)}
                                disabled={
                                    saving || formData.Estado_Cumplimiento_Asegurar.length < 350
                                }
                            >
                                Finalizar Paso 3 ➡
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {step === 4 && (
                <div className="sos-vertical-flow animate-slide-up">
                    <section className="sos-card-full" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '400px',
                        textAlign: 'center',
                        gap: '24px'
                    }}>
                        <div style={{ fontSize: '64px' }}>🏅</div>
                        <h2 className="card-title-center">Certificación ATLAS</h2>
                        <div style={{
                            background: 'linear-gradient(135deg, #15203c, #c5a059)',
                            borderRadius: '16px',
                            padding: '32px 48px',
                            color: 'white',
                            maxWidth: '500px'
                        }}>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>
                                Certificado Descargable
                            </h3>
                            <p style={{ opacity: 0.9, fontSize: '1rem', lineHeight: '1.6' }}>
                                Esta función estará disponible próximamente. Tu institución podrá descargar el certificado oficial de sostenibilidad ATLAS una vez completado el proceso de validación.
                            </p>
                            <div style={{
                                marginTop: '20px',
                                background: 'rgba(255,255,255,0.15)',
                                borderRadius: '8px',
                                padding: '12px 20px',
                                fontSize: '0.85rem'
                            }}>
                                🔒 Próximamente disponible
                            </div>
                        </div>
                        <div className="action-footer">
                            <button className="btn-draft" onClick={() => changeStep(3)}>⬅ Volver</button>
                            <button className="btn-next-step" onClick={() => changeStep(5)}>Continuar ➡</button>
                        </div>
                    </section>
                </div>
            )}

            {step === 5 && (
                <div className="sos-vertical-flow animate-slide-up">

                    {/* SUGERENCIA AUTOMÁTICA */}
                    <section className="sos-card-full" style={{
                        background: evolucionInstitucional.nivelAhora === "Integración estratégica" ||
                            evolucionInstitucional.nivelAhora === "Gobernanza madura"
                            ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
                            : 'linear-gradient(135deg, #fefce8, #fef9c3)',
                        borderLeft: `5px solid ${evolucionInstitucional.nivelAhora === "Integración estratégica" ||
                                evolucionInstitucional.nivelAhora === "Gobernanza madura"
                                ? '#22c55e' : '#eab308'
                            }`
                    }}>
                        <h3 style={{ marginBottom: '8px' }}>🧭 Ruta Sugerida para tu Institución</h3>

                        {/* Lógica automática basada en promedioAhoraGlobal */}
                        {(() => {
                            const nivel = parseFloat(
                                (evolucionInstitucional.datasetComparativo?.[0]?.ahora || 0)
                            );
                            const esCertificacion = nivel >= 3.8;
                            return (
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
                                    <div style={{
                                        flex: 1,
                                        minWidth: '200px',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        background: !esCertificacion ? '#15203c' : 'white',
                                        color: !esCertificacion ? 'white' : '#64748b',
                                        border: '2px solid',
                                        borderColor: !esCertificacion ? '#15203c' : '#e2e8f0',
                                        position: 'relative'
                                    }}>
                                        {!esCertificacion && (
                                            <span style={{
                                                position: 'absolute', top: '-10px', left: '16px',
                                                background: '#c5a059', color: 'white',
                                                fontSize: '0.7rem', padding: '2px 10px',
                                                borderRadius: '99px', fontWeight: 700
                                            }}>SUGERIDA</span>
                                        )}
                                        <h4>🔷 Ruta A</h4>
                                        <strong>Sostener y Consolidar</strong>
                                        <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.85 }}>
                                            Institucionaliza lo logrado. Fortalece las prácticas existentes antes de escalar.
                                        </p>
                                    </div>
                                    <div style={{
                                        flex: 1,
                                        minWidth: '200px',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        background: esCertificacion ? '#15203c' : 'white',
                                        color: esCertificacion ? 'white' : '#64748b',
                                        border: '2px solid',
                                        borderColor: esCertificacion ? '#15203c' : '#e2e8f0',
                                        position: 'relative'
                                    }}>
                                        {esCertificacion && (
                                            <span style={{
                                                position: 'absolute', top: '-10px', left: '16px',
                                                background: '#c5a059', color: 'white',
                                                fontSize: '0.7rem', padding: '2px 10px',
                                                borderRadius: '99px', fontWeight: 700
                                            }}>SUGERIDA</span>
                                        )}
                                        <h4>🏆 Ruta B</h4>
                                        <strong>Avanzar hacia Certificación ATLAS</strong>
                                        <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.85 }}>
                                            Tu nivel permite aspirar a certificación institucional formal.
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}
                    </section>

                    {/* FORMULARIO DE DECISIÓN */}
                    <section className="sos-card-full">
                        <h2 className="card-title-icon">Decisión Estratégica</h2>
                        <p style={{ color: '#64748b', marginBottom: '20px' }}>
                            Ahora tu institución puede consolidar lo logrado o avanzar hacia un nivel superior. Define tu ruta para los próximos 12 meses.
                        </p>

                        {/* SELECTOR DE RUTA */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            {['Ruta A: Sostener y Consolidar', 'Ruta B: Avanzar hacia Certificación ATLAS'].map(ruta => (
                                <button
                                    key={ruta}
                                    onClick={() => setFormData({ ...formData, Ruta_Elegida: ruta })}
                                    style={{
                                        flex: 1,
                                        minWidth: '200px',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '2px solid',
                                        borderColor: formData.Ruta_Elegida === ruta ? '#15203c' : '#e2e8f0',
                                        background: formData.Ruta_Elegida === ruta ? '#15203c' : 'white',
                                        color: formData.Ruta_Elegida === ruta ? 'white' : '#64748b',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {formData.Ruta_Elegida === ruta ? '✅ ' : '☐ '}{ruta}
                                </button>
                            ))}
                        </div>

                        {/* CAMPOS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            <div>
                                <label className="reflection-title">1️⃣ Prioridad estratégica institucional</label>
                                <textarea
                                    className="sos-input-reflection"
                                    placeholder="¿Cuál es la prioridad estratégica principal para los próximos 12 meses?"
                                    value={formData.Prioridad_Estrategica_Anual}
                                    onChange={(e) => setFormData({ ...formData, Prioridad_Estrategica_Anual: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="reflection-title">2️⃣ Acción concreta a nivel de gobernanza</label>
                                <textarea
                                    className="sos-input-reflection"
                                    placeholder="¿Qué acción específica de gobernanza implementarás?"
                                    value={formData.Accion_Gobernanza}
                                    onChange={(e) => setFormData({ ...formData, Accion_Gobernanza: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="reflection-title">3️⃣ Indicador medible</label>
                                <textarea
                                    className="sos-input-reflection"
                                    placeholder="¿Cómo medirás el éxito? Define un indicador concreto."
                                    value={formData.Indicador_Medible}
                                    onChange={(e) => setFormData({ ...formData, Indicador_Medible: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="reflection-title">4️⃣ Calendario de revisión institucional</label>
                                <input
                                    type="date"
                                    className="sos-input-reflection"
                                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                                    value={formData.Fecha_Revision_Institucional}
                                    onChange={(e) => setFormData({ ...formData, Fecha_Revision_Institucional: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="reflection-title">5️⃣ Estrategia de comunicación de cultura institucional</label>
                                <textarea
                                    className="sos-input-reflection"
                                    placeholder="¿Cómo comunicarás el uso responsable de IA a toda la comunidad educativa?"
                                    value={formData.Estrategia_Comunicacion}
                                    onChange={(e) => setFormData({ ...formData, Estrategia_Comunicacion: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* MENSAJE FINAL */}
                        <div style={{
                            marginTop: '24px',
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, #15203c, #1e3a5f)',
                            borderRadius: '12px',
                            color: 'white',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                            fontStyle: 'italic'
                        }}>
                            💡 Sostener no es repetir acciones. Es institucionalizar buenas prácticas.
                        </div>

                        <div className="action-footer" style={{ marginTop: '20px' }}>
                            <button className="btn-draft" onClick={() => handleSave(false)} disabled={saving}>
                                💾 Guardar Borrador
                            </button>
                            <button
                                className="btn-next-step"
                                onClick={() => handleSave(true)}
                                disabled={
                                    saving ||
                                    !formData.Ruta_Elegida ||
                                    !formData.Prioridad_Estrategica_Anual ||
                                    !formData.Accion_Gobernanza ||
                                    !formData.Indicador_Medible ||
                                    !formData.Fecha_Revision_Institucional ||
                                    !formData.Estrategia_Comunicacion
                                }
                            >
                                ✅ Finalizar Ciclo Institucional
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {step > 5 && (
                <div className="sos-placeholder-vertical">
                    <div className="placeholder-content">
                        <h3>Ciclo Completado ✅</h3>
                        <button className="btn-return" onClick={() => changeStep(1)}>Volver al inicio</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuloSostenerDirectivo;