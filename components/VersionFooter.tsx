import React from 'react';
import { getVersionString } from '../src/version';

interface VersionFooterProps {
  className?: string;
}

const VersionFooter: React.FC<VersionFooterProps> = ({ className = '' }) => {
  try {
    const versionString = getVersionString();
    
    return (
      <div className={`text-center ${className}`}>
        <p className="text-[10px] text-sage/60 dark:text-gray-500/60 font-mono tracking-wide">
          {versionString}
        </p>
      </div>
    );
  } catch (error) {
    // Gracefully handle if version.ts doesn't exist (dev mode without build)
    return null;
  }
};

export default VersionFooter;

