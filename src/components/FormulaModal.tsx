import React from 'react';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  formula: string;
  title: string;
}

export default function FormulaModal({ isOpen, onClose, formula, title }: FormulaModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border-2 border-purple-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 overflow-x-auto">
          <p className="text-xs font-mono font-semibold text-purple-900 text-center whitespace-nowrap">
            {formula}
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

