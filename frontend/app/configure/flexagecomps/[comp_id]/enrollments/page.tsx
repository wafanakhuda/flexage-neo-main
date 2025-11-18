"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { 
  FlexAGECompResponse, 
  UserResponse,
  StudentEnrollmentCreate,
  configAPI,
  authAPI 
} from '@/services/api';

export default function EnrollmentsPage() {
  const router = useRouter();
  const params = useParams();
  const compId = params.comp_id as string;
  
  const [component, setComponent] = useState<FlexAGECompResponse | null>(null);
  const [allStudents, setAllStudents] = useState<UserResponse[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<UserResponse[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [studentToUnenroll, setStudentToUnenroll] = useState<UserResponse | null>(null);

  useEffect(() => {
    if (!compId) {
      setError('Invalid component ID');
      setLoading(false);
      return;
    }
    
    loadData();
  }, [compId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load component details
      const compData = await configAPI.getFlexAGEComp(compId);
      setComponent(compData);
      
      // Load all users and filter students
      const allUsers = await authAPI.getUsers();
      const students = allUsers.filter(user => user.role === 'student');
      setAllStudents(students);
      
      // Load enrolled students for this component
      const enrolledStudentsData = await configAPI.getEnrolledStudents(compId);
      setEnrolledStudents(enrolledStudentsData);
      
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) {
      setError('Please select a student to enroll');
      return;
    }

    setEnrolling(true);
    try {
      const enrollment: StudentEnrollmentCreate = {
        student_user_id: selectedStudentId,
        flex_age_comp_id: compId
      };
      
      await authAPI.enroll(enrollment);
      
      // Add the enrolled student to the list
      const enrolledStudent = allStudents.find(s => s.user_id === selectedStudentId);
      if (enrolledStudent) {
        setEnrolledStudents([...enrolledStudents, enrolledStudent]);
      }
      
      setSelectedStudentId('');
      setSuccessMessage('Student enrolled successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to enroll student');
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenrollStudent = async () => {
    if (!studentToUnenroll) return;

    try {
      const enrollment: StudentEnrollmentCreate = {
        student_user_id: studentToUnenroll.user_id,
        flex_age_comp_id: compId
      };
      
      await authAPI.unenroll(enrollment);
      
      // Remove the student from the enrolled list
      setEnrolledStudents(enrolledStudents.filter(s => s.user_id !== studentToUnenroll.user_id));
      
      setShowUnenrollDialog(false);
      setStudentToUnenroll(null);
      setSuccessMessage('Student unenrolled successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to unenroll student');
      console.error(err);
    }
  };

  const openUnenrollDialog = (student: UserResponse) => {
    setStudentToUnenroll(student);
    setShowUnenrollDialog(true);
  };

  const getAvailableStudents = () => {
    const enrolledIds = new Set(enrolledStudents.map(s => s.user_id));
    return allStudents.filter(student => !enrolledIds.has(student.user_id));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading enrollment data...</div>
        </div>
      </div>
    );
  }

  if (error && !component) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push('/configure')}>
          Back to Components
        </Button>
      </div>
    );
  }

  const availableStudents = getAvailableStudents();

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/configure" className="hover:underline">All Components</Link>
          <span>›</span>
          <Link href={`/configure/flexagecomps/${compId}/entries`} className="hover:underline">
            {component?.comp_name || 'Component'}
          </Link>
          <span>›</span>
          <span>Enrollments</span>
        </div>
        <h1 className="text-2xl font-bold">
          Manage Student Enrollments for: {component?.comp_name}
        </h1>
        {component?.general_instructions && (
          <p className="text-sm text-muted-foreground mt-2">
            {component.general_instructions}
          </p>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrollment Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Enroll New Student
            </CardTitle>
            <CardDescription>
              Select a student to enroll in this component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-select">Select Student</Label>
              {availableStudents.length === 0 ? (
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                  No available students to enroll
                </div>
              ) : (
                <Select 
                  value={selectedStudentId} 
                  onValueChange={(value) => {
                    if (value && value !== '__no_students__') {
                      setSelectedStudentId(value);
                    }
                  }}
                >
                  <SelectTrigger id="student-select">
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.map((student) => (
                      <SelectItem key={student.user_id} value={student.user_id}>
                        {student.full_name || student.username} ({student.username})
                        {student.email && (
                          <span className="text-muted-foreground"> - {student.email}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button 
              onClick={handleEnrollStudent}
              disabled={!selectedStudentId || enrolling || availableStudents.length === 0}
              className="w-full"
            >
              {enrolling ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </CardContent>
        </Card>

        {/* Enrolled Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Currently Enrolled Students
              <Badge variant="secondary" className="ml-auto">
                {enrolledStudents.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Students enrolled in this component
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No students enrolled yet</p>
                <p className="text-sm">Use the enrollment form to add students</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledStudents.map((student) => (
                  <div
                    key={student.user_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {student.full_name || student.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{student.username}
                        {student.email && ` • ${student.email}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Enrolled: {new Date(student.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUnenrollDialog(student)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Unenroll
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unenroll Confirmation Dialog */}
      <Dialog open={showUnenrollDialog} onOpenChange={setShowUnenrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Unenrollment</DialogTitle>
            <DialogDescription>
              Are you sure you want to unenroll{' '}
              <strong>{studentToUnenroll?.full_name || studentToUnenroll?.username}</strong>{' '}
              from this component? This action cannot be undone and they will lose access to all entries and submissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUnenrollDialog(false);
                setStudentToUnenroll(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnenrollStudent}>
              Unenroll Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => router.push('/configure')}>
          Back to Components
        </Button>
        <Button onClick={() => router.push(`/configure/flexagecomps/${compId}/entries`)}>
          Manage Entries
        </Button>
      </div>
    </div>
  );
}
