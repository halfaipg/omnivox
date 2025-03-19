# Ultravox Integration API Documentation

This directory contains the API documentation for the Ultravox Integration project. The documentation is served as a static HTML page with a modern, responsive design.

## Structure

- `index.html` - The main documentation page
- `README.md` - This file

## Features

- Modern, responsive design
- Syntax highlighting for code examples
- Interactive navigation with smooth scrolling
- Sidebar with categorized endpoints
- Detailed parameter tables
- Example requests and responses
- Mobile-friendly layout

## Endpoint Categories

1. Core Functions
   - Overview
   - Authentication
   - Health Check
   - Configuration

2. Call Management
   - Incoming Call
   - Outgoing Call
   - Direct Connect
   - Call Status
   - Callback
   - WebRTC Join URL

3. Voice Management
   - List Voices
   - Delete Voice
   - Clone Voice

4. Knowledge Base
   - List Corpora
   - Create Corpus
   - Delete Corpus

5. Calendar Integration
   - Calendar Availability
   - Schedule Event
   - Microsoft Auth

6. Miscellaneous
   - System Prompt
   - Avatar Management

## Maintaining the Documentation

### Adding New Endpoints

1. Add a new section in the appropriate category in `index.html`
2. Follow the existing format:
   ```html
   <section id="endpoint-name" class="section">
     <h2>Endpoint Name</h2>
     <div class="endpoint-title">
       <span class="method get">GET</span>
       <span class="endpoint-path">/endpoint-path</span>
     </div>
     <p>Description of the endpoint</p>
     <h3>Request Parameters</h3>
     <table class="param-table">
       <!-- Parameter table -->
     </table>
     <h3>Response</h3>
     <pre><code class="language-json">
     // Example response
     </code></pre>
   </section>
   ```

3. Add a link in the sidebar navigation

### Updating Existing Endpoints

1. Find the relevant section in `index.html`
2. Update the description, parameters, or response examples as needed
3. Ensure the endpoint path and method are correct

### Styling

The documentation uses CSS variables for consistent styling. To modify the appearance:

1. Update the CSS variables in the `:root` selector
2. Add new styles as needed
3. Test the changes across different screen sizes

## Best Practices

1. Keep descriptions clear and concise
2. Include all required parameters
3. Provide realistic example responses
4. Use proper code formatting
5. Test all links and navigation
6. Ensure mobile responsiveness

## Serving the Documentation

The documentation is served as a static file from the `/api-docs` endpoint. Make sure the file is properly placed in the `public` directory of your project.

## Contributing

1. Create a new branch for documentation changes
2. Make your changes following the existing format
3. Test the documentation locally
4. Submit a pull request

## License

This documentation is part of the Ultravox Integration project and follows the same licensing terms. 