"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

// Define interfaces for the rubric structure (can be shared or imported if already defined elsewhere)
interface Criterion {
  text: string;
  marks: number;
}

interface PerformanceLevel {
  text: string;
}

export interface RubricDefinition {
  criteria: Criterion[];
  performance_levels: PerformanceLevel[];
  cell_descriptions: string[][];
}

interface RubricViewerProps {
  rubricDefinition?: RubricDefinition;
  isOpen: boolean;
  onClose: () => void;
}

const RubricViewer: React.FC<RubricViewerProps> = ({ rubricDefinition, isOpen, onClose }) => {
  if (!rubricDefinition) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rubric Not Available</DialogTitle>
            <DialogDescription>
              There is no rubric defined for this entry.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { criteria = [], performance_levels = [], cell_descriptions = [] } = rubricDefinition;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Rubric Details</DialogTitle>
          <DialogDescription>
            This is the rubric used for assessment.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full p-1">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 sticky left-0 bg-gray-50 z-10">Criteria</th>
                  {performance_levels.map((level, levelIndex) => (
                    <th key={levelIndex} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      {level.text}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">Marks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {criteria.map((criterion, critIndex) => (
                  <tr key={critIndex}>
                    <td className="px-4 py-2 align-top whitespace-normal border-r border-gray-300 sticky left-0 bg-white z-10">
                      {criterion.text}
                    </td>
                    {performance_levels.map((_, levelIndex) => (
                      <td key={levelIndex} className="px-4 py-2 align-top whitespace-normal border-r border-gray-300">
                        {cell_descriptions[critIndex]?.[levelIndex] || 'N/A'}
                      </td>
                    ))}
                    <td className="px-4 py-2 align-top whitespace-nowrap sticky right-0 bg-white z-10">
                      {criterion.marks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
        <div className="mt-4 flex justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RubricViewer;
