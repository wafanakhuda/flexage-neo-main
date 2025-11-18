"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft } from 'lucide-react';
import { studentAPI, SubmissionWithOutcome, EntryResponse } from '@/services/api';

export default function StudentSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submission_id as string;
  
  const [submission, setSubmission] = useState<SubmissionWithOutcome | null>(null);
  const [entry, setEntry] = useState<EntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) {
      setError('Invalid submission ID');
      setLoading(false);
      return;
    }
    
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    setLoading(true);
    try {
      // Get the submission data with its outcome
      const submissionData = await studentAPI.getSubmission(submissionId);
      setSubmission(submissionData);
      
      // Load the entry details to get the comp_id for navigation
      try {
        const entryData = await studentAPI.getEntry(submissionData.entry_id);
        setEntry(entryData);
      } catch (entryErr) {
        console.error('Failed to load entry details:', entryErr);
        // Continue without entry data
      }
      
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      setError(`Failed to load submission: ${errorMsg}`);
      console.error('Error loading submission:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (err) {
      return 'Invalid date';
    }
  };

  const handleBackToEntries = () => {
    if (entry) {
      router.push(`/student/flexagecomps/${entry.flex_age_comp_id}/entries`);
    } else {
      router.push('/student');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading submission...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Submission not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/student')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-slate-600">
        <Link href="/student" className="hover:text-slate-900">
          Dashboard
        </Link>
        <span>/</span>
        {entry && (
          <>
            <Link 
              href={`/student/flexagecomps/${entry.flex_age_comp_id}/entries`}
              className="hover:text-slate-900"
            >
              {entry.entry_title}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-medium">Your Submission</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={handleBackToEntries}>
            <ChevronLeft className="h-4 w-4" />
            Back to Entries
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Your Submission: {submission.submission_title}
        </h1>
        <p className="text-slate-600">
          Submitted: {formatDate(submission.submitted_at)}
        </p>
        <div className="mt-2">
          {submission.outcome ? (
            <Badge className="bg-green-100 text-green-800">
              Outcome Available
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800">
              Processing...
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Submission */}
        <Card>
          <CardHeader>
            <CardTitle>Your Submitted Work</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] border rounded-md p-4">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: submission.content }}
              />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Feedback & Score */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback and Score</CardTitle>
            {submission.outcome?.generated_at && (
              <CardDescription>
                Generated: {formatDate(submission.outcome.generated_at)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {submission.outcome && submission.outcome.outcome_data ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Feedback:</h3>
                  <ScrollArea className="h-[40vh] border rounded-md p-4">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: submission.outcome.outcome_data.feedback_text || 'No feedback available'
                      }}
                    />
                  </ScrollArea>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-1">Score:</h3>
                  <p className="text-xl font-bold">
                    {typeof submission.outcome.outcome_data.score === 'number' 
                      ? submission.outcome.outcome_data.score.toFixed(1)
                      : 'Not scored yet'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-slate-600">
                  Your submission is being processed. Please check back later for feedback.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleBackToEntries}>
          Back to Entries
        </Button>
      </div>
    </div>
  );
}
