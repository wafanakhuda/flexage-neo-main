"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { studentAPI, EntryResponse } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, Send } from 'lucide-react';
import Link from 'next/link';
import PellEditor from '@/components/pell-editor';

export default function EntrySubmissionPage() {
  const [entry, setEntry] = useState<EntryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    submission_title: '',
    content: '',
  });
  const params = useParams();
  const router = useRouter();
  const entryId = params.entry_id as string;

  useEffect(() => {
    if (entryId) {
      fetchEntry();
    }
  }, [entryId]);

  const fetchEntry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const entryData = await studentAPI.getEntry(entryId);
      setEntry(entryData);
      
      // Pre-fill submission title with entry title
      setFormData(prev => ({
        ...prev,
        submission_title: `My submission for: ${entryData.entry_title}`,
      }));
    } catch (err: any) {
      console.error('Error fetching entry:', err);
      
      // Handle different error response formats
      let errorMessage = 'Failed to load entry details';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Handle FastAPI validation errors
          const validationErrors = errorData.detail.map((item: any) => 
            `${item.loc?.join('.')}: ${item.msg}`
          ).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.submission_title.trim()) {
      setError('Please enter a submission title');
      return;
    }
    
    // For HTML content, check if there's meaningful content (not just empty tags)
    const textContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      setError('Please enter your content');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const submissionData = {
        submission_title: formData.submission_title,
        content: formData.content,
      };
      
      const submission = await studentAPI.submitEntry(entryId, submissionData);
      
      // Redirect back to the entries page to see the new submission
      if (entry) {
        router.push(`/student/flexagecomps/${entry.flex_age_comp_id}/entries`);
      } else {
        router.push('/student');
      }
    } catch (err: any) {
      console.error('Error submitting entry:', err);
      
      // Handle different error response formats
      let errorMessage = 'Failed to submit entry';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Handle FastAPI validation errors
          const validationErrors = errorData.detail.map((item: any) => 
            `${item.loc?.join('.')}: ${item.msg}`
          ).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (entry) {
      router.push(`/student/flexagecomps/${entry.flex_age_comp_id}/entries`);
    } else {
      router.push('/student');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading entry details...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTitle>Entry Not Found</AlertTitle>
          <AlertDescription>
            The entry you're looking for doesn't exist or you don't have access to it.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/student')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-slate-600">
        <button onClick={handleBack} className="hover:text-slate-900 flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back to Entries
        </button>
        <span>/</span>
        <span className="font-medium">Submit for {entry.entry_title}</span>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Submit for: {entry.entry_title}
        </h2>
        {entry.instructions && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">Instructions:</h3>
            <div className="text-slate-700 whitespace-pre-wrap">
              <div dangerouslySetInnerHTML={{ __html: entry.instructions }} />
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Submission</CardTitle>
          <CardDescription>
            Complete the form below to submit your work for this entry. You can submit multiple times if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="submission_title">Your Submission Title *</Label>
              <Input
                id="submission_title"
                value={formData.submission_title}
                onChange={(e) => setFormData({ ...formData, submission_title: e.target.value })}
                placeholder="Enter a title for your submission"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Your Content *</Label>
              <PellEditor
                id="content"
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content: content })}
              />
              <p className="text-sm text-slate-500">
                Provide your detailed response, reflection, or solution here. Use the rich text editor to format your content.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Work
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Display rubric if available */}
      {entry.rubric_definition && Object.keys(entry.rubric_definition).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rubric Information</CardTitle>
            <CardDescription>
              This entry will be evaluated based on the following criteria:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-50 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(entry.rubric_definition, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
