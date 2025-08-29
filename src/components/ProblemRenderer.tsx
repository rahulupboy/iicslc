import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface ProblemRendererProps {
  content: string;
  className?: string;
}

const ProblemRenderer = ({ content, className = "" }: ProblemRendererProps) => {
  // Enhanced function to parse and render content with better formatting
  const renderContent = (text: string) => {
    // First, handle code blocks (```...```)
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let codeBlockIndex = 0;
    
    // Extract code blocks and replace with placeholders
    const textWithCodePlaceholders = text.replace(codeBlockRegex, (match, code) => {
      codeBlocks.push(code.trim());
      return `__CODE_BLOCK_${codeBlockIndex++}__`;
    });
    
    // Split by block math ($$...$$)
    const blockMathRegex = /\$\$(.*?)\$\$/gs;
    const parts = textWithCodePlaceholders.split(blockMathRegex);
    
    return parts.map((part, index) => {
      // Even indices are regular text, odd indices are block math
      if (index % 2 === 1) {
        try {
          return (
            <div key={index} className="my-4">
              <BlockMath math={part.trim()} />
            </div>
          );
        } catch (error) {
          console.error('KaTeX block math error:', error);
          return <span key={index} className="text-red-500 bg-red-100 px-2 py-1 rounded">$$${part}$$</span>;
        }
      }
      
      // Process inline math ($...$) in regular text
      const inlineMathRegex = /\$(.*?)\$/g;
      const textParts = part.split(inlineMathRegex);
      
      return textParts.map((textPart, textIndex) => {
        if (textIndex % 2 === 1) {
          try {
            return <InlineMath key={`${index}-${textIndex}`} math={textPart} />;
          } catch (error) {
            console.error('KaTeX inline math error:', error);
            return <span key={`${index}-${textIndex}`} className="text-red-500 bg-red-100 px-1 rounded">${textPart}$</span>;
          }
        }
        
        // Handle code block placeholders
        if (textPart.includes('__CODE_BLOCK_')) {
          return textPart.split(/(__CODE_BLOCK_\d+__)/g).map((segment, segmentIndex) => {
            const codeBlockMatch = segment.match(/__CODE_BLOCK_(\d+)__/);
            if (codeBlockMatch) {
              const blockIndex = parseInt(codeBlockMatch[1]);
              return (
                <pre key={`${index}-${textIndex}-${segmentIndex}`} className="bg-muted p-4 rounded-lg my-4 overflow-x-auto">
                  <code className="text-sm font-mono">{codeBlocks[blockIndex]}</code>
                </pre>
              );
            }
            return renderFormattedText(segment, `${index}-${textIndex}-${segmentIndex}`);
          });
        }
        
        return renderFormattedText(textPart, `${index}-${textIndex}`);
      });
    });
  };

  // Helper function to render formatted text with proper line breaks and styling
  const renderFormattedText = (text: string, key: string) => {
    const lines = text.split('\n');
    
    return (
      <span key={key}>
        {lines.map((line, lineIndex) => {
          // Handle different formatting patterns
          const trimmedLine = line.trim();
          
          // Headers (lines starting with ##, ###, etc.)
          if (trimmedLine.match(/^#{1,6}\s/)) {
            const level = trimmedLine.match(/^(#{1,6})/)?.[1].length || 1;
            const text = trimmedLine.replace(/^#{1,6}\s/, '');
            const headerClass = level === 1 ? 'text-xl font-bold text-primary mt-6 mb-3' :
                              level === 2 ? 'text-lg font-semibold text-primary mt-5 mb-2' :
                              'text-base font-medium text-primary mt-4 mb-2';
            
            return (
              <React.Fragment key={lineIndex}>
                <div className={headerClass}>{text}</div>
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            );
          }
          
          // Numbered lists
          if (trimmedLine.match(/^\d+\.\s/)) {
            return (
              <React.Fragment key={lineIndex}>
                <div className="ml-4 my-1">
                  <span className="font-medium text-accent">{trimmedLine.match(/^\d+\./)?.[0]}</span>
                  <span className="ml-2">{trimmedLine.replace(/^\d+\.\s/, '')}</span>
                </div>
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            );
          }
          
          // Bullet points
          if (trimmedLine.match(/^[-*]\s/)) {
            return (
              <React.Fragment key={lineIndex}>
                <div className="ml-4 my-1">
                  <span className="text-accent mr-2">•</span>
                  <span>{trimmedLine.replace(/^[-*]\s/, '')}</span>
                </div>
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            );
          }
          
          // Bold text (**text**)
          const boldRegex = /\*\*(.*?)\*\*/g;
          if (boldRegex.test(line)) {
            const formattedLine = line.replace(boldRegex, '<strong class="font-semibold text-primary">$1</strong>');
            return (
              <React.Fragment key={lineIndex}>
                <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            );
          }
          
          // Regular text
          return (
            <React.Fragment key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </span>
    );
  };

  return (
    <div className={`max-w-none ${className}`}>
      <div className="leading-relaxed space-y-2">
        {renderContent(content)}
      </div>
    </div>
  );
};

export default ProblemRenderer;