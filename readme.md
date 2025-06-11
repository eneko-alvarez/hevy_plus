# 🏋️ Strong Workout Visualizer

A modern and responsive web application for visualizing workout data exported from the **Strong** fitness app. It allows users to upload workout files and view interactive statistics, charts, and tables to analyze exercise performance.

## 💡 Features

- **File Upload Interface**  
  Drag-and-drop or click to upload exported workout data from Strong.

- **Responsive Dashboard**  
  A clean, mobile-friendly layout with sections for statistics, filters, and visualizations.

- **Workout Summary Cards**  
  Display total volume, number of sessions, and other key metrics in styled cards.

- **Interactive Charts**  
  Visualize:
  - Frequency of exercises
  - Progression of weight over time
  - Top exercises by volume or intensity  
  *(powered by Chart.js)*

- **Exercise Table**  
  View detailed exercise logs in a sortable, scrollable table. Includes:
  - Date
  - Exercise name
  - Weight used
  - Repetitions  
  With a “Show more” button for pagination.

- **Filter Controls**  
  Select exercise type, time period, or other criteria to dynamically update the charts and stats.

- **Visual Feedback & Errors**  
  User-friendly error messages and loading states for invalid or missing data.

## 🧱 Technologies Used

- **HTML5** + **CSS3**
- **JavaScript (vanilla)**
- **Chart.js** for data visualization
- **Responsive design** with flexbox and CSS grid

## 🖼️ UI Highlights

- Minimalist color palette with subtle shadows and hover effects
- Clean typography using system fonts
- Fully responsive design (mobile-friendly)

## 📂 How to Use

1. Export your workout data from the Strong app.
2. Open the web page.
3. Upload the exported file in the upload section.
4. Explore the automatically generated stats, charts, and tables.

## 📎 File Structure

- `index.html` – Main HTML page  
- `style.css` – All visual styling and layout rules  
- `script.js` – App logic (e.g., parsing data, rendering charts)

## 📌 Notes

- Exercises with a weight of `0` are automatically excluded from charts.
- Only the top 5 exercises by frequency are displayed in the bar chart for clarity.
- Make sure your exported file is in the correct format.
