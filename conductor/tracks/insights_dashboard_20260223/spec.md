# Specification: Insights Dashboard

## Overview
Implement a high-level analytics dashboard within the Feedback Hub to provide stakeholders with actionable insights into user sentiment, feedback trends, and project health. This feature leverages the existing Gemini integration to analyze feedback content and visualize it through interactive charts and statistics.

## User Stories
- **As a Product Manager**, I want to see a summary of overall feedback sentiment so I can understand user satisfaction at a glance.
- **As a Product Manager**, I want to see trends of feedback types (Bug vs. Feature) over time so I can adjust development priorities.
- **As a Developer**, I want to see which projects or features are receiving the most critical feedback so I can focus on high-impact fixes.

## Functional Requirements
- **Sentiment Analysis:** Utilize the Gemini AI engine to analyze the sentiment (Positive, Neutral, Negative) of all incoming and existing feedback.
- **Data Aggregation:** Calculate aggregate statistics:
    - Average sentiment score per project.
    - Distribution of feedback types (Bug, Feature, Improvement, Question).
    - Volume of feedback over time (Daily/Weekly).
- **Visualization:**
    - Sentiment distribution chart (e.g., Pie or Gauge).
    - Feedback volume trend line chart.
    - Priority distribution bar chart.
- **Interactivity:**
    - Filter insights by Project.
    - Select date ranges for analysis.
- **Navigation:** Add an "Insights" or "Analytics" link to the main dashboard sidebar.

## Technical Considerations
- **Data Layer:** Use Prisma to perform efficient aggregations where possible. AI sentiment scores should be stored in the `Feedback` model (extending the `metadata` or adding a new field).
- **API:** Create a new Server Action or API route to provide the aggregated data to the frontend.
- **Frontend:** Use Tailwind CSS for the dashboard layout and a lightweight charting library (or SVG-based components) for visualizations.
- **AI Integration:** Optimize Gemini prompts to return consistent sentiment scores (e.g., a float between -1 and 1).

## Success Criteria
- Dashboard is accessible from the sidebar.
- Charts correctly reflect the data in the database.
- AI sentiment analysis is performed automatically or via a batch process for existing data.
- Dashboard is responsive and performant on mobile devices.
