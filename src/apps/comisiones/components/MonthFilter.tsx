import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

interface MonthFilterProps {
  selectedMonth: string;
  availableMonths: string[];
  onMonthChange: (month: string) => void;
}

export const MonthFilter: React.FC<MonthFilterProps> = ({
  selectedMonth,
  availableMonths,
  onMonthChange,
}) => {
  const currentIndex = availableMonths.indexOf(selectedMonth);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < availableMonths.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onMonthChange(availableMonths[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onMonthChange(availableMonths[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
      <Label className="font-semibold text-gray-700">Filtrar por mes:</Label>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <ArrowBack className="w-4 h-4" />
          Anterior
        </Button>

        <div className="min-w-32">
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleNext}
          disabled={!hasNext}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          Siguiente
          <ArrowForward className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
