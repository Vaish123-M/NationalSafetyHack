import React from 'react';

export default function Button({ children, onClick, type = 'button', className = '', disabled = false }) {
  const baseClasses = `
    bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 
    text-white font-semibold py-2 px-6 rounded-lg shadow-lg 
    hover:from-pink-600 hover:to-purple-600 transition-all 
    focus:outline-none focus:ring-4 focus:ring-pink-300 
    focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
