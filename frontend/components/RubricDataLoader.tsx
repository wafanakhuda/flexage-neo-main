"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Define interfaces for the rubric structure (can be shared or imported if already defined elsewhere)
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

interface RubricDataLoaderProps {
  onDataLoaded: (definition: RubricDefinition) => void;
}

const RubricDataLoader: React.FC<RubricDataLoaderProps> = ({ onDataLoaded }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          setError("Failed to read file data.");
          return;
        }
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          setError("Invalid rubric format: Not enough rows.");
          return;
        }
        
        // First row contains performance levels (starting from 2nd column) and "Marks Allocation" header
        const headerRow = jsonData[0];
        if (headerRow.length < 2) {
            setError("Invalid rubric format: Not enough columns in header.");
            return;
        }

        const performanceLevels: PerformanceLevel[] = [];
        // Iterate up to the second to last item, as the last is "Marks Allocation"
        for (let i = 1; i < headerRow.length -1; i++) {
            if(headerRow[i]) { // Ensure there's a value
                performanceLevels.push({ text: String(headerRow[i]) });
            }
        }
        
        if (performanceLevels.length === 0) {
            setError("Invalid rubric format: No performance levels found. Ensure they are in the first row, starting from the second column.");
            return;
        }

        const criteria: Criterion[] = [];
        const cellDescriptions: string[][] = [];
        const marksColumnIndex = headerRow.length - 1; // Last column

        // Data rows start from the second row (index 1)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[0]) { // Skip empty or invalid rows
            continue;
          }

          const criterionText = String(row[0]);
          const marksText = row[marksColumnIndex];
          const marks = marksText !== undefined && marksText !== null && String(marksText).trim() !== '' ? parseFloat(String(marksText)) : 0;

          if (isNaN(marks)) {
            console.warn(`Invalid marks for criterion "${criterionText}": "${marksText}". Defaulting to 0.`);
          }
          
          criteria.push({ text: criterionText, marks: isNaN(marks) ? 0 : marks });

          const descriptions: string[] = [];
          for (let j = 0; j < performanceLevels.length; j++) {
            descriptions.push(String(row[j + 1] || '')); // j+1 to skip criterion text column
          }
          cellDescriptions.push(descriptions);
        }

        if (criteria.length === 0) {
            setError("Invalid rubric format: No criteria found. Ensure criteria are in the first column, starting from the second row.");
            return;
        }

        const newDefinition: RubricDefinition = {
          criteria,
          performance_levels: performanceLevels,
          cell_descriptions: cellDescriptions,
        };
        onDataLoaded(newDefinition);

      } catch (err: any) {
        console.error("Error processing Excel file:", err);
        setError(`Error processing file: ${err.message || 'Unknown error'}`);
      }
    };

    reader.onerror = (err) => {
        console.error("FileReader error:", err);
        setError("Failed to read file.");
    }

    reader.readAsBinaryString(file);
  };

  return (
    <div className="my-4 flex justify-end">
      <Input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-2 file:bg-[#0E529B] file:text-white file:px-3 file:py-1.5 file:rounded-md file:border-0 file:mr-2 hover:file:bg-blue-600 cursor-pointer"
      />
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertTitle>Error Loading Rubric</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RubricDataLoader;
