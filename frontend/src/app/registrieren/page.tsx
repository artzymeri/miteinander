'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import { 
  RegisterHeader, 
  RoleSelector, 
  ProgressSteps,
  AccountForm,
  PersonalForm,
  AddressForm,
  CareNeedsForm,
  EmergencyContactForm,
  CareGiverDetailsForm
} from '@/components/register';

interface FormData {
  // Account
  email: string;
  password: string;
  confirmPassword: string;
  // Personal
  firstName: string;
  lastName: string;
  phoneCountryCode: string;
  phone: string;
  dateOfBirth: string;
  // Address
  address: string;
  country: string;
  city: string;
  postalCode: string;
  // Care Recipient specific
  careNeeds: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactPhoneCountryCode: string;
  // Care Giver specific
  bio: string;
  skills: string[];
  certifications: string;
  experienceYears: string;
  occupation: string;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'care_giver' | 'care_recipient' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneCountryCode: '+49',
    phone: '',
    dateOfBirth: '',
    address: '',
    country: '',
    city: '',
    postalCode: '',
    careNeeds: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactPhoneCountryCode: '+49',
    bio: '',
    skills: [],
    certifications: '',
    experienceYears: '',
    occupation: '',
  });

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'support') {
        router.push('/admin');
      } else if (user.role === 'care_giver') {
        router.push('/caregiver');
      } else if (user.role === 'care_recipient') {
        router.push('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Care recipient has 7 steps, care giver has 6 steps
  const CARE_RECIPIENT_STEP_LABELS = [
    t('register.stepRole'), 
    t('register.stepAccount'), 
    t('register.stepPersonal'), 
    t('register.stepAddress'),
    t('register.stepCareNeeds'),
    t('register.stepEmergencyContact'),
    t('register.stepConfirmation')
  ];

  const CARE_GIVER_STEP_LABELS = [
    t('register.stepRole'), 
    t('register.stepAccount'), 
    t('register.stepPersonal'), 
    t('register.stepAddress'),
    t('register.stepDetails'),
    t('register.stepConfirmation')
  ];

  const STEP_LABELS = selectedRole === 'care_recipient' ? CARE_RECIPIENT_STEP_LABELS : CARE_GIVER_STEP_LABELS;

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  const handleRoleSelect = (role: 'care_giver' | 'care_recipient') => {
    setSelectedRole(role);
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Build the registration payload based on role
      const payload: Record<string, unknown> = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: selectedRole,
        phone: formData.phoneCountryCode + formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country || 'DE',
      };
      
      if (selectedRole === 'care_recipient') {
        payload.careNeeds = formData.careNeeds;
        payload.emergencyContactName = formData.emergencyContactName;
        payload.emergencyContactPhone = formData.emergencyContactPhoneCountryCode + formData.emergencyContactPhone;
      } else {
        payload.bio = formData.bio;
        payload.skills = formData.skills;
        payload.certifications = formData.certifications;
        payload.experienceYears = formData.experienceYears ? parseInt(formData.experienceYears) : null;
        payload.occupation = formData.occupation || null;
      }
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Map error codes to translation keys
        const errorCode = data.error?.code;
        if (errorCode === 'EMAIL_EXISTS') {
          throw new Error(t('register.emailExists'));
        } else if (errorCode === 'PHONE_EXISTS') {
          throw new Error(t('register.phoneExists'));
        }
        throw new Error(data.error?.message || t('register.registrationFailed'));
      }
      
      // Registration successful - redirect to email verification
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('register.registrationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    // Check if this is the last step before confirmation
    const isLastDataStep = currentStep === STEP_LABELS.length - 2;
    
    if (isLastDataStep) {
      // Submit registration
      await handleSubmit();
    } else if (currentStep < STEP_LABELS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0:
        return selectedRole !== null;
      case 1:
        return (
          formData.email.length > 0 &&
          formData.password.length >= 8 &&
          formData.password === formData.confirmPassword
        );
      case 2:
        return (
          formData.firstName.length > 0 &&
          formData.lastName.length > 0
        );
      case 3:
        return (
          formData.address.length > 0 &&
          formData.city.length > 0 &&
          formData.postalCode.length > 0
        );
      case 4:
        if (selectedRole === 'care_recipient') {
          return formData.careNeeds.length > 0;
        } else {
          return formData.bio.length > 0 && formData.skills.length > 0;
        }
      case 5:
        if (selectedRole === 'care_recipient') {
          return (
            formData.emergencyContactName.length > 0 &&
            formData.emergencyContactPhone.length > 0
          );
        }
        return true;
      default:
        return true;
    }
  };

  const canProceed = validateCurrentStep();

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <RegisterHeader />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-12">
            <ProgressSteps 
              currentStep={currentStep} 
              totalSteps={STEP_LABELS.length}
              labels={STEP_LABELS}
            />
          </div>
          
          {/* Registration card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10">
            {/* Step 0: Role Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    {t('register.welcome')}
                  </h1>
                  <p className="text-gray-600">
                    {t('register.chooseRole')}
                  </p>
                </div>
                
                <RoleSelector 
                  selectedRole={selectedRole}
                  onRoleSelect={handleRoleSelect}
                />
              </div>
            )}
            
            {/* Step 1: Account */}
            {currentStep === 1 && (
              <AccountForm
                email={formData.email}
                password={formData.password}
                confirmPassword={formData.confirmPassword}
                onChange={updateFormData}
              />
            )}
            
            {/* Step 2: Personal Data */}
            {currentStep === 2 && (
              <PersonalForm
                firstName={formData.firstName}
                lastName={formData.lastName}
                phoneCountryCode={formData.phoneCountryCode}
                phone={formData.phone}
                dateOfBirth={formData.dateOfBirth}
                onChange={updateFormData}
              />
            )}
            
            {/* Step 3: Address */}
            {currentStep === 3 && (
              <AddressForm
                address={formData.address}
                country={formData.country}
                city={formData.city}
                postalCode={formData.postalCode}
                onChange={updateFormData}
              />
            )}
            
            {/* Step 4: Role-specific - Care Needs for care recipient, Details for care giver */}
            {currentStep === 4 && selectedRole === 'care_recipient' && (
              <CareNeedsForm
                careNeeds={formData.careNeeds}
                onChange={updateFormData}
              />
            )}
            
            {currentStep === 4 && selectedRole === 'care_giver' && (
              <CareGiverDetailsForm
                bio={formData.bio}
                skills={formData.skills}
                certifications={formData.certifications}
                experienceYears={formData.experienceYears}
                occupation={formData.occupation}
                onChange={updateFormData}
              />
            )}
            
            {/* Step 5: Emergency Contact for care recipient only */}
            {currentStep === 5 && selectedRole === 'care_recipient' && (
              <EmergencyContactForm
                emergencyContactName={formData.emergencyContactName}
                emergencyContactPhone={formData.emergencyContactPhone}
                emergencyContactPhoneCountryCode={formData.emergencyContactPhoneCountryCode}
                onChange={updateFormData}
              />
            )}
            
            {/* Confirmation Step - Step 5 for care giver, Step 6 for care recipient */}
            {((currentStep === 5 && selectedRole === 'care_giver') || 
              (currentStep === 6 && selectedRole === 'care_recipient')) && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {t('register.registrationSuccess')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('register.accountCreated')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('register.canNowLogin')}
                </p>
              </div>
            )}
            
            {/* Error message */}
            {submitError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {submitError}
              </div>
            )}
            
            {/* Navigation buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              {currentStep > 0 && currentStep < STEP_LABELS.length - 1 && !isSubmitting && (
                <button
                  onClick={handleBack}
                  className="w-full sm:flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors order-2 sm:order-1 cursor-pointer"
                >
                  {t('register.back')}
                </button>
              )}
              
              {currentStep < STEP_LABELS.length - 1 && (
                <button
                  onClick={handleNext}
                  disabled={!canProceed || isSubmitting}
                  className={`
                    w-full sm:flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 order-1 sm:order-2 cursor-pointer flex items-center justify-center gap-2
                    ${canProceed && !isSubmitting
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('register.submitting')}
                    </>
                  ) : currentStep === STEP_LABELS.length - 2 ? (
                    t('register.completeRegistration')
                  ) : (
                    t('register.next')
                  )}
                </button>
              )}
              
              {currentStep === STEP_LABELS.length - 1 && (
                <a
                  href="/login"
                  className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-amber-500 text-white font-medium text-center hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
                >
                  {t('register.goToLogin')}
                </a>
              )}
            </div>
          </div>
          
          {/* Footer links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {t('register.alreadyAccount')}{' '}
              <a href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                {t('register.loginNow')}
              </a>
            </p>
          </div>
          
          {/* Terms */}
          <p className="mt-6 text-center text-xs text-gray-500 px-4">
            {t('register.termsAgree')}{' '}
            <a href="/agb" className="text-amber-600 hover:underline">{t('footer.terms')}</a>
            {' '}{t('register.and')}{' '}
            <a href="/datenschutz" className="text-amber-600 hover:underline">{t('footer.privacy')}</a>
            {' '}zu.
          </p>
        </div>
      </div>
    </main>
  );
}
