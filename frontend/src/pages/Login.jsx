import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '', rol: '' });
  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const navigate = useNavigate();

  const MAX_INTENTOS = 3;

  const manejarCambio = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const manejarIngreso = (e) => {
    e.preventDefault();

    // 1. Validar estrictamente que ningún campo esté vacío
    if (!credenciales.usuario.trim() || !credenciales.password.trim() || !credenciales.rol) {
      setMensajeError('Por favor, complete su usuario, contraseña y seleccione su rol.');
      return;
    }

    // 2. Simulación de validación (aquí iría la consulta a tu API/Backend)
    const esValido = credenciales.usuario === 'admin' && credenciales.password === '123456';

    if (esValido) {
      setMensajeError('');
      navigate('/dashboard');
    } else {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);

      if (nuevosIntentos >= MAX_INTENTOS) {
        setBloqueado(true);
        setMensajeError(`Ha superado el límite de ${MAX_INTENTOS} intentos. Intente nuevamente en 30 segundos.`);
        
        // Desbloquear después de 30 segundos
        setTimeout(() => {
          setBloqueado(false);
          setIntentos(0);
          setMensajeError('');
        }, 30000);
      } else {
        setMensajeError(`Credenciales o rol incorrectos. Intentos restantes: ${MAX_INTENTOS - nuevosIntentos}`);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 items-center justify-center p-4">
      <div className="flex bg-white rounded-xl shadow-2xl overflow-hidden max-w-4xl w-full border border-gray-200">
        
        
        <div className="w-1/2 bg-blue-900 text-white p-10 flex flex-col justify-between items-center text-center">
          <div className="my-auto flex flex-col items-center">
            <img src="/AquijesLogo.jpg" alt="Logo Los Aquijes" className="w-40 h-40 mb-4 object-contain bg-white/10 p-3 rounded-2xl shadow-inner" />
            <h1 className="text-3xl font-bold tracking-wide">SIPEC-MLA</h1>
            <p className="text-sm font-medium text-blue-200 mt-2">
              Sistema de Identificación y Perfilamiento de Competencias
            </p>
            <div className="w-12 h-1 bg-blue-500 my-4 rounded-full"></div>
            <p className="text-xs text-blue-300">Municipalidad de Los Aquijes</p>
          </div>
          <span className="text-[10px] text-blue-400">© 2026 Municipalidad de Los Aquijes</span>
        </div>

        
        <div className="w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-xl font-bold text-gray-800">Bienvenido a SIPEC-MLA</h2>
          <p className="text-xs text-gray-500 mb-4">Inicia sesión para continuar</p>

          {mensajeError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded">
              {mensajeError}
            </div>
          )}

          <form onSubmit={manejarIngreso} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Usuario *</label>
              <input 
                type="text" 
                name="usuario"
                placeholder="Ingrese su usuario"
                value={credenciales.usuario}
                onChange={manejarCambio}
                disabled={bloqueado}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 border-gray-300 disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Contraseña *</label>
              <input 
                type="password" 
                name="password"
                placeholder="Ingrese su contraseña"
                value={credenciales.password}
                onChange={manejarCambio}
                disabled={bloqueado}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 border-gray-300 disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Rol *</label>
              <select 
                name="rol"
                value={credenciales.rol}
                onChange={manejarCambio}
                disabled={bloqueado}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 border-gray-300 bg-white text-gray-700 disabled:bg-gray-100"
                required
              >
                <option value="">Seleccione su rol</option>
                <option value="jefe">Jefe de Área</option>
                <option value="rrhh">Especialista RR.HH.</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-800" />
                Recordar sesión
              </label>
              <a href="#" className="text-blue-700 hover:underline">¿Olvidaste tu contraseña?</a>
            </div>

            <button 
              type="submit" 
              disabled={bloqueado}
              className={`w-full font-bold py-2.5 rounded-md transition duration-200 mt-2 shadow text-white ${
                bloqueado ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900'
              }`}>
              {bloqueado ? 'Acceso temporalmente bloqueado' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Login;