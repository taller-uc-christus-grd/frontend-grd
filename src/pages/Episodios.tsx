import { Link } from 'react-router-dom';
const mock = Array.from({length:10}).map((_,i)=>({ id:String(1000+i), paciente:`Paciente ${i+1}`, grd: i%2?'G045':'G012', estado: i%3===0?'pendiente':'inlier' }));
export default function Episodios(){
  return (
    <main className="main-container-lg">
      <header className="mb-8">
        <h1 className="title-primary">Episodios</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Listado completo de episodios hospitalarios procesados
        </p>
      </header>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-cell font-medium text-[var(--text-primary)]">N° Episodio</th>
                <th className="table-cell font-medium text-[var(--text-primary)]">Paciente</th>
                <th className="table-cell font-medium text-[var(--text-primary)]">GRD</th>
                <th className="table-cell font-medium text-[var(--text-primary)]">Estado</th>
                <th className="table-cell font-medium text-[var(--text-primary)]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mock.map(ep => (
                <tr key={ep.id} className="table-row">
                  <td className="table-cell font-medium text-[var(--text-primary)]">{ep.id}</td>
                  <td className="table-cell text-[var(--text-secondary)]">{ep.paciente}</td>
                  <td className="table-cell">
                    <span className="badge-info">{ep.grd}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`${
                      ep.estado === 'inlier' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {ep.estado}
                    </span>
                  </td>
                  <td className="table-cell">
                    <Link 
                      className="link-primary font-medium" 
                      to={`/episodios/${ep.id}`}
                    >
                      Ver detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
