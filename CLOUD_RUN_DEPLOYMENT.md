# Deploying to Google Cloud Run

This guide explains how to deploy the Switchboard application to Google Cloud Run with IAM authentication.

## Prerequisites

1. Google Cloud CLI installed and configured
2. Docker installed locally
3. Access to Google Cloud with permissions to create Cloud Run services
4. Google OAuth 2.0 credentials (Client ID and Client Secret)

## Creating Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click "Create Credentials" > "OAuth client ID"
4. Select "Web application" as the application type
5. Add your Cloud Run URL to the "Authorized JavaScript origins" (e.g., `https://your-service.a.run.app`)
6. Add your Cloud Run URL plus `/api/auth/callback/google` to the "Authorized redirect URIs" (e.g., `https://your-service.a.run.app/api/auth/callback/google`)
7. Click "Create" and note your Client ID and Client Secret

## Environment Variables

The following environment variables are required for deployment:

- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `NEXTAUTH_SECRET`: A random string used to encrypt cookies (generated automatically if not provided)
- `NEXTAUTH_URL`: The public URL of your application (defaults to PUBLIC_URL if not provided)
- `ALLOWED_DOMAINS`: Optional comma-separated list of domains to restrict login (e.g., `example.com,example.org`)
- `OPENAI_API_KEY`: Your OpenAI API key
- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `PUBLIC_URL`: The public URL of your Cloud Run service (optional, auto-detected)
- `WEBSOCKET_URL`: URL for WebSocket connections (optional, defaults to PUBLIC_URL)

> **Security Note**: The application uses Google OAuth for user authentication and Google Cloud IAM for service-to-service authentication. This provides a secure authentication mechanism for both user access and service access.

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
  --port 8080 \
  --region [YOUR_REGION] \
  --ingress=all \
  --set-env-vars="GOOGLE_CLIENT_ID=your_client_id,GOOGLE_CLIENT_SECRET=your_client_secret,NEXTAUTH_SECRET=your_random_secret,ALLOWED_DOMAINS=your_domain.com,OPENAI_API_KEY=your_openai_key,TWILIO_ACCOUNT_SID=your_twilio_sid,TWILIO_AUTH_TOKEN=your_twilio_token,NODE_ENV=production"
```

> **Important**: Note that we've removed the `--allow-unauthenticated` flag to enable Google Cloud IAM authentication. We've also added `--ingress=all` to allow both internal and external traffic.

> **Note**: The `NEXTAUTH_SECRET` is used to encrypt cookies and tokens. If not provided, a random value will be generated during container startup, but the value will change with each deployment, invalidating existing sessions.

## Configuring IAM Permissions

After deploying your service, you need to grant appropriate IAM permissions to the services or users that need to access it:

### Grant access to a service account

```bash
gcloud run services add-iam-policy-binding switchboard \
  --member=serviceAccount:your-service-account@your-project.iam.gserviceaccount.com \
  --role=roles/run.invoker \
  --region=[YOUR_REGION]
```

### Grant access to a user

```bash
gcloud run services add-iam-policy-binding switchboard \
  --member=user:user@example.com \
  --role=roles/run.invoker \
  --region=[YOUR_REGION]
```

### Grant access to all authenticated users

```bash
gcloud run services add-iam-policy-binding switchboard \
  --member=allAuthenticatedUsers \
  --role=roles/run.invoker \
  --region=[YOUR_REGION]
```

## Accessing the Application

### User Access

For users accessing the web interface, they will be redirected to Google's sign-in page for authentication. Only users with email addresses from domains specified in the `ALLOWED_DOMAINS` environment variable will be allowed to access the application (if configured).

### Service-to-Service Access

For service-to-service communication, you'll need to include an ID token in the request headers:

```bash
# Get an ID token for your service account
TOKEN=$(gcloud auth print-identity-token --audiences=https://your-service.a.run.app)

# Make a request with the token
curl -H "Authorization: Bearer $TOKEN" https://your-service.a.run.app/endpoint
```

## WebSocket Connections

To connect to the WebSocket server with IAM authentication, you'll need to include the ID token as a query parameter:

```javascript
// In your client code
const token = await getIdToken(); // Implement this to get the ID token
const ws = new WebSocket(`wss://your-service.a.run.app/logs?token=${token}`);
```

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
        '--ingress',
        'all',
        '--port',
        '8080',
        '--set-env-vars',
        'GOOGLE_CLIENT_ID=$$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$$GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET=$$NEXTAUTH_SECRET,ALLOWED_DOMAINS=$$ALLOWED_DOMAINS,OPENAI_API_KEY=$$OPENAI_API_KEY,TWILIO_ACCOUNT_SID=$$TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN=$$TWILIO_AUTH_TOKEN,NODE_ENV=production'
      ]
images:
  - 'gcr.io/$PROJECT_ID/switchboard'
substitutions:
  _ALLOWED_DOMAINS: your_domain.com
options:
  secretEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET', 'OPENAI_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
```

Then set up your secret environment variables in Secret Manager.

## Updating the Application

To update the application, rebuild the Docker image and redeploy to Cloud Run using the same commands as above.

### Updating OAuth Configuration

You can update the OAuth configuration without rebuilding the container:

1. Go to the Cloud Run service in the Google Cloud Console
2. Click on the "Edit and Deploy New Revision" button
3. Scroll down to the "Container, Networking, Security" section and expand it
4. Under "Environment Variables", update the OAuth-related environment variables:
   - `GOOGLE_CLIENT_ID`: Update if you created new OAuth credentials
   - `GOOGLE_CLIENT_SECRET`: Update if you created new OAuth credentials
   - `ALLOWED_DOMAINS`: Update to change which email domains are allowed to access the application
5. Click "Deploy" to apply the changes

The new configuration will take effect immediately when the new revision is deployed.

### Modifying Authorized Domains

To update which domains can access your application:

1. Go to the Cloud Run service in the Google Cloud Console
2. Update the `ALLOWED_DOMAINS` environment variable with a comma-separated list of allowed domains (e.g., `example.com,example.org`)
3. Deploy the new revision

Users with email addresses from the specified domains will be allowed to access the application.