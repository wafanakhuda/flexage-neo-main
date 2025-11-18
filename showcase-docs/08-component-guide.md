# Frontend Component Guide

This document provides an overview of the key React components used in the FlexAGE frontend application.

---

## 1. Core Components

These are the main, high-level components that constitute the primary building blocks of the user interface.

### `RubricEditor.tsx`

-   **Purpose**: A comprehensive component for creating and editing rubrics.
-   **Features**:
    -   Allows adding, editing, and deleting criteria and levels of achievement.
    -   Manages the state of the rubric being edited.
    -   Interfaces with the backend API to save the rubric data.

### `RubricViewer.tsx`

-   **Purpose**: Displays a read-only view of a rubric.
-   **Usage**: Used on student-facing pages to show the evaluation criteria for an entry.

### `pell-editor.tsx`

-   **Purpose**: A lightweight, web-based WYSIWYG text editor.
-   **Integration**: This component is used for student submissions, providing a simple interface for writing and formatting content.
-   **Library**: Based on the `pell` library.

### `feedback-display.tsx`

-   **Purpose**: Renders the feedback and grade (outcome) for a submission.
-   **Features**:
    -   Displays the structured feedback from the LLM evaluation.
    -   Clearly presents the score or achievement level for each criterion.

### `edit-outcome-dialog.tsx`

-   **Purpose**: A dialog modal that allows a `Configurator` to manually override or edit an AI-generated outcome.
-   **Usage**: Triggered from the submission view page.

---

## 2. UI Components (`components/ui`)

The application utilizes a set of reusable UI components, largely based on the `shadcn/ui` library. These components provide a consistent look and feel throughout the application.

Key UI components include:

-   `Button.tsx`
-   `Card.tsx`
-   `Dialog.tsx`
-   `Input.tsx`
-   `Label.tsx`
-   `Table.tsx`
-   `Tabs.tsx`
-   `Textarea.tsx`

These components are used to build more complex UI structures and are not documented individually here. Refer to the `shadcn/ui` documentation for more details on their props and usage.

---

## 3. Layout and Routing

### `app/layout.tsx`

-   **Purpose**: The root layout for the entire application. It includes the basic HTML structure, providers, and global styles.

### `lib/protected-route.tsx`

-   **Purpose**: A higher-order component or hook that wraps pages to protect them from unauthenticated access.
-   **Logic**: It checks for the presence of a valid JWT in the `AuthContext` and redirects to the login page if the user is not authenticated.

### `lib/auth-context.tsx`

-   **Purpose**: A React Context provider that manages the authentication state of the user.
-   **Features**:
    -   Stores the JWT and user information.
    -   Provides `login` and `logout` functions to the rest of the application.
    -   Makes the authentication state available to all components wrapped within it.
