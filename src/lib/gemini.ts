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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Get the user's primary skill (first in the list)
    const primarySkill = skills[0] || 'Programming';
    const secondarySkills = skills.slice(1, 3); // Take next 2 skills
    
    // Determine which day we're generating (based on existing problems count)
    const dayNumber = existingProblems.length + 1;
    
    // Create context from existing problems for course progression
    const existingContext = existingProblems.length > 0 
      ? `\n\nPREVIOUS PROBLEMS IN THIS COURSE:\n${existingProblems.map((p, i) => `Day ${i + 1}: ${p.problem_title}\n${p.problem_description.substring(0, 200)}...\n`).join('\n')}\n\nThis is Day ${dayNumber} of a 5-day progressive course. Build upon previous days and move towards completing the full problem statement.`
      : '\n\nThis is Day 1 of a 5-day progressive course to build the complete solution.';

    const prompt = `You are an AI assistant creating a 5-day progressive course for Smart India Hackathon (SIH) preparation. Generate Day ${dayNumber} of this course.

STUDENT PROFILE:
- Primary Skill (MAIN FOCUS): ${primarySkill}
- Secondary Skills: ${secondarySkills.join(', ')}
- Target Problem Statement: ${problemStatement}
- Current Day: ${dayNumber}/5

COURSE STRUCTURE REQUIREMENTS:
Day 1: Foundation & Setup (Revise basics + Start core component)
Day 2: Core Implementation (Build main functionality)
Day 3: Integration & Advanced Features (Connect components)
Day 4: Enhancement & Optimization (Add advanced features)
Day 5: Polish & Demo Ready (Final touches + presentation)

SPECIFIC REQUIREMENTS FOR DAY ${dayNumber}:
${getDaySpecificRequirements(dayNumber, primarySkill, problemStatement)}

SKILL-FOCUSED GUIDELINES:
- 80% of the problem should focus on their PRIMARY SKILL (${primarySkill})
- Only use secondary skills if they naturally support the primary skill
- Make it hackathon-appropriate: practical, implementable in 6-8 hours per day
- Each day should build upon previous days' work
- Students are preparing for hackathons (intermediate level, not beginners but not experts)

FORMAT YOUR RESPONSE AS:
Title: Day ${dayNumber} – [Specific title focusing on primary skill and day's objective]

Description: 
## Day ${dayNumber} Objective
[Clear objective for this day]

## Revise/Learn Today
[Specific concepts related to primary skill that need revision]

## Implementation Task
[Detailed task description that builds towards the problem statement]

## Expected Deliverable
[What should be completed by end of day]

## Success Criteria
[How to measure if day's objective is achieved]

**Time Allocation**: 6-8 hours
**Primary Focus**: ${primarySkill}${existingContext}`;

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
    
    // Fallback to skill-specific course templates if API fails
    return generateCourseBasedFallback(skills, problemStatement, existingProblems);
  }
}

function getDaySpecificRequirements(dayNumber: number, primarySkill: string, problemStatement: string): string {
  const skillLower = primarySkill.toLowerCase();
  
  if (skillLower.includes('react') || skillLower.includes('frontend') || skillLower.includes('javascript')) {
    return getReactCourseRequirements(dayNumber, problemStatement);
  } else if (skillLower.includes('python') || skillLower.includes('backend') || skillLower.includes('api')) {
    return getPythonCourseRequirements(dayNumber, problemStatement);
  } else if (skillLower.includes('machine learning') || skillLower.includes('ml') || skillLower.includes('ai')) {
    return getMLCourseRequirements(dayNumber, problemStatement);
  } else if (skillLower.includes('ui') || skillLower.includes('ux') || skillLower.includes('design')) {
    return getUIUXCourseRequirements(dayNumber, problemStatement);
  } else {
    return getGeneralCourseRequirements(dayNumber, problemStatement);
  }
}

function getReactCourseRequirements(dayNumber: number, problemStatement: string): string {
  const requirements = {
    1: `Foundation Day: Revise React basics (components, props, state, hooks). Build a file upload component that can handle PDF files. Focus on creating the basic UI structure for the ${problemStatement} application.`,
    2: `UI Development: Create the main interface layout with React Router. Build the scanner-like interface with upload area, preview window, and action buttons. Focus on responsive design and user experience.`,
    3: `Integration Day: Connect React with external libraries for PDF processing. Implement text extraction functionality and display extracted content in the UI. Focus on data flow between components.`,
    4: `Feature Enhancement: Add advanced features like text highlighting, search functionality, and result processing. Implement the core logic for detecting and highlighting specific content in PDFs.`,
    5: `Polish & Demo: Add loading states, error handling, animations, and final UI polish. Create a complete demo-ready application with download/export features.`
  };
  return requirements[dayNumber as keyof typeof requirements] || requirements[1];
}

