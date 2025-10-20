import { Link } from 'react-router-dom';
import { useState } from 'react';
import ucFoto from '@/assets/uc_foto.jpg';
import letras from '@/assets/letras.png'; // <— imagen “ConectaGRD” grande
import icon1 from '@/assets/icon1.png';
import icon2 from '@/assets/icon2.png';
import icon3 from '@/assets/icon3.png';
import icon4 from '@/assets/icon4.png';
import adminIcon from '@/assets/admin.png';

export default function Landing() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  
  const steps = [
    {
      n: '1',
      title: 'Carga de datos clínicos',
      p1: 'Los codificadores GRD cargan los archivos Excel con episodios hospitalarios.',
      p2: 'El sistema valida y prepara automáticamente los datos para codificación.',
      color: '#5B8BFF',
    },
    {
      n: '2',
      title: 'Codificación asistida',
      p1: 'El sistema cruza información clínica y sugiere códigos.',
      p2: 'Los codificadores revisan, ajustan y confirman los datos.',
      color: '#5B8BFF',
    },
    {
      n: '3',
      title: 'Revisión financiera',
      p1: 'Finanzas valida los pesos GRD y genera la prefactura para FONASA.',
      p2: 'El sistema reduce errores y mejora la trazabilidad contable.',
      color: '#9B79FF',
    },
    {
      n: '4',
      title: 'Supervisión y análisis',
      p1: 'Gestión visualiza reportes de eficiencia y rechazos.',
      p2: 'Toda la información queda centralizada para la toma de decisiones.',
      color: '#C57BFF',
    },
  ];

  const profiles = [
    {
      title: "Codificador GRD",
      highlight: "Registra diagnósticos y procedimientos, verifica consistencia clínica y adjunta respaldos.",
      desc: "El sistema automatiza validaciones y mantiene trazabilidad por episodio.",
      icon: icon1,
      color: "#5B8BFF",
      expanded: "Responsable de la codificación precisa de diagnósticos y procedimientos médicos según estándares GRD. Utiliza herramientas de validación automática para asegurar la consistencia clínica y adjunta todos los respaldos necesarios para cada episodio."
    },
    {
      title: "Coordinación / Gestión",
      highlight: "Supervisa el avance del proceso, analiza indicadores de eficiencia y rechazo.",
      desc: "Garantiza cumplimiento normativo y decisiones basadas en datos.",
      icon: icon4,
      color: "#C57BFF",
      expanded: "Lidera la supervisión del proceso GRD completo, analizando métricas de eficiencia y tasas de rechazo. Toma decisiones estratégicas basadas en datos para optimizar el flujo de trabajo y garantizar el cumplimiento normativo."
    },
    {
      title: "Finanzas / Ciclo de Ingresos",
      highlight: "Valida los pesos GRD y genera la prefactura para FONASA.",
      desc: "Accede a indicadores y reportes automáticos que facilitan el control financiero.",
      icon: icon3,
      color: "#9B79FF",
      expanded: "Gestiona la validación de pesos GRD y la generación de prefacturas para FONASA. Accede a indicadores financieros en tiempo real y reportes automáticos que facilitan el control y seguimiento del ciclo de ingresos."
    },
    {
      title: "Administrador del Sistema",
      highlight: "Gestiona permisos, configuración de reglas y mantenimiento general.",
      desc: "Asegura la correcta operación técnica y funcional de la plataforma.",
      icon: adminIcon,
      color: "#333333",
      expanded: "Responsable de la configuración y mantenimiento del sistema GRD. Gestiona permisos de usuario, configura reglas de validación y asegura la operación técnica continua de la plataforma."
    },
  ];
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
        className="max-w-7xl mx-auto px-6"
      >
        {/* Título fuera del degradado */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-open-sauce font-light text-black">¿Cómo funciona?</h2>
        </div>

        <div className="relative bg-[#d3d3d3] rounded-[28px] md:rounded-[32px] p-6 md:p-10">
          {/* Zona de línea + círculos */}
          <div className="hidden md:block relative mb-6 mt-2">
            {/* Línea punteada centrada detrás */}
            <div className={`absolute left-10 right-10 top-1/2 -translate-y-1/2 z-0 transition-opacity ${hovered !== null ? 'opacity-30' : 'opacity-80'}`}>
              <div className="border-t-4 border-dotted border-white" />
            </div>
            {/* Círculos alineados con la grilla de tarjetas */}
            <div className="grid grid-cols-4 gap-6 relative z-10">
              {[
                { src: icon1, color: steps[0].color },
                { src: icon2, color: steps[1].color },
                { src: icon3, color: steps[2].color },
                { src: icon4, color: steps[3].color },
              ].map(({ src, color }, idx) => {
                const dim = hovered !== null && hovered !== idx;
                return (
                  <div key={idx} className="flex items-center justify-center">
                    <div className={`w-20 h-20 rounded-full bg-white shadow-lg ring-4 ring-slate-100 flex items-center justify-center select-none transition-opacity ${dim ? 'opacity-50' : 'opacity-100'}`}>
                      <div
                        className="w-10 h-10"
                        style={{
                          WebkitMaskImage: `url(${src})`,
                          maskImage: `url(${src})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          backgroundColor: color as string,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline en 4 tarjetas */}
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <CardPaso
                key={idx}
                n={s.n}
                title={s.title}
                p1={s.p1}
                p2={s.p2}
                color={`text-[${s.color}]`}
                className={hovered === null || hovered === idx ? 'opacity-100' : 'opacity-50'}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* separador */}
      <div className="h-6 md:h-10" />

      {/* ======= Equipo GRD ======= */}
      <section
        id="equipo-grd"
        className="max-w-7xl mx-auto px-6 py-10 md:py-14"
      >
        {/* Títulos fuera del degradado */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl md:text-3xl font-open-sauce font-light text-black">Equipo GRD – Perfiles</h2>
            <p className="text-base text-purple-600">
              Un mismo sistema, cuatro perfiles que trabajan conectados
            </p>
          </div>
        </div>

        {/* Contenedor con degradado horizontal */}
        <div className="relative bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl p-10">
          {/* Grid de perfiles con efecto apilado */}
          <div className="grid md:grid-cols-2 gap-8">
            {profiles.map((profile, idx) => (
              <div
                key={idx}
                className={`relative cursor-pointer transition-all duration-500 ${
                  expandedCard === idx 
                    ? 'transform scale-105 z-10' 
                    : expandedCard !== null 
                      ? 'transform scale-95 opacity-60' 
                      : 'hover:transform hover:scale-102'
                }`}
                onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
                style={{
                  transform: expandedCard === idx 
                    ? 'scale(1.05) translateY(-10px)' 
                    : expandedCard !== null 
                      ? 'scale(0.95)' 
                      : 'scale(1)',
                  zIndex: expandedCard === idx ? 10 : 1,
                }}
              >
                <CardRol
                  title={profile.title}
                  highlight={profile.highlight}
                  desc={profile.desc}
                  icon={profile.icon}
                  color={profile.color}
                  expanded={profile.expanded}
                  isExpanded={expandedCard === idx}
                />
              </div>
            ))}
          </div>
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
  className,
  onMouseEnter,
  onMouseLeave,
}: {
  n: string;
  title: string;
  p1: string;
  p2: string;
  color: string;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div className={`bg-white rounded-3xl p-6 border shadow-lg transition-opacity ${className ?? ''}`} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className={`${color} text-6xl font-open-sauce font-light leading-none text-center`}>{n}</div>
      <h3 className={`mt-2 text-xl font-open-sauce font-light ${color}`}>{title}</h3>
      <p className="text-[15px] text-slate-700 mt-3 leading-6">{p1}</p>
      <p className="text-[15px] text-slate-700 mt-2 leading-6">{p2}</p>
    </div>
  );
}

function CardRol({ title, highlight, desc, icon, color, expanded, isExpanded }: { 
  title: string; 
  highlight: string; 
  desc: string; 
  icon: string; 
  color: string; 
  expanded: string;
  isExpanded: boolean;
}) {
  return (
    <div className={`bg-white rounded-[20px] p-5 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-500 ${
      isExpanded ? 'shadow-2xl' : ''
    }`}>
      {/* Título e ícono centrados */}
      <div className="flex flex-col items-center justify-center mb-4">
        <div 
          className="w-12 h-12 mb-3"
          style={{
            WebkitMaskImage: `url(${icon})`,
            maskImage: `url(${icon})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            backgroundColor: color,
          }}
        />
        <h4 className={`font-open-sauce font-medium text-xl text-center transition-all duration-500 ${
          isExpanded ? 'border-b-2' : ''
        }`} style={{ 
          color,
          borderColor: isExpanded ? color : 'transparent'
        }}>
          {title}
        </h4>
      </div>
      
      {/* Contenido expandido */}
      <div className={`transition-all duration-500 overflow-hidden ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <p className="text-sm font-open-sauce font-light text-[#333] leading-relaxed p-3 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: color }}>
          {expanded}
        </p>
      </div>
      
      {/* Indicador de click */}
      <div className="mt-4 text-center">
        <span className={`text-xs px-3 py-1 rounded-full transition-colors duration-300 ${
          isExpanded 
            ? 'bg-gray-200 text-gray-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}>
          {isExpanded ? 'Click para cerrar' : 'Click para expandir'}
        </span>
      </div>
    </div>
  );
}

