# French AP Learning Platform

An interactive web app for French AP students to access learning materials, submit responses, and receive feedback.

## Setup Instructions

### 1. Set up Supabase

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Create the following tables:
   - `profiles` - User profiles
   - `lessons` - Course lessons
   - `exercises` - Interactive exercises
   - `submissions` - Student submissions
   - `feedback` - Teacher feedback

   Refer to the `DBTables` file for detailed table structure.

4. Enable Authentication in your Supabase project
5. Update your Row Level Security policies to restrict access appropriately

### 2. Import sample data

You have two options for importing data:

#### Option A: CSV Import (via Supabase UI)
1. In your Supabase dashboard, go to the Table Editor
2. Select the table you want to import data to (lessons or exercises)
3. Click "Import" and select the corresponding CSV file:
   - `lessons.csv` for the lessons table
   - `exercises.csv` for the exercises table
4. Follow the import wizard, ensuring columns are mapped correctly

#### Option B: SQL Script (via SQL Editor)
1. In your Supabase dashboard, go to the SQL Editor
2. Open the `import.sql` file from this project
3. Run the entire script or sections as needed
4. Verify that data was imported correctly by browsing the tables

### 3. Update Supabase credentials

1. Update the `supabase.js` file with your project URL and anon key:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

### 4. Run the application

The app is a static web application, so you can:
1. Serve it locally using a simple HTTP server
2. Deploy it to any static hosting service (Netlify, Vercel, GitHub Pages, etc.)

## Features

- **User Authentication**: Login/signup with email verification
- **Lesson Viewer**: Interactive lesson content with rich formatting
- **Exercise Submission**: Text and audio responses
- **Student Dashboard**: Track progress and view feedback (upcoming)
- **Teacher Interface**: Review and provide feedback on submissions (upcoming)

## Development Plan

Refer to `plan.md` for the detailed development plan.

## Project Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling for all components
- `main.js` - Application logic
- `supabase.js` - Supabase client configuration
- `lessons.json` - Sample lesson data
- `exercises.json` - Sample exercise data
- `DBTables` - Database schema documentation
- `plan.md` - Development roadmap 