function getPythonCourseRequirements(dayNumber: number, problemStatement: string): string {
  const requirements = {
    1: `Backend Foundation: Set up Python environment and basic API structure using Flask/FastAPI. Create endpoints for file upload and basic PDF processing. Focus on server architecture for ${problemStatement}.`,
    2: `Core Processing: Implement PDF text extraction using libraries like PyPDF2 or pdfplumber. Create the main processing logic and database models for storing results.`,
    3: `Algorithm Implementation: Build the core detection/analysis algorithm. Implement the main business logic that addresses the ${problemStatement} requirements.`,
    4: `API Enhancement: Add advanced features like batch processing, result caching, and detailed analysis reports. Implement proper error handling and validation.`,
    5: `Production Ready: Add authentication, rate limiting, logging, and API documentation. Optimize performance and prepare for deployment.`
  };
  return requirements[dayNumber as keyof typeof requirements] || requirements[1];
}

function getMLCourseRequirements(dayNumber: number, problemStatement: string): string {
  const requirements = {
    1: `ML Foundation: Set up the ML environment and data preprocessing pipeline. Create basic data loading and cleaning scripts for the ${problemStatement} project.`,
    2: `Model Development: Build and train the core ML model. Focus on feature engineering and initial model training for the specific use case.`,
    3: `Model Optimization: Improve model performance through hyperparameter tuning and advanced techniques. Implement model evaluation and validation.`,
    4: `Integration & API: Create an API wrapper for the ML model. Build inference endpoints and integrate with a simple frontend for testing.`,
    5: `Deployment Ready: Optimize model for production, add monitoring, and create a complete demo application showcasing the ML solution.`
  };
  return requirements[dayNumber as keyof typeof requirements] || requirements[1];
}

function getUIUXCourseRequirements(dayNumber: number, problemStatement: string): string {
  const requirements = {
    1: `Research & Planning: Conduct user research and create personas for the ${problemStatement} solution. Define user journeys and create initial wireframes.`,
    2: `Design System: Create a comprehensive design system with colors, typography, and components. Build the visual identity for the application.`,
    3: `High-Fidelity Design: Create detailed mockups and interactive prototypes. Focus on the main user flows and key interactions.`,
    4: `Usability Testing: Conduct user testing sessions and iterate on the design. Refine the user experience based on feedback.`,
    5: `Final Prototype: Create a pixel-perfect, interactive prototype ready for development handoff. Include design specifications and documentation.`
  };
  return requirements[dayNumber as keyof typeof requirements] || requirements[1];
}

function getGeneralCourseRequirements(dayNumber: number, problemStatement: string): string {
  const requirements = {
    1: `Foundation: Set up the development environment and basic project structure. Create the core components needed for ${problemStatement}.`,
    2: `Core Development: Build the main functionality and core features. Focus on the primary technical implementation.`,
    3: `Integration: Connect different parts of the system and add supporting features. Implement data flow and communication between components.`,
    4: `Enhancement: Add advanced features, optimization, and error handling. Improve the overall system performance and reliability.`,
    5: `Finalization: Polish the application, add final features, and prepare for demonstration. Create a complete, demo-ready solution.`
  };
  return requirements[dayNumber as keyof typeof requirements] || requirements[1];
}

