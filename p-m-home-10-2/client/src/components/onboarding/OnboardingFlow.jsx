import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

/**
 * Progressive onboarding flow for new users
 */
export function OnboardingFlow({
  steps = [],
  onComplete,
  onSkip,
  storageKey = 'onboarding_completed'
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(storageKey);
    if (!completed && steps.length > 0) {
      setIsVisible(true);
    }
  }, [steps, storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                {currentStepData.icon && <currentStepData.icon className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Step {currentStep + 1} of {steps.length}
                </h2>
                <p className="text-sm text-gray-600">Let's get you started</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Skip onboarding"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <motion.div
                className="bg-blue-500 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="text-center">
              {/* Illustration/Icon */}
              {currentStepData.illustration && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mb-6"
                >
                  {currentStepData.illustration}
                </motion.div>
              )}

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-2xl font-bold text-gray-900 mb-3"
              >
                {currentStepData.title}
              </motion.h3>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-gray-600 mb-6 max-w-md mx-auto"
              >
                {currentStepData.description}
              </motion.p>

              {/* Interactive Content */}
              {currentStepData.content && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mb-6"
                >
                  {currentStepData.content}
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            {/* Step Indicators */}
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
              )}

              <Button
                onClick={handleNext}
                rightIcon={currentStep === steps.length - 1 ?
                  <CheckCircle2 className="w-4 h-4" /> :
                  <ChevronRight className="w-4 h-4" />
                }
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Contextual tooltip/guide for specific features
 */
export function FeatureGuide({
  target,
  title,
  description,
  position = 'top',
  isVisible = false,
  onClose,
  onNext,
  step,
  totalSteps
}) {
  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`absolute z-50 ${positions[position]}`}
    >
      <div className="bg-gray-900 text-white rounded-lg p-4 max-w-xs shadow-xl">
        {/* Arrow */}
        <div className={`absolute w-0 h-0 ${
          position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900' :
          position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900' :
          position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900' :
          'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900'
        }`} />

        {/* Content */}
        <div className="relative">
          {step && totalSteps && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">
                {step} of {totalSteps}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <h4 className="font-semibold mb-2">{title}</h4>
          <p className="text-sm text-gray-300 mb-3">{description}</p>

          {onNext && (
            <Button
              size="sm"
              onClick={onNext}
              rightIcon={<ArrowRight className="w-3 h-3" />}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Got it
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Achievement/Notification system for user progress
 */
export function AchievementNotification({
  title,
  description,
  icon: Icon,
  type = 'achievement',
  onClose,
  autoClose = true
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const typeStyles = {
    achievement: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    milestone: 'bg-gradient-to-r from-blue-400 to-purple-500',
    tip: 'bg-gradient-to-r from-green-400 to-blue-500'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div className={`${typeStyles[type]} rounded-lg p-4 shadow-xl text-white`}>
            <div className="flex items-start gap-3">
              {Icon && <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />}
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{title}</h4>
                <p className="text-sm opacity-90">{description}</p>
              </div>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Interactive tutorial overlay
 */
export function InteractiveTutorial({
  steps = [],
  currentStep = 0,
  isActive = false,
  onComplete,
  onSkip,
  onStepChange
}) {
  const [highlightElement, setHighlightElement] = useState(null);

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const element = document.querySelector(steps[currentStep].target);
      setHighlightElement(element);
    }
  }, [isActive, currentStep, steps]);

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Highlight */}
      {highlightElement && (
        <div
          className="absolute border-2 border-blue-500 rounded-lg"
          style={{
            top: highlightElement.offsetTop - 4,
            left: highlightElement.offsetLeft - 4,
            width: highlightElement.offsetWidth + 8,
            height: highlightElement.offsetHeight + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
          }}
        />
      )}

      {/* Tooltip */}
      <div className="absolute z-10 pointer-events-auto" style={{
        top: step.tooltipPosition?.top || '50%',
        left: step.tooltipPosition?.left || '50%',
        transform: 'translate(-50%, -50%)'
      }}>
        <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold mb-2">{step.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{step.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStepChange(currentStep - 1)}
                    >
                      Previous
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      if (currentStep < steps.length - 1) {
                        onStepChange(currentStep + 1);
                      } else {
                        onComplete();
                      }
                    }}
                  >
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onSkip}
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}