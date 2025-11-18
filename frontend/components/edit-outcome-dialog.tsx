"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PellEditor from "./pell-editor"; // Assuming PellEditor is in the same directory or accessible path
import { OutcomeResponse, OutcomeUpdate, configAPI } from "@/services/api"; // Adjust path as necessary

interface EditOutcomeDialogProps {
  outcome: OutcomeResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOutcome: OutcomeResponse) => void;
}

export default function EditOutcomeDialog({
  outcome,
  isOpen,
  onClose,
  onSave,
}: EditOutcomeDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (outcome && outcome.outcome_data) {
      // Use feedback_text from the outcome_data
      setFeedback(outcome.outcome_data.feedback_text || "");
      // Use ?? to handle 0 or empty string correctly for score
      setScore(outcome.outcome_data.score ?? "");
    } else {
      setFeedback("");
      setScore("");
    }
  }, [outcome]);

  const handleSave = async () => {
    if (!outcome || !outcome.outcome_id) {
      setError("Outcome data is missing.");
      return;
    }

    setLoading(true);
    setError(null);

    const numericScore = parseFloat(score as string);
    if (isNaN(numericScore)) {
      setError("Invalid score. Please enter a number.");
      setLoading(false);
      return;
    }

    // This is the payload for the API, specifically the parts of Outcome we are updating
    const outcomeUpdatePayload: OutcomeUpdate = {
      outcome_data: {
        ...outcome.outcome_data, // Preserve other existing fields in outcome_data
        feedback_text: feedback, // Set the primary feedback field
        score: numericScore, // Set the updated score
      },
      is_llm_generated: false, // Mark as manually edited
    };

    try {
      // configAPI.updateOutcome expects (outcomeId: string, dataToUpdate: OutcomeUpdate)
      const updatedOutcomeResponse = await configAPI.updateOutcome(
        outcome.outcome_id,
        outcomeUpdatePayload
      );
      onSave(updatedOutcomeResponse); // Pass the full updated outcome object from the server response
      onClose();
    } catch (err) {
      setError("Failed to save outcome. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Outcome</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="feedback" className="text-right col-span-1">
              Feedback
            </label>
            <div className="col-span-3">
              <PellEditor
                id="feedback-editor"
                value={feedback}
                onChange={setFeedback}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="score" className="text-right col-span-1">
              Score
            </label>
            <Input
              id="score"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="col-span-3"
            />
          </div>
          {error && <p className="text-red-500 text-sm col-span-4">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
