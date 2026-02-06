import React, { useState, useEffect } from "react";
import "../Styles/analisis.css"; 

export const Analisis = ({ userData, API_URL }) => {
    const [formulariosAgrupados, setFormulariosAgrupados] = useState({});
    const [selectedForm, setSelectedForm] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchRespuestas();
    }, []);

    const fetchRespuestas = async () => {
        try {
            const res = await fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${userData.Teacher_Key}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                procesarDatos(data);
            }
        } catch (e) {
            console.error("Error al cargar respuestas", e);
        }
    };

    const procesarDatos = (data) => {
        // Agrupamos primero por Formulario y luego por el ID de envío único para consolidar puntos
        const agrupado = data.reduce((acc, resp) => {
            const formId = resp.ID_Form;
            const envioId = resp.ID_Envio || resp.Timestamp; // Usar ID_Envio para no contar preguntas individuales

            if (!acc[formId]) {
                acc[formId] = {
                    id: formId,
                    nombre: resp.Nombre_Formulario || "Instrumento ATLAS",
                    envios: {} // Usamos un objeto para consolidar por ID_Envio
                };
            }

            // Consolidamos el puntaje por envío (sumamos o promediamos según tu lógica de BD)
            // Aquí asumimos que Puntos_Ganados viene por pregunta, así que sumamos para tener el total del envío
            if (!acc[formId].envios[envioId]) {
                acc[formId].envios[envioId] = 0;
            }
            acc[formId].envios[envioId] += parseFloat(resp.Puntos_Ganados || 0);

            return acc;
        }, {});

        // Convertimos los envios en un array de puntajes finales por cada vez que se llenó el formulario
        const finalData = {};
        Object.keys(agrupado).forEach(key => {
            finalData[key] = {
                id: agrupado[key].id,
                nombre: agrupado[key].nombre,
                puntajes: Object.values(agrupado[key].envios)
            };
        });

        setFormulariosAgrupados(finalData);
    };

    const calcularEstadisticas = (puntajes) => {
        const n = puntajes.length;
        const suma = puntajes.reduce((a, b) => a + b, 0);
        const promedio = (suma / n).toFixed(2);
        
        // Moda
        const frecuencias = {};
        puntajes.forEach(p => frecuencias[p] = (frecuencias[p] || 0) + 1);
        const moda = Object.keys(frecuencias).reduce((a, b) => frecuencias[a] > frecuencias[b] ? a : b);

        // Desviación Estándar
        const varianza = puntajes.reduce((a, b) => a + Math.pow(b - promedio, 2), 0) / n;
        const desviacion = Math.sqrt(varianza).toFixed(2);

        return { promedio, n, moda, desviacion };
    };

    const abrirAnalisis = (formId) => {
        const formulario = formulariosAgrupados[formId];
        const stats = calcularEstadisticas(formulario.puntajes);
        const conclusiones = generarConclusiones(stats.promedio, stats.desviacion);

        setSelectedForm({
            ...formulario,
            ...stats,
            conclusiones
        });
        setShowModal(true);
    };

    const generarConclusiones = (prom, desv) => {
        const p = parseFloat(prom);
        const d = parseFloat(desv);

        // Caso 1: Alto rendimiento y alta consistencia
        if (p >= 90 && d <= 5) {
            return {
                nivel: "Dominio Maestro",
                desc: `Tu media de ${p}% con una dispersión mínima (${d}) indica que has estandarizado tus procesos bajo el marco ATLAS con éxito total. La moda de los resultados refleja una tendencia constante hacia la excelencia.`
            };
        }
        // Caso 2: Rendimiento alto pero inestable
        if (p >= 80 && d > 10) {
            return {
                nivel: "Rendimiento Volátil",
                desc: `Aunque tu promedio es alto (${p}%), la desviación de ${d} sugiere que existen variaciones críticas entre una aplicación y otra. Tu práctica no es uniforme; algunos criterios se cumplen al máximo mientras otros flaquean.`
            };
        }
        // Caso 3: Desempeño promedio/operativo
        if (p >= 70 && p < 90) {
            return {
                nivel: "Capacidad Operativa",
                desc: `Te encuentras en un nivel sólido. Con un promedio de ${p}%, el sistema detecta que los fundamentos están presentes, pero la desviación indica que aún falta ajustar los detalles técnicos para llegar a la excelencia estratégica.`
            };
        }
        // Caso 4: Desviación Estándar muy alta (Falta de criterio)
        if (d > 20) {
            return {
                nivel: "Inconsistencia de Proceso",
                desc: `Alerta: La desviación estándar (${d}) es demasiado alta respecto a tu media de ${p}%. Esto significa que no hay un patrón claro en tus respuestas; estás experimentando resultados muy dispares en el instrumento.`
            };
        }
        // Caso 5: Nivel Inicial / Bajo
        return {
            nivel: "Fase de Alineación",
            desc: `Tu media actual de ${p}% y moda reflejan que el instrumento aún está en fase de aprendizaje. La estadística sugiere revisar los puntos clave donde la puntuación es baja para reducir la brecha de madurez digital.`
        };
    };

    return (
        <div className="atl-an-container">

            <div className="atl-an-grid">
                {Object.values(formulariosAgrupados).map(form => (
                    <div key={form.id} className="atl-an-card">
                        <div className="atl-an-card-info">
                            <h4>{form.nombre}</h4>
                            <small className="user-key-tag">ID: {form.id}</small>
                        </div>
                        
                        <div className="atl-an-stats-row">
                            <div className="atl-an-mini-box">
                                <span className="atl-an-val">{form.puntajes.length}</span>
                                <span className="atl-an-lbl">Envíos Totales</span>
                            </div>
                            <div className="atl-an-mini-box">
                                <span className="atl-an-val">
                                    {(form.puntajes.reduce((a,b)=>a+b,0)/form.puntajes.length).toFixed(0)}%
                                </span>
                                <span className="atl-an-lbl">Media (μ)</span>
                            </div>
                        </div>

                        <button className="atl-an-btn-main" onClick={() => abrirAnalisis(form.id)}>
                            Ver Diagnóstico Estadístico
                        </button>
                    </div>
                ))}
            </div>

            {showModal && selectedForm && (
                <div className="atl-an-overlay">
                    <div className="atl-an-modal">
                        <div className="atl-an-modal-head">
                            <h3>Reporte ATLAS: {selectedForm.nombre}</h3>
                            <button className="atl-an-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div className="atl-an-metrics-grid">
                            <div className="atl-an-mini-box dark">
                                <span className="atl-an-val blue">{selectedForm.promedio}%</span>
                                <span className="atl-an-lbl">Media (μ)</span>
                            </div>
                            <div className="atl-an-mini-box dark">
                                <span className="atl-an-val green">{selectedForm.moda}%</span>
                                <span className="atl-an-lbl">Moda (Mo)</span>
                            </div>
                            <div className="atl-an-mini-box dark">
                                <span className="atl-an-val gold">{selectedForm.desviacion}</span>
                                <span className="atl-an-lbl">Desv. (σ)</span>
                            </div>
                        </div>

                        <div className="atl-an-progress-section">
                            <label className="atl-an-lbl">Posicionamiento en Curva de Rendimiento</label>
                            <div className="atl-an-bar-bg">
                                <div className="atl-an-bar-fill" style={{ width: `${selectedForm.promedio}%` }}></div>
                            </div>
                        </div>

                        <div className="atl-an-insight-card">
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                                <span style={{fontSize: '1.5rem'}}>💡</span>
                                <h5 style={{margin: 0, color: '#2d3748'}}>Interpretación de Datos</h5>
                            </div>
                            <p className="atl-an-nivel" style={{color: 'var(--atlas-accent)', fontSize: '1.1rem'}}>{selectedForm.conclusiones.nivel}</p>
                            <p className="atl-an-desc" style={{lineHeight: '1.6', color: '#4a5568'}}>
                                {selectedForm.conclusiones.desc}
                            </p>
                            <p style={{fontSize: '0.7rem', color: '#a0aec0', marginTop: '15px', fontStyle: 'italic', borderTop: '1px solid #e2e8f0', paddingTop: '10px'}}>
                                * Este análisis utiliza {selectedForm.n} muestras de envío para calcular la varianza y la consistencia operativa.
                            </p>
                        </div>

                        <button className="atl-an-btn-main" onClick={() => setShowModal(false)}>Cerrar Reporte</button>
                    </div>
                </div>
            )}
        </div>
    );
};