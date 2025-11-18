"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { configAPI, FlexAGECompResponse, FlexAGECompCreate, FlexAGECompUpdate } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Edit, Users, FileText, Trash2 } from 'lucide-react';

export default function FlexAGECompsPage() {
  const [components, setComponents] = useState<FlexAGECompResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCompId, setCurrentCompId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FlexAGECompCreate>({
    comp_name: '',
    general_instructions: '',
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<FlexAGECompResponse | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await configAPI.getFlexAGEComps();
      setComponents(data);
    } catch (err: any) {
      console.error('Error fetching components:', err);
      setError(err.response?.data?.detail || 'Failed to load components');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsEditing(false);
    setCurrentCompId(null);
    setFormData({ comp_name: '', general_instructions: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = async (compId: string) => {
    try {
      const component = await configAPI.getFlexAGEComp(compId);
      setIsEditing(true);
      setCurrentCompId(compId);
      setFormData({
        comp_name: component.comp_name,
        general_instructions: component.general_instructions || '',
      });
      setIsDialogOpen(true);
    } catch (err: any) {
      console.error('Error loading component for edit:', err);
      setError(err.response?.data?.detail || 'Failed to load component details');
    }
  };

  const handleSave = async () => {
    if (!formData.comp_name.trim()) {
      setError('Component name is required');
      return;
    }

    try {
      setError(null);
      if (isEditing && currentCompId) {
        const updateData: FlexAGECompUpdate = {
          comp_name: formData.comp_name,
          general_instructions: formData.general_instructions,
        };
        const updated = await configAPI.updateFlexAGEComp(currentCompId, updateData);
        setComponents(components.map(comp => 
          comp.comp_id === currentCompId ? updated : comp
        ));
      } else {
        const created = await configAPI.createFlexAGEComp(formData);
        setComponents([...components, created]);
      }
      setIsDialogOpen(false);
      setFormData({ comp_name: '', general_instructions: '' });
    } catch (err: any) {
      console.error('Error saving component:', err);
      setError(err.response?.data?.detail || 'Failed to save component');
    }
  };

  const handleDeleteClick = (component: FlexAGECompResponse) => {
    setComponentToDelete(component);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!componentToDelete) return;

    try {
      await configAPI.deleteFlexAGEComp(componentToDelete.comp_id);
      setComponents(components.filter(comp => comp.comp_id !== componentToDelete.comp_id));
      setIsDeleteDialogOpen(false);
      setComponentToDelete(null);
    } catch (err: any) {
      console.error('Error deleting component:', err);
      setError(err.response?.data?.detail || 'Failed to delete component');
    }
  };

  const handleEnrollStudents = (compId: string) => {
    router.push(`/configure/flexagecomps/${compId}/enrollments`);
  };

  const handleManageEntries = (compId: string) => {
    router.push(`/configure/flexagecomps/${compId}/entries`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading components...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">FlexAGE Configuration</h2>
          <p className="text-slate-600">Manage your FlexAGE components and entries.</p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New FlexAGEComp
        </Button>
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
            <p className="text-lg text-slate-600 mb-2">No FlexAGEComps created.</p>
            <p className="text-sm text-slate-500 mb-4">
              Create your first component to get started with FlexAGE.
            </p>
            <Button onClick={handleCreateNew} className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Create New FlexAGEComp
            </Button>
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
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(component.comp_id)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEnrollStudents(component.comp_id)}
                    className="flex items-center gap-1"
                  >
                    <Users className="h-3 w-3" />
                    Enroll Students
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteClick(component)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
                <div className="mt-3">
                  <Button 
                    onClick={() => handleManageEntries(component.comp_id)}
                    className="w-full flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Manage Entries
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Component' : 'Create New FlexAGEComp'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the component details below.' 
                : 'Create a new FlexAGE component to organize your entries.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comp_name">Component Name *</Label>
              <Input
                id="comp_name"
                value={formData.comp_name}
                onChange={(e) => setFormData({ ...formData, comp_name: e.target.value })}
                placeholder="Enter component name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="general_instructions">General Instructions</Label>
              <Textarea
                id="general_instructions"
                value={formData.general_instructions}
                onChange={(e) => setFormData({ ...formData, general_instructions: e.target.value })}
                placeholder="Enter general instructions for this component"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? 'Update Component' : 'Save Component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Component</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{componentToDelete?.comp_name}"? 
              This action cannot be undone and will also delete all associated entries and submissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
