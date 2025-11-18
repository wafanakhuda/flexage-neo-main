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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Users, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { 
  EntryResponse,
  UserResponse,
  StudentEntryStateWithSubmission,
  configAPI,
  authAPI 
} from '@/services/api';

interface StudentStateWithUser extends StudentEntryStateWithSubmission {
  user?: UserResponse;
}

export default function StudentStatesPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.entry_id as string;
  
  const [entry, setEntry] = useState<EntryResponse | null>(null);
  const [studentStates, setStudentStates] = useState<StudentStateWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) {
      setError('Invalid entry ID');
      setLoading(false);
      return;
    }
    
    loadData();
  }, [entryId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load entry details
      const entryData = await configAPI.getEntry(entryId);
      setEntry(entryData);
      
      // Load student states for this entry
      const statesData = await configAPI.getStudentStates(entryId);
      
      // Load all users to get user details for each student state
      const allUsers = await authAPI.getUsers();
      const usersMap = new Map(allUsers.map(user => [user.user_id, user]));
      
      // Combine student states with user details
      const statesWithUsers: StudentStateWithUser[] = statesData.map(state => ({
        ...state,
        user: usersMap.get(state.student_user_id)
      }));
      
      setStudentStates(statesWithUsers);
      setError(null);
    } catch (err) {
      setError('Failed to load student state data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_submitted':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'submitted_processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'outcome_available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_submitted':
        return <Badge variant="outline">Not Submitted</Badge>;
      case 'submitted_processing':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Processing</Badge>;
      case 'outcome_available':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getStatusCounts = () => {
    const counts = {
      not_submitted: 0,
      submitted_processing: 0,
      outcome_available: 0,
      total: studentStates.length
    };
    
    studentStates.forEach(state => {
      if (counts.hasOwnProperty(state.status)) {
        counts[state.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading student progress data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/configure" className="hover:underline">Configuration</Link>
          <span>›</span>
          <Link href={`/configure/entries/${entryId}/submissions`} className="hover:underline">
            Entry Submissions
          </Link>
          <span>›</span>
          <span>Student Progress</span>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-7 w-7" />
          Student Progress for: {entry?.entry_title}
        </h1>
        <p className="text-muted-foreground">
          Overview of student submission status and progress
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Not Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.not_submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.submitted_processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.outcome_available}</div>
          </CardContent>
        </Card>
      </div>

      {/* Student States Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Submission Status</CardTitle>
          <CardDescription>
            Current status of all students for this entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentStates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No student data available</p>
              <p className="text-muted-foreground mb-4">
                This could be because no students are enrolled or the API endpoint is not available
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Expected API endpoint: <code>GET /api/configure/entries/{entryId}/student_states</code></p>
                <p>This feature requires backend implementation to fetch student states for an entry.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Submission</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentStates.map((state) => (
                    <TableRow key={state.student_user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(state.status)}
                          <span className="font-medium">
                            {state.user?.full_name || `Student ${state.student_user_id}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {state.user?.username || state.student_user_id}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(state.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(state.updated_at)}
                      </TableCell>
                      <TableCell>
                        {state.submission ? (
                          <span className="text-sm">
                            {state.submission.submission_title}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {state.submission && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/configure/submissions/${state.submission!.submission_id}`)}
                          >
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Back to Submissions
        </Button>
        <Button onClick={() => router.push(`/configure/entries/${entryId}/submissions`)}>
          View All Submissions
        </Button>
      </div>
    </div>
  );
}
