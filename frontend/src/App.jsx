import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PortalPostulacion from './pages/PortalPostulacion';
import Dashboard from './pages/Dashboard';
import SolicitudesCobertura from './pages/SolicitudesCobertura';
import NuevaSolicitudPOI from './pages/NuevaSolicitudPOI';
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
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { moduleRoles } from './lib/rolePermissions';

function App() {
  return (
    <Router>
      <AuthProvider>
       <Routes>
       <Route path="/" element={<Login />} />
       <Route path="/postular" element={<PortalPostulacion />} />
       <Route element={<ProtectedRoute roles={moduleRoles.dashboard} />}>
         <Route path="/dashboard" element={<Dashboard />} />
         <Route path="/mi-perfil" element={<MiPerfil />} />
       </Route>
       <Route element={<ProtectedRoute roles={moduleRoles.requests} />}>
         <Route path="/solicitudes-cobertura" element={<SolicitudesCobertura />} />
         <Route path="/nueva-solicitud" element={<SolicitudesCobertura />} />
       </Route>
       <Route element={<ProtectedRoute roles={moduleRoles.profiles} />}>
         <Route path="/perfil-puesto" element={<PerfilPuesto />} />
         <Route path="/perfil-puesto/detalle/:id" element={<PerfilPuestoDetalle />} />
         <Route path="/perfil-puesto/detalle" element={<PerfilPuestoDetalle />} />
       </Route>
       <Route element={<ProtectedRoute roles={moduleRoles.candidates} />}>
         <Route path="/candidatos-compatibles" element={<CandidatosCompatibles />} />
       </Route>
       <Route element={<ProtectedRoute roles={moduleRoles.workers} />}>
         <Route path="/trabajadores" element={<Trabajadores />} />
         <Route path="/trabajadores/expediente" element={<ExpedienteTrabajador />} />
       </Route>
       <Route element={<ProtectedRoute roles={moduleRoles.documents} />}>
         <Route path="/validacion-ocr" element={<ValidacionOCR />} />
       </Route>
       <Route element={<ProtectedRoute roles={moduleRoles.evaluations} />}>
         <Route path="/evaluacion" element={<Evaluacion />} />
         <Route path="/evaluaciones" element={<Evaluacion />} />
       </Route>
       <Route element={<ProtectedRoute roles={moduleRoles.reports} />}>
         <Route path="/informes" element={<Informes />} />
       </Route>
       <Route element={<ProtectedRoute roles={moduleRoles.audit} />}>
         <Route path="/auditoria" element={<Auditoria />} />
       </Route>
       <Route element={<ProtectedRoute roles={moduleRoles.settings} />}>
         <Route path="/configuracion" element={<Configuracion />} />
       </Route>
       <Route path="*" element={<Navigate to="/" />} />
       </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;