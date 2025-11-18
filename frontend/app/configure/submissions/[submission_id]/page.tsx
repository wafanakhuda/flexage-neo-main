"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import EditOutcomeDialog from '@/components/edit-outcome-dialog'; // Import the dialog
import { 
  EntryResponse,
  SubmissionWithOutcome,
  OutcomeResponse, // Import current Outcome type
  configAPI,
  studentAPI,
  StudentEntryStateWithSubmission
} from '@/services/api';

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submission_id as string;
  
  const [submission, setSubmission] = useState<SubmissionWithOutcome | null>(null);
  const [entryState, setEntryState] = useState<StudentEntryStateWithSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for dialog
  const [isGenerating, setIsGenerating] = useState(false); // State for generate outcome loading

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
      const data = await configAPI.getSubmission(submissionId);
      setSubmission(data);
      // Fetch entry state (status and score)
      try {
        const state = await studentAPI.getStudentEntryStateForEntry(data.student_user_id, data.entry_id);
        setEntryState(state);
      } catch (stateErr) {
        console.error('Failed to load entry state', stateErr);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load submission data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOutcome = (updatedOutcome: OutcomeResponse) => {
    // Update the submission state with the new outcome
    if (submission) {
      setSubmission({ 
        ...submission, 
        outcome: { // Ensure the entire outcome object is updated
          ...submission.outcome, // Spread existing outcome fields
          ...updatedOutcome // Overwrite with new data from the server
        }
      });
    }
    // Optionally, update entryState if it also holds outcome data directly
    if (entryState && entryState.submission) {
      setEntryState({
        ...entryState,
        submission: {
          ...entryState.submission,
          outcome: { // Ensure the entire outcome object is updated
            ...entryState.submission.outcome,
            ...updatedOutcome
          }
        },
      });
    }
  };

  const handleGenerateOutcome = async () => {
    if (!submission) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Check if outcome already exists to determine if we need force regeneration
      const forceRegenerate = submission.outcome !== null && submission.outcome !== undefined;
      
      // Call the API to generate outcome
      await configAPI.generateOutcome(submission.submission_id, forceRegenerate);
      
      // Reload submission data to get the newly generated outcome
      await loadSubmission();
    } catch (err) {
      setError('Failed to generate outcome');
      console.error(err);
    } finally {
      setIsGenerating(false);
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

  const formatDetailedTimestamp = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const datePart = date.toLocaleDateString('en-US', {
        month: 'numeric', // M
        day: 'numeric',   // D
        year: 'numeric',  // YYYY
      });
      const timePart = date.toLocaleTimeString('en-US', {
        hour: 'numeric',   // h
        minute: '2-digit', // mm
        second: '2-digit', // ss
        hour12: true,      // AM/PM
      });
      return `${datePart}, ${timePart}`;
    } catch (err) {
      console.error("Error formatting detailed timestamp:", err);
      return 'Invalid date';
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error || !submission) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Submission not found'}</AlertDescription>
        </Alert>
        <Button 
          className="mt-4" 
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/configure" className="hover:underline">All Components</Link>
          <span>›</span>
          <Link href={`/configure/entries/${submission.entry_id}/submissions`} className="hover:underline">
            Submissions
          </Link>
          <span>›</span>
          <span>Submission Details</span>
        </div>
        <h1 className="text-2xl font-bold">
          Submission by Student {submission.student_user_id}
        </h1>
        <p className="text-muted-foreground">
          Submitted: {formatDate(submission.submitted_at)}
        </p>
        {entryState && (
          <div className="mt-2 flex items-center gap-4">
            <Badge variant="outline">{entryState.status.replace('_', ' ')}</Badge>
            {entryState.submission?.outcome?.outcome_data.score != null && (
              <span className="font-semibold">Score: {entryState.submission.outcome.outcome_data.score.toFixed(1)}</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Submission Section */}
        <Card>
          <CardHeader>
            <CardTitle>Student's Submission: {submission.submission_title}</CardTitle>
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

        {/* Generated Outcome Section */}
        <Card>
          <CardHeader>
            <CardTitle>Automated Outcome</CardTitle>
            {submission.outcome?.generated_at && (
              <CardDescription>
                Generated: {formatDate(submission.outcome.generated_at)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {submission.outcome ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Feedback:</h3>
                  <ScrollArea className="h-[40vh] border rounded-md p-4">
                    <div className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: submission.outcome.outcome_data.feedback_text }}
                    />
                  </ScrollArea>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-1">Score:</h3>
                  <p className="text-xl font-bold">
                    {submission.outcome.outcome_data.score.toFixed(1)}
                  </p>
                </div>
                {submission.outcome.is_llm_generated === false ? (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium mb-1">Status:</h3>
                    <p>Manually edited at {formatDetailedTimestamp(submission.outcome.generated_at)}</p>
                  </div>
                ) : submission.outcome.outcome_data.llm_confidence && (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium mb-1">AI Confidence:</h3>
                    <p>
                      {(submission.outcome.outcome_data.llm_confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setIsEditDialogOpen(true)}> 
                    Edit Outcome
                  </Button>
                  <Button 
                    onClick={handleGenerateOutcome} 
                    disabled={isGenerating}
                    variant="outline"
                  >
                    {isGenerating ? 'Regenerating...' : 'Regenerate Outcome'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No outcome generated yet.</p>
                <Button 
                  onClick={handleGenerateOutcome} 
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? 'Generating...' : 'Generate Outcome'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          Back to Submissions
        </Button>
      </div>

      {submission?.outcome && (
        <EditOutcomeDialog
          outcome={submission.outcome}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveOutcome}
        />
      )}
    </div>
  );
}
