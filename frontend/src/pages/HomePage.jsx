import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const services = [
  {
    number: '01',
    title: 'Convocatorias públicas',
    description: 'Consulta las oportunidades vigentes y presenta tu postulación en línea.',
    to: '/postular',
    link: 'Ver convocatorias',
  },
  {
    number: '02',
    title: 'Seguimiento de postulación',
    description: 'Revisa el avance de tu proceso con tu código de postulación y documento.',
    to: '/postular',
    link: 'Consultar mi proceso',
  },
  {
    number: '03',
    title: 'Gestión institucional',
    description: 'Acceso a las herramientas de gestión para el personal autorizado.',
    to: '/login',
    link: 'Ingresar al sistema',
  },
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M4.25 10h11.5m-4.5-4.5 4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const internalLink = user ? '/dashboard' : '/login';

  return (
    <div className="min-h-dvh bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/" aria-label="SIPEC-MLA, inicio" className="flex min-w-0 items-center gap-3">
            <img src="/AquijesLogo.jpg" alt="" className="h-11 w-11 rounded-xl object-contain" />
            <span className="min-w-0">
              <span className="block text-base font-extrabold tracking-tight text-blue-950">SIPEC-MLA</span>
              <span className="hidden text-xs text-slate-500 sm:block">Municipalidad Distrital de Los Aquijes</span>
            </span>
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-2 sm:gap-5">
            <a href="#servicios" className="hidden text-sm font-medium text-slate-600 hover:text-blue-900 sm:inline">
              Servicios
            </a>
            <Link to="/postular" className="hidden text-sm font-medium text-slate-600 hover:text-blue-900 sm:inline">
              Convocatorias
            </Link>
            <Link
              to={internalLink}
              className="rounded-lg bg-blue-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 sm:px-4"
            >
              {user ? 'Ir al sistema' : 'Acceso institucional'}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-[#f5f7fb] to-[#f5f7fb]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-blue-900">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal-500" />
                Municipalidad de Los Aquijes
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-blue-950 sm:text-5xl lg:text-6xl">
                Talento público al servicio de nuestra comunidad.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                SIPEC-MLA reúne las convocatorias municipales y las herramientas institucionales para gestionar perfiles y procesos de selección.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/postular"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-blue-900"
                >
                  Explorar convocatorias <ArrowIcon />
                </Link>
                <Link
                  to={internalLink}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-blue-950 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Acceso institucional
                </Link>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">
                Las convocatorias son publicadas por Recursos Humanos. Revisa sus bases y fechas antes de postular.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div aria-hidden="true" className="absolute -left-5 top-8 h-24 w-24 rounded-full bg-teal-300/40 blur-2xl" />
              <div aria-hidden="true" className="absolute -right-4 bottom-8 h-32 w-32 rounded-full bg-blue-300/60 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-950 via-blue-900 to-teal-800 p-6 text-white shadow-2xl shadow-blue-950/20 sm:p-8">
                <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
                <div aria-hidden="true" className="absolute -right-5 -top-9 h-44 w-44 rounded-full border border-white/10" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <img src="/AquijesLogo.jpg" alt="" className="h-12 w-12 rounded-xl bg-white p-1 object-contain" />
                    <div>
                      <p className="text-sm font-bold tracking-wide">Portal de oportunidades</p>
                      <p className="text-xs text-blue-100">SIPEC-MLA · Los Aquijes</p>
                    </div>
                  </div>
                  <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">Postulación en línea</p>
                    <h2 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">Encuentra una oportunidad y sigue tu proceso.</h2>
                    <p className="mt-3 text-sm leading-6 text-blue-100">
                      Consulta las bases, registra tus documentos y utiliza tu código para revisar el estado de tu postulación.
                    </p>
                    <Link to="/postular" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-teal-200">
                      Ir al portal de postulaciones <ArrowIcon />
                    </Link>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-blue-100 sm:gap-3 sm:text-xs">
                    <div className="rounded-xl bg-white/10 px-2 py-3">Consulta<br />convocatorias</div>
                    <div className="rounded-xl bg-white/10 px-2 py-3">Postula<br />en línea</div>
                    <div className="rounded-xl bg-white/10 px-2 py-3">Sigue tu<br />proceso</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="servicios" className="border-y border-slate-200 bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Un espacio para la comunidad</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">
                Accede a los servicios de SIPEC-MLA
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Elige el portal que necesitas. La información de cada convocatoria y sus requisitos se publica en el portal de postulaciones.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {services.map((service) => (
                <article key={service.number} className="group rounded-2xl border border-slate-200 bg-[#fbfcfe] p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5 sm:p-6">
                  <span className="text-xs font-extrabold tracking-[0.14em] text-teal-700">{service.number}</span>
                  <h3 className="mt-4 text-lg font-bold text-blue-950">{service.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{service.description}</p>
                  <Link to={service.to} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-900 group-hover:text-teal-800">
                    {service.link} <ArrowIcon />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-blue-950 text-blue-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/AquijesLogo.jpg" alt="" className="h-9 w-9 rounded-lg bg-white p-1 object-contain" />
            <span>
              <span className="block font-bold text-white">SIPEC-MLA</span>
              Municipalidad Distrital de Los Aquijes
            </span>
          </div>
          <p>Plataforma institucional de gestión y postulaciones.</p>
        </div>
      </footer>
    </div>
  );
}
