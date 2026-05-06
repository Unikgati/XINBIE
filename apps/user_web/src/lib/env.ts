export const env = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  // Add other variables here as needed
};

// Validate required variables in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn('WARNING: NEXT_PUBLIC_API_URL is not set. Using default.');
  }
}
