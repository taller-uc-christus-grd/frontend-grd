export default function Footer() {
    const year = new Date().getFullYear();
  
    return (
      <footer className="mt-10 bg-white">
        {/* sombra/gradiente superior suave */}
        <div className="h-2 bg-gradient-to-b from-slate-200/70 to-transparent" />
        {/* línea divisoria */}
        <div className="border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <p className="text-xs text-right">
              <span className="text-purple-600">
                © {year} ConectaGRD — UC Christus
              </span>
            </p>
          </div>
        </div>
      </footer>
    );
  }
  
