*Time Tracker Web App*

A beautifully designed, AI-assisted 24-hour time tracking and analytics web application that helps users log their daily activities in minutes and analyze how their day is spent.

Users can securely log in, add activities for specific dates, and view detailed visual analytics—complete with dynamic charts, category breakdowns, and a smart “No Data Available” view.

*Live Demo Link (Deployed Link)*

https://poojitha308-t.github.io/Time_Tracker-website/

*Video Walkthrough Link*

https://youtu.be/8dx6F3EACqE

*Tech Stack*

1. Frontend

-> HTML
-> CSS / Responsive UI
-> JavaScript
->Chart.js (for analytics charts)

2. Backend

-> Firebase Authentication
-> Firebase Realtime Database (or Firestore)

3. Tools

AI tools (ChatGPT, Gemini, Cursor, Figma AI, etc.) for:

-> UI design
-> Code generation
-> Debugging
-> Documentation

*Features*

1. User Authentication

-> Login / Signup with Email & Password
-> Login using Google
-> Only authenticated users can:
-> Add activities
-> View analytics
-> Edit or delete entries

2. Activity Logging

-> Select a date (Date Picker)

-> Add activities with:

* Activity name
* Category (Work, Sleep, Study, etc.)
* Duration (in minutes)

-> Automatically calculates:

* Total used minutes
* Remaining minutes (1440 – used)

-> Prevents exceeding 1440 minutes

-> Edit & delete activities
 
-> Stores data under:
users/{uid}/days/{YYYY-MM-DD}/activities

3. Analytics Dashboard

If data exists for the selected date:
-> Total minutes
-> Category-wise distribution
-> Activity count
-> Pie chart visualization
-> Bar chart for activity breakdown

If NO data available:
-> A beautiful “No data available” screen

-> A helpful CTA (“Start logging your day!”)

