'use client';

import { FC } from 'react';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

const ProgressSteps: FC<ProgressStepsProps> = ({ currentStep, totalSteps, labels }) => {
  return (
    <div className="w-full">
      {/* Steps container */}
      <div className="flex items-start justify-between w-full">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step with label */}
            <div className="flex flex-col items-center w-full last:w-auto">
              {/* Step circle */}
              <div className={`
                w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-semibold text-[10px] sm:text-xs md:text-sm
                transition-all duration-300 flex-shrink-0
                ${index < currentStep 
                  ? 'bg-amber-500 text-white' 
                  : index === currentStep 
                    ? 'bg-amber-500 text-white ring-2 ring-amber-200' 
                    : 'bg-gray-200 text-gray-500'
                }
              `}>
                {index < currentStep ? (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Label below circle */}
              {labels && labels[index] && (
                <span 
                  className={`
                    mt-1 text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center leading-tight
                    transition-colors duration-300 whitespace-nowrap
                    ${index <= currentStep ? 'text-amber-600' : 'text-gray-400'}
                  `}
                >
                  {labels[index]}
                </span>
              )}
            </div>
            
            {/* Connector line */}
            {index < totalSteps - 1 && (
              <div className={`
                flex-1 h-0.5 mx-0.5 sm:mx-1 rounded-full transition-colors duration-300 -mt-3 sm:-mt-4
                min-w-[8px]
                ${index < currentStep ? 'bg-amber-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressSteps;
