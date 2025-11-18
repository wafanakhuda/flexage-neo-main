"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import PellEditor from "@/components/pell-editor"; 
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area'; 
import { 
  FlexAGECompResponse as FlexAGEComp, 
  EntryResponse as Entry, 
  configAPI 
} from '@/services/api'; 
import RubricEditor from '@/components/RubricEditor';
import RubricViewer, { RubricDefinition } from '@/components/RubricViewer'; 

export default function EntriesPage() {
  const router = useRouter();
  const params = useParams();
  const compId = params.comp_id as string;
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  // State for new entry form
  const [newEntry, setNewEntry] = useState<{
    flex_age_comp_id: string;
    entry_title: string;
    instructions: string;
    rubric_definition?: any;
  }>({
    flex_age_comp_id: compId,
    entry_title: '',
    instructions: '',
    // initial undefined so RubricEditor uses default
    rubric_definition: undefined,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [selectedRubric, setSelectedRubric] = useState<RubricDefinition | undefined>(undefined);
  const [isRubricViewerOpen, setIsRubricViewerOpen] = useState(false);
  const [compName, setCompName] = useState<string | null>(null); // Added compName state

  useEffect(() => {
    if (!compId) {
      setError('Invalid component ID');
      setLoading(false);
      return;
    }
    
    loadCompAndEntries();
  }, [compId]);

  const loadCompAndEntries = async () => {
    setLoading(true);
    try {
      // Load component details
      const compData = await configAPI.getFlexAGEComp(compId);
      setCompName(compData.comp_name); // Set compName
      
      // Load all entries for this component
      const entriesData = await configAPI.getEntries(compId);
      setEntries(entriesData);
      
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRubricDefinitionChange = (definition: RubricDefinition) => {
    setNewEntry(prev => ({ ...prev, rubric_definition: definition }));
  };

  const handleCreateOrUpdateEntry = async () => {
    try {
      if (!newEntry.entry_title) {
        setError('Entry title is required');
        return;
      }
       
       if (isEditing && currentEntryId) {
         // Update existing entry
         const updated = await configAPI.updateEntry(currentEntryId, newEntry);
         setEntries(entries.map(entry => entry.entry_id === currentEntryId ? updated : entry));
       } else {
         // Create new entry
         const created = await configAPI.createEntry(newEntry);
         setEntries([...entries, created]);
       }
       
       // Reset form state
       setIsDialogOpen(false);
       setIsEditing(false);
       setCurrentEntryId(null);
      setNewEntry({
        flex_age_comp_id: compId,
        entry_title: '',
        instructions: '',
        rubric_definition: undefined,
      });
       setError(null);
     } catch (err) {
       setError(isEditing ? 'Failed to update entry' : 'Failed to create entry');
       console.error(err);
     }
  };

  const handleEditEntry = (entry: Entry) => {
    setIsEditing(true);
    setCurrentEntryId(entry.entry_id || null);
    setNewEntry({
      flex_age_comp_id: compId,
      entry_title: entry.entry_title,
      instructions: entry.instructions || '',
      rubric_definition: entry.rubric_definition || {},
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await configAPI.deleteEntry(entryId);
      setEntries(entries.filter(entry => entry.entry_id !== entryId));
      setEntryToDelete(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete entry');
      console.error(err);
    }
  };

  const openDeleteConfirm = (entryId: string) => {
    setEntryToDelete(entryId);
    setShowDeleteConfirm(true);
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setCurrentEntryId(null);
    setNewEntry({
      flex_age_comp_id: compId,
      entry_title: '',
      instructions: '',
      rubric_definition: {},
    });
    setIsDialogOpen(true);
  };

  const handleViewRubric = (entry: Entry) => {
    setSelectedRubric(entry.rubric_definition);
    setIsRubricViewerOpen(true);
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
        <Button className="mt-4" onClick={() => router.push('/configure')}>
          Back to Components
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
          <span>{compName || 'Component'}</span>
        </div>
        <h1 className="text-2xl font-bold">Manage Entries for: {compName}</h1>
        <p className="text-sm text-muted-foreground">Component ID: {compId}</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Entries</h2>
        <Button onClick={openCreateDialog}>
          Create New Entry
        </Button>
      </div>

      {/* Create/Edit Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? `Edit Entry: ${newEntry.entry_title}` : `Create New Entry with ${compName}`}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the entry details below.'
                : 'Fill in the details to create a new entry.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh] w-full pr-4">
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="entryTitleInput">Entry Title*</Label>
                <Input 
                  id="entryTitleInput"
                  value={newEntry.entry_title}
                  onChange={(e) => setNewEntry({...newEntry, entry_title: e.target.value})}
                  placeholder="e.g., Week 1 Reflection"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instructions">Instructions</Label>
                {/* Replace Textarea with PellEditor */}
                <PellEditor
                  id="instructions"
                  value={newEntry.instructions}
                  onChange={(content) => setNewEntry(prev => ({ ...prev, instructions: content }))}
                />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Rubric Definition</h3>
                <RubricEditor 
                  initialDefinition={newEntry.rubric_definition}
                  onChange={handleRubricDefinitionChange} 
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrUpdateEntry}>
              {isEditing ? 'Save Entry' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => entryToDelete && handleDeleteEntry(entryToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-2">No entries created yet for this component.</p>
            <Button onClick={openCreateDialog}>Create New Entry</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <Card key={entry.entry_id} className="mb-4 flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{entry.entry_title}</CardTitle>
                {entry.created_at && (
                  <CardDescription>
                    Created: {new Date(entry.created_at).toLocaleDateString()}
                  </CardDescription>
                )}
              </CardHeader>
              {entry.instructions && (
                <CardContent className="flex-grow">
                  <div
                    className="text-sm line-clamp-3 prose dark:prose-invert max-w-none explanation-content"
                    dangerouslySetInnerHTML={{ __html: entry.instructions }}
                  />
                </CardContent>
              )}
              <CardFooter className="flex flex-wrap justify-end gap-2 mt-auto pt-4">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewRubric(entry)}
                  disabled={!entry.rubric_definition}
                >
                  View Rubric
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditEntry(entry)}
                >
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => entry.entry_id && openDeleteConfirm(entry.entry_id)}
                >
                  Delete
                </Button>
                <Button 
                  size="sm"
                  asChild
                >
                  <Link href={`/configure/entries/${entry.entry_id}/submissions`}>
                    View Submissions
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <RubricViewer 
        rubricDefinition={selectedRubric}
        isOpen={isRubricViewerOpen}
        onClose={() => setIsRubricViewerOpen(false)}
      />
    </div>
  );
}
