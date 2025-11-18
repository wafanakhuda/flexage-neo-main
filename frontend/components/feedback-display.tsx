import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeedbackDisplayProps {
  title?: string;
  submissionTitle: string;
  submissionDate?: string;
  content: string;
  feedback?: string;
  score?: number;
  status?: 'not_submitted' | 'submitted_processing' | 'outcome_available';
}

export function FeedbackDisplay({
  title = 'Feedback and Outcome',
  submissionTitle,
  submissionDate,
  content,
  feedback,
  score,
  status = 'outcome_available'
}: FeedbackDisplayProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_submitted':
        return <Badge variant="outline">Not Submitted</Badge>;
      case 'submitted_processing':
        return <Badge className="bg-yellow-500">Processing</Badge>;
      case 'outcome_available':
        return <Badge className="bg-green-500">Outcome Available</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Submission Content */}
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Submission: {submissionTitle}</CardTitle>
              {submissionDate && (
                <CardDescription>
                  Submitted: {formatDate(submissionDate)}
                </CardDescription>
              )}
            </div>
            <div>{getStatusBadge(status)}</div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
            <div 
              className="prose max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Feedback & Score */}
      <Card className="border-l-4 border-l-green-600">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Feedback:</h3>
                <ScrollArea className="h-[40vh] border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="prose max-w-none dark:prose-invert">
                    {feedback}
                  </div>
                </ScrollArea>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-1">Score:</h3>
                <div className="flex items-center">
                  <span className="text-xl font-bold">{score?.toFixed(1)}</span>
                  <div className="ml-2 w-full max-w-[200px] h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600" 
                      style={{ 
                        width: `${(score !== undefined ? score / 10 : 0) * 100}%`,
                        backgroundColor: score && score < 6 ? 'rgb(239 68 68)' : 
                                         score && score < 8 ? 'rgb(234 179 8)' : 'rgb(22 163 74)'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {status === 'submitted_processing' 
                  ? 'Your submission is being processed. Please check back later for feedback.'
                  : 'No feedback available yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
