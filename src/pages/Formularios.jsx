import React, { useState, useEffect, useRef } from "react";
import "../Styles/formularios.css";

export const Formularios = ({ userData, isSyncing, setIsSyncing, API_URL }) => {
    const questionsRef = useRef(null);

    // --- ESTADOS ---
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
    const [formsList, setFormsList] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    const initialFormState = {
        ID_Form: `FORM-${Date.now()}`,
        Titulo_Form: "",
        Descripcion: "",
        Fase_ATLAS: "A",
        Puntos_Maximos: 100,
        Teacher_Key: userData?.Teacher_Key
    };

    const [formConfig, setFormConfig] = useState(initialFormState);
    const [preguntas, setPreguntas] = useState([
        { idTemp: Date.now(), Texto_Pregunta: "", Tipo_Respuesta: "MULTIPLE", Opciones_Seleccion: "", Puntaje_Asociado: 0 }
    ]);

    // --- CARGAR LISTA AL INICIAR ---
    const fetchForms = async () => {
        try {
            const res = await fetch(`${API_URL}?sheet=Config_Formularios&user_key=${userData?.Teacher_Key}`);
            const data = await res.json();
            if (Array.isArray(data)) setFormsList(data);
        } catch (e) { console.error("Error al cargar lista:", e); }
    };

    useEffect(() => { fetchForms(); }, []);

    // --- LÓGICA DE EDICIÓN ---
    const handleEditForm = async (form) => {
        setIsEditing(true);
        setFormConfig({
            ID_Form: form.ID_Form,
            Titulo_Form: form.Titulo_Form,
            Descripcion: form.Descripcion,
            Fase_ATLAS: form.Fase_ATLAS,
            Puntos_Maximos: form.Puntos_Maximos,
            Teacher_Key: form.Teacher_Key
        });
        
        setIsConfigOpen(true);
        setIsQuestionsOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });

        try {
            const res = await fetch(`${API_URL}?sheet=Config_Preguntas`);
            const allQuestions = await res.json();
            const filtered = allQuestions.filter(q => q.ID_Form === form.ID_Form);
            
            if(filtered.length > 0) {
                setPreguntas(filtered.map(q => ({
                    idTemp: q.ID_Pregunta || (Date.now() + Math.random()),
                    Texto_Pregunta: q.Texto_Pregunta,
                    Tipo_Respuesta: q.Tipo_Respuesta,
                    Opciones_Seleccion: q.Opciones_Seleccion || "",
                    Puntaje_Asociado: q.Puntaje_Asociado
                })));
            }
        } catch (e) { console.error("Error cargando preguntas"); }
    };

    // --- LÓGICA DE BORRADO ---
    const handleDeleteForm = async (id) => {
        const confirmFirst = window.confirm("¿Eliminar este instrumento y todas sus preguntas?");
        if (!confirmFirst) return;
        
        const confirmSecond = window.confirm("¡ADVERTENCIA! Se pueden perder datos asociados. ¿Desea continuar?");
        if (!confirmSecond) return;

        // Actualización optimista para borrado
        const backup = [...formsList];
        setFormsList(formsList.filter(f => f.ID_Form !== id));

        setIsSyncing(true);
        try {
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'delete_instrumento', idValue: id })
            });
        } catch (e) {
            setFormsList(backup);
            alert("Error al borrar.");
        } finally {
            setIsSyncing(false);
            fetchForms();
        }
    };

    const handleAddPregunta = () => {
        setPreguntas([...preguntas, { 
            idTemp: Date.now() + Math.random(), 
            Texto_Pregunta: "", 
            Tipo_Respuesta: "MULTIPLE", 
            Opciones_Seleccion: "", 
            Puntaje_Asociado: 0 
        }]);
    };

    const handleRemovePregunta = (id) => {
        if(preguntas.length > 1) setPreguntas(preguntas.filter(p => p.idTemp !== id));
    };

    const updatePregunta = (id, field, value) => {
        setPreguntas(preguntas.map(p => p.idTemp === id ? { ...p, [field]: value } : p));
    };

    // --- GUARDAR / ACTUALIZAR (OPTIMIZADO) ---
    const handleSubmitInstrumento = async (e) => {
        e.preventDefault();
        setIsSyncing(true);

        // --- LÓGICA OPTIMISTA: Actualizamos el Front de inmediato ---
        const updatedForm = { ...formConfig };
        
        if (isEditing) {
            setFormsList(prev => prev.map(f => f.ID_Form === updatedForm.ID_Form ? updatedForm : f));
        } else {
            // Si es nuevo, lo añadimos temporalmente a la lista
            setFormsList(prev => [updatedForm, ...prev]);
        }

        // Cerramos el formulario de inmediato para dar sensación de velocidad
        const wasEditing = isEditing;
        setIsEditing(false);
        setIsConfigOpen(false);
        setIsQuestionsOpen(false);

        const payload = {
            action: wasEditing ? 'update_instrumento' : 'create_instrumento',
            form: { ...formConfig, Teacher_Key: userData?.Teacher_Key },
            questions: preguntas
        };

        // Reseteamos campos internos
        setFormConfig({ ...initialFormState, ID_Form: `FORM-${Date.now()}` });
        setPreguntas([{ idTemp: Date.now(), Texto_Pregunta: "", Tipo_Respuesta: "MULTIPLE", Opciones_Seleccion: "", Puntaje_Asociado: 0 }]);

        try {
            const response = await fetch(API_URL, { 
                method: 'POST', 
                mode: 'cors',
                body: JSON.stringify(payload) 
            });
            const resData = await response.json();

            if (resData.status === "success") {
                console.log("Sincronización en la nube exitosa");
            }
        } catch (error) {
            console.error("Error en sincronización:", error);
            alert("Hubo un problema al guardar en la nube, pero tus cambios se ven en el front.");
        } finally {
            setIsSyncing(false);
            fetchForms(); // Refrescamos al final para asegurar que los IDs de fila y datos estén perfectos
        }
    };

    return (
        <div className="atlas-architect-container animate-fade-in">
            {!isEditing && !isConfigOpen && (
                <button 
                    className="btn-publish-main" 
                    style={{marginBottom: '20px'}}
                    onClick={() => setIsConfigOpen(true)}
                >
                    ➕ Crear Nuevo Instrumento
                </button>
            )}

            <form onSubmit={handleSubmitInstrumento} className="architect-layout-grid">
                
                {/* PASO 1: CONFIGURACIÓN */}
                <section className={`info-card-modern ${!isConfigOpen ? 'card-closed' : ''}`}>
                    <div className="card-header-minimal" onClick={() => setIsConfigOpen(!isConfigOpen)}>
                        <span className="step-badge">1</span>
                        <h3 style={{flex: 1}}>{isEditing ? "Editando: " + formConfig.Titulo_Form : "Configuración Base del Instrumento"}</h3>
                        <span>{isConfigOpen ? "▲" : "▼"}</span>
                    </div>
                    
                    {isConfigOpen && (
                        <div className="input-stack animate-slide-down">
                            <div className="group-modern">
                                <label>Título del Instrumento</label>
                                <input 
                                    type="text" 
                                    placeholder="Nombre del formulario..." 
                                    value={formConfig.Titulo_Form}
                                    onChange={(e) => setFormConfig({...formConfig, Titulo_Form: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="row-split">
                                <div className="group-modern">
                                    <label>Fase ATLAS</label>
                                    <select value={formConfig.Fase_ATLAS} onChange={(e) => setFormConfig({...formConfig, Fase_ATLAS: e.target.value})}>
                                        <option value="A">A - Auditar</option>
                                        <option value="T">T - Transformar</option>
                                        <option value="L">L - Liderar</option>
                                    </select>
                                </div>
                                <div className="group-modern">
                                    <label>Puntos Máximos</label>
                                    <input 
                                        type="number" 
                                        value={formConfig.Puntos_Maximos}
                                        onChange={(e) => setFormConfig({...formConfig, Puntos_Maximos: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="group-modern">
                                <label>Instrucciones / Descripción</label>
                                <textarea 
                                    rows="4" 
                                    placeholder="Define el objetivo de este instrumento..."
                                    value={formConfig.Descripcion}
                                    onChange={(e) => setFormConfig({...formConfig, Descripcion: e.target.value})}
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* PASO 2: PREGUNTAS */}
                <section className={`info-card-modern ${!isQuestionsOpen ? 'card-closed' : ''}`} ref={questionsRef}>
                    <div className="card-header-flex-modern" onClick={() => setIsQuestionsOpen(!isQuestionsOpen)}>
                        <div className="header-left" style={{flex: 1}}>
                            <span className="step-badge">2</span>
                            <h3>Diseño de Preguntas</h3>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                            <button type="button" className="btn-add-pill" onClick={(e) => {e.stopPropagation(); handleAddPregunta();}}>
                                ➕ Añadir Pregunta
                            </button>
                            <span>{isQuestionsOpen ? "▲" : "▼"}</span>
                        </div>
                    </div>

                    {isQuestionsOpen && (
                        <div className="questions-list-container animate-slide-down">
                            {preguntas.map((pregunta, index) => (
                                <div key={pregunta.idTemp} className="question-builder-card">
                                    <div className="q-number-side">{index + 1}</div>
                                    <div className="q-main-fields">
                                        <input 
                                            type="text" 
                                            placeholder="Escribe la pregunta..." 
                                            className="q-input-text-large"
                                            value={pregunta.Texto_Pregunta}
                                            onChange={(e) => updatePregunta(pregunta.idTemp, 'Texto_Pregunta', e.target.value)}
                                            required
                                        />
                                        <div className="q-controls-row">
                                            <div className="control-item">
                                                <span>Tipo:</span>
                                                <select 
                                                    value={pregunta.Tipo_Respuesta}
                                                    onChange={(e) => updatePregunta(pregunta.idTemp, 'Tipo_Respuesta', e.target.value)}
                                                >
                                                    <option value="MULTIPLE">Opción Múltiple</option>
                                                    <option value="TEXTO">Texto Abierto</option>
                                                    <option value="ESCALA">Escala (1-5)</option>
                                                </select>
                                            </div>
                                            <div className="control-item">
                                                <span>Valor Pts:</span>
                                                <input 
                                                    type="number" 
                                                    className="q-pts-mini"
                                                    value={pregunta.Puntaje_Asociado}
                                                    onChange={(e) => updatePregunta(pregunta.idTemp, 'Puntaje_Asociado', e.target.value)}
                                                />
                                            </div>
                                            <button type="button" className="btn-delete-q" onClick={() => handleRemovePregunta(pregunta.idTemp)}>🗑️</button>
                                        </div>

                                        {pregunta.Tipo_Respuesta === "MULTIPLE" && (
                                            <div className="options-zone animate-fade-in">
                                                <input 
                                                    type="text"
                                                    className="q-options-field"
                                                    placeholder="Ej: Opción 1, Opción 2, Opción 3"
                                                    value={pregunta.Opciones_Seleccion}
                                                    onChange={(e) => updatePregunta(pregunta.idTemp, 'Opciones_Seleccion', e.target.value)}
                                                />
                                                <small>Separa las opciones por comas.</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="architect-footer-zone">
                                <button type="submit" className="btn-publish-main" disabled={isSyncing}>
                                    {isSyncing ? "💾 Sincronizando..." : isEditing ? "🔄 Actualizar Instrumento" : "🚀 Publicar Instrumento ATLAS"}
                                </button>
                                {isEditing && (
                                    <button type="button" className="btn-cancel" onClick={() => {
                                        setIsEditing(false); 
                                        setIsConfigOpen(false);
                                        setIsQuestionsOpen(false);
                                        setFormConfig({ ...initialFormState, ID_Form: `FORM-${Date.now()}` });
                                        setPreguntas([{ idTemp: Date.now(), Texto_Pregunta: "", Tipo_Respuesta: "MULTIPLE", Opciones_Seleccion: "", Puntaje_Asociado: 0 }]);
                                    }}>
                                        Cancelar Edición
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </form>

            {/* LISTADO INFERIOR */}
            <section className="info-card-modern list-area">
                <div className="card-header-minimal"><h3>Mis Instrumentos Creados</h3></div>
                <div className="forms-grid">
                    {formsList.length > 0 ? formsList.map((f) => (
                        <div key={f.ID_Form} className="form-item-card animate-fade-in">
                            <div className="form-info">
                                <span className="phase-pill">{f.Fase_ATLAS}</span>
                                <h4>{f.Titulo_Form}</h4>
                            </div>
                            <div className="form-actions">
                                <button className="btn-edit-small" onClick={() => handleEditForm(f)}>✏️</button>
                                <button className="btn-delete-small" onClick={() => handleDeleteForm(f.ID_Form)}>🗑️</button>
                            </div>
                        </div>
                    )) : <p style={{textAlign: 'center', color: '#64748b', width: '100%'}}>No has creado instrumentos todavía.</p>}
                </div>
            </section>
        </div>
    );
};