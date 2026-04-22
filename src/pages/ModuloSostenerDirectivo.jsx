import React, { useState, useEffect } from "react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import Swal from "sweetalert2";
import "../Styles/moduloSostener.css";

const ModuloSostenerDirectivo = ({ userData, API_URL, onNavigate, datosExistentes }) => {
    const [view, setView] = useState("menu");
    const [respuestas, setRespuestas] = useState({});
    const [loading, setLoading] = useState(false);
    const [historial, setHistorial] = useState(datosExistentes ? [datosExistentes] : []);

    const [retos, setRetos] = useState([]);
    const [promptData, setPromptData] = useState(null);
    const [viewModeModal, setViewModeModal] = useState('stats');
    const [showModal, setShowModal] = useState(false);

    const [selectedFormReal, setSelectedFormReal] = useState(null);
    const [viewModeReal, setViewModeReal] = useState('stats');
    const [showModalReal, setShowModalReal] = useState(false);

    const [cierreStep, setCierreStep] = useState(1);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const [formDataCierre, setFormDataCierre] = useState({
        Reflexion_Punto_Partida: "",
        Estado_Cumplimiento_Asegurar: "",
        Analisis_Implementacion: "",
        aprendizajeClave: "",
        Ruta_Elegida: "",
        Prioridad_Estrategica_Anual: "",
        Accion_Gobernanza: "",
        Indicador_Medible: "",
        Fecha_Revision_Institucional: "",
        Estrategia_Comunicacion: ""
    });

    // ============================================================
    // DATOS GRUPALES INSTITUCIONALES
    // ============================================================
    const [datosGrupales, setDatosGrupales] = useState({
        totalDocentes: 0,
        promedioGlobal: 0,
        promedioD1: 0,
        promedioD2: 0,
        promedioD3: 0,
        promedioD4: 0,
        distribucionNiveles: { N1: 0, N2: 0, N3: 0, N4: 0 },
        alertasGlobales: []
    });

    // Datos de auditoría (FORM-1770684713222) — TODOS los docentes sin filtro de usuario
    const [respuestasAuditarReal, setRespuestasAuditarReal] = useState([]);

    // Datos de liderazgo — TODOS sin filtro
    const [promptsGrupales, setPromptsGrupales] = useState([]);

    const [analysis, setAnalysis] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // ============================================================
    // DIMENSIONES DEL CUESTIONARIO DIRECTIVO
    // ============================================================
    const dimensiones = [
        {
            id: "D1",
            nombre: "Gobernanza y Liderazgo en IA",
            preguntas: [
                { id: 1, text: "Lidero la definición y actualización de la política institucional sobre uso de IA." },
                { id: 2, text: "Existe un equipo o responsable claramente designado para supervisar el uso de IA en la institución." },
                { id: 3, text: "Tomo decisiones informadas sobre la adopción de herramientas de IA en procesos académicos." },
                { id: 4, text: "Superviso la implementación de protocolos frente a riesgos o incidentes relacionados con IA." },
                { id: 5, text: "Aseguro que el uso de IA esté alineado con principios éticos y marcos internacionales (UNESCO u otros)." },
                { id: 6, text: "Participo activamente en el seguimiento del uso pedagógico de la IA en la institución." }
            ]
        },
        {
            id: "D2",
            nombre: "Desarrollo y Supervisión Docente",
            preguntas: [
                { id: 7, text: "Promuevo la formación docente en el uso pedagógico y ético de la IA." },
                { id: 8, text: "Superviso que los docentes utilicen IA con intención pedagógica clara." },
                { id: 9, text: "Verifico que exista supervisión humana en el uso de IA por parte de los docentes." },
                { id: 10, text: "Fomento el intercambio de buenas prácticas sobre IA entre docentes." },
                { id: 11, text: "Evalúo periódicamente el nivel de competencia docente en IA." },
                { id: 12, text: "Acompaño o retroalimento a los docentes en el diseño de experiencias de aprendizaje con IA." }
            ]
        },
        {
            id: "D3",
            nombre: "Ética, Privacidad y Protección de Datos",
            preguntas: [
                { id: 13, text: "Superviso que no se compartan datos sensibles de estudiantes en herramientas de IA." },
                { id: 14, text: "Garantizo que se apliquen medidas de protección de datos en el uso institucional de IA." },
                { id: 15, text: "Reviso o delego la revisión de términos y condiciones de herramientas de IA antes de su uso." },
                { id: 16, text: "Promuevo prácticas de anonimización o uso responsable de la información estudiantil." },
                { id: 17, text: "Aseguro que estudiantes y familias sean informados sobre el uso de IA en la institución." },
                { id: 18, text: "Tomo acciones cuando identifico riesgos éticos o de privacidad en el uso de IA." }
            ]
        },
        {
            id: "D4",
            nombre: "Monitoreo, Impacto y Transparencia",
            preguntas: [
                { id: 19, text: "Monitoreo el impacto del uso de IA en el aprendizaje de los estudiantes." },
                { id: 20, text: "Analizo datos o evidencias para tomar decisiones sobre el uso institucional de IA." },
                { id: 21, text: "Garantizo espacios donde estudiantes puedan cuestionar o reflexionar sobre el uso de IA." },
                { id: 22, text: "Superviso posibles sesgos o inequidades en el uso de IA en la institución." },
                { id: 23, text: "Promuevo la transparencia sobre cómo y para qué se utiliza la IA en la institución." },
                { id: 24, text: "Impulso procesos de evaluación o auditoría del uso institucional de la IA." }
            ]
        }
    ];

    // ============================================================
    // FUNCIONES DE DIAGNÓSTICO
    // ============================================================
    const getCompassData = (score) => {
        const s = parseFloat(score) || 0;
        if (s >= 90) return {
            nivel: "Gobernanza madura",
            desc: `La institución lidera con madurez el ecosistema de IA educativa. Existe supervisión humana estructurada, documentación de decisiones, evaluación de impacto y contribución activa a lineamientos institucionales. Práctica alineada con principios internacionales de IA confiable.`
        };
        if (s >= 75) return {
            nivel: "Integración estratégica",
            desc: `La institución integra IA de manera coherente y estratégica. Existen criterios de uso responsable, supervisión explícita y evaluación ajustada. El siguiente paso es avanzar hacia gobernanza documentada y escalable.`
        };
        if (s >= 60) return {
            nivel: "Integración pedagógica",
            desc: `La IA forma parte del diseño pedagógico institucional con intención clara. Se vincula con objetivos curriculares y hay conciencia ética. Aún se puede fortalecer la documentación y evaluación sistemática de impacto.`
        };
        if (s >= 40) return {
            nivel: "Uso incipiente",
            desc: `El uso de IA es instrumental u ocasional. Hay intención pero falta sistematicidad en evaluación, documentación y criterios éticos. El siguiente paso es avanzar hacia coherencia pedagógica institucional.`
        };
        return {
            nivel: "Exploración",
            desc: `La institución se encuentra en etapa inicial de aproximación a la IA educativa. Es el punto de partida del camino ATLAS.`
        };
    };

    const generarDiagnostico = (puntaje) => {
        const p = parseFloat(puntaje) || 0;
        if (p >= 90) return {
            nivel: "Institución Referente de Vanguardia",
            texto: `La institución refleja una integración madura, ética y estratégicamente documentada de la inteligencia artificial. Existe coherencia sistémica entre propósito curricular, protección de datos, evaluación crítica y desarrollo profesional continuo.`,
            implicacion: `La institución puede convertirse en modelo replicable y liderar procesos de certificación externa.`,
            accion: `• Liderar comunidades de práctica interinstitucionales.\n• Documentar casos de impacto medible.\n• Participar en construcción de política sectorial de IA.`
        };
        if (p >= 80) return {
            nivel: "Institución Estratégica Consolidada",
            texto: `La integración institucional de IA es sólida y coherente con objetivos de aprendizaje. Existe intención pedagógica clara y conciencia ética en el manejo de datos.`,
            implicacion: `El siguiente paso es medir con mayor precisión el impacto en autonomía estudiantil y diferenciación pedagógica.`,
            accion: `• Implementar métricas comparativas antes/después.\n• Sistematizar evidencias de mejora.\n• Profundizar en personalización avanzada.`
        };
        if (p >= 60) return {
            nivel: "Institución en Evolución",
            texto: `La institución ha superado la fase instrumental. La IA forma parte de la práctica pedagógica con intención identificable, aunque aún existen oportunidades en la dimensión ética y la documentación de impacto.`,
            implicacion: `El crecimiento depende de consolidar supervisión humana explícita y evaluar resultados más allá de la eficiencia operativa.`,
            accion: `• Diseñar secuencias donde la IA tenga rol definido y evaluable.\n• Revisar políticas institucionales de protección de datos.\n• Iniciar registro estructurado de experiencias.`
        };
        if (p >= 40) return {
            nivel: "Institución Exploradora",
            texto: `La institución se encuentra en aproximación activa a la IA. Hay interés y apertura pero predomina un enfoque funcional u ocasional.`,
            implicacion: `El desafío no es incorporar más herramientas, sino comprender cuándo, cómo y para qué usarlas dentro de un marco ético.`,
            accion: `• Formular objetivos antes de usar IA.\n• Practicar revisión crítica sistemática.\n• Participar en formación específica sobre ética y sesgos.`
        };
        return {
            nivel: "Fase de Alfabetización Institucional",
            texto: `El uso institucional de IA es limitado o principalmente operativo. No se evidencia integración pedagógica estructurada ni conciencia consolidada sobre riesgos.`,
            implicacion: `El progreso depende de fortalecer comprensión conceptual antes de escalar.`,
            accion: `• Comprender principios básicos de protección de datos.\n• Explorar casos de uso pedagógico con acompañamiento.\n• Reflexionar sobre el rol insustituible del criterio docente.`
        };
    };

    // ============================================================
    // RECOMENDACIONES POR DIMENSIÓN
    // ============================================================
    const dimensionRecommendations = {
        uso: {
            basic: ["Definir política de uso pedagógico de IA.", "Capacitar docentes en uso intencional.", "Crear criterios institucionales de evaluación con IA."],
            medium: ["Medir impacto en aprendizaje institucional.", "Diseñar secuencias didácticas con rol de IA definido.", "Revisar si la automatización reemplaza criterio docente."],
            advanced: ["Documentar casos de alto impacto.", "Compartir prácticas en red interinstitucional.", "Experimentar con mejora incremental basada en evidencia."]
        },
        etica: {
            basic: ["Revisar la política institucional de IA.", "Evitar datos identificables en herramientas externas.", "Verificar términos de uso de plataformas."],
            medium: ["Analizar casos de posible sesgo algorítmico.", "Explicitar a estudiantes el uso de IA.", "Incorporar revisión humana sistemática."],
            advanced: ["Liderar conversación institucional sobre riesgos.", "Diseñar guía para estudiantes y familias.", "Apoyar procesos de revisión institucional externa."]
        },
        impacto: {
            basic: ["Definir indicadores concretos de mejora.", "Evaluar resultados antes y después del uso de IA.", "Ajustar herramientas que no aporten valor."],
            medium: ["Implementar medición sistemática institucional.", "Diseñar experiencias personalizadas con IA.", "Recoger retroalimentación de toda la comunidad."],
            advanced: ["Sistematizar evidencia institucional.", "Presentar resultados en espacios académicos.", "Convertir la institución en referente de impacto."]
        },
        desarrollo: {
            basic: ["Agendar formación institucional en IA educativa.", "Unirse a comunidades de práctica.", "Iniciar bitácora institucional mensual."],
            medium: ["Profundizar en tema específico por área.", "Publicar o compartir experiencias.", "Solicitar retroalimentación de pares externos."],
            advanced: ["Diseñar microformación para docentes.", "Participar en proyectos piloto nacionales.", "Apoyar diseño de lineamientos sectoriales."]
        }
    };

    // ============================================================
    // MÉTRICAS DE AUDITORÍA GRUPAL (sin filtro de usuario)
    // ============================================================
    const [datosAsegurar, setDatosAsegurar] = useState({
        diagnostico: null,
        planAccion: null,
        loading: false
    });

    const [datosAuditoriafase1, setDatosAuditoriafase1] = useState({
        promedioGlobal: 0,
        promedioPorcentaje: 0,
        totalDocentes: 0,
        desviacion: "0.0",
        categoriasData: [],
        dimensionDebil: "",
        nivelCompassObj: {}
    });
    const getMetricasAuditoria = () => {
        const r = respuestasAuditarReal;
        if (!r || r.length === 0) return { uso: 0, etica: 0, impacto: 0, desarrollo: 0 };

        // Agrupamos por pregunta igual que Código 1
        const agrupado = {};
        r.forEach(resp => {
            const qId = String(resp.ID_Pregunta).trim();
            const puntos = parseFloat(String(resp.Puntos_Ganados || "0").replace(',', '.'));
            if (!agrupado[qId]) {
                agrupado[qId] = { sumaPuntos: 0, total: 0 };
            }
            agrupado[qId].sumaPuntos += puntos;
            agrupado[qId].total += 1;
        });

        const calcPromDim = (ids) => {
            const pregsDeCat = Object.entries(agrupado)
                .filter(([qId]) => ids.includes(qId))
                .map(([, data]) => data);
            if (pregsDeCat.length === 0) return 0;
            const sumaPromedios = pregsDeCat.reduce(
                (acc, q) => acc + (q.sumaPuntos / q.total), 0
            );
            return parseFloat((sumaPromedios / pregsDeCat.length).toFixed(2));
        };

        return {
            uso: calcPromDim(DIMENSIONES_CONFIG["Uso"]),
            etica: calcPromDim(DIMENSIONES_CONFIG["Ética"]),
            impacto: calcPromDim(DIMENSIONES_CONFIG["Impacto"]),
            desarrollo: calcPromDim(DIMENSIONES_CONFIG["Desarrollo"])
        };
    };

    // ============================================================
    // COMPARATIVO ATLAS — ahora grupal
    // ============================================================
    const getComparativoAtlas = () => {
        const m = getMetricasAuditoria();
        const promedioBase5 = (
        parseFloat(m.uso) + parseFloat(m.etica) +
        parseFloat(m.impacto) + parseFloat(m.desarrollo)
    ) / 4;
        const scoreAntesPct = promedioBase5 * 20;
        const scoreAntesBase5 = scoreAntesPct / 20;
        const nivelAntes = getCompassData(scoreAntesPct).nivel;

        // El "ahora" es el promedio global de TODOS los docentes de SOSTENER_Docentes
        const scoreAhoraBase5 = parseFloat(datosGrupales.promedioGlobal) || 0;
        const scoreAhoraPct = scoreAhoraBase5 * 20;
        const crecimiento = (scoreAhoraPct - scoreAntesPct).toFixed(1);

        return {
            scoreAntes: scoreAntesBase5,
            nivelAntes,
            scoreAhora: scoreAhoraBase5,
            nivelAhora: generarDiagnostico(scoreAhoraPct).nivel,
            crecimiento
        };
    };

    // ============================================================
    // DATASET PARA GRÁFICAS — grupal
    // ============================================================
    const DIMENSIONES_CONFIG = {
        "Uso": ['Q-A2-04', 'Q-A2-05', 'Q-A2-06', 'Q-A2-07', 'Q-A2-08'],
        "Ética": ['Q-A4-13', 'Q-A4-14', 'Q-A4-15', 'Q-A4-16', 'Q-A4-17'],
        "Impacto": ['Q-A5-18', 'Q-A5-19', 'Q-A5-20', 'Q-A5-21', 'Q-A5-22'],
        "Desarrollo": ['Q-A3-09', 'Q-A3-10', 'Q-A3-11', 'Q-A3-12', 'Q-A6-23', 'Q-A6-24', 'Q-A6-25', 'Q-A6-26']
    };
    const metricasAuditoria = getMetricasAuditoria();
    const datasetAuditoria = [
        { label: 'Uso', valor: parseFloat(metricasAuditoria.uso) || 0 },
        { label: 'Ética', valor: parseFloat(metricasAuditoria.etica) || 0 },
        { label: 'Impacto', valor: parseFloat(metricasAuditoria.impacto) || 0 },
        { label: 'Desarrollo', valor: parseFloat(metricasAuditoria.desarrollo) || 0 }
    ];
    const valorMinimo = Math.min(...datasetAuditoria.map(d => d.valor));

    // pD: promedios de dimensiones grupales (de SOSTENER_Docentes, todos los docentes)
    const pD = [
        parseFloat(datosGrupales.promedioD1) || 0,
        parseFloat(datosGrupales.promedioD2) || 0,
        parseFloat(datosGrupales.promedioD3) || 0,
        parseFloat(datosGrupales.promedioD4) || 0
    ];

    const toPct = (val) => ((parseFloat(val) / 5) * 100).toFixed(1);

    // ============================================================
    // ALERTAS
    // ============================================================
    const generateAlerts = (data) => {
        const alerts = [];
        if (data.item3 <= 2 && data.item5 <= 2) alerts.push("⚠️ Riesgo de automatización sin supervisión pedagógica.");
        if (data.item7 <= 2 || data.item8 <= 2) alerts.push("⚠️ Posible riesgo en protección de datos institucional.");
        if (data.dim3 < 2.5) alerts.push("⚠️ El uso podría estar enfocado en eficiencia más que en aprendizaje.");
        if (data.dim4 < data.previousDim4) alerts.push("⚠️ Se detecta desaceleración en desarrollo profesional docente.");
        return alerts;
    };

    const generateAnalysis = () => {
        const dims = { uso: pD[0], etica: pD[1], impacto: pD[2], desarrollo: pD[3] };
        const result = {};
        Object.keys(dims).forEach(key => {
            const value = dims[key];
            if (value < 3.0) result[key] = dimensionRecommendations[key].basic;
            else if (value < 4.0) result[key] = dimensionRecommendations[key].medium;
            else result[key] = dimensionRecommendations[key].advanced;
        });
        return result;
    };

    // Análisis de prompts grupales
    const analizarPromptsGrupal = () => {
        if (!promptsGrupales || promptsGrupales.length === 0) return null;
        const n = promptsGrupales.length;
        const sum = (field) => promptsGrupales.reduce((acc, p) => acc + parseFloat(p[field] || 0), 0);
        const etica = sum('Puntaje_Etica') / n;
        const priv = sum('Puntaje_Privacidad') / n;
        const agen = sum('Puntaje_Agencia') / n;
        const cogn = sum('Puntaje_Dependencia') / n;
        const promedio = (etica + priv + agen + cogn) / 4;
        return {
            etica: etica.toFixed(2),
            priv: priv.toFixed(2),
            agen: agen.toFixed(2),
            cogn: cogn.toFixed(2),
            promedio: promedio.toFixed(2),
            diagnostico: promedio >= 4 ? "Excelente equilibrio ético institucional." : "Se sugiere mayor supervisión humana institucional.",
            color: promedio >= 4 ? "#22c55e" : "#f59e0b",
            total: n
        };
    };
    const statsPrompt = analizarPromptsGrupal();

    // ============================================================
    // EFFECT: CARGAR DATOS GRUPALES (sin filtro de usuario)
    // ============================================================
    useEffect(() => {
        const cargarDatosGrupales = async () => {
            try {
                // Traemos TODAS las hojas sin filtrar por usuario individual
                const [resAuditar, resRetos, resLiderar, resSostener, resAsegurarDiag, resAsegurarPlan] = await Promise.all([
                    fetch(`${API_URL}?sheet=Respuestas_Usuarios`),
                    fetch(`${API_URL}?sheet=Retos_Transformar_ATLAS`),
                    fetch(`${API_URL}?sheet=Liderar_Prompts_Docentes`),
                    fetch(`${API_URL}?sheet=SOSTENER_Docentes`),
                    fetch(`${API_URL}?sheet=ASEGURAR_Directivos_Diagnostico&user_key=${userData?.Teacher_Key}`),
                    fetch(`${API_URL}?sheet=ASEGURAR_Directivos_Plan_Accion&user_key=${userData?.Teacher_Key}`)
                ]);

                const dAuditar = await resAuditar.json();
                const dRetos = await resRetos.json();
                const dLiderar = await resLiderar.json();
                const dSostener = await resSostener.json();

                // ── 5. ASEGURAR: Diagnóstico y Plan del directivo ──
                const dAsegurarDiag = await resAsegurarDiag.json();
                const dAsegurarPlan = await resAsegurarPlan.json();

                const ultimoDiag = Array.isArray(dAsegurarDiag) && dAsegurarDiag.length > 0
                    ? dAsegurarDiag[dAsegurarDiag.length - 1]
                    : null;

                const ultimoPlan = Array.isArray(dAsegurarPlan) && dAsegurarPlan.length > 0
                    ? dAsegurarPlan[dAsegurarPlan.length - 1]
                    : null;

                setDatosAsegurar({
                    diagnostico: ultimoDiag,
                    planAccion: ultimoPlan,
                    loading: false
                });

                // ── 1. AUDITORÍA: todos los docentes del formulario específico ──
                const idAuditarCorrecto = "FORM-1770684713222";
                const todosDatosAuditoria = Array.isArray(dAuditar)
                    ? dAuditar.filter(r => r.ID_Form === idAuditarCorrecto)
                    : [];
                setRespuestasAuditarReal(todosDatosAuditoria);

                // ── FASE 1: Cálculo igual al Código 1 original ──
                if (todosDatosAuditoria.length > 0) {
                    // Agrupar por pregunta (para promedios por dimensión)
                    const agrupado = {};
                    // Agrupar puntajes totales por envío (para contar docentes reales)
                    const puntajesTotales = {};
                    const preguntasPorEnvio = {};

                    todosDatosAuditoria.forEach(resp => {
                        const qId = String(resp.ID_Pregunta).trim();
                        const puntos = parseFloat(String(resp.Puntos_Ganados || "0").replace(',', '.'));
                        const envioId = resp.ID_Respuesta_Global;

                        // Acumular por envío
                        puntajesTotales[envioId] = (puntajesTotales[envioId] || 0) + puntos;
                        preguntasPorEnvio[envioId] = (preguntasPorEnvio[envioId] || 0) + 1;

                        // Acumular por pregunta
                        if (!agrupado[qId]) {
                            agrupado[qId] = { sumaPuntos: 0, total: 0 };
                        }
                        agrupado[qId].sumaPuntos += puntos;
                        agrupado[qId].total += 1;
                    });

                    // Total docentes reales (por envío único)
                    const listaPuntajes = Object.values(puntajesTotales);
                    const totalDocentesFase1 = listaPuntajes.length;

                    // Promedio global (suma de todos los puntajes por envío / número de envíos)
                    const promedioGlobalRaw = listaPuntajes.length > 0
                        ? listaPuntajes.reduce((a, b) => a + b, 0) / listaPuntajes.length
                        : 0;

                    // Normalizar a escala 0-5 y luego a porcentaje
                    const NUM_PREGUNTAS_FORMULARIO = 20;
                    const promedioBase5 = promedioGlobalRaw / NUM_PREGUNTAS_FORMULARIO;
                    const promedioPorcentaje = promedioBase5 * 20;

                    // Desviación estándar entre docentes
                    const promediosPorDocente = Object.keys(puntajesTotales).map(envioId =>
                        puntajesTotales[envioId] / (preguntasPorEnvio[envioId] || 1)
                    );
                    const mediaDocentes = promediosPorDocente.reduce((a, b) => a + b, 0) / promediosPorDocente.length;
                    const desviacion = Math.sqrt(
                        promediosPorDocente.reduce((acc, p) => acc + Math.pow(p - mediaDocentes, 2), 0) / promediosPorDocente.length
                    ).toFixed(2);

                    // Promedios por dimensión usando DIMENSIONES_CONFIG
                    const calcPromDim = (ids) => {
                        const pregsDeCat = Object.entries(agrupado)
                            .filter(([qId]) => ids.includes(qId))
                            .map(([, data]) => data);
                        if (pregsDeCat.length === 0) return 0;
                        const sumaPromedios = pregsDeCat.reduce(
                            (acc, q) => acc + (q.sumaPuntos / q.total), 0
                        );
                        return parseFloat((sumaPromedios / pregsDeCat.length).toFixed(1));
                    };

                    const categoriasFinales = [
                        { dimension: "Uso", puntaje: calcPromDim(DIMENSIONES_CONFIG["Uso"]) },
                        { dimension: "Ética", puntaje: calcPromDim(DIMENSIONES_CONFIG["Ética"]) },
                        { dimension: "Impacto", puntaje: calcPromDim(DIMENSIONES_CONFIG["Impacto"]) },
                        { dimension: "Desarrollo", puntaje: calcPromDim(DIMENSIONES_CONFIG["Desarrollo"]) }
                    ];

                    const minCat = [...categoriasFinales].sort((a, b) => a.puntaje - b.puntaje)[0];

                    setDatosAuditoriafase1({
                        promedioGlobal: promedioGlobalRaw,
                        promedioPorcentaje,
                        totalDocentes: totalDocentesFase1,
                        desviacion,
                        categoriasData: categoriasFinales,
                        dimensionDebil: minCat?.dimension || "Por evaluar",
                        nivelCompassObj: getCompassData(promedioPorcentaje)
                    });
                }

                if (todosDatosAuditoria.length > 0) {
                    const puntajes = todosDatosAuditoria.map(r =>
                        parseFloat(String(r.Puntos_Ganados || "0").replace(',', '.'))
                    );
                    const n = puntajes.length;
                    const mediaPuntos = puntajes.reduce((a, b) => a + b, 0) / n;
                    const frecuencias = {};
                    puntajes.forEach(p => frecuencias[p] = (frecuencias[p] || 0) + 1);
                    const moda = Object.keys(frecuencias).reduce((a, b) => frecuencias[a] > frecuencias[b] ? a : b);
                    const varianza = puntajes.reduce((acc, p) => acc + Math.pow(p - mediaPuntos, 2), 0) / n;
                    const desviacion = Math.sqrt(varianza);

                    setSelectedFormReal({
                        puntosMedia: mediaPuntos.toFixed(2),
                        puntosModa: parseFloat(moda).toFixed(2),
                        promedioEscala100: (mediaPuntos * 20).toFixed(1),
                        desviacion: desviacion.toFixed(2),
                        totalItems: n,
                        analisis: { nivel: "Evidencia de Auditoría Institucional", color: "#4c51bf" }
                    });
                }

                // ── 2. RETOS: todos ──
                if (Array.isArray(dRetos)) setRetos(dRetos);

                // ── 3. LIDERAZGO: todos los prompts sin filtro ──
                if (Array.isArray(dLiderar) && dLiderar.length > 0) {
                    setPromptsGrupales(dLiderar);
                    // Para el panel 3 usamos el primer registro como referencia de estructura
                    setPromptData(dLiderar[0]);
                }

                // ── 4. SOSTENER_Docentes: calcular promedios grupales de TODOS los docentes ──
                if (Array.isArray(dSostener) && dSostener.length > 0) {
                    const total = dSostener.length;
                    let sumaGlobal = 0;
                    let sumaD = [0, 0, 0, 0];
                    let N1 = 0, N2 = 0, N3 = 0, N4 = 0;

                    dSostener.forEach(doc => {
                        const pg = parseFloat(doc.Promedio_Global || 0);
                        sumaGlobal += pg;

                        if (pg >= 4.3) N4++;
                        else if (pg >= 3.5) N3++;
                        else if (pg >= 2.5) N2++;
                        else N1++;

                        // Extraemos los promedios por dimensión de cada docente
                        const dimStr = String(doc["Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4"] || "0,0,0,0");
                        const pDArr = dimStr.split(',').map(v => parseFloat(v.trim()) || 0);
                        pDArr.forEach((v, i) => { if (i < 4) sumaD[i] += v; });
                    });

                    const promedioGlobal = total > 0 ? (sumaGlobal / total) : 0;

                    setDatosGrupales({
                        totalDocentes: total,
                        promedioGlobal: promedioGlobal.toFixed(2),
                        promedioD1: total > 0 ? (sumaD[0] / total).toFixed(2) : 0,
                        promedioD2: total > 0 ? (sumaD[1] / total).toFixed(2) : 0,
                        promedioD3: total > 0 ? (sumaD[2] / total).toFixed(2) : 0,
                        promedioD4: total > 0 ? (sumaD[3] / total).toFixed(2) : 0,
                        distribucionNiveles: { N1, N2, N3, N4 },
                        alertasGlobales: []
                    });
                }

            } catch (e) {
                console.error("Error cargando datos grupales:", e);
            }
        };

        cargarDatosGrupales();
    }, [API_URL, userData]);

    // Cargar respuestas si hay datos existentes
    useEffect(() => {
        if (datosExistentes) {
            setHistorial([datosExistentes]);
            // Si las respuestas están guardadas como string "5,4,3..."
            if (datosExistentes.Reflexion_Punto_Partida && !datosExistentes.Reflexion_Punto_Partida.includes(' ')) {
                const valoresArray = String(datosExistentes.Reflexion_Punto_Partida).split(",");
                const mapaRespuestas = {};
                valoresArray.forEach((valor, index) => {
                    const num = Number(valor.trim());
                    if (!isNaN(num) && num >= 1 && num <= 5) {
                        mapaRespuestas[index + 1] = num;
                    }
                });
                if (Object.keys(mapaRespuestas).length > 0) setRespuestas(mapaRespuestas);
            }
        }
    }, [datosExistentes]);

    // ============================================================
    // CALCULAR RESULTADOS DE LA AUTOEVALUACIÓN DIRECTIVA
    // ============================================================
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
        else if (promedioGlobal >= 3.5) nivel = "Nivel 3: Institución Estratégica";
        else if (promedioGlobal >= 2.5) nivel = "Nivel 2: Integración Inicial";
        else nivel = "Nivel 1: Exploración Institucional";

        const alertas = [];
        if ((respuestas[3] || 0) <= 2 && (respuestas[5] || 0) <= 2) alertas.push("Gobernanza sin estructura formal");
        if ((respuestas[7] || 0) <= 2 || (respuestas[8] || 0) <= 2) alertas.push("Riesgo en formación docente");
        if (parseFloat(promediosD[2].promedio) < 2.5) alertas.push("Bajo impacto pedagógico institucional");

        return { promedioGlobal, promediosD, nivel, alertas };
    };

    // ============================================================
    // GUARDAR AUTOEVALUACIÓN → SOSTENER_Docentes (igual que el módulo docente)
    // ============================================================
    const handleSave = async () => {
        const res = calcularResultados();
        if (!res) return Swal.fire("Incompleto", "Responde todas las preguntas.", "warning");

        setLoading(true);
        const tKey = userData?.Teacher_Key || "KEY-NOT-FOUND";
        const instKey = userData?.Institucion_Key || "INST-GENERAL";

        // Verificamos si ya hay un registro previo del directivo en SOSTENER_Docentes
        const esUpdate = historial.length > 0 && historial[0]?.ID_Sostener;
        const idAUsar = esUpdate
            ? historial[0].ID_Sostener
            : `SOS-${tKey}-${Date.now()}`;

        // Mapeamos igual que el módulo docente original
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
            Institucion_Key: instKey,
            ...respuestasMapeadas,
            Promedio_Global: res.promedioGlobal.toFixed(2),
            Nivel_Calculado: res.nivel,
            "Promedio_D1, Promedio_D2, Promedio_D3, Promedio_D4": `${res.promediosD[0].promedio}, ${res.promediosD[1].promedio}, ${res.promediosD[2].promedio}, ${res.promediosD[3].promedio}`,
            Alertas_Activas: res.alertas.join(" | ") || "Sin Alertas",
            Porcentaje_Crecimiento: "0%",
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

            setHistorial([excelData]);
            setView("dashboard");
            Swal.fire("Éxito", "Autoevaluación institucional guardada en SOSTENER_Docentes.", "success");
        } catch (e) {
            Swal.fire("Error", "Error al sincronizar con Excel.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // GUARDAR CIERRE → SOSTENER_Institucional
    // ============================================================
    const handleFinalSaveCierre = async () => {
        if (!formDataCierre.Prioridad_Estrategica_Anual || formDataCierre.Prioridad_Estrategica_Anual.length < 150) {
            Swal.fire("Acción Incompleta", "La prioridad estratégica debe tener al menos 150 caracteres.", "warning");
            return;
        }

        setLoading(true);
        const comp = getComparativoAtlas();
        const tKey = userData?.Teacher_Key || "KEY-NOT-FOUND";
        const instKey = userData?.Institucion_Key || "INST-GENERAL";

        // ID para SOSTENER_Institucional — diferente del de SOSTENER_Docentes
        const idInstExistente = historial[0]?.ID_Sostener_Inst;
        const idAUsar = idInstExistente || `SOS-INST-${instKey}-${Date.now()}`;
        const esUpdate = !!idInstExistente;

        const { N1, N2, N3, N4 } = datosGrupales.distribucionNiveles;

        const finalData = {
            ID_Sostener_Inst: idAUsar,
            Institucion_Key: instKey,
            Teacher_Key: tKey,
            Fecha_Cierre: new Date().toLocaleDateString('es-ES'),

            // Columnas de SOSTENER_Institucional
            Reflexion_Punto_Partida: formDataCierre.Reflexion_Punto_Partida,
            Estado_Cumplimiento_Asegurar: formDataCierre.Estado_Cumplimiento_Asegurar,
            Analisis_Implementacion: formDataCierre.aprendizajeClave
                ? `${formDataCierre.aprendizajeClave}: ${formDataCierre.Analisis_Implementacion}`
                : formDataCierre.Analisis_Implementacion,
            Nivel_Institucional_Actual: generarDiagnostico(comp.scoreAhora * 20).nivel,
            "Docentes_N1, Docentes_N2, Docentes_N3, Docentes_N4": `${N1}, ${N2}, ${N3}, ${N4}`,
            Porcentaje_Reduccion_Alertas: `${comp.crecimiento}%`,
            Ruta_Elegida: formDataCierre.Ruta_Elegida,
            Prioridad_Estrategica_Anual: formDataCierre.Prioridad_Estrategica_Anual,
            Accion_Gobernanza: formDataCierre.Accion_Gobernanza,
            Indicador_Medible: formDataCierre.Indicador_Medible,
            Fecha_Revision_Institucional: formDataCierre.Fecha_Revision_Institucional,
            Estrategia_Comunicacion: formDataCierre.Estrategia_Comunicacion,

            // Métricas de impacto calculadas automáticamente
            Score_Inicial_Pct: (comp.scoreAntes * 20).toFixed(1),
            Score_Final_Pct: (comp.scoreAhora * 20).toFixed(1),
            Crecimiento_Puntos: comp.crecimiento,
            Total_Docentes_Evaluados: datosGrupales.totalDocentes,
            Promedio_Global_Institucional: datosGrupales.promedioGlobal,

            Status: "Ciclo_Institucional_Completado",
            Fecha_Cierre_Final: new Date().toLocaleString()
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: esUpdate ? "update" : "create",
                    sheet: "SOSTENER_Institucional",
                    idField: "ID_Sostener_Inst",
                    idValue: idAUsar,
                    data: finalData
                })
            });

            if (response.ok) {
                // Actualizamos el historial local para reflejar el nuevo ID
                setHistorial(prev => prev.length > 0
                    ? [{ ...prev[0], ID_Sostener_Inst: idAUsar }]
                    : [{ ID_Sostener_Inst: idAUsar }]
                );

                await Swal.fire({
                    title: "¡Ciclo Institucional Completado!",
                    text: "La hoja de ruta institucional ha sido integrada al ecosistema ATLAS.",
                    icon: "success",
                    confirmButtonColor: "#D4AF37"
                });
                setView("menu");
            } else {
                throw new Error("Error en respuesta del servidor");
            }
        } catch (e) {
            console.error("Error en handleFinalSaveCierre:", e);
            Swal.fire("Error", "No se pudo sincronizar el cierre institucional. Verifica tu conexión.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // CARGAR DATOS DE CIERRE EXISTENTES
    // ============================================================
    const cargarDatosCierreExistentes = async () => {
        if (historial.length === 0) {
            Swal.fire("Sin datos", "No hay un ciclo previo guardado.", "info");
            return;
        }

        setLoading(true);
        try {
            const tKey = userData?.Teacher_Key;
            const response = await fetch(`${API_URL}?sheet=SOSTENER_Institucional&Teacher_Key=${tKey}`);
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                const ultimo = data[0];
                setHistorial(prev => prev.length > 0
                    ? [{ ...prev[0], ...ultimo }]
                    : [ultimo]
                );
                setFormDataCierre({
                    Reflexion_Punto_Partida: ultimo.Reflexion_Punto_Partida || "",
                    Estado_Cumplimiento_Asegurar: ultimo.Estado_Cumplimiento_Asegurar || "",
                    Analisis_Implementacion: ultimo.Analisis_Implementacion?.split(': ')[1] || ultimo.Analisis_Implementacion || "",
                    aprendizajeClave: ultimo.Analisis_Implementacion?.split(': ')[0] || "",
                    Ruta_Elegida: ultimo.Ruta_Elegida || "",
                    Prioridad_Estrategica_Anual: ultimo.Prioridad_Estrategica_Anual || "",
                    Accion_Gobernanza: ultimo.Accion_Gobernanza || "",
                    Indicador_Medible: ultimo.Indicador_Medible || "",
                    Fecha_Revision_Institucional: ultimo.Fecha_Revision_Institucional || "",
                    Estrategia_Comunicacion: ultimo.Estrategia_Comunicacion || ""
                });
                setIsReadOnly(true);
                setCierreStep(1);
                setView("cierre");
            } else {
                // Si no hay en SOSTENER_Institucional, usamos los datos del historial local
                const registro = historial[0];
                setFormDataCierre({
                    Reflexion_Punto_Partida: registro.Reflexion_Punto_Partida || "",
                    Estado_Cumplimiento_Asegurar: registro.Estado_Cumplimiento_Asegurar || "",
                    Analisis_Implementacion: registro.Analisis_Implementacion || "",
                    aprendizajeClave: "",
                    Ruta_Elegida: registro.Ruta_Elegida || "",
                    Prioridad_Estrategica_Anual: registro.Prioridad_Estrategica_Anual || "",
                    Accion_Gobernanza: registro.Accion_Gobernanza || "",
                    Indicador_Medible: registro.Indicador_Medible || "",
                    Fecha_Revision_Institucional: registro.Fecha_Revision_Institucional || "",
                    Estrategia_Comunicacion: registro.Estrategia_Comunicacion || ""
                });
                setIsReadOnly(true);
                setCierreStep(1);
                setView("cierre");
            }
        } catch (e) {
            console.error("Error cargando cierre:", e);
            Swal.fire("Error", "No pudimos conectar con la base de datos.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="sostener-page-wrapper">

            {/* ======================== MENÚ ======================== */}
            {view === "menu" && (
                <div className="sostener-menu animate-fade-in">
                    <div className="sostener-header">
                        <button className="btn-back-atlas" onClick={() => onNavigate('overview')}>⬅ Mapa ATLAS</button>
                        <h2>Misiones de Sostenibilidad Institucional</h2>
                    </div>
                    <div className="sostener-grid-menu">
                        <div className={`sos-card-main ${historial.length > 0 ? 'is-done' : ''}`}>
                            <div className="sos-icon">🏛️</div>
                            <h3>Radar Institucional</h3>
                            <p>Evaluación de gobernanza, competencia docente, datos e impacto institucional 2026.</p>
                            <div className="sos-actions">
                                {historial.length > 0 ? (
                                    <>
                                        <button onClick={() => setView("dashboard")} className="btn-sos-primary">Ver Análisis Institucional</button>
                                        <button onClick={() => setView("cuestionario")} className="btn-sos-secondary">Revisar Evaluación</button>
                                    </>
                                ) : (
                                    <button onClick={() => setView("cuestionario")} className="btn-sos-primary">Iniciar Evaluación Institucional</button>
                                )}
                            </div>
                        </div>

                        <div className={`sos-card-main ${historial.length > 0 ? '' : 'is-locked'}`}>
                            <div className="sos-icon">🔄</div>
                            <h3>Cierre de Ciclo Institucional</h3>
                            <p>Compara la evolución de todos los docentes Antes vs Después.</p>
                            <div className="sos-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                                <button
                                    disabled={historial.length === 0}
                                    className="btn-sos-primary"
                                    onClick={() => {
                                        setFormDataCierre({
                                            Reflexion_Punto_Partida: "",
                                            Estado_Cumplimiento_Asegurar: "",
                                            Analisis_Implementacion: "",
                                            aprendizajeClave: "",
                                            Ruta_Elegida: "",
                                            Prioridad_Estrategica_Anual: "",
                                            Accion_Gobernanza: "",
                                            Indicador_Medible: "",
                                            Fecha_Revision_Institucional: "",
                                            Estrategia_Comunicacion: ""
                                        });
                                        setIsReadOnly(false);
                                        setCierreStep(1);
                                        setView("cierre");
                                    }}
                                >Iniciar Nuevo Cierre</button>
                                <button
                                    disabled={historial.length === 0}
                                    className="btn-sos-secondary"
                                    onClick={cargarDatosCierreExistentes}
                                >Ver Respuestas Anteriores</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================== CUESTIONARIO INSTITUCIONAL ======================== */}
            {view === "cuestionario" && (
                <div className="atl-q-page-container animate-fade-in">
                    <button className="atl-q-btn-back" onClick={() => setView("menu")}>⬅ Volver</button>
                    <div className="atl-q-main-card">
                        <header className="atl-q-header">
                            <h2 className="atl-q-title">Evaluación Institucional de IA</h2>
                            <p className="atl-q-subtitle">Sostener: Consolidación del Marco ATLAS Institucional 2026</p>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
                                Esta evaluación refleja el estado de toda la institución.
                            </p>
                        </header>

                        {dimensiones.map(dim => (
                            <section key={dim.id} className="atl-q-dimension-section">
                                <h3 className="atl-q-dim-title">{dim.nombre}</h3>
                                <div className="atl-q-questions-list">
                                    {dim.preguntas.map(p => (
                                        <div key={p.id} className="atl-q-item-row">
                                            <span className="atl-q-question-text">{p.text}</span>
                                            <div className="atl-q-likert-scale">
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <button
                                                        key={v}
                                                        className={`atl-q-likert-btn ${respuestas[p.id] === v ? 'is-active' : ''} ${v === 5 ? 'is-premium' : ''}`}
                                                        onClick={() => setRespuestas({ ...respuestas, [p.id]: v })}
                                                    >{v}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}

                        <footer className="atl-q-footer">
                            <button className="atl-q-btn-submit" onClick={handleSave} disabled={loading}>
                                {loading ? "Sincronizando con ATLAS..." : "Finalizar y Guardar Evaluación Institucional"}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* ======================== DASHBOARD INSTITUCIONAL ======================== */}
            {view === "dashboard" && historial.length > 0 && (
                <div className="sostener-dashboard animate-fade-in">
                    <button className="btn-sos-back" onClick={() => setView("menu")}>⬅ Menú Principal</button>
                    <div className="sos-dash-layout">

                        {/* PANEL 1: ÍNDICE INSTITUCIONAL GRUPAL */}
                        <div className="sos-dash-top">
                            <div className="sos-stat-card gold">
                                <span className="dash-lider-2026-panel-id">Panel 1 — Institucional</span>
                                <h4>Índice de Sostenibilidad Institucional</h4>
                                <div className="sos-big-val">
                                    {toPct(datosGrupales.promedioGlobal)}%
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#c5a059', marginTop: '8px' }}>
                                    Promedio de <strong>{datosGrupales.totalDocentes}</strong> docentes evaluados
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                                    Media: {datosGrupales.promedioGlobal} / 5 | {generarDiagnostico(toPct(datosGrupales.promedioGlobal)).nivel}
                                </div>
                                <button className="atl-an-btn-main" onClick={() => setShowModal(true)}>
                                    Ver Análisis Institucional
                                </button>
                            </div>

                            <div className="sos-stat-card radar-cont">
                                <h4>Radar Institucional — Promedio de Todos los Docentes</h4>
                                <ResponsiveContainer width="100%" height={250}>
                                    <RadarChart data={[
                                        { s: 'Gobernanza', A: parseFloat(datosGrupales.promedioD1) || 0 },
                                        { s: 'Supervisión', A: parseFloat(datosGrupales.promedioD2) || 0 },
                                        { s: 'Ética/Datos', A: parseFloat(datosGrupales.promedioD3) || 0 },
                                        { s: 'Impacto', A: parseFloat(datosGrupales.promedioD4) || 0 }
                                    ]}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="s" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Radar name="Promedio Institucional" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
                                    </RadarChart>
                                </ResponsiveContainer>

                                <button className="analysis-btn" onClick={() => {
                                    if (analysis) { setShowAnalysis(prev => !prev); return; }
                                    const generated = generateAnalysis();
                                    setAnalysis(generated);
                                    const alertResults = generateAlerts({
                                        item3: parseFloat(datosGrupales.promedioD1) < 2.5 ? 2 : 3,
                                        item5: parseFloat(datosGrupales.promedioD1) < 2.5 ? 2 : 3,
                                        item7: parseFloat(datosGrupales.promedioD2) < 2.5 ? 2 : 3,
                                        item8: parseFloat(datosGrupales.promedioD2) < 2.5 ? 2 : 3,
                                        dim3: parseFloat(datosGrupales.promedioD3),
                                        dim4: parseFloat(datosGrupales.promedioD4),
                                        previousDim4: 3.5
                                    });
                                    setAlerts(alertResults);
                                    setShowAnalysis(true);
                                }}>
                                    {!analysis ? "Generar Análisis Institucional" : showAnalysis ? "Minimizar Análisis" : "Mostrar Análisis"}
                                </button>
                            </div>
                        </div>

                        {/* ANÁLISIS GENERADO */}
                        {analysis && showAnalysis && (
                            <div className="analysis-box">
                                <h3>📊 Recomendaciones Institucionales</h3>
                                {Object.entries(analysis).map(([dim, recs]) => (
                                    <div key={dim} className="dimension-block">
                                        <h4>{dim.toUpperCase()}</h4>
                                        <ul>{recs.map((r, i) => <li key={i}>{r}</li>)}</ul>
                                    </div>
                                ))}
                                {alerts.length > 0 && (
                                    <div className="alerts-box">
                                        <h3>🚨 Alertas Institucionales</h3>
                                        <ul>{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PANEL 2: DISTRIBUCIÓN GRUPAL DE TODOS LOS DOCENTES */}
                        <div className="sos-stat-card real-evidence" onClick={() => setShowModalReal(true)}>
                            <span className="dash-lider-2026-panel-id">Panel 2: Diagnóstico Institucional — Auditoría Grupal</span>
                            <h4>Distribución de Docentes por Nivel de Madurez</h4>
                            <div className="atl-an-metrics-grid">
                                {[
                                    { label: 'Exploración\n(N1)', val: datosGrupales.distribucionNiveles.N1, color: '#f87171' },
                                    { label: 'Integración\n(N2)', val: datosGrupales.distribucionNiveles.N2, color: '#fbbf24' },
                                    { label: 'Estratégico\n(N3)', val: datosGrupales.distribucionNiveles.N3, color: '#34d399' },
                                    { label: 'Referente\n(N4)', val: datosGrupales.distribucionNiveles.N4, color: '#c5a059' }
                                ].map((n, i) => (
                                    <div key={i} className="atl-an-mini-box" style={{ borderTop: `3px solid ${n.color}` }}>
                                        <span className="atl-an-mini-box-val" style={{ color: n.color }}>{n.val}</span>
                                        <span className="atl-an-mini-box-lbl" style={{ whiteSpace: 'pre-line', fontSize: '0.7rem' }}>{n.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                                Total: <strong>{datosGrupales.totalDocentes}</strong> docentes | Promedio global: <strong>{datosGrupales.promedioGlobal}/5</strong>
                            </div>
                            <div className="atl-an-metrics-grid" style={{ marginTop: '8px' }}>
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-mini-box-val">
                                        {selectedFormReal?.puntosMedia
                                            ? (selectedFormReal.puntosMedia * 20).toFixed(2)
                                            : "0.00"}
                                    </span>
                                    <span className="atl-an-mini-box-lbl">Media Auditoría</span>
                                </div>
                                <div className="atl-an-mini-box">
                                    <span className="atl-an-mini-box-val">{selectedFormReal?.totalItems || 0}</span>
                                    <span className="atl-an-mini-box-lbl">Respuestas</span>
                                </div>
                            </div>
                            <button className="atl-an-btn-main-alt">Ver Diagnóstico Detallado</button>
                        </div>

                        {/* MODAL DIAGNÓSTICO GRUPAL */}
                        {showModalReal && (
                            <div className="atl-an-overlay">
                                <div className="audit-modal-container animate-fade-in">
                                    <div className="audit-modal-head">
                                        <div className="audit-modal-header-top">
                                            <div>
                                                <h3>Reporte ATLAS: Diagnóstico Grupal Institucional</h3>
                                                <p className="audit-modal-sub">
                                                    {selectedFormReal?.totalItems || 0} respuestas de {datosGrupales.totalDocentes} docentes
                                                </p>
                                            </div>
                                            <button className="audit-modal-close" onClick={() => setShowModalReal(false)}>✕</button>
                                        </div>
                                        <div className="audit-modal-tabs">
                                            <button className={viewModeReal === 'stats' ? 'active' : ''} onClick={() => setViewModeReal('stats')}>📊 Estadísticas</button>
                                            <button className={viewModeReal === 'survey' ? 'active' : ''} onClick={() => setViewModeReal('survey')}>📝 Ítems</button>
                                            <button className={`compass-tab-unique ${viewModeReal === 'compass' ? 'active' : ''}`} onClick={() => setViewModeReal('compass')}>🧭 Compass</button>
                                        </div>
                                    </div>

                                    <div className="audit-modal-body">
                                        {viewModeReal === 'stats' && (
                                            <div className="audit-stats-view">
                                                <div className="audit-metrics-grid">
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val blue">
                                                            {selectedFormReal?.puntosMedia
                                                                ? (selectedFormReal.puntosMedia * 20).toFixed(2)
                                                                : "0.00"}
                                                        </span>
                                                        <span className="audit-lbl">MEDIA GRUPAL (0-100)</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val green">{datosGrupales.totalDocentes}</span>
                                                        <span className="audit-lbl">TOTAL DOCENTES</span>
                                                    </div>
                                                    <div className="audit-stat-box">
                                                        <span className="audit-val orange">{selectedFormReal?.desviacion || "0.00"}</span>
                                                        <span className="audit-lbl">DESVIACIÓN (Σ)</span>
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                                                        <strong>Distribución por nivel:</strong><br />
                                                        N1 (Exploración): {datosGrupales.distribucionNiveles.N1} | 
                                                        N2 (Integración): {datosGrupales.distribucionNiveles.N2} | 
                                                        N3 (Estratégico): {datosGrupales.distribucionNiveles.N3} | 
                                                        N4 (Referente): {datosGrupales.distribucionNiveles.N4}
                                                    </p>
                                                </div>
                                                <div className="audit-insight-card">
                                                    <h4>Interpretación Grupal</h4>
                                                    <p>
                                                        Una desviación de <strong>{selectedFormReal?.desviacion || "0.00"}</strong> indica que la práctica institucional con IA
                                                        {parseFloat(selectedFormReal?.desviacion) < 1.0
                                                            ? " es altamente consistente entre los docentes."
                                                            : " presenta variaciones notables entre docentes, lo que sugiere necesidad de homogenización."}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {viewModeReal === 'survey' && (
                                            <div className="audit-survey-scroll">
                                                {respuestasAuditarReal.slice(0, 25).map((q, idx) => {
                                                    const puntos = parseFloat(String(q.Puntos_Ganados || "0").replace(',', '.'));
                                                    return (
                                                        <div key={idx} className="audit-item-row">
                                                            <div className="audit-item-info">
                                                                <span className="audit-item-text">{q.Valor_Respondido || `Indicador ${idx + 1}`}</span>
                                                                <span className="audit-item-score">{puntos.toFixed(1)}</span>
                                                            </div>
                                                            <div className="audit-progress-bg">
                                                                <div className="audit-progress-fill" style={{
                                                                    width: `${(puntos / 9) * 100}%`,
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
                                                    {getCompassData(selectedFormReal?.promedioEscala100).nivel}
                                                </div>
                                                <div className="audit-compass-box">
                                                    <h4>Diagnóstico Compass Institucional</h4>
                                                    <p>{getCompassData(selectedFormReal?.promedioEscala100).desc}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="audit-modal-footer">
                                        <button className="audit-btn-close-full" onClick={() => setShowModalReal(false)}>Cerrar Diagnóstico</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PANEL 3: DICTAMEN ÉTICO GRUPAL — TODOS LOS DOCENTES */}
                        <div className={`sos-history-chart audit-ethic-border`} style={{ borderLeftColor: statsPrompt?.color || '#e2e8f0' }}>
                            <span className="dash-lider-2026-panel-id">Panel 3: Fase Liderar — Análisis Grupal</span>
                            <h4>Dictamen de Liderazgo Pedagógico e IA Institucional</h4>

                            {statsPrompt ? (
                                <div className="sos-audit-content">
                                    <div className="sos-audit-head-row">
                                        <div>
                                            <h5 className="sos-audit-title" style={{ color: statsPrompt.color }}>
                                                {statsPrompt.diagnostico}
                                            </h5>
                                            <small>Promedio de {statsPrompt.total} registros | Marco UNESCO 2024 & AI Act</small>
                                        </div>
                                    </div>

                                    <div className="sos-mini-grid-bars">
                                        {[
                                            { l: 'Ética', v: statsPrompt.etica, c: '#8b5cf6' },
                                            { l: 'Privacidad', v: statsPrompt.priv, c: '#06b6d4' },
                                            { l: 'Agencia', v: statsPrompt.agen, c: '#f59e0b' },
                                            { l: 'Cognición', v: statsPrompt.cogn, c: '#ec4899' }
                                        ].map(d => (
                                            <div key={d.l} className="sos-mini-bar-item">
                                                <div className="sos-mini-bar-labels">
                                                    <span>{d.l}</span>
                                                    <strong>{d.v}/5</strong>
                                                </div>
                                                <div className="sos-mini-bar-bg">
                                                    <div className="sos-mini-bar-fill" style={{ width: `${(parseFloat(d.v) / 5) * 100}%`, backgroundColor: d.c }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="sos-dictamen-box">
                                        <strong className="sos-dictamen-tag">🔍 Hallazgos Grupales:</strong>
                                        <p className="sos-dictamen-text">
                                            {parseFloat(statsPrompt.agen) <= 2
                                                ? "⚠️ Alerta institucional: Se detecta delegación excesiva del juicio docente en múltiples participantes. Se requiere refuerzo de supervisión humana."
                                                : "✅ La mayoría de docentes mantiene agencia humana adecuada en sus interacciones con IA."}
                                            <br /><br />
                                            En términos de <strong>Privacidad</strong> (promedio {statsPrompt.priv}/5), la institución
                                            {parseFloat(statsPrompt.priv) >= 4
                                                ? " aplica protocolos seguros de minimización de datos de manera consistente."
                                                : " requiere fortalecer los protocolos de seguridad de datos estudiantiles."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="sos-empty-state">
                                    <p>No se encontraron registros de liderazgo ético. <br />Completa la Fase Liderar para activar este panel grupal.</p>
                                </div>
                            )}
                        </div>

                        {/* PANEL 4: RETOS GRUPALES */}
                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 4</span>
                            <h4>Misiones de Transformación — Estado Global</h4>
                            <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                                Total misiones: <strong>{retos.length}</strong> |
                                Completadas: <strong>{retos.filter(r => ['COMPLETADO', 'COMPLETED'].includes(r.Status_Reto?.toUpperCase())).length}</strong>
                            </div>
                            <div className="retos-summary-grid">
                                {retos.length > 0 ? retos.slice(0, 6).map((r, i) => (
                                    <div key={i} className="reto-mini-card">
                                        <h5>{r.Nombre_Reto}</h5>
                                        <span className={`status-pill ${r.Status_Reto}`}>{r.Status_Reto}</span>
                                        <small>{r.Nivel_UNESCO}</small>
                                    </div>
                                )) : <p>No hay retos registrados en la institución.</p>}
                            </div>
                        </div>

                        {/* PANEL 5: EVOLUCIÓN HISTÓRICA DE SOSTENIBILIDAD GRUPAL */}
                        <div className="sos-history-chart">
                            <span className="dash-lider-2026-panel-id">Panel 5</span>
                            <h4>Estado Actual ATLAS — Promedios Institucionales</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                {[
                                    { label: 'Gobernanza', val: datosGrupales.promedioD1, color: '#8b5cf6' },
                                    { label: 'Supervisión', val: datosGrupales.promedioD2, color: '#06b6d4' },
                                    { label: 'Ética/Datos', val: datosGrupales.promedioD3, color: '#f59e0b' },
                                    { label: 'Impacto', val: datosGrupales.promedioD4, color: '#22c55e' }
                                ].map((d, i) => (
                                    <div key={i} style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '8px', borderTop: `3px solid ${d.color}` }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: d.color }}>{parseFloat(d.val).toFixed(1)}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{d.label}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>/5</div>
                                    </div>
                                ))}
                            </div>
                            <ResponsiveContainer width="100%" height={120}>
                                <RadarChart data={[
                                    { s: 'Gobernanza', A: parseFloat(datosGrupales.promedioD1) },
                                    { s: 'Supervisión', A: parseFloat(datosGrupales.promedioD2) },
                                    { s: 'Ética', A: parseFloat(datosGrupales.promedioD3) },
                                    { s: 'Impacto', A: parseFloat(datosGrupales.promedioD4) }
                                ]}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="s" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Radar dataKey="A" stroke="#c5a059" fill="#c5a059" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================== CIERRE DE CICLO ======================== */}
            {view === "cierre" && (
                <div className="sostener-cuestionario animate-fade-in cierre-full-view">
                    <div className="cierre-nav-header">
                        <button className="btn-sos-back" onClick={() => setView("menu")}>⬅ Salir del Cierre</button>
                        <div className="cierre-stepper">
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} className={`step-pill ${cierreStep >= s ? 'active' : ''} ${cierreStep > s ? 'completed' : ''}`}>
                                    {s < cierreStep ? '✓' : s}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="sos-form-container cierre-main-content">

                        {/* FASE 1: EL ORIGEN INSTITUCIONAL */}
                        {cierreStep === 1 && (
                            <div className="at-cierre-fase-wrapper animate-slide-up">
                                <header className="at-cierre-header-main">
                                    <div className="at-cierre-badge-container">
                                        <span className="at-badge-gold">Fase 1: El Origen Institucional</span>
                                    </div>
                                    <h2 className="at-cierre-title">¿Dónde comenzó el viaje de tu institución?</h2>
                                    <p className="at-cierre-subtitle">
                                        Análisis retrospectivo basado en el Diagnóstico de Auditoría grupal de <strong>{datosAuditoriafase1.totalDocentes}</strong> docentes.</p>
                                </header>

                                <div className="at-cierre-grid-container">
                                    <section className="at-cierre-card-premium at-variant-dark">
                                        <div className="at-card-tag">Estado Inicial Institucional</div>
                                        <div className="at-score-hero-layout">
                                            <div className="at-score-circle">
                                                <span className="at-score-big-num">
                                                    {datosAuditoriafase1.promedioPorcentaje.toFixed(2)}
                                                </span>
                                                <span className="at-score-subtext">Media Global</span>
                                            </div>
                                            <h3 className="at-level-title">
                                                {datosAuditoriafase1.nivelCompassObj.nivel}
                                            </h3>
                                        </div>
                                        <div className="at-description-box">
                                            <p>{datosAuditoriafase1.nivelCompassObj.desc}</p>
                                        </div>
                                        <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                            <small style={{ color: '#c5a059' }}>
                                                📊 {datosAuditoriafase1.totalDocentes} docentes
                                            </small>
                                        </div>
                                    </section>

                                    <section className="at-cierre-card-premium at-variant-white">
                                        <h4 className="at-chart-title">Desempeño Grupal por Dimensión (Inicial)</h4>
                                        <div className="at-vertical-chart-area">
                                            {datasetAuditoria.map((item, idx) => {
                                                const isMin = item.valor === valorMinimo && item.valor < 5;
                                                return (
                                                    <div key={idx} className="at-chart-col">
                                                        <span className="at-col-val">{item.valor.toFixed(1)}</span>
                                                        <div className="at-col-track">
                                                            <div className={`at-col-fill ${isMin ? 'at-is-critical' : ''}`} style={{ height: `${(item.valor / 5) * 100}%` }}>
                                                                {isMin && <span className="at-alert-pulse"></span>}
                                                            </div>
                                                        </div>
                                                        <span className="at-col-label">{item.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {valorMinimo < 3 && (
                                            <div className="at-critical-alert-box">
                                                <span className="at-alert-icon">⚠️</span>
                                                <p>Brecha crítica institucional: <strong>{datasetAuditoria.find(d => d.valor === valorMinimo)?.label}</strong></p>
                                            </div>
                                        )}
                                    </section>
                                </div>

                                {/* CAMPO → Reflexion_Punto_Partida */}
                                <div className="at-cierre-reflection-section">
                                    <div className="at-reflection-header">
                                        <h4>Reflexión sobre el Punto de Partida Institucional</h4>
                                        <ul className="at-reflection-prompts">
                                            <li>¿Qué decisiones institucionales eran más reactivas que estratégicas?</li>
                                            <li>¿Dónde no existía supervisión estructurada del uso de IA?</li>
                                            <li>¿Qué prácticas eran informales o desarticuladas a nivel institucional?</li>
                                        </ul>
                                    </div>
                                    <div className="at-reflection-input-group">
                                        <textarea
                                            className="at-reflection-textarea"
                                            readOnly={isReadOnly}
                                            placeholder="Escribe tu reflexión institucional aquí (mínimo 200 caracteres)..."
                                            value={formDataCierre.Reflexion_Punto_Partida}
                                            onChange={(e) => setFormDataCierre({ ...formDataCierre, Reflexion_Punto_Partida: e.target.value })}
                                        />
                                        <div className={`at-char-counter ${formDataCierre.Reflexion_Punto_Partida.length >= 200 ? 'at-ready' : ''}`}>
                                            <span className="at-counter-number">{formDataCierre.Reflexion_Punto_Partida.length} / 200</span>
                                            <span className="at-counter-label">caracteres requeridos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FASE 2: TRANSFORMACIÓN INSTITUCIONAL */}
                        {cierreStep === 2 && (
                            <div className="at-c2-wrapper animate-slide-up">
                                <header className="at-c2-header-main">
                                    <div className="at-c2-badge-container">
                                        <span className="at-badge-success">Fase 2: Consolidación Institucional</span>
                                    </div>
                                    <h2 className="at-c2-title">La evolución de tu institución</h2>
                                    <p className="at-c2-subtitle">
                                        Mira cuánto han avanzado los {datosGrupales.totalDocentes} docentes desde el diagnóstico inicial.
                                    </p>
                                </header>

                                <div className="at-c2-impact-grid">
                                    <div className="at-c2-card-stats at-variant-dark-gold">
                                        <div className="at-c2-growth-circle">
                                            <span className="at-c2-plus">+</span>
                                            <span className="at-c2-growth-num">{getComparativoAtlas().crecimiento}</span>
                                            <span className="at-c2-percent">%</span>
                                        </div>
                                        <h4>Crecimiento Institucional</h4>
                                        <p>Incremento grupal en madurez pedagógica</p>
                                    </div>

                                    <div className="at-c2-card-stats at-variant-white">
                                        <div className="at-c2-status-row">
                                            <div className="at-c2-status-item at-level-block">
                                                <label>Nivel Institucional Actual</label>
                                                <strong className="at-text-level">{generarDiagnostico(toPct(datosGrupales.promedioGlobal)).nivel}</strong>
                                            </div>
                                            <div className="at-c2-status-item">
                                                <label>Docentes N3+N4</label>
                                                <strong className="at-text-gold">
                                                    {datosGrupales.distribucionNiveles.N3 + datosGrupales.distribucionNiveles.N4}
                                                </strong>
                                            </div>
                                            <div className="at-c2-status-item">
                                                <label>Alertas</label>
                                                <strong className="at-text-forest">-{alerts.length || 0} mitigadas</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Gráfica comparativa Antes (auditoría) vs Ahora (SOSTENER_Docentes grupal) */}
                                <div className="at-c2-comparison-container">
                                    <h4 className="at-c2-chart-title">Análisis Comparativo Grupal: Auditoría Inicial vs Sostenibilidad Actual</h4>
                                    <div className="at-c2-comparison-chart">
                                        {datasetAuditoria.map((item, idx) => (
                                            <div key={idx} className="at-c2-comp-row">
                                                <div className="at-c2-comp-label">{item.label}</div>
                                                <div className="at-c2-dual-track-container">
                                                    <div className="at-c2-track-path">
                                                        <div className="at-c2-bar-before" style={{ width: `${(item.valor / 5) * 100}%` }}>
                                                            <span className="at-c2-bar-label-val">{item.valor.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="at-c2-track-path">
                                                        <div className="at-c2-bar-after" style={{ width: `${(pD[idx] / 5) * 100}%` }}>
                                                            <span className="at-c2-bar-label-val">{(pD[idx] || 0).toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="at-c2-chart-legend">
                                        <span className="at-leg-before">Diagnóstico Inicial (Auditoría)</span>
                                        <span className="at-leg-after">Estado de Sostenibilidad (Promedio Grupal)</span>
                                    </div>
                                </div>

                                {/* CAMPO → Estado_Cumplimiento_Asegurar */}
                                <div className="at-c2-reflection-section">
                                    <div className="at-reflection-header">
                                        <h4>Estado de Cumplimiento Institucional</h4>
                                        <ul className="at-reflection-prompts">
                                            <li>¿Cómo cambió la cultura institucional respecto al uso de IA?</li>
                                            <li>¿Cómo se garantiza ahora supervisión humana explícita a nivel institucional?</li>
                                            <li>¿Qué prácticas ya no dependen de voluntades individuales sino de política institucional?</li>
                                        </ul>
                                    </div>
                                    <div className="at-reflection-input-group">
                                        <textarea
                                            className="at-reflection-textarea"
                                            readOnly={isReadOnly}
                                            placeholder="Describe la transformación institucional (mínimo 300 caracteres)..."
                                            value={formDataCierre.Estado_Cumplimiento_Asegurar}
                                            onChange={(e) => setFormDataCierre({ ...formDataCierre, Estado_Cumplimiento_Asegurar: e.target.value })}
                                        />
                                        <div className={`at-char-counter ${formDataCierre.Estado_Cumplimiento_Asegurar.length >= 300 ? 'at-ready' : ''}`}>
                                            <span className="at-counter-number">{formDataCierre.Estado_Cumplimiento_Asegurar.length} / 300</span>
                                            <span className="at-counter-label">caracteres requeridos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FASE 3: ANÁLISIS DE IMPLEMENTACIÓN */}
                        {cierreStep === 3 && (
                            <div className="at-c3-wrapper animate-slide-up">
                                <header className="at-c2-header-main">
                                    <div className="at-c2-badge-container">
                                        <span className="at-badge-success">Fase 3: Análisis de Implementación Estratégica</span>
                                    </div>
                                    <h2 className="at-c2-title">¿Cómo se ejecutó la estrategia institucional?</h2>
                                    <p className="at-c2-subtitle">
                                        Revisión del diagnóstico directivo y el plan de acción registrado en la fase ASEGURAR.
                                    </p>
                                </header>

                                {/* BLOQUE: DIAGNÓSTICO DIRECTIVO (ASEGURAR_Directivos_Diagnostico) */}
                                {datosAsegurar.diagnostico ? (
                                    <div style={{ marginBottom: '28px' }}>
                                        <h4 style={{ color: '#1a237e', fontSize: '1rem', marginBottom: '14px', borderBottom: '2px solid #c5a059', paddingBottom: '6px' }}>
                                            🧭 Diagnóstico Directivo — Resultados del Radar ASEGURAR
                                        </h4>

                                        {/* Clasificación final */}
                                        <div style={{
                                            background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
                                            borderRadius: '12px', padding: '16px 20px', marginBottom: '16px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                                        }}>
                                            <div>
                                                <span style={{ color: '#c5a059', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                    Clasificación Final del Sistema
                                                </span>
                                                <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, marginTop: '4px' }}>
                                                    {datosAsegurar.diagnostico.Clasificacion_Final || 'Sin clasificación'}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ color: '#c5a059', fontSize: '0.75rem' }}>Puntaje Total Radar</span>
                                                <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700 }}>
                                                    {parseFloat(datosAsegurar.diagnostico.Puntaje_Total_Radar || 0).toFixed(2)}
                                                    <small style={{ fontSize: '0.8rem', color: '#94a3b8' }}></small>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grid de 5 dimensiones */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                                            {[
                                                {
                                                    label: '🏛️ Gobernanza',
                                                    keys: ['Gobernanza_1_Politica', 'Gobernanza_2_Responsable', 'Gobernanza_3_Evaluacion_Htas', 'Gobernanza_4_Protocolo_Incidentes'],
                                                    color: '#8b5cf6'
                                                },
                                                {
                                                    label: '🎓 Competencia Docente',
                                                    keys: ['Competencia_1_Etica', 'Competencia_2_UNESCO_Levels', 'Competencia_3_Plan_Progresivo', 'Competencia_4_Reflexion_Critica'],
                                                    color: '#06b6d4'
                                                },
                                                {
                                                    label: '🔒 Gestión de Datos',
                                                    keys: ['Datos_1_Protocolo_Estudiantes', 'Datos_2_Anonimizacion', 'Datos_3_Terminos_Htas', 'Datos_4_Almacenamiento'],
                                                    color: '#f59e0b'
                                                },
                                                {
                                                    label: '👁️ Supervisión Humana',
                                                    keys: ['Supervision_1_Decision_Humana', 'Supervision_2_No_Automatizada', 'Supervision_3_Monitoreo_IA', 'Supervision_4_Revision_Practicas'],
                                                    color: '#22c55e'
                                                },
                                                {
                                                    label: '📢 Transparencia',
                                                    keys: ['Transparencia_1_Informa_Estud', 'Transparencia_2_Lineamientos_Uso', 'Transparencia_3_Alfabetizacion', 'Transparencia_4_Declaracion_Pub'],
                                                    color: '#ec4899'
                                                }
                                            ].map((dim, i) => {
                                                const valores = dim.keys.map(k => parseFloat(datosAsegurar.diagnostico[k] || 0));
                                                const promDim = valores.reduce((a, b) => a + b, 0) / valores.length;
                                                const pct = (promDim / 4) * 100;
                                                return (
                                                    <div key={i} style={{
                                                        background: 'white', borderRadius: '10px', padding: '12px',
                                                        border: `2px solid ${dim.color}20`,
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                                    }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                                                            {dim.label}
                                                        </div>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: dim.color }}>
                                                            {promDim.toFixed(1)}
                                                            <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/4</small>
                                                        </div>
                                                        <div style={{ marginTop: '6px', height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${pct}%`, background: dim.color, borderRadius: '99px', transition: 'width 0.8s ease' }}></div>
                                                        </div>
                                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>{pct.toFixed(0)}%</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Detalle por ítem de la dimensión más baja */}
                                        {(() => {
                                            const todasDims = [
                                                { label: 'Gobernanza', keys: ['Gobernanza_1_Politica', 'Gobernanza_2_Responsable', 'Gobernanza_3_Evaluacion_Htas', 'Gobernanza_4_Protocolo_Incidentes'] },
                                                { label: 'Competencia', keys: ['Competencia_1_Etica', 'Competencia_2_UNESCO_Levels', 'Competencia_3_Plan_Progresivo', 'Competencia_4_Reflexion_Critica'] },
                                                { label: 'Datos', keys: ['Datos_1_Protocolo_Estudiantes', 'Datos_2_Anonimizacion', 'Datos_3_Terminos_Htas', 'Datos_4_Almacenamiento'] },
                                                { label: 'Supervisión', keys: ['Supervision_1_Decision_Humana', 'Supervision_2_No_Automatizada', 'Supervision_3_Monitoreo_IA', 'Supervision_4_Revision_Practicas'] },
                                                { label: 'Transparencia', keys: ['Transparencia_1_Informa_Estud', 'Transparencia_2_Lineamientos_Uso', 'Transparencia_3_Alfabetizacion', 'Transparencia_4_Declaracion_Pub'] }
                                            ];
                                            const conPromedios = todasDims.map(d => ({
                                                ...d,
                                                prom: d.keys.reduce((acc, k) => acc + parseFloat(datosAsegurar.diagnostico[k] || 0), 0) / d.keys.length
                                            }));
                                            const dimDebil = conPromedios.sort((a, b) => a.prom - b.prom)[0];
                                            return (
                                                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '14px' }}>
                                                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c2410c', marginBottom: '8px' }}>
                                                        ⚠️ Dimensión con mayor brecha institucional: <strong>{dimDebil.label}</strong> ({dimDebil.prom.toFixed(2)}/4)
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {dimDebil.keys.map((k, idx) => {
                                                            const val = parseFloat(datosAsegurar.diagnostico[k] || 0);
                                                            return (
                                                                <div key={idx} style={{
                                                                    background: val <= 2 ? '#fee2e2' : '#f0fdf4',
                                                                    borderRadius: '8px', padding: '6px 10px',
                                                                    fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px'
                                                                }}>
                                                                    <span style={{ fontWeight: 700, color: val <= 2 ? '#dc2626' : '#16a34a' }}>{val}/4</span>
                                                                    <span style={{ color: '#374151' }}>{k.split('_').slice(2).join(' ')}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px', color: '#94a3b8' }}>
                                        <p>📋 No se encontró diagnóstico directivo en ASEGURAR_Directivos_Diagnostico.</p>
                                        <small>Completa primero la fase ASEGURAR para ver este análisis.</small>
                                    </div>
                                )}

                                {/* BLOQUE: PLAN DE ACCIÓN (ASEGURAR_Directivos_Plan_Accion) */}
                                {datosAsegurar.planAccion ? (
                                    <div style={{ marginBottom: '28px' }}>
                                        <h4 style={{ color: '#1a237e', fontSize: '1rem', marginBottom: '14px', borderBottom: '2px solid #c5a059', paddingBottom: '6px' }}>
                                            🏗️ Plan Estratégico de Acción — ASEGURAR
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                            {[
                                                { label: '🎯 Objetivo Estratégico', value: datosAsegurar.planAccion.Objetivo_Estrategico, full: true },
                                                { label: '🛠️ Acciones Seleccionadas', value: datosAsegurar.planAccion.Acciones_Seleccionadas, full: false },
                                                { label: '👤 Responsables', value: datosAsegurar.planAccion.Responsables_Asignados, full: false },
                                                { label: '📅 Cronograma', value: datosAsegurar.planAccion.Cronograma_Estimado, full: false },
                                                { label: '⚡ Prioridad', value: datosAsegurar.planAccion.Dimension_Prioridad_1, full: false },
                                                { label: '📈 Indicadores de Éxito', value: datosAsegurar.planAccion.Indicadores_Exito, full: true }
                                            ].map((campo, i) => campo.value ? (
                                                <div key={i} style={{
                                                    gridColumn: campo.full ? '1 / -1' : 'auto',
                                                    background: 'white', borderRadius: '10px', padding: '14px',
                                                    border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                                                }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                                                        {campo.label}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                                        {campo.value}
                                                    </div>
                                                </div>
                                            ) : null)}
                                        </div>

                                        {/* Barra de estado del plan */}
                                        <div style={{
                                            marginTop: '14px', padding: '12px 16px',
                                            background: 'linear-gradient(90deg, #f0fdf4, #dcfce7)',
                                            borderRadius: '10px', border: '1px solid #86efac',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
                                        }}>
                                            <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>
                                                ✅ Plan estratégico registrado — Estado: {datosAsegurar.planAccion.Status || 'COMPLETADO'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                Prioridad: <strong>{datosAsegurar.planAccion.Dimension_Prioridad_1 || '—'}</strong>
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px', color: '#94a3b8' }}>
                                        <p>📋 No se encontró plan de acción en ASEGURAR_Directivos_Plan_Accion.</p>
                                        <small>Completa primero la fase ASEGURAR para ver este análisis.</small>
                                    </div>
                                )}

                                {/* SELECTOR DE APRENDIZAJE CLAVE (se mantiene) */}
                                
                                {/* CAMPO → Analisis_Implementacion */}
                                <div className="at-c2-reflection-section">
                                    <div className="at-reflection-header">
                                        <h4>Análisis de la Implementación Institucional</h4>
                                        <p className="at-reflection-subtext">
                                            Con base en el diagnóstico y el plan de acción mostrados arriba, describe cómo se ejecutaron las acciones y cuál fue su nivel de cumplimiento institucional.
                                        </p>
                                    </div>
                                    <div className="at-reflection-input-group">
                                        <textarea
                                            className="at-reflection-textarea"
                                            readOnly={isReadOnly}
                                            placeholder="Analiza la implementación institucional (mínimo 150 caracteres)..."
                                            value={formDataCierre.Analisis_Implementacion}
                                            onChange={(e) => setFormDataCierre({ ...formDataCierre, Analisis_Implementacion: e.target.value })}
                                        />
                                        <div className={`at-char-counter ${formDataCierre.Analisis_Implementacion.length >= 150 ? 'at-ready' : ''}`}>
                                            <span className="at-counter-number">{formDataCierre.Analisis_Implementacion.length} / 150</span>
                                            <span className="at-counter-label">caracteres</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FASE 4: CERTIFICACIÓN INSTITUCIONAL */}
                        {cierreStep === 4 && (
                            <div className="at-c4-wrapper animate-slide-up">
                                <header className="at-c4-header-main">
                                    <div className="at-c4-badge-container">
                                        <span className="at-badge-gold">Certificación Institucional ATLAS 2026</span>
                                    </div>
                                    <h2 className="at-c4-title">Evolución Institucional ATLAS</h2>
                                    <p className="at-c4-subtitle">Consolidación de evidencias grupales: De la Auditoría a la Sostenibilidad Colectiva.</p>
                                </header>

                                <div className="at-c4-report-card">
                                    <div className="at-c4-report-header">
                                        <div className="at-c4-logo-section">
                                            <div className="at-c4-brand">ATLAS <span>PROJECT</span></div>
                                            <div className="at-c4-docente-info">
                                                <strong>INSTITUCIÓN:</strong> {userData?.Institucion_Key}<br />
                                                <strong>DIRECTIVO:</strong> {userData?.Nombre} | {new Date().toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="at-c4-stamp-seal">
                                            <div className="seal-inner">2026</div>
                                            <span>CERTIFICADO</span>
                                        </div>
                                    </div>

                                    {(() => {
                                        const comp = getComparativoAtlas();
                                        const pctInicial = (comp.scoreAntes * 20).toFixed(1);
                                        const pctActual = toPct(datosGrupales.promedioGlobal);
                                        return (
                                            <div className="at-c4-comparison-layout">
                                                <div className="at-c4-col-before">
                                                    <h4 className="at-c4-col-title">Punto de Partida Grupal</h4>
                                                    <div className="at-c4-main-metric">
                                                        <span className="at-val">{pctInicial}<small className="at-symbol-pct">%</small></span>
                                                        <span className="at-lbl">Diagnóstico Inicial</span>
                                                    </div>
                                                    <div className="at-c4-status-desc">
                                                        <strong>Nivel: {comp.nivelAntes}</strong>
                                                        <p>{getCompassData(comp.scoreAntes * 20).desc}</p>
                                                    </div>
                                                    <div className="at-c4-mini-stats">
                                                        <span>Docentes evaluados: {datosGrupales.totalDocentes}</span>
                                                        <span>Media auditoría: {comp.scoreAntes.toFixed(2)}/5</span>
                                                    </div>
                                                </div>

                                                <div className="at-c4-divider">
                                                    <div className="at-c4-impact-orb">
                                                        <span className="at-orb-plus">+</span>
                                                        <span className="at-orb-val">{comp.crecimiento}</span>
                                                        <span className="at-orb-pct">%</span>
                                                    </div>
                                                    <div className="at-c4-missions-badge">
                                                        <strong>{retos.filter(r => ['COMPLETADO', 'COMPLETED'].includes(r.Status_Reto?.toUpperCase())).length}</strong>
                                                        <span>Misiones</span>
                                                    </div>
                                                </div>

                                                <div className="at-c4-col-after">
                                                    <h4 className="at-c4-col-title">Madurez Institucional Actual</h4>
                                                    <div className="at-c4-main-metric gold">
                                                        <span className="at-val">{pctActual}<small className="at-symbol-pct">%</small></span>
                                                        <span className="at-lbl">Promedio Grupal Actual</span>
                                                    </div>
                                                    <div className="at-c4-status-desc">
                                                        <strong>{generarDiagnostico(pctActual).nivel}</strong>
                                                        <p>{generarDiagnostico(pctActual).texto}</p>
                                                    </div>
                                                    <div className="at-c4-mini-stats">
                                                        <span className="at-text-gold">N3+N4: {datosGrupales.distribucionNiveles.N3 + datosGrupales.distribucionNiveles.N4} docentes</span>
                                                        <span className="at-text-gold">Promedio: {datosGrupales.promedioGlobal}/5</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Narrativa */}
                                    <div className="at-c4-narrative-section">
                                        <h5 className="at-section-subtitle">Trayectoria Reflexiva Institucional</h5>
                                        <div className="at-narrative-grid">
                                            <div className="at-narrative-box">
                                                <label>Visión Inicial</label>
                                                <p>{formDataCierre.Reflexion_Punto_Partida.length > 5
                                                    ? `"${formDataCierre.Reflexion_Punto_Partida.substring(0, 200)}..."`
                                                    : `Al inicio, la institución presentaba una brecha crítica en ${datasetAuditoria.find(d => d.valor === Math.min(...datasetAuditoria.map(i => i.valor)))?.label}.`
                                                }</p>
                                            </div>
                                            <div className="at-narrative-box gold">
                                                <label>Visión Transformada</label>
                                                <p>{formDataCierre.Estado_Cumplimiento_Asegurar.length > 5
                                                    ? `"${formDataCierre.Estado_Cumplimiento_Asegurar.substring(0, 200)}..."`
                                                    : "A través del ciclo ATLAS, se han consolidado prácticas institucionales de supervisión humana activa."
                                                }</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auditoría ética grupal */}
                                    {statsPrompt && (
                                        <div className="at-c4-ethic-summary">
                                            <h5><span className="dot l"></span> Dictamen de Liderazgo Ético UNESCO — Grupal</h5>
                                            <div className="at-c4-ethic-bars">
                                                {[
                                                    { l: 'Privacidad y Seguridad', v: statsPrompt.priv, c: '#06b6d4' },
                                                    { l: 'Agencia Humana', v: statsPrompt.agen, c: '#f59e0b' },
                                                    { l: 'Propósito Pedagógico', v: statsPrompt.etica, c: '#8b5cf6' }
                                                ].map(d => (
                                                    <div key={d.l} className="at-c4-bar-row">
                                                        <div className="at-bar-label"><span>{d.l}</span> <strong>{d.v}/5</strong></div>
                                                        <div className="at-bar-track">
                                                            <div className="at-bar-fill" style={{ width: `${(parseFloat(d.v) / 5) * 100}%`, backgroundColor: d.c }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="at-c4-hallazgo-box">
                                                <strong>Análisis UNESCO 2026 (Grupal):</strong> {parseFloat(statsPrompt.agen) <= 2
                                                    ? "Se detectó inicialmente delegación de juicio docente en múltiples participantes. El ciclo ATLAS ha fortalecido la autonomía colectiva."
                                                    : "La institución demuestra agencia humana sólida en la mayoría de docentes. Se cumple con los estándares de integridad digital UNESCO."}
                                            </div>
                                        </div>
                                    )}

                                    {/* Misiones completadas */}
                                    <div className="at-c4-double-stats">
                                        <div className="at-c4-tech-block">
                                            <h5><span className="dot t"></span> Misiones Superadas</h5>
                                            <div className="at-c4-tags-container">
                                                {retos.filter(r => ['COMPLETADO', 'COMPLETED'].includes(r.Status_Reto?.toUpperCase())).length > 0 ? (
                                                    retos.filter(r => ['COMPLETADO', 'COMPLETED'].includes(r.Status_Reto?.toUpperCase())).map((r, i) => (
                                                        <div key={i} className="at-mission-card-mini">
                                                            <span className="check">✓</span>
                                                            <div className="info">
                                                                <strong>{r.Nombre_Reto}</strong>
                                                                <small>{r.Nivel_UNESCO || 'Nivel Avanzado'}</small>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : <p className="at-empty-text">No se registraron misiones completadas aún.</p>}
                                            </div>
                                        </div>

                                        <div className="at-c4-alerts-section">
                                            <h5><span className="dot a"></span> Gestión de Riesgos Institucionales</h5>
                                            <div className="at-c4-alerts-grid">
                                                {alerts.length > 0 ? alerts.slice(0, 2).map((a, i) => (
                                                    <div key={i} className="at-alert-item-resolved">
                                                        <span className="icon">🛡️</span>
                                                        <p>{a}</p>
                                                    </div>
                                                )) : (
                                                    <div className="at-alert-item-resolved success">
                                                        <span className="icon">✅</span>
                                                        <p>Ciclo finalizado sin brechas de seguridad activas.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Indicadores de calidad */}
                                    <div className="at-c4-quality-checks">
                                        <div className="at-check-row">
                                            <span className={`pill ${parseFloat(statsPrompt?.priv) >= 3 ? 'on' : ''}`}>🛡️ Privacidad UNESCO</span>
                                            <span className={`pill ${parseFloat(statsPrompt?.agen) >= 3 ? 'on' : ''}`}>👤 Agencia Humana</span>
                                            <span className={`pill ${parseFloat(selectedFormReal?.desviacion) < 1.8 ? 'on' : ''}`}>📊 Consistencia ATLAS</span>
                                            <span className={`pill ${datosGrupales.totalDocentes > 0 ? 'on' : ''}`}>♻️ Sostenibilidad</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                            🏅 <strong>Certificado Institucional Descargable — Próximamente disponible</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FASE 5: HOJA DE RUTA INSTITUCIONAL */}
                        {cierreStep === 5 && (() => {
                            const m = getMetricasAuditoria();
                            const dims = [
                                { nombre: 'Gobernanza', valor: parseFloat(m.uso) },
                                { nombre: 'Competencia Docente', valor: parseFloat(m.etica) },
                                { nombre: 'Protección de Datos', valor: parseFloat(m.impacto) },
                                { nombre: 'Impacto y Transparencia', valor: parseFloat(m.desarrollo) }
                            ];
                            const oportunidad = [...dims].sort((a, b) => a.valor - b.valor)[0]?.nombre;
                            const nivelActual = parseFloat(datosGrupales.promedioGlobal);
                            const sugiereCertificacion = nivelActual >= 3.8;

                            return (
                                <div className="at-c5-roadmap-container animate-slide-up">
                                    <div className="at-c5-header">
                                        <span className="at-c5-badge">Fase 5: Proyección Institucional</span>
                                        <h2 className="at-c5-title">Decisión Estratégica Institucional</h2>
                                        <div className="at-c5-insight-box">
                                            <span className="at-c5-insight-label">Diagnóstico Automático:</span>
                                            <p>Nivel institucional promedio: <strong>{nivelActual.toFixed(2)}/5 ({toPct(nivelActual)}%)</strong> →
                                                {sugiereCertificacion
                                                    ? <span style={{ color: '#22c55e' }}> ✅ Se sugiere avanzar hacia Certificación ATLAS</span>
                                                    : <span style={{ color: '#f59e0b' }}> 🔷 Se sugiere Consolidar y Sostener primero</span>
                                                }
                                            </p>
                                            <p>Dimensión con mayor oportunidad de mejora: <strong>{oportunidad}</strong></p>
                                            <p>Docentes en niveles estratégicos (N3+N4): <strong>{datosGrupales.distribucionNiveles.N3 + datosGrupales.distribucionNiveles.N4} de {datosGrupales.totalDocentes}</strong></p>
                                        </div>
                                    </div>

                                    <div className="at-c5-roadmap-card">
                                        {/* SELECTOR DE RUTA → Ruta_Elegida */}
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                                            {['Ruta A: Sostener y Consolidar', 'Ruta B: Avanzar hacia Certificación ATLAS'].map(ruta => (
                                                <button
                                                    key={ruta}
                                                    disabled={isReadOnly}
                                                    onClick={() => setFormDataCierre({ ...formDataCierre, Ruta_Elegida: ruta })}
                                                    style={{
                                                        flex: 1, minWidth: '200px', padding: '14px 16px', borderRadius: '12px',
                                                        border: '2px solid',
                                                        borderColor: formDataCierre.Ruta_Elegida === ruta ? '#15203c' : '#e2e8f0',
                                                        background: formDataCierre.Ruta_Elegida === ruta ? '#15203c' : 'white',
                                                        color: formDataCierre.Ruta_Elegida === ruta ? 'white' : '#64748b',
                                                        cursor: isReadOnly ? 'default' : 'pointer',
                                                        fontWeight: 600, fontSize: '0.9rem', position: 'relative'
                                                    }}
                                                >
                                                    {formDataCierre.Ruta_Elegida === ruta ? '✅ ' : '☐ '}{ruta}
                                                    {((ruta.includes('Consolidar') && !sugiereCertificacion) || (ruta.includes('Certificación') && sugiereCertificacion)) && (
                                                        <span style={{
                                                            position: 'absolute', top: '-10px', right: '10px',
                                                            background: '#c5a059', color: 'white',
                                                            fontSize: '0.65rem', padding: '2px 8px', borderRadius: '99px'
                                                        }}>SUGERIDA</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="at-c5-form-grid">
                                            {/* 1. PRIORIDAD → Prioridad_Estrategica_Anual */}
                                            <div className="at-c5-field full">
                                                <label className="at-c5-label">
                                                    1️⃣ Prioridad estratégica institucional (próximos 12 meses):
                                                    <span className={formDataCierre.Prioridad_Estrategica_Anual?.length < 150 ? "at-char-count error" : "at-char-count"}>
                                                        ({formDataCierre.Prioridad_Estrategica_Anual?.length || 0}/150 caracteres)
                                                    </span>
                                                </label>
                                                <textarea
                                                    className="at-c5-textarea"
                                                    readOnly={isReadOnly}
                                                    placeholder="¿Cuál es la prioridad estratégica institucional principal? (mínimo 150 caracteres)"
                                                    value={formDataCierre.Prioridad_Estrategica_Anual}
                                                    onChange={(e) => setFormDataCierre({ ...formDataCierre, Prioridad_Estrategica_Anual: e.target.value })}
                                                />
                                            </div>

                                            {/* 2. GOBERNANZA → Accion_Gobernanza */}
                                            <div className="at-c5-field full">
                                                <label className="at-c5-label">2️⃣ Acción concreta a nivel de gobernanza:</label>
                                                <textarea
                                                    className="at-c5-textarea"
                                                    readOnly={isReadOnly}
                                                    placeholder="¿Qué acción específica de gobernanza implementará la institución?"
                                                    value={formDataCierre.Accion_Gobernanza}
                                                    onChange={(e) => setFormDataCierre({ ...formDataCierre, Accion_Gobernanza: e.target.value })}
                                                />
                                            </div>

                                            {/* 3. INDICADOR → Indicador_Medible */}
                                            <div className="at-c5-field">
                                                <label className="at-c5-label">3️⃣ Indicador medible:</label>
                                                <input
                                                    type="text"
                                                    className="at-c5-input"
                                                    readOnly={isReadOnly}
                                                    placeholder="¿Cómo medirá la institución el éxito?"
                                                    value={formDataCierre.Indicador_Medible}
                                                    onChange={(e) => setFormDataCierre({ ...formDataCierre, Indicador_Medible: e.target.value })}
                                                />
                                            </div>

                                            {/* 4. FECHA → Fecha_Revision_Institucional */}
                                            <div className="at-c5-field">
                                                <label className="at-c5-label">4️⃣ Calendario de revisión institucional:</label>
                                                <input
                                                    type="date"
                                                    className="at-c5-input-date"
                                                    readOnly={isReadOnly}
                                                    value={formDataCierre.Fecha_Revision_Institucional}
                                                    onChange={(e) => setFormDataCierre({ ...formDataCierre, Fecha_Revision_Institucional: e.target.value })}
                                                />
                                            </div>

                                            {/* 5. COMUNICACIÓN → Estrategia_Comunicacion */}
                                            <div className="at-c5-field full">
                                                <label className="at-c5-label">5️⃣ Estrategia de comunicación institucional de IA:</label>
                                                <textarea
                                                    className="at-c5-textarea"
                                                    readOnly={isReadOnly}
                                                    placeholder="¿Cómo comunicará la institución el uso responsable de IA a toda la comunidad educativa?"
                                                    value={formDataCierre.Estrategia_Comunicacion}
                                                    onChange={(e) => setFormDataCierre({ ...formDataCierre, Estrategia_Comunicacion: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="at-c5-footer-quote">
                                            <div className="at-quote-line"></div>
                                            <p className="at-main-quote">"Sostener no es repetir acciones. Es institucionalizar buenas prácticas."</p>
                                            <p className="at-sub-quote">Esta hoja de ruta guiará el próximo ciclo ATLAS institucional y se guardará en SOSTENER_Institucional.</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* NAVEGACIÓN INFERIOR */}
                        <div className="cierre-actions-footer">
                            {cierreStep > 1 && (
                                <button className="btn-sos-secondary" onClick={() => setCierreStep(cierreStep - 1)}>
                                    Anterior
                                </button>
                            )}
                            <button
                                className="btn-sos-primary btn-large"
                                disabled={loading}
                                onClick={() => {
                                    if (cierreStep === 5) {
                                        isReadOnly ? setView("menu") : handleFinalSaveCierre();
                                    } else {
                                        setCierreStep(cierreStep + 1);
                                    }
                                }}
                            >
                                {loading ? "Guardando..." : cierreStep === 5
                                    ? (isReadOnly ? "Finalizar Consulta" : "Finalizar Ciclo Institucional e Integrar")
                                    : "Siguiente Etapa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================== MODAL ANÁLISIS INSTITUCIONAL ======================== */}
            {showModal && (
                <div className="atl-an-overlay">
                    <div className="atl-an-modal wide animate-fade-in">
                        <div className="atl-an-modal-head">
                            <div className="atl-an-modal-head-flex">
                                <div>
                                    <h3>Reporte Institucional: {userData?.Institucion_Key}</h3>
                                    <p className="atl-an-modal-sub">
                                        Marco COMPASS — Ciclo Sostener Institucional 2026 ({datosGrupales.totalDocentes} docentes)
                                    </p>
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
                                            <span className="atl-an-val-primary">{toPct(datosGrupales.promedioGlobal)}%</span>
                                            <span className="atl-an-lbl">MEDIA GRUPAL GLOBAL</span>
                                        </div>
                                        <div className="atl-an-mini-box-dark">
                                            <span className="atl-an-val-small">{generarDiagnostico(toPct(datosGrupales.promedioGlobal)).nivel}</span>
                                            <span className="atl-an-lbl">NIVEL INSTITUCIONAL</span>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                                            {[
                                                { l: 'N1', v: datosGrupales.distribucionNiveles.N1, c: '#f87171' },
                                                { l: 'N2', v: datosGrupales.distribucionNiveles.N2, c: '#fbbf24' },
                                                { l: 'N3', v: datosGrupales.distribucionNiveles.N3, c: '#34d399' },
                                                { l: 'N4', v: datosGrupales.distribucionNiveles.N4, c: '#c5a059' }
                                            ].map(n => (
                                                <div key={n.l}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: n.c }}>{n.v}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Nivel {n.l}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="atl-an-insight-card-individual">
                                        <h4 className="insight-title">💡 Diagnóstico Institucional</h4>
                                        <p className="insight-text">{generarDiagnostico(toPct(datosGrupales.promedioGlobal)).texto}</p>
                                        <h4 className="insight-sub-title">🔍 Implicación</h4>
                                        <p className="insight-sub-text">{generarDiagnostico(toPct(datosGrupales.promedioGlobal)).implicacion}</p>
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
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                                Promedio grupal: {pD[i].toFixed(2)}/5
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="atl-an-btn-full" onClick={() => setShowModal(false)}>
                                Cerrar Reporte Institucional
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuloSostenerDirectivo;