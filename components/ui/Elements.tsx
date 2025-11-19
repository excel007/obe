
import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const base = "px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50",
    secondary: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50",
    ghost: "text-slate-500 hover:text-slate-900 disabled:opacity-50"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, value, onChange, placeholder, type = "text", className = "" }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
    />
  </div>
);

export const Textarea = ({ label, value, onChange, placeholder, rows = 3 }: any) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
    />
  </div>
);

export const Card = ({ children, title, className = "" }: any) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border border-slate-200 ${className}`}>
    {title && <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">{title}</h3>}
    {children}
  </div>
);

export const Badge = ({ children, color = "blue", title = "" }: any) => {
    const colors: any = {
        blue: "bg-blue-100 text-blue-800",
        green: "bg-green-100 text-green-800",
        purple: "bg-purple-100 text-purple-800",
        gray: "bg-gray-100 text-gray-800",
        yellow: "bg-yellow-100 text-yellow-800",
        red: "bg-red-100 text-red-800",
    }
    return (
        <span title={title} className={`text-xs font-semibold mr-1 px-2 py-0.5 rounded ${colors[color]}`}>
            {children}
        </span>
    )
}

export const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
