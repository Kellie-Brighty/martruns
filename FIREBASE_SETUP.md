# Firebase Setup Guide for MartRuns

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `martruns` (or your preferred name)
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Enable the provider
4. Add your project's domains to authorized domains
5. Note down your **Web client ID** (you'll need this)

## 3. Set up Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (we'll configure rules later)
4. Select a location closest to your users

## 4. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click **Web** icon to add a web app
4. Register app with name: `MartRuns`
5. Copy the config object

## 5. Environment Variables

Create a `.env` file in your project root with the following:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

Replace the placeholder values with your actual Firebase config values.

## 6. Firestore Security Rules

Replace the default Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Market runs - users can only access their own
    match /marketRuns/{runId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Items - users can only access their own
    match /items/{itemId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 7. Database Collections Structure

### Users Collection (`/users/{uid}`)

```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  name: string;
  experience: string;
  voiceEnabled: boolean;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  onboardingCompleted: boolean;
}
```

### Market Runs Collection (`/marketRuns/{runId}`)

```typescript
{
  id: string;
  userId: string;
  title: string;
  date: string;
  items: MarketItem[];
  status: "planning" | "shopping" | "completed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Items Collection (`/items/{itemId}`)

```typescript
{
  id: string;
  userId: string;
  runId: string;
  name: string;
  category: string;
  estimatedPrice?: number;
  actualPrice?: number;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 8. Single Session Management

The implementation includes automatic single session management:

- Only one browser tab can be authenticated at a time
- User will be logged out from other tabs when signing in from a new tab
- Session state is synchronized across tabs using localStorage events

## 9. Testing the Setup

1. Start your development server: `npm run dev`
2. Try signing in with Google
3. Complete the onboarding process
4. Check Firebase Console to see user data being created

## 10. Production Deployment

For production deployment:

1. Add your production domain to Firebase authorized domains
2. Update CORS settings if needed
3. Review and tighten Firestore security rules
4. Set up Firebase hosting (optional)

## Troubleshooting

**Authentication Issues:**

- Check if Google provider is enabled
- Verify authorized domains include your domain
- Check browser console for CORS errors

**Firestore Issues:**

- Verify security rules allow authenticated users
- Check if collections are created correctly
- Ensure proper user authentication before database operations

**Environment Variables:**

- Make sure all VITE\_ prefixed variables are set
- Restart development server after changing .env
- Check if .env file is in project root (not in src/)
 