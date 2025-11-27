import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCommission } from '../contexts/CommissionContext';
import { validateBudgetRecord } from '../lib/validation';
import { BudgetRecord } from '../types';
import { Error, CheckCircle, Upload as UploadIcon } from '@mui/icons-material';

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
    <Card>
      <CardContent className="space-y-4">
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
            <UploadIcon className="w-4 h-4" />
            {loading ? 'Cargando...' : 'Cargar CSV de Presupuestos'}
          </Button>
        </div>

        {message && (
          <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Error className="h-4 w-4" />
            )}
            <AlertDescription className="whitespace-pre-wrap">
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="font-semibold mb-2">Formato esperado del CSV:</p>
          <p className="font-mono text-xs">tienda,fecha,presupuesto_total</p>
          <p className="font-mono text-xs">Tienda A,2025-11-01,50000</p>
        </div>
      </CardContent>
    </Card>
  );
};
