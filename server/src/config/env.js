import dotenv from 'dotenv';

// Loads server/.env for local development. On Render the variables come from the dashboard instead.
dotenv.config({ quiet: true });
