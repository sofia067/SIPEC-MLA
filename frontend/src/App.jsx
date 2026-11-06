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
import ProtectedRole from './auth/ProtectedRole';

const ADMIN_RRHH = ['admin', 'hr_specialist'];
const ADMIN_RRHH_JEFE = [...ADMIN_RRHH, 'area_manager'];
const ADMIN_RRHH_COMITE = [...ADMIN_RRHH, 'committee'];
const TODOS_LOS_PERFILES = [...ADMIN_RRHH_JEFE, 'committee'];

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/postular" element={<PortalPostulacion />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/solicitudes-cobertura" element={<ProtectedRoute><ProtectedRole roles={ADMIN_RRHH_JEFE}><SolicitudesCobertura /></ProtectedRole></ProtectedRoute>} />
          <Route path="/nueva-solicitud" element={<ProtectedRoute><ProtectedRole roles={ADMIN_RRHH_JEFE}><SolicitudesCobertura /></ProtectedRole></ProtectedRoute>} />
          <Route path="/perfil-puesto" element={<ProtectedRoute><ProtectedRole roles={TODOS_LOS_PERFILES}><PerfilPuesto /></ProtectedRole></ProtectedRoute>} />
          <Route path="/perfil-puesto/detalle/:id" element={<ProtectedRoute><ProtectedRole roles={TODOS_LOS_PERFILES}><PerfilPuestoDetalle /></ProtectedRole></ProtectedRoute>} />
          <Route path="/mi-perfil" element={<ProtectedRoute><MiPerfil /></ProtectedRoute>} />
          <Route path="/candidatos-compatibles" element={<ProtectedRoute><ProtectedRole roles={ADMIN_RRHH_COMITE}><CandidatosCompatibles /></ProtectedRole></ProtectedRoute>} />
          <Route path="/trabajadores" element={<ProtectedRoute><ProtectedRole roles={ADMIN_RRHH_JEFE}><Trabajadores /></ProtectedRole></ProtectedRoute>} />
          <Route path="/trabajadores/expediente" element={<ProtectedRoute><ProtectedRole roles={ADMIN_RRHH_JEFE}><ExpedienteTrabajador /></ProtectedRole></ProtectedRoute>} />
          <Route path="/validacion-ocr" element={<ProtectedRoute><ProtectedRole roles={ADMIN_RRHH_COMITE}><ValidacionOCR /></ProtectedRole></ProtectedRoute>} />
          <Route path="/evaluacion" element={<ProtectedRoute><ProtectedRole roles={ADMIN_RRHH_COMITE}><Evaluacion /></ProtectedRole></ProtectedRoute>} />
          <Route path="/evaluaciones" element={<ProtectedRoute><ProtectedRole roles={ADMIN_RRHH_COMITE}><Evaluacion /></ProtectedRole></ProtectedRoute>} />
          <Route path="/informes" element={<ProtectedRoute><ProtectedRole roles={ADMIN_RRHH_JEFE}><Informes /></ProtectedRole></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute><ProtectedRole roles={['admin']}><Auditoria /></ProtectedRole></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><ProtectedRole roles={['admin']}><Configuracion /></ProtectedRole></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;