# User Workflows

This document outlines the primary user workflows for both `Configurator` and `Student` roles in the FlexAGE application.

---

## 1. Configurator Workflow

Configurators (instructors or administrators) are responsible for setting up the assessment structure, managing users, and overseeing the grading process.

### 1.1. Setup and Configuration

1.  **Login**: The configurator logs into the application using their credentials.
2.  **User Management**:
    - Navigates to the user management section.
    - Creates new user accounts for students and other configurators (`POST /api/auth/register`).
    - Views a list of all users (`GET /api/auth/users`).
3.  **Create a FlexAGEComp**:
    - Navigates to the FlexAGEComps configuration page.
    - Creates a new `FlexAGEComp`, providing a title and description (`POST /api/configure/flexagecomps`). This represents a course or a major assessment unit.
4.  **Create Entries**:
    - Within a `FlexAGEComp`, the configurator creates multiple `Entries` (`POST /api/configure/entries`). Each entry represents a specific task or assignment for students.
    - For each entry, they provide a title, description, and the rubric or evaluation criteria.
5.  **Enroll Students**:
    - The configurator enrolls students into the `FlexAGEComp` (`POST /api/auth/enroll`), enabling them to access the entries and submit their work.

### 1.2. Assessment and Grading

1.  **View Submissions**:
    - The configurator can view all submissions for a specific entry (`GET /api/configure/entries/{entry_id}/submissions`).
    - The dashboard displays a list of students and their submission status for each entry.
2.  **Generate Feedback**:
    - For each submission, the configurator can trigger an AI-powered evaluation (`POST /api/configure/submissions/{submission_id}/generate_outcome`).
    - The system sends the submission content, entry details, and submission history to the LLM for evaluation.
3.  **Review and Override**:
    - The generated `Outcome` (feedback and grade) is displayed.
    - The configurator can review the AI-generated feedback and, if necessary, manually edit or update it (`PUT /api/configure/outcomes/{outcome_id}`).

---

## 2. Student Workflow

Students interact with the system to complete their assigned tasks and receive feedback.

### 2.1. Completing an Assignment

1.  **Login**: The student logs into the application.
2.  **View Dashboard**: The student sees a list of `FlexAGEComp`s they are enrolled in (`GET /api/student/flexagecomps`).
3.  **Select an Entry**:
    - The student selects a `FlexAGEComp` to view its `Entries` (`GET /api/student/flexagecomps/{comp_id}/entries`).
    - The list shows the status of each entry (e.g., not started, submitted, graded).
4.  **Submit Work**:
    - The student selects an entry to view its details and rubric.
    - They use the provided editor to write and submit their work (`POST /api/student/entries/{entry_id}/submit`).
    - The system allows for multiple submissions for the same entry.

### 2.2. Viewing Feedback

1.  **Check Submission Status**: After submitting, the student can see that the entry is pending evaluation.
2.  **View Outcome**:
    - Once the configurator has generated the outcome, the student can view their submission details along with the feedback and grade (`GET /api/student/submissions/{submission_id}`).
    - The student can view their history of submissions for an entry to see their progress (`GET /api/student/entries/{entry_id}/submissions`).
