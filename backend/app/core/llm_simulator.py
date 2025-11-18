import random
from typing import Dict, Any



class LLMSimulator:
    """
    Simulates LLM responses for the prototype.
    In a real implementation, this would be replaced with an actual LLM service.
    """
    
    @staticmethod
    def generate_feedback(submission_content: str, submission_title: str) -> Dict[str, Any]:
        """
        Simulates generating feedback and a score for a submission.
        For the prototype, returns positive feedback with a random high score.
        
        Args:
            submission_content: The student's submitted content
            submission_title: The title of the submission
            
        Returns:
            Dict containing feedback_text and score
        """
        # Generate a random score between 7.0 and 10.0 (skewed toward positive feedback for demo)
        score = round(random.uniform(7.0, 10.0), 1)
        
        # Extract a small sample of the submission for personalization
        content_sample = submission_content[:100].replace('<p>', '').replace('</p>', '').strip()
        if len(content_sample) > 0:
            content_sample = content_sample + "..."
        
        # Generic positive feedback templates
        feedback_templates = [
            f"Your submission on \"{submission_title}\" demonstrates clear thinking and strong reasoning. {content_sample} Your ideas are presented logically, and you've provided adequate support for your main points. To further improve, consider adding more specific examples to illustrate your concepts.",
            f"Excellent work on \"{submission_title}\"! You've articulated your thoughts well and shown good understanding of the subject matter. {content_sample} Your organization is effective, making it easy to follow your reasoning. For future submissions, you might consider exploring counter-arguments to strengthen your position.",
            f"I appreciate your thoughtful submission titled \"{submission_title}\". {content_sample} You've successfully communicated your key ideas with good supporting details. Your writing style is engaging and clear. To elevate your work further, consider deepening your analysis in specific areas.",
            f"Strong submission on \"{submission_title}\". Your writing shows careful consideration of the topic. {content_sample} You've structured your response effectively and demonstrated solid understanding. To enhance future work, you might incorporate more diverse perspectives on the subject.",
            f"Your reflection on \"{submission_title}\" shows critical thinking and engagement with the material. {content_sample} You've made meaningful connections and expressed your ideas coherently. Consider adding more specific real-world applications to strengthen your analysis in the future."
        ]
        
        # Randomly select a feedback template
        feedback_text = random.choice(feedback_templates)
        
        return {
            "feedback_text": feedback_text,
            "score": score,
            "llm_confidence": round(random.uniform(0.85, 0.98), 2)
        }
