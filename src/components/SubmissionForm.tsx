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
  const [codeFile, setCodeFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleCodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const isValidType = /\.(zip|rar|tar|gz|7z)$/i.test(file.name);
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload a compressed archive (.zip, .rar, .tar, .gz, .7z)",
          variant: "destructive",
        });
        return;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 50MB",
          variant: "destructive",
        });
        return;
      }
      
      setCodeFile(file);
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
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file type and size
      const isValidType = /\.(zip|rar|tar|gz|7z)$/i.test(file.name);
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload a compressed archive (.zip, .rar, .tar, .gz, .7z)",
          variant: "destructive",
        });
        return;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 50MB",
          variant: "destructive",
        });
        return;
      }
      
      setCodeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codeFile || !videoFile) {
      toast({
        title: "Missing files",
        description: "Please upload both code archive and video",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload code file to Supabase Storage
      const codeFileName = `${user.id}/${problemId}/code_${Date.now()}_${codeFile.name}`;
      const { data: codeUpload, error: codeError } = await supabase.storage
        .from('code-submissions')
        .upload(codeFileName, codeFile);

      if (codeError) throw codeError;

      // Upload video file to Supabase Storage
      const videoFileName = `${user.id}/${problemId}/video_${Date.now()}_${videoFile.name}`;
      const { data: videoUpload, error: videoError } = await supabase.storage
        .from('video-submissions')
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      // Get public URLs
      const { data: codeUrl } = supabase.storage
        .from('code-submissions')
        .getPublicUrl(codeFileName);

      const { data: videoUrl } = supabase.storage
        .from('video-submissions')
        .getPublicUrl(videoFileName);

      // Create submission record with actual file URLs
      const { error } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
          day_problem_id: problemId,
          file_url: codeUrl.publicUrl,
          video_url: videoUrl.publicUrl
        });

      if (error) throw error;

      toast({
        title: "Submission successful!",
        description: "You will receive your result by 11:59 PM IST tonight",
      });

      onClose();
      setCodeFile(null);
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
                Submit Your Code Archive
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
                  <p className="text-sm font-medium mb-1">Drag and drop your code archive here</p>
                  <p className="text-xs text-muted-foreground mb-3">or click below to browse</p>
                </div>
                
                <Input
                  id="codeFiles"
                  type="file"
                  onChange={handleCodeFileChange}
                  accept=".zip,.rar,.tar,.gz,.7z"
                  className="cursor-pointer"
                  required
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Please compress all your code files into a single archive</p>
                  <p>• Supported formats: .zip, .rar, .tar, .gz, .7z</p>
                  <p>• Maximum file size: 50MB</p>
                </div>
              </div>
              {codeFile && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">Selected file:</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="truncate">{codeFile.name}</span>
                    <span>{(codeFile.size / (1024 * 1024)).toFixed(2)} MB</span>
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
                disabled={submitting || !codeFile || !videoFile}
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