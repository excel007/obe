
# OBE Curriculum Designer - System Requirement Specification (SRS)

## 1. Introduction

### 1.1 Purpose
The **OBE Curriculum Designer** is a web-based application designed to assist Thai Higher Education institutions in designing Outcome-Based Education (OBE) curricula. It facilitates the workflow from defining stakeholder needs to structuring the curriculum, mapping learning outcomes (PLOs/CLOs), and generating study plans.

### 1.2 Scope
The system provides tools for:
- Defining Program Learning Outcomes (PLOs) derived from Stakeholder needs.
- Managing courses and curriculum structures.
- Mapping relationships between courses, PLOs, YLOs (Year Learning Outcomes), and CLOs (Course Learning Outcomes).
- Designing semester-based study plans.
- Generating reports for TQF (Thai Qualifications Framework) compliance.

## 2. Functional Requirements

### 2.1 Curriculum Identity (Menu 1)
- **Input**: Users can input Program Name (TH/EN), Degree Level, and Total Credits.
- **Credit Structure**: Users can define the credit distribution for standard categories (General Ed, Core, Major Required, Major Elective, Field Experience, Free Elective).

### 2.2 Outcome Definition (Menu 2)
- **Stakeholders**: Manage stakeholder needs (Source & Description).
- **PLO Management**: Create, edit, and delete PLOs.
- **YLO Management**: Define Year Learning Outcomes for Years 1-4.
- **AI Assistance**:
  - Synthesize PLOs from stakeholder inputs using Generative AI.
  - Suggest YLOs based on degree level and program name.

### 2.3 Needs Mapping (Menu 3)
- **Matrix View**: Map Stakeholder Needs to PLOs using a checkbox matrix.
- **Visualization**: View relationships by Need Source or by PLO.

### 2.4 Curriculum Structure (Menu 4)
- **Course Management**: Add, edit, delete courses with properties (Code, Name TH/EN, Credits, Category, Description).
- **Categorization**: Organize courses into standard TQF categories.
- **AI Gap Analysis**: Analyze existing courses against PLOs to suggest missing elective courses.
- **Import**: Support CSV import for bulk course creation.
- **Print**: Generate a printable view of the curriculum structure (Popup window, Bullet list format).

### 2.5 Study Plan (Menu 5)
- **Drag & Drop**: Assign courses from the unassigned pool to specific semesters (Year 1 Sem 1 to Year 4 Sem 2).
- **Validation**: Visual indicators for credit totals per semester.
- **Content Generation**: AI generation of Course Descriptions and CLOs based on course name and PLOs.
- **Print**: Generate a printable view of the study plan (Popup window, Bullet list per semester with Category Codes).

### 2.6 Mapping & Relations (Menu 6 & 7)
- **PLO-CLO Mapping**: Visual matrix and Node diagram showing relationships between courses and PLOs.
- **YLO Derivation**: Logic to display derived YLOs based on course placement in the study plan.
- **Visual Fixes**: Clean node diagrams without artifact lines.

### 2.7 Modules (Menu 8)
- **Module Management**: Group courses into "Modules" or "Tracks" (e.g., Data Science Track).
- **AI Suggestion**: Suggest courses for a module based on a description.

### 2.8 Reporting (Menu 9)
- **Course Specification Report**: Detailed printable view of selected courses.
- **Filtering**: Filter report output by Course Category.
- **Content**: Includes Code, Names, Credits, Descriptions, CLOs, and Mapped PLOs.
- **Print Format**: Optimized for A4 printing via `Ctrl+P`.

## 3. Non-Functional Requirements

### 3.1 User Interface
- **Framework**: React (v18+).
- **Styling**: Tailwind CSS.
- **Responsiveness**: Sidebar navigation for desktop, collapsible menu for mobile.
- **Printability**: Specific CSS classes (`print:hidden`) to ensure clean printing of reports without UI chrome.

### 3.2 AI Integration
- **Provider**: Google Gemini API.
- **Latency**: Retry logic with exponential backoff for API rate limits.

### 3.3 Data Persistence
- **State Management**: React Context API.
- **Import/Export**: JSON file format for saving and loading curriculum data.

## 4. Technical Architecture

- **Frontend**: Single Page Application (SPA).
- **Language**: TypeScript.
- **Build Tool**: Vite (assumed based on typical setup) or standard Webpack.
- **Icons**: Text-based or Emoji icons for simplicity.
- **Fonts**: "Sarabun" (Google Fonts) for Thai language support.

## 5. Appendix: Print Formats

### 5.1 Structure Print
- **Format**: Hierarchy (Category -> Course List).
- **Item Detail**: Code, Name TH, Name EN, Credits.

### 5.2 Plan Print
- **Format**: Semester Blocks (Year X Semester Y).
- **Item Detail**: Code, Name EN, Credits, Category Code (e.g., 2.1, 2.2.1).
