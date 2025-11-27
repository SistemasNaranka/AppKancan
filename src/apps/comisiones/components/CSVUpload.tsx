import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { useCommission } from '../contexts/CommissionContext';
import { validateBudgetRecord } from '../lib/validation';
import { BudgetRecord } from '../types';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';

export const CSVUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { setBudgets } = useCommission();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    Papa.parse(file as any, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        const errors: string[] = [];
        const budgets: BudgetRecord[] = [];

        results.data.forEach((row: any, index: number) => {
          const validationErrors = validateBudgetRecord(row, index + 2);
          if (validationErrors.length > 0) {
            validationErrors.forEach(err => {
              errors.push(`Fila ${err.row}: ${err.field} - ${err.message}`);
            });
          } else {
            budgets.push({
              tienda: row.tienda.trim(),
              fecha: row.fecha.trim(),
              presupuesto_total: parseFloat(row.presupuesto_total),
            });
          }
        });

        if (errors.length > 0) {
          setMessage({
            type: 'error',
            text: `Errores en el CSV:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... y ${errors.length - 5} errores más` : ''}`,
          });
        } else if (budgets.length === 0) {
          setMessage({
            type: 'error',
            text: 'No se encontraron registros válidos en el CSV',
          });
        } else {
          setBudgets(budgets);
          setMessage({
            type: 'success',
            text: `Se cargaron ${budgets.length} registros de presupuesto correctamente`,
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }

        setLoading(false);
      },
    } as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          {loading ? 'Cargando...' : 'Cargar CSV de Presupuestos'}
        </Button>
      </div>

      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-sm whitespace-pre-wrap">{message.text}</div>
        </div>
      )}

      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="font-semibold mb-2">Formato esperado del CSV:</p>
        <p className="font-mono text-xs">tienda,fecha,presupuesto_total</p>
        <p className="font-mono text-xs">Tienda A,2025-11-01,50000</p>
      </div>
    </div>
  );
};
