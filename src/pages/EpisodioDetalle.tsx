import { useParams, Link } from 'react-router-dom'; export default function EpisodioDetalle(){ 
  const { id } = useParams(); 
  
  return(
    <main className="main-container-sm">
      <div className="mb-6">
        <Link to='/episodios' className="link-primary text-sm flex items-center">
          <span className="mr-2">←</span> Volver a episodios
        </Link>
      </div>
      
      <header className="mb-8">
        <h1 className="title-primary">Episodio #{id}</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Información detallada del episodio hospitalario
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Información del paciente */}
        <div className="card p-6">
          <h2 className="title-secondary mb-4">Información del Paciente</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Nombre:</span>
              <p className="font-medium text-[var(--text-primary)]">Paciente Ejemplo</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">RUT:</span>
              <p className="font-medium text-[var(--text-primary)]">12.345.678-9</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Fecha Ingreso:</span>
              <p className="font-medium text-[var(--text-primary)]">15/01/2024</p>
            </div>
          </div>
        </div>

        {/* Información GRD */}
        <div className="card p-6">
          <h2 className="title-secondary mb-4">Información GRD</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Código GRD:</span>
              <p className="font-medium text-[var(--text-primary)]">G045</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Peso:</span>
              <p className="font-medium text-[var(--text-primary)]">1.25</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Estado:</span>
              <span className="badge-success">Inlier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Datos clínicos */}
      <div className="card p-6 mt-6">
        <h2 className="title-secondary mb-4">Datos Clínicos</h2>
        <p className="text-[var(--text-secondary)]">
          Información clínica detallada y códigos GRD asociados al episodio.
        </p>
      </div>
    </main>
  ); 
}
