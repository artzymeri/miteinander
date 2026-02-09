'use client';

import { FC } from 'react';

interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

const RoleCard: FC<RoleCardProps> = ({ title, description, icon, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left
        ${isSelected 
          ? 'border-amber-500 bg-amber-50 shadow-lg scale-[1.02]' 
          : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          p-3 rounded-xl transition-colors duration-300
          ${isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}
        `}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={`
            text-lg font-semibold mb-1 transition-colors duration-300
            ${isSelected ? 'text-amber-700' : 'text-gray-900'}
          `}>
            {title}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
          ${isSelected 
            ? 'border-amber-500 bg-amber-500' 
            : 'border-gray-300 bg-white'
          }
        `}>
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
};

export default RoleCard;
