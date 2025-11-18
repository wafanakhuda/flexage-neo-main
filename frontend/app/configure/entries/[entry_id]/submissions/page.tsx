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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  EntryResponse,
  SubmissionWithOutcome,
  configAPI,
} from '@/services/api';

export default function SubmissionsOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.entry_id as string;

  const [entry, setEntry] = useState<EntryResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!entryId) {
      setError('Invalid entry ID');
      setLoading(false);
      return;
    }
    
    loadEntryAndSubmissions();
  }, [entryId]);

  const loadEntryAndSubmissions = async () => {
    setLoading(true);
    try {
      // Load entry details
      const entryData = await configAPI.getEntry(entryId);
      setEntry(entryData);
      
      // Load all submissions for this entry
      const submissionsData = await configAPI.getSubmissions(entryId);
      setSubmissions(submissionsData);
      
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (submission: SubmissionWithOutcome) => {
    if (submission.outcome) {
      return <Badge className="bg-green-500">Outcome Available</Badge>;
    }
    return <Badge className="bg-yellow-500">Processing</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
          {entry?.flex_age_comp_id && (
            <>
              <Link 
                href={`/configure/flexagecomps/${entry.flex_age_comp_id}/entries`}
                className="hover:underline"
              >
                Entries
              </Link>
              <span>›</span>
            </>
          )}
          <span>{entry?.entry_title || 'Entry'}</span>
        </div>
        <h1 className="text-2xl font-bold">Submissions for: {entry?.entry_title}</h1>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No students have submitted to this entry yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Student Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Submission Title</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Submitted At</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Score</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {submissions.map((submission) => (
                  <tr 
                    key={submission.submission_id} 
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle">{submission.student_name || 'Unknown Student'}</td>
                    <td className="p-4 align-middle">{submission.submission_title}</td>
                    <td className="p-4 align-middle">{formatDate(submission.submitted_at)}</td>
                    <td className="p-4 align-middle">{getStatusBadge(submission)}</td>
                    <td className="p-4 align-middle">
                      {submission.outcome ? submission.outcome.outcome_data.score.toFixed(1) : 'N/A'}
                    </td>
                    <td className="p-4 align-middle">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                      >
                        <Link href={`/configure/submissions/${submission.submission_id}`}>
                          View Details
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
