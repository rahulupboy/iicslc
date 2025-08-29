import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface ProblemRendererProps {
  content: string;
  className?: string;
}

const ProblemRenderer = ({ content, className = "" }: ProblemRendererProps) => {
  // Enhanced function to parse and render content with comprehensive formatting
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
    
    // Handle tables (|...| format)
    const tableRegex = /(\|[^\n]*\|\n)+/g;
    const tables: string[] = [];
    let tableIndex = 0;
    
    const textWithTablePlaceholders = textWithCodePlaceholders.replace(tableRegex, (match) => {
      tables.push(match.trim());
      return `__TABLE_${tableIndex++}__`;
    });
    
    // Split by block math ($$...$$)
    const blockMathRegex = /\$\$(.*?)\$\$/gs;
    const parts = textWithTablePlaceholders.split(blockMathRegex);
    
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
        
        // Handle table placeholders
        if (textPart.includes('__TABLE_')) {
          return textPart.split(/(__TABLE_\d+__)/g).map((segment, segmentIndex) => {
            const tableMatch = segment.match(/__TABLE_(\d+)__/);
            if (tableMatch) {
              const tableIndex = parseInt(tableMatch[1]);
              return renderTable(tables[tableIndex], `${index}-${textIndex}-${segmentIndex}`);
            }
            return renderFormattedText(segment, `${index}-${textIndex}-${segmentIndex}`);
          });
        }
        
        // Handle code block placeholders
        if (textPart.includes('__CODE_BLOCK_')) {
          return textPart.split(/(__CODE_BLOCK_\d+__)/g).map((segment, segmentIndex) => {
            const codeBlockMatch = segment.match(/__CODE_BLOCK_(\d+)__/);
            if (codeBlockMatch) {
              const blockIndex = parseInt(codeBlockMatch[1]);
              return (
                <pre key={`${index}-${textIndex}-${segmentIndex}`} className="bg-muted p-4 rounded-lg my-4 overflow-x-auto border border-primary/20">
                  <code className="text-sm font-mono text-accent">{codeBlocks[blockIndex]}</code>
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

  // Helper function to render tables
  const renderTable = (tableText: string, key: string) => {
    const rows = tableText.trim().split('\n').filter(row => row.trim());
    if (rows.length === 0) return null;

    // Parse table rows
    const parsedRows = rows.map(row => 
      row.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
    );

    if (parsedRows.length === 0) return null;

    // Assume first row is header if it looks like one
    const hasHeader = parsedRows.length > 1 && parsedRows[1].every(cell => cell.match(/^[-:]+$/));
    const headerRow = hasHeader ? parsedRows[0] : null;
    const dataRows = hasHeader ? parsedRows.slice(2) : parsedRows;

    return (
      <div key={key} className="my-4 overflow-x-auto">
        <table className="min-w-full border border-primary/20 rounded-lg overflow-hidden">
          {headerRow && (
            <thead className="bg-primary/10">
              <tr>
                {headerRow.map((cell, cellIndex) => (
                  <th key={cellIndex} className="px-4 py-2 text-left font-semibold text-primary border-b border-primary/20">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {dataRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/50 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 border-b border-primary/10 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
            const headerClass = level === 1 ? 'text-2xl font-bold text-primary mt-6 mb-4' :
                              level === 2 ? 'text-xl font-semibold text-primary mt-5 mb-3' :
                              level === 3 ? 'text-lg font-semibold text-primary mt-4 mb-2' :
                              'text-base font-medium text-primary mt-3 mb-2';
            
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
                <div className="ml-4 my-2 flex">
                  <span className="font-bold text-accent mr-3 min-w-[1.5rem]">{trimmedLine.match(/^\d+\./)?.[0]}</span>
                  <span className="flex-1">{processInlineFormatting(trimmedLine.replace(/^\d+\.\s/, ''))}</span>
                </div>
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            );
          }
          
          // Bullet points
          if (trimmedLine.match(/^[-*]\s/)) {
            return (
              <React.Fragment key={lineIndex}>
                <div className="ml-4 my-2 flex">
                  <span className="text-accent mr-3 font-bold">•</span>
                  <span className="flex-1">{processInlineFormatting(trimmedLine.replace(/^[-*]\s/, ''))}</span>
                </div>
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            );
          }
          
          // Regular text with inline formatting
          return (
            <React.Fragment key={lineIndex}>
              {processInlineFormatting(line)}
              {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </span>
    );
  };

  // Process inline formatting like **bold**, *italic*, `code`, etc.
  const processInlineFormatting = (text: string) => {
    // Handle inline code first (`code`)
    const codeRegex = /`([^`]+)`/g;
    const codeParts = text.split(codeRegex);
    
    return codeParts.map((part, index) => {
      if (index % 2 === 1) {
        // This is inline code
        return (
          <code key={index} className="bg-muted px-2 py-1 rounded text-accent font-mono text-sm border border-primary/20">
            {part}
          </code>
        );
      }
      
      // Process other formatting in non-code parts
      return processTextFormatting(part, index);
    });
  };

  const processTextFormatting = (text: string, baseIndex: number) => {
    // Handle bold text (**text** or __text__)
    const boldRegex = /(\*\*|__)(.*?)\1/g;
    const boldParts = text.split(boldRegex);
    
    return boldParts.map((part, index) => {
      // Check if this part should be bold (every 3rd element starting from index 2)
      if (index > 0 && (index - 2) % 3 === 0) {
        return <strong key={`${baseIndex}-${index}`} className="font-bold text-primary">{processItalicFormatting(part, `${baseIndex}-${index}`)}</strong>;
      }
      
      // Skip the delimiter parts
      if (index > 0 && (index - 1) % 3 === 0) {
        return null;
      }
      
      return processItalicFormatting(part, `${baseIndex}-${index}`);
    }).filter(Boolean);
  };

  const processItalicFormatting = (text: string, baseKey: string) => {
    // Handle italic text (*text* or _text_)
    const italicRegex = /(\*|_)(.*?)\1/g;
    const italicParts = text.split(italicRegex);
    
    return italicParts.map((part, index) => {
      // Check if this part should be italic (every 3rd element starting from index 2)
      if (index > 0 && (index - 2) % 3 === 0) {
        return <em key={`${baseKey}-${index}`} className="italic text-accent">{part}</em>;
      }
      
      // Skip the delimiter parts
      if (index > 0 && (index - 1) % 3 === 0) {
        return null;
      }
      
      return <span key={`${baseKey}-${index}`}>{part}</span>;
    }).filter(Boolean);
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