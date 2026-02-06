import React from "react";
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard"; 
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";

export const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

        {/* Ruta principal: Login / Home */}
        <Route 
            path="/" 
            element={<Home onLoginSuccess={(user) => {
                // Al loguear, guardamos en localStorage para que Dashboard lo reconozca
                localStorage.setItem("userATLAS", JSON.stringify(user));
                window.location.href = "/dashboard";
            }} />} 
        />

        {/* Ruta: Dashboard ATLAS 
          Nota: Esta ruta ahora contiene internamente las vistas de:
          - Panel de Control (vista por defecto)
          - Arquitecto de Instrumentos (Formularios)
        */}
        <Route 
            path="/dashboard" 
            element={<Dashboard onLogout={() => {
                localStorage.removeItem("userATLAS");
                window.location.href = "/";
            }} />} 
        />

        {/* Rutas de ejemplo anteriores */}
        <Route path="/single/:theId" element={<Single />} />
        <Route path="/demo" element={<Demo />} />
      </Route>
    )
);