function generateCourseBasedFallback(
  skills: string[], 
  problemStatement: string, 
  existingProblems: Array<{ problem_title: string; problem_description: string }>
): ProblemData {
  const primarySkill = skills[0] || 'Programming';
  const dayNumber = existingProblems.length + 1;
  
  // Skill-specific course templates
  const courseTemplates: Record<string, ProblemData[]> = {
    'react': [
      {
        problem_title: "Day 1 – React Foundation & PDF Upload Setup",
        problem_description: `## Day 1 Objective
Set up the foundation for your PDF scanner application with React basics and file upload functionality.

## Revise/Learn Today
- React components, props, and state management
- useState and useEffect hooks
- File handling in React
- Controlled vs uncontrolled components

## Implementation Task
Build a PDF upload component that can:
1. **File Upload Interface**: Create a drag-and-drop or click-to-upload area
2. **PDF Preview**: Display uploaded PDF using react-pdf library
3. **Basic Validation**: Check file type and size
4. **State Management**: Store uploaded file in component state

### Technical Requirements
- Use functional components with hooks
- Implement proper error handling for file uploads
- Create responsive design for mobile and desktop
- Add loading states during file processing

## Expected Deliverable
A working React application with PDF upload and preview functionality

## Success Criteria
- Successfully upload and display PDF files
- Clean, reusable component structure
- Proper error handling and user feedback
- Responsive design implementation

**Time Allocation**: 6-8 hours
**Primary Focus**: React Components & File Handling`
      },
      {
        problem_title: "Day 2 – Scanner Interface & Navigation",
        problem_description: `## Day 2 Objective
Build the main scanner interface with navigation and user-friendly design.

## Revise/Learn Today
- React Router for navigation
- CSS/Tailwind for professional UI design
- Component composition and layout
- State lifting and prop drilling

## Implementation Task
Create a complete scanner interface:
1. **Navigation System**: Implement React Router with "Upload", "Scan", "Results" pages
2. **Scanner Layout**: Design a professional scanner-like interface
3. **Action Buttons**: Add "Scan Now", "Clear", "Download" buttons
4. **Progress Indicators**: Show scanning progress and status

### Technical Requirements
- Multi-page navigation using React Router
- Professional UI design with consistent styling
- Interactive elements with hover and click states
- Responsive layout for different screen sizes

## Expected Deliverable
A complete scanner interface with navigation and professional design

## Success Criteria
- Smooth navigation between different sections
- Professional, scanner-like appearance
- Interactive elements with proper feedback
- Mobile-responsive design

**Time Allocation**: 6-8 hours
**Primary Focus**: React Router & UI Design`
      },
      {
        problem_title: "Day 3 – Text Extraction Integration",
        problem_description: `## Day 3 Objective
Integrate PDF text extraction capabilities into your React application.

## Revise/Learn Today
- Integrating external libraries in React
- Asynchronous operations with useEffect
- Error handling in React components
- Working with PDF processing libraries

## Implementation Task
Implement text extraction functionality:
1. **PDF Text Extraction**: Use pdf.js or similar library to extract text from PDFs
2. **Text Display**: Show extracted text in a readable format
3. **Processing States**: Add loading, success, and error states
4. **Text Analysis**: Prepare text for fraud word detection

### Technical Requirements
- Integrate PDF processing library (pdf.js/pdf-parse)
- Handle asynchronous text extraction
- Display extracted text in organized format
- Add proper loading and error states

## Expected Deliverable
React application that can extract and display text from uploaded PDFs

## Success Criteria
- Successfully extract text from various PDF formats
- Clean text display with proper formatting
- Robust error handling for processing failures
- Good user feedback during extraction process

**Time Allocation**: 6-8 hours
**Primary Focus**: React Integration & Async Operations`
      },
      {
        problem_title: "Day 4 – Fraud Detection & Text Highlighting",
        problem_description: `## Day 4 Objective
Implement the core fraud detection logic with visual highlighting in React.

## Revise/Learn Today
- String manipulation and regex in JavaScript
- Array methods (map, filter, includes)
- Conditional rendering in React
- Dynamic styling and CSS classes

## Implementation Task
Build fraud detection and highlighting:
1. **Fraud Word Database**: Create a comprehensive list of fraud-related keywords
2. **Text Analysis**: Implement algorithm to detect suspicious words/phrases
3. **Visual Highlighting**: Use React to highlight detected words with different colors
4. **Results Summary**: Show count and types of suspicious content found

### Technical Requirements
- Implement text analysis algorithms
- Dynamic highlighting using React components
- Color-coded highlighting for different fraud types
- Summary statistics and reporting

## Expected Deliverable
Working fraud detection system with visual highlighting in React interface

## Success Criteria
- Accurate detection of suspicious words/phrases
- Clear visual highlighting of detected content
- Detailed results summary and statistics
- Fast processing even for large documents

**Time Allocation**: 6-8 hours
**Primary Focus**: React Dynamic Rendering & Text Processing`
      },
      {
        problem_title: "Day 5 – Polish & Demo Preparation",
        problem_description: `## Day 5 Objective
Finalize the application with professional polish and prepare for demonstration.

## Revise/Learn Today
- React performance optimization
- Error boundaries and robust error handling
- User experience best practices
- Application deployment preparation

## Implementation Task
Complete the application with final features:
1. **Loading & Animations**: Add smooth loading spinners and transitions
2. **Error Handling**: Implement comprehensive error boundaries
3. **Export Features**: Add "Download Report" functionality
4. **Mobile Optimization**: Ensure perfect mobile responsiveness
5. **Demo Preparation**: Create a smooth demo flow

### Technical Requirements
- Implement React.memo and useMemo for performance
- Add comprehensive error handling
- Create export/download functionality
- Optimize for mobile devices
- Add final UI polish and animations

## Expected Deliverable
Complete, demo-ready PDF fraud scanner application built with React

## Success Criteria
- Professional, polished user interface
- Smooth performance on all devices
- Complete fraud detection and reporting system
- Ready for hackathon demonstration
- Comprehensive error handling

**Time Allocation**: 6-8 hours
**Primary Focus**: React Optimization & User Experience`
      }
    ],
    'python': [
      {
        problem_title: "Day 1 – Python Backend Foundation & PDF Processing Setup",
        problem_description: `## Day 1 Objective
Set up Python backend infrastructure and basic PDF processing capabilities.

## Revise/Learn Today
- Flask/FastAPI basics and routing
- File handling in Python
- PDF processing libraries (PyPDF2, pdfplumber)
- Basic API design principles

## Implementation Task
Build the backend foundation:
1. **API Setup**: Create Flask/FastAPI server with basic routes
2. **File Upload Endpoint**: Handle PDF file uploads via API
3. **PDF Processing**: Implement basic PDF text extraction
4. **Database Setup**: Create models for storing analysis results

### Technical Requirements
- RESTful API design with proper HTTP methods
- File upload handling with validation
- Basic PDF text extraction functionality
- Database integration for storing results

## Expected Deliverable
Working Python backend that can receive and process PDF files

## Success Criteria
- API endpoints respond correctly
- PDF files can be uploaded and processed
- Text extraction works for basic PDFs
- Database stores processing results

**Time Allocation**: 6-8 hours
**Primary Focus**: Python Backend & PDF Processing`
      },
      {
        problem_title: "Day 2 – Core Fraud Detection Algorithm",
        problem_description: `## Day 2 Objective
Implement the core fraud detection algorithm using Python.

## Revise/Learn Today
- String processing and regex in Python
- Natural language processing basics
- Algorithm design and optimization
- Data structures for efficient searching

## Implementation Task
Build fraud detection engine:
1. **Keyword Database**: Create comprehensive fraud keyword database
2. **Detection Algorithm**: Implement pattern matching and scoring system
3. **Text Analysis**: Add context analysis around detected words
4. **Confidence Scoring**: Assign confidence levels to detections

### Technical Requirements
- Efficient text processing algorithms
- Pattern matching with regex
- Scoring system for fraud likelihood
- Context analysis around suspicious words

## Expected Deliverable
Python fraud detection engine with confidence scoring

## Success Criteria
- Accurate detection of fraud patterns
- Fast processing of large documents
- Confidence scoring for each detection
- Detailed analysis results

**Time Allocation**: 6-8 hours
**Primary Focus**: Python Algorithm Development`
      },
      {
        problem_title: "Day 3 – Advanced Analysis & Reporting",
        problem_description: `## Day 3 Objective
Add advanced analysis features and comprehensive reporting capabilities.

## Revise/Learn Today
- Advanced Python data processing
- Report generation (PDF, JSON)
- Data visualization with matplotlib/plotly
- API response formatting

## Implementation Task
Enhance the analysis system:
1. **Advanced Detection**: Add phrase detection and context analysis
2. **Report Generation**: Create detailed PDF/JSON reports
3. **Statistics**: Generate analysis statistics and visualizations
4. **API Enhancement**: Improve API responses with detailed results

### Technical Requirements
- Advanced text analysis algorithms
- Report generation in multiple formats
- Data visualization for results
- Comprehensive API documentation

## Expected Deliverable
Enhanced fraud detection system with detailed reporting

## Success Criteria
- Advanced fraud pattern detection
- Professional report generation
- Clear data visualizations
- Well-documented API endpoints

**Time Allocation**: 6-8 hours
**Primary Focus**: Python Data Processing & Reporting`
      },
      {
        problem_title: "Day 4 – Performance Optimization & Batch Processing",
        problem_description: `## Day 4 Objective
Optimize the system for performance and add batch processing capabilities.

## Revise/Learn Today
- Python performance optimization
- Concurrent processing with threading/asyncio
- Caching strategies
- Memory management for large files

## Implementation Task
Optimize and scale the system:
1. **Performance Optimization**: Optimize algorithms for speed and memory
2. **Batch Processing**: Add ability to process multiple PDFs
3. **Caching System**: Implement result caching for faster responses
4. **Concurrent Processing**: Use threading for parallel processing

### Technical Requirements
- Optimized algorithms with better time complexity
- Multi-threading or async processing
- Intelligent caching system
- Memory-efficient file handling

## Expected Deliverable
High-performance fraud detection system with batch processing

## Success Criteria
- Significantly improved processing speed
- Ability to handle multiple files simultaneously
- Efficient memory usage for large files
- Robust caching system

**Time Allocation**: 6-8 hours
**Primary Focus**: Python Performance & Concurrency`
      },
      {
        problem_title: "Day 5 – Production Deployment & API Documentation",
        problem_description: `## Day 5 Objective
Prepare the system for production deployment with complete documentation.

## Revise/Learn Today
- Python deployment best practices
- API documentation with Swagger/OpenAPI
- Security considerations
- Monitoring and logging

## Implementation Task
Finalize for production:
1. **Security**: Add authentication, input validation, and security headers
2. **Documentation**: Create comprehensive API documentation
3. **Deployment**: Prepare for cloud deployment (Docker, requirements.txt)
4. **Monitoring**: Add logging and basic monitoring

### Technical Requirements
- Production-ready security measures
- Complete API documentation
- Deployment configuration
- Comprehensive logging system

## Expected Deliverable
Production-ready Python fraud detection API with full documentation

## Success Criteria
- Secure, authenticated API endpoints
- Complete documentation for all features
- Ready for cloud deployment
- Comprehensive logging and monitoring

**Time Allocation**: 6-8 hours
**Primary Focus**: Python Production Deployment`
      }
    ],
    'machine learning': [
      {
        problem_title: "Day 1 – ML Environment & Data Pipeline Setup",
        problem_description: `## Day 1 Objective
Set up machine learning environment and create data preprocessing pipeline.

## Revise/Learn Today
- Python ML libraries (scikit-learn, pandas, numpy)
- Data preprocessing techniques
- Feature engineering basics
- ML project structure

## Implementation Task
Build ML foundation for fraud detection:
1. **Environment Setup**: Configure ML development environment
2. **Data Pipeline**: Create preprocessing pipeline for PDF text data
3. **Feature Extraction**: Implement text feature extraction (TF-IDF, word embeddings)
4. **Data Preparation**: Prepare training data for fraud detection

### Technical Requirements
- Proper ML project structure
- Efficient data preprocessing pipeline
- Feature extraction from text data
- Data validation and cleaning

## Expected Deliverable
ML environment with data preprocessing pipeline for fraud detection

## Success Criteria
- Clean, structured ML codebase
- Efficient data preprocessing
- Proper feature extraction from text
- Ready for model training

**Time Allocation**: 6-8 hours
**Primary Focus**: ML Data Pipeline & Feature Engineering`
      },
      {
        problem_title: "Day 2 – Fraud Detection Model Development",
        problem_description: `## Day 2 Objective
Develop and train machine learning models for fraud detection in documents.

## Revise/Learn Today
- Classification algorithms (SVM, Random Forest, Neural Networks)
- Model training and validation
- Cross-validation techniques
- Model evaluation metrics

## Implementation Task
Build fraud detection models:
1. **Model Selection**: Choose appropriate algorithms for text classification
2. **Training Pipeline**: Implement model training with proper validation
3. **Feature Engineering**: Create domain-specific features for fraud detection
4. **Model Evaluation**: Implement comprehensive evaluation metrics

### Technical Requirements
- Multiple ML algorithms for comparison
- Proper train/validation/test splits
- Feature importance analysis
- Model performance metrics

## Expected Deliverable
Trained ML models for fraud detection with performance evaluation

## Success Criteria
- Models achieve >85% accuracy on validation data
- Proper evaluation with multiple metrics
- Feature importance analysis completed
- Best performing model identified

**Time Allocation**: 6-8 hours
**Primary Focus**: ML Model Training & Evaluation`
      },
      {
        problem_title: "Day 3 – Advanced NLP & Pattern Recognition",
        problem_description: `## Day 3 Objective
Implement advanced NLP techniques for better fraud pattern recognition.

## Revise/Learn Today
- Advanced NLP techniques (BERT, transformers)
- Pattern recognition in text
- Ensemble methods
- Model fine-tuning

## Implementation Task
Enhance fraud detection with advanced NLP:
1. **Advanced NLP**: Implement transformer-based models for better understanding
2. **Pattern Recognition**: Add sophisticated pattern matching algorithms
3. **Ensemble Methods**: Combine multiple models for better accuracy
4. **Context Analysis**: Analyze surrounding context of suspicious words

### Technical Requirements
- Implementation of transformer models
- Advanced pattern recognition algorithms
- Model ensemble techniques
- Context-aware analysis

## Expected Deliverable
Advanced fraud detection system with state-of-the-art NLP

## Success Criteria
- Improved accuracy with advanced NLP
- Sophisticated pattern recognition
- Effective model ensemble
- Context-aware fraud detection

**Time Allocation**: 6-8 hours
**Primary Focus**: Advanced NLP & Pattern Recognition`
      },
      {
        problem_title: "Day 4 – Model Optimization & Real-time Inference",
        problem_description: `## Day 4 Objective
Optimize models for production and implement real-time inference capabilities.

## Revise/Learn Today
- Model optimization techniques
- Real-time inference systems
- Model serving with APIs
- Performance monitoring

## Implementation Task
Optimize for production deployment:
1. **Model Optimization**: Optimize models for speed and memory efficiency
2. **Inference API**: Create fast inference endpoints
3. **Batch Processing**: Implement batch processing for multiple documents
4. **Performance Monitoring**: Add model performance tracking

### Technical Requirements
- Optimized model inference
- Fast API endpoints for real-time processing
- Efficient batch processing
- Performance monitoring and logging

## Expected Deliverable
Production-optimized ML system with real-time inference

## Success Criteria
- Fast inference times (<100ms per document)
- Efficient batch processing capabilities
- Robust performance monitoring
- Production-ready API endpoints

**Time Allocation**: 6-8 hours
**Primary Focus**: ML Optimization & Production Deployment`
      },
      {
        problem_title: "Day 5 – Complete ML Solution & Demo",
        problem_description: `## Day 5 Objective
Finalize the complete ML solution with demonstration capabilities.

## Revise/Learn Today
- End-to-end ML system integration
- Model deployment strategies
- Demo preparation techniques
- ML system documentation

## Implementation Task
Complete the ML fraud detection solution:
1. **System Integration**: Connect all components into complete solution
2. **Demo Interface**: Create simple web interface for demonstration
3. **Result Visualization**: Add charts and graphs for fraud analysis results
4. **Documentation**: Create comprehensive system documentation

### Technical Requirements
- Complete end-to-end ML pipeline
- Web interface for easy demonstration
- Data visualization for results
- Comprehensive documentation

## Expected Deliverable
Complete ML-powered fraud detection system ready for demonstration

## Success Criteria
- Fully integrated ML solution
- Professional demonstration interface
- Clear result visualizations
- Complete system documentation

**Time Allocation**: 6-8 hours
**Primary Focus**: ML System Integration & Demo Preparation`
      }
    ]
  };
  
  const primarySkillLower = primarySkill.toLowerCase();
  let templates: ProblemData[] = [];
  
  // Find matching templates based on primary skill
  for (const [skillKey, templatesArray] of Object.entries(courseTemplates)) {
    if (primarySkillLower.includes(skillKey) || skillKey.includes(primarySkillLower)) {
      templates = templatesArray;
      break;
    }
  }
  
  // If no specific templates found, use React as default
  if (templates.length === 0) {
    templates = courseTemplates['react'];
  }
  
  // Select template based on day number
  const templateIndex = Math.min(dayNumber - 1, templates.length - 1);
  const selectedTemplate = templates[templateIndex];
  
  // Customize the template with the user's specific problem statement
  const customizedDescription = selectedTemplate.problem_description.replace(
    /PDF scanner|fraud detection/gi, 
    problemStatement.toLowerCase()
  );
  
  return {
    problem_title: selectedTemplate.problem_title,
    problem_description: customizedDescription
  };
}