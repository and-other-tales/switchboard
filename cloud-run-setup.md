# Deploying to Google Cloud Run

This guide explains how to deploy the Switchboard application to Google Cloud Run.

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
2. A Google Cloud project set up
3. Enable necessary APIs: Cloud Run, Container Registry
4. [Docker](https://docs.docker.com/get-docker/) installed locally

## Deployment Steps

### 1. Set up environment variables

In Google Cloud Run, set the following environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
- `PUBLIC_URL`: Your Cloud Run service URL (will be automatically set if not specified)
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
- `NEXTAUTH_URL`: Your Cloud Run service URL (e.g., https://your-service-url.run.app)
- `NEXTAUTH_SECRET`: A secure random string for NextAuth.js session encryption

### 2. Build and deploy the application

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Build the container image locally
docker build -t gcr.io/YOUR_PROJECT_ID/switchboard .

# Push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/switchboard

# Deploy to Cloud Run
gcloud run deploy switchboard \
  --image gcr.io/YOUR_PROJECT_ID/switchboard \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars="OPENAI_API_KEY=YOUR_OPENAI_API_KEY,TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN"
```

### 3. Update Twilio webhook

After deployment, get your Cloud Run service URL and update your Twilio phone number's webhook to point to:
`https://YOUR-CLOUD-RUN-URL/twiml`

## Additional Notes

- The application listens on port 8080 as required by Cloud Run
- Both the webapp and websocket-server run in the same container
- The `PUBLIC_URL` is automatically set to your Cloud Run service URL if not specified