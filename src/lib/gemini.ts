import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyD4C7drU0i3yg9vCx_UyN1kgYaNWnV3K4E');

interface ProblemData {
  problem_title: string;
  problem_description: string;
}

export async function generateProblemStatements(
  skills: string[], 
  problemStatement: string, 
  existingProblems: Array<{ problem_title: string; problem_description: string }> = []
): Promise<ProblemData> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Get the user's primary skill (first in the list)
    const primarySkill = skills[0] || 'Programming';
    const secondarySkills = skills.slice(1, 3); // Take next 2 skills
    
    // Create context from existing problems to avoid repetition
    const existingContext = existingProblems.length > 0 
      ? `\n\nPrevious problems generated:\n${existingProblems.map((p, i) => `${i + 1}. ${p.problem_title}`).join('\n')}\n\nMake sure the new problem is different from these.`
      : '';

    const prompt = `You are an AI assistant helping students prepare for Smart India Hackathon (SIH). Generate a single, specific coding challenge that focuses primarily on the student's strongest skill.

STUDENT PROFILE:
- Primary Skill (MAIN FOCUS): ${primarySkill}
- Secondary Skills: ${secondarySkills.join(', ')}
- Target Problem Domain: ${problemStatement}
- Level: Hackathon preparation (intermediate level, not beginner but not expert)

REQUIREMENTS:
1. Create a problem that is 70% focused on their PRIMARY SKILL (${primarySkill})
2. Only incorporate secondary skills if they naturally complement the primary skill
3. The problem should be directly related to their chosen SIH domain: "${problemStatement}"
4. Make it hackathon-appropriate: practical, implementable in 6-8 hours
5. Include specific technical requirements that match their skill level
6. The problem should help them build something they could showcase in SIH

SKILL-SPECIFIC GUIDELINES:
- If primary skill is Frontend (React, Vue, Angular): Focus on UI/UX, responsive design, user interactions
- If primary skill is Backend (Node.js, Python, Java): Focus on APIs, databases, server logic
- If primary skill is ML/AI: Focus on data processing, model implementation, intelligent features
- If primary skill is UI/UX/Design: Focus on user experience, design systems, prototyping
- If primary skill is Mobile: Focus on mobile app development, native features
- If primary skill is DevOps: Focus on deployment, CI/CD, infrastructure

FORMAT YOUR RESPONSE AS:
Title: [Specific, actionable title that clearly indicates the primary skill focus]

Description: [Detailed problem description with:
- Clear problem statement related to their SIH domain
- Specific technical requirements focusing on their primary skill
- Expected deliverables
- Success criteria
- Any constraints or special considerations]

Make the problem challenging but achievable for a hackathon participant. Include specific technologies they should use based on their primary skill.${existingContext}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response to extract title and description
    const titleMatch = text.match(/Title:\s*(.+)/i);
    const descriptionMatch = text.match(/Description:\s*([\s\S]+)/i);
    
    if (!titleMatch || !descriptionMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    return {
      problem_title: titleMatch[1].trim(),
      problem_description: descriptionMatch[1].trim()
    };
    
  } catch (error) {
    console.error('Error generating problem with Gemini:', error);
    
    // Fallback to skill-specific templates if API fails
    return generateSkillBasedFallback(skills, problemStatement, existingProblems);
  }
}

function generateSkillBasedFallback(
  skills: string[], 
  problemStatement: string, 
  existingProblems: Array<{ problem_title: string; problem_description: string }>
): ProblemData {
  // Skill-specific problem templates
  const skillTemplates: Record<string, ProblemData[]> = {
    'react': [
      {
        problem_title: "Interactive Dashboard for University Problem Solver",
        problem_description: `## Problem Statement
Build a React-based interactive dashboard that helps students find solutions to university problems.

### Technical Requirements
- **Primary Focus (React)**: Create a responsive single-page application using React 18+ with hooks
- **Component Architecture**: Design reusable components for problem categories, search, and solution display
- **State Management**: Implement proper state management for user interactions and data flow
- **UI/UX**: Create an intuitive interface with smooth animations and transitions

### Deliverables
1. **React Application** with multiple interactive components
2. **Responsive Design** that works on mobile and desktop
3. **Search and Filter** functionality for problems
4. **Problem Submission** form with validation
5. **Real-time Updates** using React hooks

### Success Criteria
- Clean, maintainable React code structure
- Responsive design across all devices
- Smooth user interactions and animations
- Proper error handling and loading states

**Time Allocation**: 6-8 hours
**Tech Stack**: React, TypeScript, CSS/Tailwind, React Router`
      },
      {
        problem_title: "Real-time Collaboration Platform Frontend",
        problem_description: `## Problem Statement
Develop a React frontend for a real-time collaboration platform where students can work together on university projects.

