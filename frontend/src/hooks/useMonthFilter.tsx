import { createContext, useContext, useState, type ReactNode } from 'react';
import { format, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface MonthFilterValue {
  selectedMonth: string;       // "YYYY-MM"
  setSelectedMonth: (m: string) => void;
  monthOptions: { value: string; label: string }[];
  month: number;
  year: number;
}

const MonthFilterContext = createContext<MonthFilterValue | null>(null);

function buildOptions() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, i);
    return {
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: idLocale }),
    };
  });
}

export function MonthFilterProvider({ children }: { children: ReactNode }) {
  const options = buildOptions();
  const [selectedMonth, setSelectedMonth] = useState(options[0].value);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  return (
    <MonthFilterContext.Provider value={{ selectedMonth, setSelectedMonth, monthOptions: options, month, year }}>
      {children}
    </MonthFilterContext.Provider>
  );
}

export function useMonthFilter() {
  const ctx = useContext(MonthFilterContext);
  if (!ctx) throw new Error('useMonthFilter must be used inside MonthFilterProvider');
  return ctx;
}
