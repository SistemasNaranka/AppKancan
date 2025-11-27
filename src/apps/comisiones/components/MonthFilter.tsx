import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      <label className="font-semibold text-gray-700">Filtrar por mes:</label>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <div className="min-w-32 text-center">
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleNext}
          disabled={!hasNext}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
