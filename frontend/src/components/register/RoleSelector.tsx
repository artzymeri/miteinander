'use client';

import { FC } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import RoleCard from './RoleCard';

interface RoleSelectorProps {
  selectedRole: 'care_giver' | 'care_recipient' | null;
  onRoleSelect: (role: 'care_giver' | 'care_recipient') => void;
}

const HeartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
    />
  </svg>
);

const HandIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" 
    />
  </svg>
);

const RoleSelector: FC<RoleSelectorProps> = ({ selectedRole, onRoleSelect }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <RoleCard
        title={t('register.seekingCare')}
        description={t('register.seekingCareDesc')}
        icon={<HeartIcon />}
        isSelected={selectedRole === 'care_recipient'}
        onClick={() => onRoleSelect('care_recipient')}
      />
      
      <RoleCard
        title={t('register.offeringCare')}
        description={t('register.offeringCareDesc')}
        icon={<HandIcon />}
        isSelected={selectedRole === 'care_giver'}
        onClick={() => onRoleSelect('care_giver')}
      />
    </div>
  );
};

export default RoleSelector;
