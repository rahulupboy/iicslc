import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, CheckCircle, Clock } from 'lucide-react';

interface ProblemGenerationStatusProps {
  isGenerating: boolean;
  currentStep: number;
  totalSteps: number;
  completedProblems: number;
}

const ProblemGenerationStatus = ({ 
  isGenerating, 
  currentStep, 
  totalSteps, 
  completedProblems 
}: ProblemGenerationStatusProps) => {
  const progress = (completedProblems / totalSteps) * 100;
  
  const steps = [
    { icon: Brain, label: "Analyzing your skills", description: "Processing your technical capabilities" },
    { icon: Zap, label: "Crafting problem statement", description: "Creating personalized challenge" },
    { icon: CheckCircle, label: "Validating complexity", description: "Ensuring optimal difficulty" },
  ];

  if (!isGenerating && completedProblems === totalSteps) {
    return null;
  }

  return (
    <Card className="shadow-glow border-primary/20 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 font-mono">
          <Brain className="w-5 h-5 text-accent animate-pulse" />
          <span className="text-primary">AI Problem Generator</span>
        </CardTitle>
        <CardDescription className="font-mono">
          Gemini AI is crafting personalized challenges for your SIH journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center font-mono text-sm">
            <span className="text-muted-foreground">Generation Progress</span>
            <span className="text-accent">{completedProblems}/{totalSteps} Problems</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Generation Status */}
        {isGenerating && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent"></div>
              <div className="font-mono">
                <p className="text-sm font-medium text-primary">
                  Generating Problem {completedProblems + 1}
                </p>
                <p className="text-xs text-muted-foreground">
                  {steps[(currentStep - 1) % steps.length]?.label}
                </p>
              </div>
            </div>

            {/* Generation Steps */}
            <div className="space-y-2">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = (currentStep - 1) % steps.length === index;
                const isCompleted = (currentStep - 1) % steps.length > index;
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
                      isActive ? 'bg-accent/20 border border-accent/30' : 
                      isCompleted ? 'bg-success/10 border border-success/20' : 
                      'bg-muted/20'
                    }`}
                  >
                    <StepIcon className={`w-4 h-4 ${
                      isActive ? 'text-accent animate-pulse' :
                      isCompleted ? 'text-success' :
                      'text-muted-foreground'
                    }`} />
                    <div className="font-mono text-sm">
                      <p className={`font-medium ${
                        isActive ? 'text-accent' :
                        isCompleted ? 'text-success' :
                        'text-muted-foreground'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="w-4 h-4 text-success ml-auto" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {!isGenerating && completedProblems > 0 && completedProblems < totalSteps && (
          <div className="text-center py-4">
            <p className="text-accent font-mono mb-2">
              ✓ {completedProblems} problems generated successfully!
            </p>
            <p className="text-muted-foreground font-mono text-sm">
              Continuing with next problem...
            </p>
          </div>
        )}

        {/* Estimated Time */}
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground font-mono">
          <Clock className="w-3 h-3" />
          <span>Estimated time: {(totalSteps - completedProblems) * 15-30} seconds</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProblemGenerationStatus;