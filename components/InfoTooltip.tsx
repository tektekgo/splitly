import React, { useState } from 'react';

interface InfoTooltipProps {
  text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="ml-1 text-gray-400 hover:text-primary transition-colors"
        aria-label="More information"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
      
      {show && (
        <div className="absolute z-50 left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
          <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
          {text}
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;

