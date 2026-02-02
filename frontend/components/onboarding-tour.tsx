'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ steps, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(true);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setShow(false);
    onComplete();
  };

  const handleSkip = () => {
    setShow(false);
    onSkip();
  };

  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in" />

      {/* Tour Card */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-slide-up shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-muted-foreground mb-6">{step.description}</p>

            {/* Progress dots */}
            <div className="flex items-center gap-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-muted'
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Skip tour
              </Button>
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button variant="outline" onClick={handlePrevious}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button onClick={handleNext}>
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Hook to manage onboarding state
export function useOnboarding(tourId: string) {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(`onboarding-${tourId}`);
    if (!hasCompletedTour) {
      // Show tour after a short delay
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [tourId]);

  const completeTour = () => {
    localStorage.setItem(`onboarding-${tourId}`, 'true');
    setShowTour(false);
  };

  const skipTour = () => {
    localStorage.setItem(`onboarding-${tourId}`, 'skipped');
    setShowTour(false);
  };

  const resetTour = () => {
    localStorage.removeItem(`onboarding-${tourId}`);
    setShowTour(true);
  };

  return { showTour, completeTour, skipTour, resetTour };
}
