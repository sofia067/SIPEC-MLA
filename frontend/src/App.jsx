import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SolicitudesCobertura from './pages/SolicitudesCobertura';
import PerfilPuesto from './pages/PerfilPuesto';
import PerfilPuestoDetalle from './pages/PerfilPuestoDetalle';
import MiPerfil from './pages/MiPerfil';
import CandidatosCompatibles from './pages/CandidatosCompatibles';
import Trabajadores from './pages/Trabajadores';
import ExpedienteTrabajador from './pages/ExpedienteTrabajador';
import ValidacionOCR from './pages/ValidacionOCR';
import Evaluacion from './pages/Evaluacion';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
       <Route path="/solicitudes-cobertura" element={<SolicitudesCobertura />} />
       <Route path="/nueva-solicitud" element={<SolicitudesCobertura />} />
        <Route path="/perfil-puesto" element={<PerfilPuesto />} />
        <Route path="/perfil-puesto/detalle" element={<PerfilPuestoDetalle />} />
       <Route path="/mi-perfil" element={<MiPerfil />} />
       <Route path="/candidatos-compatibles" element={<CandidatosCompatibles />} />
       <Route path="/trabajadores" element={<Trabajadores />} />
       <Route path="/trabajadores/expediente" element={<ExpedienteTrabajador />} />
       <Route path="/validacion-ocr" element={<ValidacionOCR />} />
       <Route path="/evaluacion" element={<Evaluacion />} />
       <Route path="/evaluaciones" element={<Evaluacion />} />
       <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;