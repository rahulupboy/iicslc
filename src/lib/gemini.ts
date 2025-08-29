export async function generateProblemStatements(skills: string[], gender: string): Promise<string[]> {
  // Placeholder implementation - replace with actual Gemini API integration
  const problemTemplates = [
    "Create a responsive web component that displays user information",
    "Build a data visualization dashboard using modern frameworks",
    "Implement a real-time chat application with proper state management",
    "Design and develop a mobile-first e-commerce product page",
    "Create an interactive form with validation and error handling"
  ];

  // Filter and customize based on skills
  const relevantProblems = problemTemplates.filter((_, index) => 
    skills.some(skill => skill.toLowerCase().includes(['web', 'react', 'javascript', 'frontend', 'backend'][index % 5]))
  );

  return relevantProblems.length > 0 ? relevantProblems : problemTemplates;
}