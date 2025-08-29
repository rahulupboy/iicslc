import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateProblemStatements } from '@/lib/gemini';
import { toast } from '@/hooks/use-toast';

export const useProblemGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedProblems, setCompletedProblems] = useState(0);

  const generateProblems = useCallback(async (
    userId: string,
    skills: string[],
    problemStatement: string
  ) => {
    setIsGenerating(true);
    setCurrentStep(0);
    setCompletedProblems(0);

    try {
      const totalProblems = 5;
      const existingProblems: Array<{ problem_title: string; problem_description: string }> = [];

      for (let i = 0; i < totalProblems; i++) {
        setCurrentStep((i * 3) + 1); // Each problem has 3 steps

        try {
          // Step 1: Analyzing skills
          await new Promise(resolve => setTimeout(resolve, 1000));
          setCurrentStep((i * 3) + 2);

          // Step 2: Generate problem using Gemini
          const problemData = await generateProblemStatements(
            skills,
            problemStatement,
            existingProblems
          );

          // Step 3: Save to database
          setCurrentStep((i * 3) + 3);
          
          // Calculate challenge date (starting from tomorrow, one per day)
          const challengeDate = new Date();
          challengeDate.setDate(challengeDate.getDate() + i);
          
          const { error } = await supabase
            .from('day_problems')
            .insert({
              user_id: userId,
              day_number: i + 1,
              problem_title: problemData.problem_title,
              problem_description: problemData.problem_description,
              challenge_date: challengeDate.toISOString().split('T')[0],
              is_active: i === 0 // First problem (today) is active initially
            });

          if (error) {
            console.error(`Error saving problem ${i + 1}:`, error);
            throw error;
          }

          // Add to existing problems for context in next generation
          existingProblems.push({
            problem_title: problemData.problem_title,
            problem_description: problemData.problem_description
          });

          setCompletedProblems(i + 1);
          
          // Small delay between problems to show progress
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`Error generating problem ${i + 1}:`, error);
          toast({
            title: `Problem ${i + 1} generation failed`,
            description: "Continuing with next problem...",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "🎉 Problem generation complete!",
        description: `${completedProblems} personalized challenges created for your SIH journey`,
      });

    } catch (error) {
      console.error('Error in problem generation process:', error);
      toast({
        title: "Generation failed",
        description: "Please try again later or contact support",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
    }
  }, []);

  return {
    isGenerating,
    currentStep,
    completedProblems,
    generateProblems
  };
};