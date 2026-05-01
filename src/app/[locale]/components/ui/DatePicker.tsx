import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';

interface CustomDatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onChange,
  label,
  placeholder,
  error,
  required,
  className,
  minDate,
  maxDate
}) => {
  // Get current year for the year range
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 10; // 10 years in the past
  const endYear = currentYear + 10; // 10 years in the future

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative" style={{ zIndex: 30 }}>
        <DatePicker
          selected={selectedDate}
          onChange={onChange}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholder}
          className={`w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className || ''}`}
          wrapperClassName="w-full"
          popperClassName="react-datepicker-popper"
          popperPlacement="bottom-start"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          locale={ptBR}
          yearDropdownItemNumber={21} // Increased to show more years
          scrollableYearDropdown
          minDate={minDate || new Date(startYear, 0, 1)}
          maxDate={maxDate || new Date(endYear, 11, 31)}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      <style jsx global>{`
        .react-datepicker-wrapper {
          display: block;
          width: 100%;
        }
        .react-datepicker__input-container {
          display: block;
          width: 100%;
        }
        .react-datepicker-popper {
          z-index: 9999 !important;
          margin-top: 1px !important;
        }
        .react-datepicker {
          font-family: inherit;
          border-radius: 0.5rem;
          border: none;
          background: white;
          width: 100%;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.06),
                      0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        .react-datepicker::before {
          content: '';
          position: absolute;
          inset: -8px;
          background: white;
          border-radius: 0.75rem;
          z-index: -1;
        }
        .react-datepicker__triangle {
          display: none;
        }
        .react-datepicker__month-container {
          float: none;
          background: white;
          border-radius: 0.5rem;
          position: relative;
          z-index: 1;
          padding: 8px;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05),
                      0 0 #0000,
                      0 0 #0000,
                      0 0 #0000;
        }
        .react-datepicker__header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          padding-top: 12px;
          position: relative;
        }
        .react-datepicker__day-names {
          border-top: 1px solid #e5e7eb;
          margin-top: 8px;
          background: white;
          position: relative;
        }
        .react-datepicker__month {
          background: white;
          position: relative;
          margin: 0;
          padding: 0.4rem;
        }
        .react-datepicker__day-name {
          color: #6b7280;
          font-weight: 500;
        }
        .react-datepicker__current-month {
          color: #111827;
          font-weight: 600;
          font-size: 1rem;
          padding: 0 8px;
        }
        .react-datepicker__day {
          border-radius: 0.375rem;
          color: #374151;
          position: relative;
          z-index: 1;
          margin: 0.2rem;
        }
        .react-datepicker__day:hover {
          background-color: #f3f4f6;
        }
        .react-datepicker__day--selected {
          background-color: #3b82f6;
          color: white !important;
          font-weight: 600;
          position: relative;
        }
        .react-datepicker__day--selected::after {
          content: '';
          position: absolute;
          inset: -2px;
          border: 2px solid #93c5fd;
          border-radius: 0.375rem;
          z-index: -1;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #93c5fd;
          color: white;
        }
        .react-datepicker__day--today {
          font-weight: 600;
          color: #3b82f6;
          position: relative;
        }
        .react-datepicker__day--today::after {
          content: '';
          position: absolute;
          inset: -1px;
          border: 1px solid #93c5fd;
          border-radius: 0.375rem;
          z-index: -1;
        }
        .react-datepicker__day--outside-month {
          color: #9ca3af;
        }
        .react-datepicker__navigation {
          top: 12px;
        }
        .react-datepicker__navigation--previous {
          left: 12px;
        }
        .react-datepicker__navigation--next {
          right: 12px;
        }
        .react-datepicker__week {
          background: white;
        }
        .react-datepicker__month-dropdown,
        .react-datepicker__year-dropdown {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .react-datepicker__month-dropdown-container,
        .react-datepicker__year-dropdown-container {
          margin: 0 5px;
        }
        .react-datepicker__month-read-view--selected-month,
        .react-datepicker__year-read-view--selected-year {
          font-weight: 600;
          color: #3b82f6;
        }
        .react-datepicker__month-option,
        .react-datepicker__year-option {
          padding: 8px 12px;
          transition: background-color 0.2s;
        }
        .react-datepicker__month-option:hover,
        .react-datepicker__year-option:hover {
          background-color: #f3f4f6;
        }
        .react-datepicker__month-option--selected,
        .react-datepicker__year-option--selected {
          background-color: #3b82f6;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker; 