"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentAPI, FlexAGECompResponse } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function StudentDashboard() {
  const [components, setComponents] = useState<FlexAGECompResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setIsLoading(true);
        const data = await studentAPI.getFlexAGEComps();
        setComponents(data);
      } catch (err: any) {
        console.error('Error fetching components:', err);
        setError(err.response?.data?.detail || 'Failed to load components');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, []);

  const handleViewEntries = (compId: string) => {
    router.push(`/student/flexagecomps/${compId}/entries`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading your components...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Enrolled Components</h2>
        <p className="text-slate-600">Select a component to view and complete its entries.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {components.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-slate-600 mb-2">You are not enrolled in any components.</p>
            <p className="text-sm text-slate-500">
              Contact your instructor or administrator to get enrolled in FlexAGE components.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {components.map((component) => (
            <Card key={component.comp_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{component.comp_name}</CardTitle>
                {component.general_instructions && (
                  <CardDescription className="line-clamp-3">
                    {component.general_instructions}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleViewEntries(component.comp_id)}
                    className="w-full"
                  >
                    View Entries
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
