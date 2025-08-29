import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, ChevronLeft, User, Code, Target, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ProblemGenerationStatus from "./ProblemGenerationStatus";
import { useProblemGeneration } from "@/hooks/useProblemGeneration";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showProblemGeneration, setShowProblemGeneration] = useState(false);
  const { isGenerating, currentStep: generationStep, completedProblems, generateProblems } = useProblemGeneration();
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    skills: '',
    problemStatement: ''
  });

  const steps = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Initialize your profile',
      icon: User
    },
    {
      id: 'skills',
      title: 'Skill Matrix',
      description: 'Define your technical capabilities',
      icon: Code
    },
    {
      id: 'problem',
      title: 'Target Problem',
      description: 'Select your SIH domain',
      icon: Target
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('No authenticated user');

      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(Boolean);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          gender: formData.gender,
          skills: skillsArray,
          problem_statement: formData.problemStatement
        })
        .eq('user_id', user.data.user.id);

      if (error) throw error;

      toast({
        title: "Profile initialized successfully! 🎯",
        description: "Welcome to the SIH preparation matrix, SLCIAN!",
      });

      // Show problem generation status and start generation
      setShowProblemGeneration(true);
      setIsLoading(false);
      
      // Start problem generation in background
      await generateProblems(user.data.user.id, skillsArray, formData.problemStatement);
      
      // Complete onboarding after generation
      onComplete();
    } catch (error: any) {
      toast({
        title: "Profile initialization failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } finally {
      // Keep loading state until generation completes
    }
  };

  // Show problem generation status if active
  if (showProblemGeneration) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-card/20">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Terminal className="w-10 h-10 text-accent animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-cyber bg-clip-text text-transparent font-mono">SIH SLC</h1>
            </div>
            <p className="text-muted-foreground font-mono">AI is crafting your personalized challenge matrix...</p>
          </div>
          
          <ProblemGenerationStatus
            isGenerating={isGenerating}
            currentStep={generationStep}
            totalSteps={5}
            completedProblems={completedProblems}
          />
          
          {!isGenerating && completedProblems === 5 && (
            <div className="text-center mt-6">
              <p className="text-accent font-mono text-lg mb-2">
                🚀 All systems ready!
              </p>
              <p className="text-muted-foreground font-mono text-sm">
                Redirecting to your personalized dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-card/20">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Terminal className="w-10 h-10 text-accent animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-cyber bg-clip-text text-transparent font-mono">SIH SLC</h1>
          </div>
          <p className="text-muted-foreground font-mono">Initializing preparation matrix...</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${
                index <= currentStep ? 'bg-accent shadow-neon' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Card className="shadow-glow animate-fade-in border-primary/20 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-cyber/20 border border-accent/30 flex items-center justify-center">
                {React.createElement(steps[currentStep].icon, { className: "w-5 h-5 text-accent" })}
              </div>
              <div>
                <CardTitle className="text-xl font-mono text-primary">{steps[currentStep].title}</CardTitle>
                <CardDescription className="font-mono text-sm">{steps[currentStep].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-mono text-accent">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="font-mono bg-background/50 border-primary/30 focus:border-accent focus:shadow-neon transition-all duration-300"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-mono text-accent">Gender</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" className="border-accent text-accent" />
                      <Label htmlFor="male" className="font-mono">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" className="border-accent text-accent" />
                      <Label htmlFor="female" className="font-mono">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" className="border-accent text-accent" />
                      <Label htmlFor="other" className="font-mono">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="skills" className="font-mono text-accent">Skill Matrix</Label>
                  <Textarea
                    id="skills"
                    placeholder="React, TypeScript, Node.js, Python, Data Science, Machine Learning, UI/UX, DevOps"
                    value={formData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    className="min-h-[120px] font-mono bg-background/50 border-primary/30 focus:border-accent focus:shadow-neon transition-all duration-300"
                  />
                  <p className="text-sm text-muted-foreground font-mono">
                    <span className="text-accent">// </span>
                    List skills in <strong className="text-primary">decreasing order of confidence</strong>. 
                    <br />
                    <span className="text-accent">// </span>
                    Algorithm will optimize preparation strategy based on skill matrix.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="problem" className="font-mono text-accent">Target Problem Statement</Label>
                  <Textarea
                    id="problem"
                    placeholder="Problem Statement: Develop an AI-powered solution for..."
                    value={formData.problemStatement}
                    onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                    className="min-h-[150px] font-mono bg-background/50 border-primary/30 focus:border-accent focus:shadow-neon transition-all duration-300"
                  />
                  <p className="text-sm text-muted-foreground font-mono">
                    <span className="text-accent">// </span>
                    Select optimal SIH problem statement matching skill matrix.
                    <br />
                    <span className="text-accent">// </span>
                    Challenge generator will target specific domain requirements.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 font-mono"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button 
                  onClick={handleComplete} 
                  className="flex items-center space-x-2 font-mono" 
                  variant="neon"
                  disabled={isLoading}
                >
                  <span>{isLoading ? "Initializing..." : "Initialize Profile"}</span>
                </Button>
              ) : (
                <Button onClick={handleNext} className="flex items-center space-x-2 font-mono" variant="neon">
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingFlow;