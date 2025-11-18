from ..models.models import Entry, Submission
from ..schemas.schemas import EntryResponse # Added import
from dotenv import load_dotenv
import os # Added
import google.genai as genai # Added
from google.genai import types # Added
import json # Added
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional
from ..core.config import settings


load_dotenv("../../.env")


# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


class LLMOutcomeReturn(BaseModel):
    feedback_text: str = Field(..., description="HTML Formatted String")
    score: float = Field(..., description="Score for the student's submission")
    llm_confidence: int = Field(..., description="The confidence of the model on the outcome and score., between 0 and 100")

class LLMEvaluator:
    """
    Gets responses for a student's submission.
    """
    
    @staticmethod
    def generate_feedback(submission_content: str, submission_title: str, entry_details: Entry, submission_history: Optional[List[Submission]] = None) -> LLMOutcomeReturn:
        """
        Generates feedback and a score for a submission using the Gemini API.
        
        Args:
            submission_content: The student's submitted content
            submission_title: The title of the submission
            entry_details: Entry object containing details of the question.
            submission_history: List of previous submissions by the student for this entry (optional)
            
        Returns:
            LLMOutcomeReturn object containing feedback_text, score and confidence
        """
        # Convert Entry object to a Pydantic model, then to a dictionary
        entry_details_pydantic = EntryResponse.from_orm(entry_details)
        entry_details_dict = entry_details_pydantic.model_dump()
        
        question_details = {
            "question_title": entry_details_dict.get("entry_title", "Question Title"),
            "question_rubric": entry_details.rubric_definition if entry_details.rubric_definition else "",
            "question_description": entry_details.instructions if entry_details.instructions else "<no instructions given>"
        }
        
        submission_details = {
            "submission_title": submission_title,
            "submission_content": submission_content
        }
        
        # Process submission history if provided
        history_details = []
        if submission_history:
            for i, prev_submission in enumerate(submission_history):
                # Convert datetime object to string before creating history item
                submitted_at_str = ""
                if prev_submission.submitted_at:
                    if hasattr(prev_submission.submitted_at, 'isoformat'):
                        submitted_at_str = prev_submission.submitted_at.isoformat()
                    else:
                        submitted_at_str = str(prev_submission.submitted_at)
                
                history_item = {
                    "attempt_number": i + 1,
                    "submission_title": prev_submission.submission_title or "",
                    "submission_content": prev_submission.content or "",
                    "submitted_at": submitted_at_str
                }
                history_details.append(history_item)

        try:
            client = genai.Client(
                api_key = settings.GOOGLE_API_KEY,  # Ensure GOOGLE_API_KEY is set in your .env file
            )

            prompt_file_path = os.path.join(os.path.dirname(__file__), "../../prompts/evaluation_prompt.txt")
            system_instruction_text = "You are an academic evaluation expert. Your output will be in the form of a JSON ONLY. You will also answer questions from an academic perspective to the best of your knowledge when asked."

            with open(prompt_file_path, "r") as f:
                user_prompt_template = f.read()
            
            user_prompt = user_prompt_template.replace("{question_content}", json.dumps(question_details, cls=DateTimeEncoder))
            user_prompt = user_prompt.replace("{submission_content}", json.dumps(submission_details, cls=DateTimeEncoder))
            user_prompt = user_prompt.replace("{submission_history}", json.dumps(history_details, cls=DateTimeEncoder))


            print(f"LLM Prompt: {user_prompt}")  # Debug print
            model_name = "gemini-2.0-flash" 
            
            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=user_prompt)],
                ),
            ]
            
            generate_content_config = types.GenerateContentConfig(
                response_mime_type="application/json",
                system_instruction=types.Content(parts=[types.Part.from_text(text=system_instruction_text)])
            )
            
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=generate_content_config,
            )
            # print(f"LLM Response: {response}")

            if response.candidates and response.candidates[0].content.parts:
                response_text = response.candidates[0].content.parts[0].text
                try:
                    llm_output = json.loads(response_text)
                    # print("LLM Output:", llm_output)  # Debug print
                    return LLMOutcomeReturn(
                        feedback_text=llm_output.get("feedback_text", "Error: Could not parse feedback."),
                        score=float(llm_output.get("score", 0.0)),
                        llm_confidence=int(llm_output.get("llm_confidence", 0)) # Ensure int
                    )
                except json.JSONDecodeError:
                    print("JSON Decode ERROR INVOKED.")
                    return LLMOutcomeReturn(
                        feedback_text="Error: LLM returned invalid JSON.", score=0.0, llm_confidence=0
                    )
            else:
                print("LLM Response is empty or malformed.")
                return LLMOutcomeReturn(
                    feedback_text="Error: No content in LLM response.", score=0.0, llm_confidence=0
                )

        except Exception as e:
            print("Something went wrong with the LLM evaluation. Like, totally wrong.")
            return LLMOutcomeReturn(
                feedback_text=f"Error, something went wrong! Contact the admin, error: {e}", score=0.0, llm_confidence=0
            )
