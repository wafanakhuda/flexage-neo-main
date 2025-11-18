"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { studentAPI, EntryWithStudentStateWithSubmission, FlexAGECompResponse, SubmissionWithOutcome } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, FileText, Clock, CheckCircle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function StudentEntriesPage() {
  const [entries, setEntries] = useState<EntryWithStudentStateWithSubmission[]>([]);
  const [component, setComponent] = useState<FlexAGECompResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [loadingSubmissions, setLoadingSubmissions] = useState<Set<string>>(new Set());
  const [entrySubmissions, setEntrySubmissions] = useState<Record<string, SubmissionWithOutcome[]>>({});
  const params = useParams();
  const router = useRouter();
  const compId = params.comp_id as string;

  useEffect(() => {
    if (compId) {
      fetchData();
    }
  }, [compId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First get all enrolled components to find the component name
      const enrolledComps = await studentAPI.getFlexAGEComps();
      const currentComp = enrolledComps.find(comp => comp.comp_id === compId);
      
      if (currentComp) {
        setComponent(currentComp);
      }
      
      // Fetch entries for the student
      const entriesData = await studentAPI.getEntries(compId);
      setEntries(entriesData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.detail || 'Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntryExpand = async (entryId: string, isExpanded: boolean) => {
    if (isExpanded) {
      setExpandedEntries(prev => new Set([...prev, entryId]));
      
      // Fetch all submissions for this entry if not already loaded
      if (!entrySubmissions[entryId]) {
        setLoadingSubmissions(prev => new Set([...prev, entryId]));
        try {
          console.log('Fetching all submissions for entry:', entryId);
          const submissions = await studentAPI.getSubmissionsForEntry(entryId);
          console.log('Received submissions:', submissions);
          setEntrySubmissions(prev => ({
            ...prev,
            [entryId]: submissions
          }));
        } catch (err: any) {
          console.error('Failed to load submissions:', err);
          console.error('Error response:', err.response?.data);
          console.error('Error status:', err.response?.status);
          console.error('Error details:', err);
        } finally {
          setLoadingSubmissions(prev => {
            const newSet = new Set(prev);
            newSet.delete(entryId);
            return newSet;
          });
        }
      }
    } else {
      setExpandedEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  const handleSubmitEntry = (entryId: string) => {
    router.push(`/student/entries/${entryId}/submit`);
  };

  const getEntryStatus = (entry: EntryWithStudentStateWithSubmission, submissions?: SubmissionWithOutcome[]) => {
    // If we have fetched submissions, use the latest one to determine status
    if (submissions && submissions.length > 0) {
      const latestSubmission = submissions[0]; // API returns sorted by submitted_at DESC
      if (latestSubmission.outcome) {
        return 'outcome_available';
      } else {
        return 'submitted_processing';
      }
    }
    // Fall back to the entry's student state
    return entry.student_state?.status || 'not_submitted';
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'not_submitted':
        return <Badge variant="secondary">Not Submitted</Badge>;
      case 'submitted_processing':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Processing...</Badge>;
      case 'outcome_available':
        return <Badge variant="default" className="bg-green-600">Outcome Available</Badge>;
      default:
        return <Badge variant="secondary">Not Submitted</Badge>;
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'submitted_processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'outcome_available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading entries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-slate-600">
        <Link href="/student" className="hover:text-slate-900">
          Dashboard
        </Link>
        <ChevronLeft className="h-4 w-4 rotate-180" />
        <span className="font-medium">
          {component?.comp_name || 'Component Entries'}
        </span>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {component?.comp_name || 'Component'}: Your Entries
        </h2>
        {component?.general_instructions && (
          <p className="text-slate-600 mt-2">{component.general_instructions}</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-slate-600 mb-2">No entries in this component.</p>
            <p className="text-sm text-slate-500">
              Your instructor hasn't created any entries yet. Check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const isExpanded = expandedEntries.has(entry.entry_id);
            const isLoadingSubmission = loadingSubmissions.has(entry.entry_id);
            const submissions = entrySubmissions[entry.entry_id];
            const status = getEntryStatus(entry, submissions);

            return (
              <Collapsible
                key={entry.entry_id}
                open={isExpanded}
                onOpenChange={(open) => handleEntryExpand(entry.entry_id, open)}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          {getStatusIcon(status)}
                          <div className="text-left">
                            <CardTitle className="text-lg">{entry.entry_title}</CardTitle>
                            {entry.instructions && (
                              <CardDescription className="line-clamp-2 mt-1">
                                <div dangerouslySetInnerHTML={{ __html: entry.instructions }} />
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(status)}
                          <ChevronDown 
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent>
                      {isLoadingSubmission ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Always show submit button - students can submit multiple times */}
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-slate-900">Submissions</h4>
                            <Button 
                              onClick={() => handleSubmitEntry(entry.entry_id)}
                              size="sm"
                            >
                              {submissions && submissions.length > 0 ? 'Submit Again' : 'Submit Now'}
                            </Button>
                          </div>

                          {submissions && submissions.length > 0 ? (
                            <div className="space-y-6">
                              {submissions.map((submission, index) => (
                                <div key={submission.submission_id} className="border rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <h5 className="font-medium text-slate-900">
                                        Submission #{submissions.length - index}
                                        {index === 0 && (
                                          <Badge variant="outline" className="ml-2 text-xs">Latest</Badge>
                                        )}
                                      </h5>
                                      <p className="text-sm text-slate-600">
                                        {submission.submission_title}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Submitted: {formatDate(submission.submitted_at)}
                                      </p>
                                    </div>
                                    <div>
                                      {submission.outcome ? (
                                        <Badge variant="default" className="bg-green-600">Graded</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-yellow-600">Processing</Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Submission Content */}
                                  <div className="mb-4">
                                    <ScrollArea className="h-32 w-full border rounded-md p-3 bg-slate-50">
                                      <div 
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: submission.content }}
                                      />
                                    </ScrollArea>
                                  </div>

                                  {/* Outcome Details */}
                                  {submission.outcome ? (
                                    <div className="bg-green-50 rounded-lg p-4">
                                      <h6 className="font-semibold text-slate-900 mb-2">Feedback</h6>
                                      {/* {submission.outcome.outcome_data?.score !== undefined && (
                                        <div className="mb-3">
                                          <span className="text-xl font-bold text-green-700">
                                            Score: {submission.outcome.outcome_data.score}/100
                                          </span>
                                        </div>
                                      )} */}
                                      {submission.outcome.outcome_data?.feedback_text && (
                                        <ScrollArea className="w-full border rounded-md p-3 bg-white">
                                          <div 
                                            className="prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ 
                                              __html: submission.outcome.outcome_data.feedback_text 
                                            }}
                                          />
                                        </ScrollArea>
                                      )}
                                      <p className="text-xs text-slate-500 mt-2">
                                        Graded: {formatDate(submission.outcome.generated_at)}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="bg-yellow-50 rounded-lg p-3">
                                      <div className="flex items-center space-x-2 text-yellow-700">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-sm">Being processed...</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-lg">
                              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                              <p className="text-slate-600 mb-2">No submissions yet</p>
                              <p className="text-sm text-slate-500">
                                Click "Submit Now" to make your first submission for this entry.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
