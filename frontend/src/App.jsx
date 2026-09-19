import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NuevaSolicitud from './pages/NuevaSolicitudPOI';
import PerfilPuesto from './pages/PerfilPuesto';
import PerfilPuestoDetalle from './pages/PerfilPuestoDetalle';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/nueva-solicitud" element={<NuevaSolicitud />} />
        <Route path="/perfil-puesto" element={<PerfilPuesto />} />
        <Route path="/perfil-puesto/detalle" element={<PerfilPuestoDetalle />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;