### Technical Requirements
- **Primary Focus (React)**: Build complex React components with real-time data synchronization
- **Advanced Hooks**: Use useEffect, useContext, useReducer for complex state management
- **Performance**: Implement React.memo, useMemo, useCallback for optimization
- **Real-time UI**: Create live updating interfaces without page refreshes

### Deliverables
1. **Multi-user Interface** showing active collaborators
2. **Live Document Editor** with React components
3. **Chat System** integrated into the main interface
4. **Project Management** dashboard with task tracking
5. **Notification System** for real-time updates

### Success Criteria
- Efficient React component architecture
- Smooth real-time user experience
- Proper handling of concurrent user actions
- Professional-grade UI/UX design

**Time Allocation**: 6-8 hours
**Tech Stack**: React, TypeScript, WebSockets, Context API`
      }
    ],
    'python': [
      {
        problem_title: "AI-Powered University Problem Solver Backend",
        problem_description: `## Problem Statement
Create a Python backend system that uses AI to analyze and provide solutions for common university problems.

### Technical Requirements
- **Primary Focus (Python)**: Build robust backend APIs using Flask/FastAPI
- **AI Integration**: Implement natural language processing for problem analysis
- **Database Design**: Create efficient data models for problems and solutions
- **API Architecture**: Design RESTful endpoints with proper error handling

### Deliverables
1. **REST API** with authentication and authorization
2. **AI Problem Analyzer** using NLP libraries
3. **Database Schema** for storing problems and solutions
4. **Solution Recommendation Engine** based on problem similarity
5. **Admin Dashboard API** for content management

### Success Criteria
- Well-structured Python codebase following PEP 8
- Efficient database queries and data processing
- Proper API documentation and testing
- Scalable architecture design

**Time Allocation**: 6-8 hours
**Tech Stack**: Python, Flask/FastAPI, SQLAlchemy, NLTK/spaCy`
      }
    ],
    'machine learning': [
      {
        problem_title: "Intelligent University Problem Classification System",
        problem_description: `## Problem Statement
Build a machine learning system that automatically classifies and routes university problems to appropriate solution resources.

### Technical Requirements
- **Primary Focus (ML)**: Develop and train classification models for problem categorization
- **Data Processing**: Create preprocessing pipelines for text and structured data
- **Model Training**: Implement supervised learning algorithms for problem classification
- **Performance Optimization**: Ensure model accuracy and inference speed

### Deliverables
1. **Text Classification Model** for problem categorization
2. **Data Preprocessing Pipeline** for cleaning and feature extraction
3. **Model Training Scripts** with hyperparameter tuning
4. **Inference API** for real-time problem classification
5. **Performance Metrics Dashboard** showing model accuracy

### Success Criteria
- Model accuracy above 85% on test data
- Fast inference time (< 100ms per prediction)
- Robust preprocessing for various input formats
- Clear documentation of model architecture

**Time Allocation**: 6-8 hours
**Tech Stack**: Python, scikit-learn/TensorFlow, pandas, numpy`
      }
    ],
    'ui/ux': [
      {
        problem_title: "University Problem Solver User Experience Design",
        problem_description: `## Problem Statement
Design a comprehensive user experience for a university problem-solving platform, focusing on student engagement and ease of use.

### Technical Requirements
- **Primary Focus (UI/UX)**: Create complete user experience design from research to prototype
- **Design System**: Develop consistent visual language and component library
- **User Research**: Conduct analysis of student needs and pain points
- **Prototyping**: Build interactive prototypes for user testing

### Deliverables
1. **User Research Report** with student personas and journey maps
2. **Design System** with colors, typography, and component guidelines
3. **Wireframes and Mockups** for all major user flows
4. **Interactive Prototype** using Figma or similar tools
5. **Usability Testing Results** with improvement recommendations

### Success Criteria
- Clear, intuitive user interface design
- Consistent design system implementation
- Evidence-based design decisions from user research
- High-fidelity prototype ready for development

**Time Allocation**: 6-8 hours
**Tools**: Figma, Adobe XD, Miro, user testing platforms`
      }
    ]
  };
  
  const primarySkill = skills[0]?.toLowerCase() || 'programming';
  const problemIndex = existingProblems.length;

  // Find matching templates based on primary skill
  let templates: ProblemData[] = [];
  
  for (const [skillKey, skillTemplates] of Object.entries(skillTemplates)) {
    if (primarySkill.includes(skillKey) || skillKey.includes(primarySkill)) {
      templates = skillTemplates;
      break;
    }
  }
  
  // If no specific templates found, use React as default
  if (templates.length === 0) {
    templates = skillTemplates['react'];
  }
  
  // Select template based on problem index, cycling through available templates
  const selectedTemplate = templates[problemIndex % templates.length];
  
  // Customize the template with the user's problem statement
  const customizedDescription = selectedTemplate.problem_description.replace(
    /university problems?/gi, 
    problemStatement.toLowerCase()
  );
  
  return {
    problem_title: selectedTemplate.problem_title,
    problem_description: customizedDescription
  };
}