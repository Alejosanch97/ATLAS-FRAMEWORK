import React, { useState, useEffect } from 'react';
import '../Styles/responderFormularios.css'; 

// Se agrega onNavigate a las props
export const ResponderFormularios = ({ userData, API_URL, setIsSyncing, isSyncing, filterPhase, onNavigate }) => {
    const [availableForms, setAvailableForms] = useState([]);
    const [userAnswers, setUserAnswers] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [currentResponses, setCurrentResponses] = useState({});
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchInitialData();
    }, [filterPhase]); // Recargar si cambia la fase seleccionada

    const fetchInitialData = async () => {
        setIsSyncing(true);
        try {
            const resForms = await fetch(`${API_URL}?sheet=Config_Formularios`);
            const forms = await resForms.json();
            const resAnswers = await fetch(`${API_URL}?sheet=Respuestas_Usuarios&user_key=${userData?.Teacher_Key}`);
            const answers = await resAnswers.json();
            
            if (Array.isArray(forms)) {
                // LÓGICA DE FILTRADO
                if (filterPhase) {
                    // Si hay una fase activa (A, T o L), filtramos los formularios
                    const filtered = forms.filter(f => f.Fase_ATLAS === filterPhase);
                    setAvailableForms(filtered);
                } else {
                    // Si no hay fase (ADMIN en Explorador), mostramos todos
                    setAvailableForms(forms);
                }
            }
            
            if (Array.isArray(answers)) setUserAnswers(answers);
        } catch (e) {
            console.error("Error cargando datos:", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const isFormAnswered = (formId) => userAnswers.some(ans => ans.ID_Form === formId);
    
    // Estos arrays dependen de availableForms ya filtrado por fase
    const pendingForms = availableForms.filter(f => !isFormAnswered(f.ID_Form));
    const completedForms = availableForms.filter(f => isFormAnswered(f.ID_Form));

    const handleOpenForm = async (form) => {
        setIsSyncing(true);
        try {
            const res = await fetch(`${API_URL}?sheet=Config_Preguntas`);
            const allQuestions = await res.json();
            const filteredQuestions = allQuestions.filter(q => q.ID_Form === form.ID_Form);
            setSelectedForm({ ...form, questions: filteredQuestions });
            setCurrentResponses({}); 
        } catch (e) {
            alert("Error al cargar preguntas");
        } finally {
            setIsSyncing(false);
        }
    };

    const splitOptions = (text) => {
        if (!text) return [];
        return text.split(/(?<!\d),/).map(opt => opt.trim());
    };

    const handleInputChange = (questionId, value, isCheckbox = false) => {
        if (isCheckbox) {
            setCurrentResponses(prev => {
                const prevValues = prev[questionId] || [];
                const newValues = prevValues.includes(value)
                    ? prevValues.filter(v => v !== value)
                    : [...prevValues, value];
                return { ...prev, [questionId]: newValues };
            });
        } else {
            setCurrentResponses(prev => ({ ...prev, [questionId]: value }));
        }
    };

    const cleanOptionText = (text) => {
        if (!text) return "";
        return String(text).replace(/\s*\([^)]+\)$/, "").trim();
    };

    const handleSubmitAnswers = async (e) => {
        e.preventDefault();
        const formToSave = { ...selectedForm };
        const responsesToSave = { ...currentResponses };
        
        setUserAnswers(prev => [...prev, { ID_Form: formToSave.ID_Form }]);
        setSelectedForm(null);
        setIsSyncing(true);

        const batchTimestamp = new Date().toISOString();
        const globalID = `G-${Date.now()}`;

        const batchData = formToSave.questions.map(q => {
            const rawValue = responsesToSave[q.ID_Pregunta];
            let answerString = "";
            let totalPoints = 0;

            if (Array.isArray(rawValue)) {
                answerString = rawValue.map(v => cleanOptionText(v)).join(", ");
                rawValue.forEach(v => {
                    const match = String(v).match(/\(([^)]+)\)$/);
                    if (match) totalPoints += parseFloat(match[1].replace(',', '.'));
                });
            } else {
                answerString = q.Tipo_Respuesta === "ESCALA" ? `Nivel ${rawValue}` : cleanOptionText(rawValue);
                const match = String(rawValue).match(/\(([^)]+)\)$/);
                if (match) {
                    totalPoints = parseFloat(match[1].replace(',', '.'));
                } else if (q.Tipo_Respuesta === "ESCALA") {
                    totalPoints = parseFloat(rawValue || 0);
                } else {
                    totalPoints = parseFloat(q.Puntaje_Asociado || 0);
                }
            }

            return {
                ID_Respuesta_Global: globalID,
                Teacher_Key: userData?.Teacher_Key,
                ID_Form: formToSave.ID_Form,
                ID_Pregunta: q.ID_Pregunta,
                Valor_Respondido: answerString,
                Puntos_Ganados: totalPoints,
                Fecha_Respuesta: batchTimestamp
            };
        });

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', 
                body: JSON.stringify({ action: 'create_batch', sheet: 'Respuestas_Usuarios', data: batchData })
            });
        } catch (err) {
            console.error("Error:", err);
            alert("Error al sincronizar.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="atlas-responder-container animate-fade-in">
            
            {/* --- NUEVO BOTÓN DE REGRESAR --- */}
            <div className="nav-back-container" style={{ marginBottom: '20px' }}>
                <button 
                    className="btn-back-minimal" 
                    onClick={() => {
                        if (filterPhase === 'A') {
                            onNavigate('fase_auditar');
                        } else {
                            onNavigate('overview');
                        }
                    }}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#fff',
                        border: '1px solid #c5a059',
                        borderRadius: '8px',
                        color: '#c5a059',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ⬅ Volver
                </button>
            </div>

            <div className="responder-controls-row">
                <div className="tab-container-modern">
                    <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                        Pendientes <span className="tab-count">{pendingForms.length}</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
                        Completados <span className="tab-count">{completedForms.length}</span>
                    </button>
                </div>
                <div className={`sync-status-pill ${isSyncing ? 'syncing' : ''}`}>
                    <span className="sync-icon">{isSyncing ? "🔄" : "☁️"}</span>
                    {isSyncing ? "Sincronizando..." : "Nube Actualizada"}
                </div>
            </div>

            <div className="forms-grid-responder">
                {/* LÓGICA CORREGIDA: Solo muestra el mensaje si NO está sincronizando y el array está vacío */}
                {isSyncing ? (
                    <div className="loading-state-placeholder">
                        <p>Buscando instrumentos en la nube...</p>
                    </div>
                ) : (activeTab === 'pending' ? pendingForms : completedForms).length === 0 ? (
                    <div className="no-forms-message">
                        <p>No hay instrumentos disponibles en la Fase {filterPhase || ''} por ahora.</p>
                    </div>
                ) : (
                    (activeTab === 'pending' ? pendingForms : completedForms).map(form => (
                        <div key={form.ID_Form} className={`form-card-answerable ${activeTab === 'completed' ? 'card-done' : 'card-pending'}`}>
                            <div className="card-accent" />
                            <span className="phase-badge">{form.Fase_ATLAS}</span>
                            <h3>{form.Titulo_Form}</h3>
                            <p>{form.Descripcion}</p>
                            <div className="card-footer">
                                <span className="pts-tag">{form.Puntos_Maximos} Pts Máx</span>
                                {activeTab === 'pending' ? (
                                    <button className="btn-respond" onClick={() => handleOpenForm(form)}>Responder Ahora ✍️</button>
                                ) : (
                                    <span className="status-done-pill">✅ Completado</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedForm && (
                <div className="modal-overlay-atlas" onClick={() => setSelectedForm(null)}>
                    <div className="modal-content-glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-atlas-header">
                            <div className="header-info">
                                <h2>{selectedForm.Titulo_Form}</h2>
                                <span className="modal-subtitle">Fase {selectedForm.Fase_ATLAS} • Máximo: {selectedForm.Puntos_Maximos} pts</span>
                            </div>
                            <button className="close-btn-circle" onClick={() => setSelectedForm(null)}>×</button>
                        </div>
                        
                        <form onSubmit={handleSubmitAnswers} className="modal-atlas-body">
                            {selectedForm.questions.map((q, idx) => (
                                <div key={q.ID_Pregunta} className="question-card-minimal">
                                    <div className="q-number">{idx + 1}</div>
                                    <div className="q-content">
                                        <label className="q-text">{q.Texto_Pregunta}</label>
                                        
                                        {q.Tipo_Respuesta === "MULTIPLE" && (
                                            <div className="options-vertical">
                                                {splitOptions(q.Opciones_Seleccion).map(opt => (
                                                    <label key={opt} className="custom-radio-row">
                                                        <input type="radio" name={q.ID_Pregunta} value={opt} required onChange={(e) => handleInputChange(q.ID_Pregunta, e.target.value)} />
                                                        <span className="radio-label-text">{cleanOptionText(opt)}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {q.Tipo_Respuesta === "CHECKBOX" && (
                                            <div className="options-vertical">
                                                {splitOptions(q.Opciones_Seleccion).map(opt => (
                                                    <label key={opt} className="custom-radio-row">
                                                        <input type="checkbox" value={opt} onChange={(e) => handleInputChange(q.ID_Pregunta, e.target.value, true)} />
                                                        <span className="radio-label-text">{cleanOptionText(opt)}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {["TEXTO", "PARRAFO"].includes(q.Tipo_Respuesta) && (
                                            <textarea className="atlas-textarea" placeholder={q.Tipo_Respuesta === "PARRAFO" ? "Escribe un párrafo detallado..." : "Respuesta corta..."} onChange={(e) => handleInputChange(q.ID_Pregunta, e.target.value)} required />
                                        )}

                                        {q.Tipo_Respuesta === "ESCALA" && (
                                            <div className="scale-container-expert">
                                                <div className="scale-labels-top">
                                                    <span className="label-min">1 - Totalmente en desacuerdo</span>
                                                    <span className="label-max">5 - Totalmente de acuerdo</span>
                                                </div>
                                                <div className="atlas-scale-row">
                                                    {[1,2,3,4,5].map(num => (
                                                        <button 
                                                            key={num} 
                                                            type="button" 
                                                            className={`scale-pill ${currentResponses[q.ID_Pregunta] == num ? 'active' : ''}`} 
                                                            onClick={() => handleInputChange(q.ID_Pregunta, num)}
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="modal-footer-sticky">
                                <button type="submit" className="btn-submit-atlas">Finalizar y Enviar Respuestas</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};