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

### 2. Build and deploy the application

#### Using cloudbuild.yaml

1. Create a `cloudbuild.yaml` file in the root of your repository with the following content:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/switchboard-webapp', '-f', 'Dockerfile.webapp', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/switchboard-webapp']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/switchboard-websocket', '-f', 'Dockerfile.websocket', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/switchboard-websocket']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'switchboard',
      '--image', 'gcr.io/$PROJECT_ID/switchboard-webapp',
      '--image', 'gcr.io/$PROJECT_ID/switchboard-websocket',
      '--platform', 'managed',
      '--allow-unauthenticated',
      '--region', 'europe-west4',
    ]

options:
  logging: CLOUD_LOGGING_ONLY
```

2. Trigger the build and deployment using the following command:

```bash
gcloud builds submit --config cloudbuild.yaml
```

#### Manually

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Build the container images locally
docker build -t gcr.io/YOUR_PROJECT_ID/switchboard-webapp -f Dockerfile.webapp .
docker build -t gcr.io/YOUR_PROJECT_ID/switchboard-websocket -f Dockerfile.websocket .

# Push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/switchboard-webapp
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/switchboard-websocket

# Deploy to Cloud Run
gcloud run deploy switchboard \
  --image gcr.io/YOUR_PROJECT_ID/switchboard-webapp \
  --image gcr.io/YOUR_PROJECT_ID/switchboard-websocket \
  --platform managed \
  --allow-unauthenticated \
  --region europe-west4 \
  --set-env-vars="OPENAI_API_KEY=YOUR_OPENAI_API_KEY,TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN"
```

### 3. Update Twilio webhook

After deployment, get your Cloud Run service URL and update your Twilio phone number's webhook to point to:
`https://YOUR-CLOUD-RUN-URL/twiml`

## Additional Notes

- The application listens on ports 8080 and 8081 as required by Cloud Run
- The webapp and websocket-server run in separate containers
- The `PUBLIC_URL` is automatically set to your Cloud Run service URL if not specified
