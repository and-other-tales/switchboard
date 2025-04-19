# Deploying to Google Cloud Run

This guide explains how to deploy the Switchboard application to Google Cloud Run.

## Prerequisites

1. Google Cloud CLI installed and configured
2. Docker installed locally
3. Access to Google Cloud with permissions to create Cloud Run services

## Environment Variables

The following environment variables are required for deployment:

- `AUTH_USERNAME`: Username for basic HTTP authentication (required for security)
- `AUTH_PASSWORD`: Password for basic HTTP authentication (required for security)
- `OPENAI_API_KEY`: Your OpenAI API key
- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `PUBLIC_URL`: The public URL of your Cloud Run service (optional, auto-detected)
- `WEBSOCKET_URL`: URL for WebSocket connections (optional, defaults to PUBLIC_URL)

> **Security Note**: The HTTP authentication is dynamically configured at container startup using the `AUTH_USERNAME` and `AUTH_PASSWORD` environment variables. These values are read directly from the Cloud Run environment variables, allowing you to update credentials without rebuilding the container.

## Build and Deploy

### 1. Build the Docker image

```bash
docker build -t gcr.io/[YOUR_PROJECT_ID]/switchboard .
```

### 2. Push the image to Google Container Registry

```bash
docker push gcr.io/[YOUR_PROJECT_ID]/switchboard
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy switchboard \
  --image gcr.io/[YOUR_PROJECT_ID]/switchboard \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --region [YOUR_REGION] \
  --set-env-vars="AUTH_USERNAME=your_chosen_username,AUTH_PASSWORD=your_secure_password,OPENAI_API_KEY=your_openai_key,TWILIO_ACCOUNT_SID=your_twilio_sid,TWILIO_AUTH_TOKEN=your_twilio_token"
```

> **Note**: You can update the authentication credentials later without rebuilding the container by updating the `AUTH_USERNAME` and `AUTH_PASSWORD` environment variables in the Cloud Run service configuration.

## Automation with Cloud Build

You can set up continuous deployment using Cloud Build by creating a `cloudbuild.yaml` file:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/switchboard', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/switchboard']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      [
        'run',
        'deploy',
        'switchboard',
        '--image',
        'gcr.io/$PROJECT_ID/switchboard',
        '--platform',
        'managed',
        '--region',
        'us-central1',
        '--allow-unauthenticated',
        '--port',
        '8080',
        '--set-env-vars',
        'AUTH_USERNAME=$$AUTH_USERNAME,AUTH_PASSWORD=$$AUTH_PASSWORD,OPENAI_API_KEY=$$OPENAI_API_KEY,TWILIO_ACCOUNT_SID=$$TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN=$$TWILIO_AUTH_TOKEN'
      ]
images:
  - 'gcr.io/$PROJECT_ID/switchboard'
substitutions:
  _AUTH_USERNAME: admin
options:
  secretEnv: ['AUTH_PASSWORD', 'OPENAI_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
```

Then set up your secret environment variables in Secret Manager.

## Accessing the Application

After deployment, your application will be available at the Cloud Run URL. You'll need to use the basic authentication credentials to access it.

## Updating the Application

To update the application, rebuild the Docker image and redeploy to Cloud Run using the same commands as above.

### Updating Authentication Credentials

You can update the HTTP authentication credentials without rebuilding the container:

1. Go to the Cloud Run service in the Google Cloud Console
2. Click on the "Edit and Deploy New Revision" button
3. Scroll down to the "Container, Networking, Security" section and expand it
4. Under "Environment Variables", update the `AUTH_USERNAME` and/or `AUTH_PASSWORD` values
5. Click "Deploy" to apply the changes

The new credentials will take effect immediately when the new revision is deployed.