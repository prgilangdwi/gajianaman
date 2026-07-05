import { createContext, useContext, useState, type ReactNode } from 'react';
import { format } from 'date-fns';

interface MonthFilterValue {
  selectedMonth: string;       // "YYYY-MM"
  setSelectedMonth: (m: string) => void;
  monthOptions: { value: string; label: string }[];
  month: number;
  year: number;
}

const MonthFilterContext = createContext<MonthFilterValue | null>(null);

const FIRST_YEAR = 2026;

function buildOptions() {
  const now = new Date();
  const start = new Date(FIRST_YEAR, 0, 1);
  const months: { value: string; label: string }[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);

  while (cursor >= start) {
    months.push({
      value: format(cursor, 'yyyy-MM'),
      label: format(cursor, 'MMM-yy'),
    });
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return months;
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
