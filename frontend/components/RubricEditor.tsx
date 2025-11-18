"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RubricDataLoader from './RubricDataLoader'; // Import the new component

// Define interfaces for the rubric structure
interface Criterion {
  text: string;
  marks: number;
}

interface PerformanceLevel {
  text: string;
}

interface RubricDefinition {
  criteria: Criterion[];
  performance_levels: PerformanceLevel[];
  cell_descriptions: string[][];
}

interface RubricEditorProps {
  initialDefinition?: RubricDefinition;
  onChange: (definition: RubricDefinition) => void;
}

const defaultRubricDefinition: RubricDefinition = {
  criteria: [{ text: 'Sample Criterion', marks: 0 }],
  performance_levels: [{ text: 'Placeholder' }],
  cell_descriptions: [['']],
};

// defaultDefinition used when no initialDefinition provided
const RubricEditor: React.FC<RubricEditorProps> = ({ initialDefinition, onChange }) => {
  // Determine a safe base definition: use provided if complete, else fallback to default
  const baseDefinition: RubricDefinition = (
    initialDefinition &&
    Array.isArray(initialDefinition.criteria) && initialDefinition.criteria.length > 0 &&
    Array.isArray(initialDefinition.performance_levels) && initialDefinition.performance_levels.length > 0 &&
    Array.isArray(initialDefinition.cell_descriptions)
  )
    ? initialDefinition
    : defaultRubricDefinition;

  const [definition, setDefinition] = useState<RubricDefinition>(
    JSON.parse(JSON.stringify(baseDefinition))
  );
  const [dataLoadedFromFile, setDataLoadedFromFile] = useState(false); // New state variable

  // Handler for when data is loaded from RubricDataLoader
  const handleDataLoaded = (loadedDefinition: RubricDefinition) => {
    setDefinition(loadedDefinition);
    setDataLoadedFromFile(true); // Mark that data was loaded from file
    // onChange(loadedDefinition); // The useEffect below will handle calling onChange
  };

  useEffect(() => {
    if (dataLoadedFromFile) {
      // If data was loaded from a file, don't let initialDefinition overwrite it
      // unless initialDefinition itself changes to a new, valid object.
      // This part might need more sophisticated logic if initialDefinition can be dynamically updated
      // and is intended to override file-loaded data. For now, file load takes precedence once it occurs.
      if (initialDefinition && JSON.stringify(initialDefinition) !== JSON.stringify(definition)) {
         const isInitialStillValid = initialDefinition &&
            Array.isArray(initialDefinition.criteria) && initialDefinition.criteria.length > 0 &&
            Array.isArray(initialDefinition.performance_levels) && initialDefinition.performance_levels.length > 0 &&
            Array.isArray(initialDefinition.cell_descriptions); // Ensure cell_descriptions is checked
        if (isInitialStillValid) {
            // A new, valid initialDefinition is provided.
            // If it should override file-loaded data, uncomment and adjust the following:
            // setDefinition(JSON.parse(JSON.stringify(initialDefinition)));
            // setDataLoadedFromFile(false); // Reset flag if initialDefinition overrides
        }
      }
      return; 
    }

    const newDefFromProps: RubricDefinition = (
      initialDefinition &&
      Array.isArray(initialDefinition.criteria) && initialDefinition.criteria.length > 0 &&
      Array.isArray(initialDefinition.performance_levels) && initialDefinition.performance_levels.length > 0 &&
      Array.isArray(initialDefinition.cell_descriptions)
    )
      ? initialDefinition
      : defaultRubricDefinition;

    // Only update state if newDefFromProps is actually different from the current definition
    // This prevents an infinite loop by ensuring setDefinition is not called if the
    // effective definition from props hasn't changed.
    if (JSON.stringify(newDefFromProps) !== JSON.stringify(definition)) {
      setDefinition(JSON.parse(JSON.stringify(newDefFromProps)));
    }
  }, [initialDefinition, dataLoadedFromFile]); // <-- removed 'definition' from dependencies

  const handleCriterionChange = (index: number, field: 'text' | 'marks', value: string | number) => {
    const newCriteria = definition.criteria.map((crit, i) => {
      if (i === index) {
        return { ...crit, [field]: field === 'marks' ? Number(value) : value };
      }
      return crit;
    });
    setDefinition((prev) => ({
      ...prev,
      criteria: newCriteria,
    }));
  };

  const addCriterion = () => {
    setDefinition((prev) => {
      const newCriteria: Criterion[] = [...prev.criteria, { text: '', marks: 0 }];
      const newCellDescriptions: string[][] = prev.cell_descriptions ? [...prev.cell_descriptions] : [];
      newCellDescriptions.push(Array(prev.performance_levels.length || 1).fill(''));
      return {
        ...prev,
        criteria: newCriteria,
        cell_descriptions: newCellDescriptions,
      };
    });
  };

  const removeCriterion = (index: number) => {
    const newCriteria = definition.criteria.filter((_, i) => i !== index);
    const newCellDescriptions = definition.cell_descriptions?.filter((_, i) => i !== index) || [];
    setDefinition((prev) => ({
      ...prev,
      criteria: newCriteria,
      cell_descriptions: newCellDescriptions,
    }));
  };

  const handleLevelChange = (index: number, field: 'text', value: string) => {
    const newLevels = definition.performance_levels.map((level, i) => {
      if (i === index) {
        return { ...level, [field]: value };
      }
      return level;
    });
    setDefinition((prev) => ({
      ...prev,
      performance_levels: newLevels,
    }));
  };

  const addLevel = () => {
    setDefinition((prev) => {
      const newLevels: PerformanceLevel[] = [...prev.performance_levels, { text: '' }];
      const newCellDescriptions: string[][] = prev.cell_descriptions
        ? prev.cell_descriptions.map((row: string[]) => [...row, ''])
        : [];
      return {
        ...prev,
        performance_levels: newLevels,
        cell_descriptions: newCellDescriptions,
      };
    });
  };

  const removeLevel = (index: number) => {
    const newLevels = definition.performance_levels.filter((_, i) => i !== index);
    const newCellDescriptions =
      definition.cell_descriptions?.map((row: string[]) => row.filter((_, i) => i !== index)) || [];
    setDefinition((prev) => ({
      ...prev,
      performance_levels: newLevels,
      cell_descriptions: newCellDescriptions,
    }));
  };

  const handleCellDescriptionChange = (critIndex: number, levelIndex: number, value: string) => {
    const newCellDescriptions: string[][] = JSON.parse(JSON.stringify(definition.cell_descriptions || []));
    while (newCellDescriptions.length <= critIndex) {
      newCellDescriptions.push([]);
    }
    while (newCellDescriptions[critIndex].length <= levelIndex) {
      newCellDescriptions[critIndex].push('');
    }
    newCellDescriptions[critIndex][levelIndex] = value;
    setDefinition((prev) => ({
      ...prev,
      cell_descriptions: newCellDescriptions,
    }));
  };

  // Debounced onChange to prevent excessive updates
  useEffect(() => {
    const handler = setTimeout(() => onChange(definition), 300);

    return () => {
      clearTimeout(handler);
    };
  }, [definition, onChange]);


  return (
    <div className="space-y-6 p-4 border rounded-md bg-slate-50">
      <RubricDataLoader onDataLoaded={handleDataLoaded} /> {/* Add the RubricDataLoader component here */}
      {/* Spreadsheet Layout */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">Criteria</th>
              {definition.performance_levels.map((level: PerformanceLevel, levelIndex: number) => (
                <th key={levelIndex} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                  <div className="flex items-center justify-between">
                    <Input
                      type="text"
                      value={level.text}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleLevelChange(levelIndex, 'text', e.target.value)}
                      placeholder={`Level ${levelIndex + 1}`}
                      className="text-xs p-1 border-gray-300 rounded-md w-full"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeLevel(levelIndex)} className="ml-2 text-red-500 hover:text-red-700">X</Button>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weightage</th>
              <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Button onClick={addLevel} size="sm" variant="outline" className="text-xs p-1">+ Level</Button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {definition.criteria.map((criterion: Criterion, critIndex: number) => (
              <tr key={critIndex}>
                <td className="px-4 py-2 whitespace-nowrap border-r border-gray-300">
                  <div className="flex items-center">
                    <Textarea
                      value={criterion.text}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleCriterionChange(critIndex, 'text', e.target.value)}
                      placeholder={`Criterion ${critIndex + 1}`}
                      className="text-sm p-1 border-gray-300 rounded-md w-full mr-2"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeCriterion(critIndex)} className="text-red-500 hover:text-red-700">X</Button>
                  </div>
                </td>
                {definition.performance_levels.map((_, levelIndex: number) => (
                  <td key={levelIndex} className="px-4 py-2 border-r border-gray-300">
                    <Textarea
                      value={definition.cell_descriptions?.[critIndex]?.[levelIndex] || ''}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleCellDescriptionChange(critIndex, levelIndex, e.target.value)}
                      placeholder="Description"
                      className="text-sm p-1 border-gray-300 rounded-md w-full min-h-[60px]"
                    />
                  </td>
                ))}
                <td className="px-4 py-2 whitespace-nowrap">
                  <Input
                    type="number"
                    value={criterion.marks}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleCriterionChange(critIndex, 'marks', Number(e.target.value))}
                    placeholder="Weight"
                    className="text-sm p-1 border-gray-300 rounded-md w-20"
                  />
                </td>
                <td className="px-1 py-2"></td> {/* Empty cell for alignment with add level button column */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={addCriterion} variant="outline" className="mt-4">+ Add Criterion</Button>
    </div>
  );
};

export default RubricEditor;
