import { Link } from 'react-router-dom';
import ucFoto from '@/assets/uc_foto.jpg';
import letras from '@/assets/letras.png'; // <— imagen “ConectaGRD” grande

export default function Landing() {
  return (
    <main className="bg-slate-50">
        {/* ======= Inicio (HERO) ======= */}
<section id="inicio" className="bg-slate-50">
  <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-20">
    {/* Caja superior: Título izq / CTA der */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* IZQUIERDA: letras + subtítulo */}
      <div>
        {/* letras más chicas */}
        <img
          src={letras}
          alt="Conecta GRD"
          className="w-full max-w-[400px] select-none pointer-events-none"
        />
        {/* subtítulo Open Sauce delgada, bien debajo del logo */}
        <p className="mt-3 text-slate-700 font-open-sauce text-[100px] md:text-[28px] leading-[1.4]">
          Gestión Clínica Inteligente y Colaborativa
        </p>
      </div>

      {/* DERECHA: CTA más abajo y con anchos consistentes */}
       {/* DERECHA: CTA más abajo y con anchos consistentes */}
        <div className="w-full flex justify-end">
        <div className="w-full md:max-w-[440px] mt-16 lg:mt-40">
            <Link
            to="/login"
            className="block w-full text-center px-6 py-3 rounded-2xl bg-black text-white text-base font-medium"
            >
            Ingresar al sistema
            </Link>
            <p className="mt-3 text-[13px] leading-5 text-slate-500 max-w-[520px]">
            <span className="text-green-500 mr-1">✓</span>
            Acceso exclusivo para equipos GRD, Finanzas y Gestión UC Christus.
            </p>
        </div>
        </div>


    </div>

    {/* Separación entre cajas */}
    <div className="h-6 md:h-8" />

    {/* Caja inferior: foto con degradado + tarjeta */}
<div className="relative w-full rounded-[28px] overflow-hidden">
  <img
    src={ucFoto}
    alt="UC Christus"
    className="w-full h-[320px] md:h-[370px] object-cover"
  />
  {/* Degradé animado */}
  <div className="absolute inset-0 rounded-[28px] gradient-overlay pointer-events-none" />

  {/* === Tarjeta con el texto === */}
  <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2
                  w-[200px] md:w-[360px] rounded-2xl bg-white/75
                  backdrop-blur-lg shadow-xl p-5 md:p-6 z-10">
    <h3 className="font-semibold text-slate-900 text-lg md:text-xl">
      Automatiza y simplifica la gestión GRD
    </h3>
    <p className="text-sm md:text-base text-slate-700 mt-2">
      Validaciones en tiempo real, trazabilidad completa y control de calidad en cada etapa.
    </p>
  </div>
</div>


    <div className="h-10 md:h-12" />
  </div>
</section>





      {/* separador suave */}
      <div className="h-6 md:h-10" />

      {/* ======= Cómo funciona ======= */}
      <section
        id="como-funciona"
        className="max-w-6xl mx-auto px-4 py-10 md:py-14 bg-white rounded-3xl border"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-semibold">Cómo funciona</h2>
        </div>

        {/* Timeline en 4 tarjetas */}
        <div className="grid md:grid-cols-4 gap-6">
          <CardPaso
            n="1"
            title="Carga de datos clínicos"
            p1="Los codificadores GRD cargan los archivos Excel."
            p2="El sistema valida y prepara automáticamente los datos."
            color="text-blue-600"
          />
          <CardPaso
            n="2"
            title="Codificación asistida"
            p1="El sistema cruza información clínica y sugiere códigos."
            p2="Los codificadores revisan, ajustan y confirman los datos."
            color="text-indigo-600"
          />
          <CardPaso
            n="3"
            title="Revisión financiera"
            p1="Finanzas valida los pesos GRD y genera la prefactura FONASA."
            p2="Se reducen errores y mejora la trazabilidad contable."
            color="text-purple-600"
          />
          <CardPaso
            n="4"
            title="Supervisión y análisis"
            p1="Gestión visualiza reportes de eficiencia y rechazos."
            p2="Información centralizada para decisiones clínicas y administrativas."
            color="text-fuchsia-600"
          />
        </div>
      </section>

      {/* separador */}
      <div className="h-6 md:h-10" />

      {/* ======= Equipo GRD ======= */}
      <section
        id="equipo-grd"
        className="max-w-6xl mx-auto px-4 py-10 md:py-14 bg-white rounded-3xl border"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-semibold">Equipo GRD – Perfiles</h2>
        </div>

        <p className="text-slate-600 mb-6">
          Un mismo sistema, cuatro perfiles que trabajan conectados
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <CardRol
            title="Codificador GRD"
            highlight="Registra diagnósticos y procedimientos, verifica consistencia y adjunta respaldos."
            desc="Validaciones automáticas y trazabilidad por episodio."
          />
          <CardRol
            title="Coordinación / Gestión"
            highlight="Supervisa el proceso y analiza indicadores de eficiencia y rechazo."
            desc="Cumplimiento normativo y decisiones basadas en datos."
          />
          <CardRol
            title="Finanzas / Ciclo de Ingresos"
            highlight="Valida los pesos GRD y genera la prefactura para FONASA."
            desc="Indicadores y reportes automáticos para control financiero."
          />
          <CardRol
            title="Administrador del Sistema"
            highlight="Gestiona permisos, configuración de reglas y mantenimiento."
            desc="Operación técnica y funcional asegurada."
          />
        </div>
      </section>

      
    </main>
  );
}

/* --- componentes internos para tarjetas --- */

function CardPaso({
  n,
  title,
  p1,
  p2,
  color,
}: {
  n: string;
  title: string;
  p1: string;
  p2: string;
  color: string;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5 border">
      <div className={`${color} text-4xl font-semibold`}>{n}</div>
      <h3 className={`mt-1 font-semibold ${color}`}>{title}</h3>
      <p className="text-sm text-slate-700 mt-2">{p1}</p>
      <p className="text-sm text-slate-600 mt-1">{p2}</p>
    </div>
  );
}

function CardRol({ title, highlight, desc }: { title: string; highlight: string; desc: string }) {
  return (
    <div className="rounded-2xl border p-5 bg-white">
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <p className="text-sm text-slate-700 mt-2">{highlight}</p>
      <p className="text-sm text-slate-600 mt-1">{desc}</p>
    </div>
  );
}

