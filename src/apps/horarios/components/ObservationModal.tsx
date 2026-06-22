import { X, Clock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { ObservacionEvento } from '../interfaces/horarios.interface';

interface ObservationModalProps {
  open: boolean;
  onClose: () => void;
  empleado: string;
  fecha: string;
  observaciones: ObservacionEvento[];
}

export function ObservationModal({
  open,
  onClose,
  empleado,
  fecha,
  observaciones,
}: ObservationModalProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-slate-900/20"
            onClick={onClose}
          />
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed z-50 inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm mx-4 rounded-lg overflow-hidden shadow-2xl border border-slate-200 bg-white">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#00407a]">
                <h2 className="text-sm tracking-widest text-white/90 uppercase">
                  Observaciones
                </h2>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-6 h-6 rounded text-white/60 hover:text-white hover:bg-white/15 transition-colors duration-150 cursor-pointer"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              </div>

              {/* Info del empleado */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#00407a]">{empleado}</span>
                <span className="text-xs text-slate-400">{fecha}</span>
              </div>

              {/* Lista de observaciones */}
              <div className="px-5 py-4 space-y-3 max-h-[300px] overflow-y-auto">
                {observaciones.map((obs, idx) => (
                  <div key={idx} className="border-l-2 border-[#00407a] pl-3 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={12} className="text-[#00407a]" />
                      <span className="text-xs font-semibold text-[#00407a]">{obs.evento}</span>
                      {obs.hora && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Clock size={11} className="text-slate-400" />
                          <span className="text-xs text-slate-400">{obs.hora.slice(0, 5)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm italic text-slate-600 leading-relaxed">
                      {obs.observacion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}