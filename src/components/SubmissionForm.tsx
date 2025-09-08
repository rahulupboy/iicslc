import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Upload, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: string;
  problemTitle: string;
}

export const SubmissionForm = ({ isOpen, onClose, problemId, problemTitle }: SubmissionFormProps) => {
  const [codeFiles, setCodeFiles] = useState<FileList | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleCodeFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Validate file types and sizes
      const validFiles = Array.from(files).filter(file => {
        const isValidType = /\.(js|jsx|ts|tsx|py|java|cpp|c|html|css|json|md|txt|zip|rar)$/i.test(file.name);
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB per file
        return isValidType && isValidSize;
      });
      
      if (validFiles.length !== files.length) {
        toast({
          title: "Invalid files detected",
          description: "Some files were excluded due to invalid type or size > 50MB",
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        // Create a new FileList-like object with valid files
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        setCodeFiles(dataTransfer.files);
      }
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's a video file and under 100MB
      if (file.type.startsWith('video/') && file.size <= 100 * 1024 * 1024) {
        setVideoFile(file);
      } else {
        toast({
          title: "Invalid file",
          description: "Please upload a video file under 100MB",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Validate file types and sizes
      const validFiles = Array.from(files).filter(file => {
        const isValidType = /\.(js|jsx|ts|tsx|py|java|cpp|c|html|css|json|md|txt|zip|rar)$/i.test(file.name);
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB per file
        return isValidType && isValidSize;
      });
      
      if (validFiles.length !== files.length) {
        toast({
          title: "Invalid files detected",
          description: "Some files were excluded due to invalid type or size > 50MB",
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        // Create a new FileList-like object with valid files
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        setCodeFiles(dataTransfer.files);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codeFiles || codeFiles.length === 0 || !videoFile) {
      toast({
        title: "Missing files",
        description: "Please upload both code files and video",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // For now, we'll just create a submission record without actual file upload
      // In a real implementation, you'd upload files to Supabase Storage first
      const fileNames = Array.from(codeFiles).map(file => file.name).join(', ');
      const { error } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          day_problem_id: problemId,
          file_url: `codes_${Date.now()}_[${fileNames}]`, // Placeholder for multiple files
          video_url: `video_${Date.now()}_${videoFile.name}` // Placeholder
        });

      if (error) throw error;

      toast({
        title: "Submission successful!",
        description: "You will receive your result by 11:59 PM IST tonight",
      });

      onClose();
      setCodeFiles(null);
      setVideoFile(null);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Submit Today's Challenge
          </DialogTitle>
          <DialogDescription className="text-base">
            {problemTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Info */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
                  Important Notice
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-amber-700 dark:text-amber-300">
                Once you submit, you can't change your submission for today. 
                It's recommended to use your full time to get the best results for your team.
              </p>
            </CardContent>
          </Card>

          {/* Video Instructions */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
                  Video Explanation Requirements
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-blue-700 dark:text-blue-300 space-y-2">
                <p><strong>Record a 5-minute video explaining these three things:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li><strong>What did you understand with problem statement?</strong></li>
                  <li><strong>What is your proposed idea?</strong></li>
                  <li><strong>Show your solution</strong></li>
                </ol>
                <p className="text-sm mt-2 italic">
                  <strong>Be frank and shoot this in one go - we won't judge you, we just want to know about authenticity!</strong>
                </p>
              </CardDescription>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code Files Upload */}
            <div className="space-y-3">
              <Label htmlFor="codeFiles" className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Submit Your Code Files/Folder
              </Label>
              <div className="space-y-2">
                {/* Drag and Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Drag and drop your code files/folder here</p>
                  <p className="text-xs text-muted-foreground mb-3">or click below to browse</p>
                </div>
                
                <Input
                  id="codeFiles"
                  type="file"
                  onChange={handleCodeFilesChange}
                  accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.md,.txt,.zip,.rar"
                  className="cursor-pointer"
                  multiple
                  required
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• You can select multiple files at once (Ctrl/Cmd + Click)</p>
                  <p>• Drag and drop folders or individual files</p>
                  <p>• Supported: Code files, archives (.zip, .rar), documentation</p>
                  <p>• Max 50MB per file</p>
                </div>
              </div>
              {codeFiles && codeFiles.length > 0 && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">
                    Selected {codeFiles.length} file(s):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Array.from(codeFiles).map((file, index) => (
                      <div key={index} className="flex justify-between text-xs text-muted-foreground">
                        <span className="truncate">{file.name}</span>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Video File Upload */}
            <div className="space-y-3">
              <Label htmlFor="videoFile" className="text-lg font-semibold flex items-center gap-2">
                <Video className="h-5 w-5" />
                Submit Your 5-Minute Explanation Video
              </Label>
              <Input
                id="videoFile"
                type="file"
                onChange={handleVideoFileChange}
                accept="video/*"
                className="cursor-pointer"
                required
              />
              {videoFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum file size: 100MB
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="neon"
                className="flex-1"
                disabled={submitting || !codeFiles || codeFiles.length === 0 || !videoFile}
              >
                {submitting ? "Submitting..." : "Submit Solution"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};