import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PortalPostulacion from './pages/PortalPostulacion';
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
import Informes from './pages/Informes';
import Auditoria from './pages/Auditoria';
import Configuracion from './pages/Configuracion';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/postular" element={<PortalPostulacion />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/solicitudes-cobertura" element={<ProtectedRoute><SolicitudesCobertura /></ProtectedRoute>} />
          <Route path="/nueva-solicitud" element={<ProtectedRoute><SolicitudesCobertura /></ProtectedRoute>} />
          <Route path="/perfil-puesto" element={<ProtectedRoute><PerfilPuesto /></ProtectedRoute>} />
          <Route path="/perfil-puesto/detalle/:id" element={<ProtectedRoute><PerfilPuestoDetalle /></ProtectedRoute>} />
          <Route path="/mi-perfil" element={<ProtectedRoute><MiPerfil /></ProtectedRoute>} />
          <Route path="/candidatos-compatibles" element={<ProtectedRoute><CandidatosCompatibles /></ProtectedRoute>} />
          <Route path="/trabajadores" element={<ProtectedRoute><Trabajadores /></ProtectedRoute>} />
          <Route path="/trabajadores/expediente" element={<ProtectedRoute><ExpedienteTrabajador /></ProtectedRoute>} />
          <Route path="/validacion-ocr" element={<ProtectedRoute><ValidacionOCR /></ProtectedRoute>} />
          <Route path="/evaluacion" element={<ProtectedRoute><Evaluacion /></ProtectedRoute>} />
          <Route path="/evaluaciones" element={<ProtectedRoute><Evaluacion /></ProtectedRoute>} />
          <Route path="/informes" element={<ProtectedRoute><Informes /></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;