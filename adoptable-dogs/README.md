# Adoptable Dogs Gallery

A responsive web application that displays adoptable dogs from an ASM (Animal Shelter Manager) service.

## Setup

1. Update the `.env` file with your ASM credentials:
   ```
   ASM_USERNAME=your_username_here
   ASM_PASSWORD=your_password_here
   ```

2. Serve the application using a local web server (due to module imports and CORS):
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js (if http-server is installed)
   npx http-server -p 8000
   ```

3. Open http://localhost:8000/adoptable-dogs in your browser

## Features

- Responsive grid layout that adapts to different screen sizes
- Lazy loading images for better performance
- Click on any dog card to view their full profile
- Loading spinner while fetching data
- Error handling with user-friendly messages
- Empty state when no dogs are available

## Technical Details

- Pure JavaScript ES6 modules (no build step required)
- CSS Grid for responsive layout
- Fetch API for data retrieval
- Environment variables stored in .env file