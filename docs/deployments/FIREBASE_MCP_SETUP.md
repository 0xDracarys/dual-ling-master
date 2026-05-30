# Firebase MCP Server Setup

## Configuration Complete ✅

The Firebase MCP (Model Context Protocol) server has been successfully configured for this workspace.

### Configuration Location
- **File**: `.vscode/mcp.json`
- **MCP Server**: Firebase Tools MCP (latest)

### Configuration Details

```json
{
  "servers": {
    "firebase": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "firebase-tools@latest",
        "mcp",
        "--dir",
        "${workspaceFolder}",
        "--only",
        "auth,firestore,storage,dataconnect,messaging,functions,apphosting"
      ]
    }
  }
}
```

### Configuration Explanation

- **`type: "stdio"`**: Firebase MCP uses standard input/output for communication
- **`command: "npx"`**: Runs Firebase Tools via npx (no installation needed)
- **`--dir ${workspaceFolder}`**: Sets the project context to your workspace folder
- **`--only`**: Limits tools to only the Firebase features you're actively using
  - `auth`: Firebase Authentication tools
  - `firestore`: Cloud Firestore database tools
  - `storage`: Cloud Storage for Firebase tools
  - `dataconnect`: Firebase Data Connect tools
  - `messaging`: Firebase Cloud Messaging tools
  - `functions`: Cloud Functions tools
  - `apphosting`: Firebase App Hosting tools

## Verified Firebase Project

- **Project ID**: `paji-duolingo`
- **Project Number**: `189726325845`
- **Database**: Firestore (default)
- **Location**: `nam5` (North America)
- **Type**: `FIRESTORE_NATIVE`
- **Edition**: Standard (Free Tier)

## Available Services

1. **Firestore Database**
   - Location: nam5
   - Mode: Pessimistic concurrency
   - Real-time updates: Enabled

2. **Cloud Storage**
   - Rules configured

3. **Authentication**
   - Enabled

4. **App Hosting**
   - Backend ID: `ltus-acadamy`

## Firestore Indexes

The following composite indexes are configured:

1. **enrollments** collection:
   - `courseId` (ASC) + `enrolledAt` (DESC)
   - `userId` (ASC) + `enrolledAt` (DESC)

2. **quiz_attempts** collection:
   - `lessonId` (ASC) + additional fields

## How to Use Firebase MCP

### Through GitHub Copilot Chat

After restarting VS Code, you can now use Firebase MCP tools directly in Copilot Chat:

#### Agent Mode (Automatic Tool Invocation)
Just ask natural language questions and Copilot will automatically use the appropriate Firebase tools:

```
@workspace List all collections in my Firestore database
```

```
@workspace Show me all users in Firebase Authentication
```

```
@workspace What courses are in the Firestore courses collection?
```

#### Explicit Tool Reference
You can explicitly reference Firebase MCP tools by typing `#` followed by the tool name:

```
#firestore_list_collections Show me all Firestore collections
```

```
#auth_get_users Get information about user with email teacher@test.com
```

#### MCP Prompts (Slash Commands)
Firebase MCP provides pre-written prompts accessible as slash commands:

```
/firebase:init Set up Firebase services
```

```
/firebase:deploy Deploy resources to Firebase
```

```
/firebase:consult Ask the Firebase Assistant about best practices
```

### Available Firebase MCP Tools

#### Core Tools (Always Available)
- `firebase_login` - Sign into Firebase CLI
- `firebase_logout` - Sign out of Firebase CLI
- `firebase_get_project` - Get current project info
- `firebase_list_projects` - List all accessible projects
- `firebase_list_apps` - List Firebase apps in project
- `firebase_create_project` - Create new Firebase project
- `firebase_create_app` - Create new Firebase app
- `firebase_init` - Initialize Firebase services
- `firebase_get_environment` - Get current environment config
- `firebase_update_environment` - Update environment settings
- `firebase_validate_security_rules` - Validate security rules
- `firebase_get_security_rules` - Retrieve security rules
- `firebase_read_resources` - Read firebase:// resources

#### Firestore Tools
- `firestore_list_collections` - List all Firestore collections
- `firestore_get_documents` - Get documents by path
- `firestore_query_collection` - Query a collection with filters
- `firestore_delete_document` - Delete documents by path

#### Authentication Tools
- `auth_get_users` - Get users by UID or email
- `auth_update_user` - Update user account (disable/enable/claims)
- `auth_set_sms_region_policy` - Set SMS region restrictions

#### Storage Tools
- `storage_get_object_download_url` - Get download URL for stored objects

#### Cloud Messaging Tools
- `messaging_send_message` - Send FCM messages to tokens or topics

#### Cloud Functions Tools
- `functions_get_logs` - Retrieve function logs with filters

#### App Hosting Tools
- `apphosting_list_backends` - List App Hosting backends
- `apphosting_fetch_logs` - Fetch backend logs

#### Data Connect Tools
- `dataconnect_list_services` - List Data Connect services
- `dataconnect_build` - Compile schema and operations
- `dataconnect_generate_schema` - Generate schema from description
- `dataconnect_generate_operation` - Generate queries/mutations
- `dataconnect_execute` - Execute GraphQL operations

### Through Terminal

You can also use Firebase CLI directly:

```bash
# List all projects
firebase projects:list

# Get database info
firebase firestore:databases:get "(default)" --json

# List indexes
firebase firestore:indexes --json

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

## Emulator Configuration

The project is configured with Firebase emulators in `firebase.json`:

- **Auth**: Port 9099
- **Firestore**: Port 8080
- **Storage**: Port 9199
- **Functions**: Port 5001
- **UI Dashboard**: Port 4000

**Note**: Emulators require Java to be installed. Install from https://www.java.com if needed.

## Next Steps

1. ✅ Firebase MCP server configured
2. ✅ Firebase project authenticated
3. ✅ Firestore database verified
4. 🔄 Restart VS Code to activate MCP tools
5. 📝 Start using Firebase commands in Copilot Chat

## Testing the MCP Server

To verify the MCP server is working after restart:

1. Open GitHub Copilot Chat
2. Type: `@workspace List my Firebase Firestore collections`
3. The MCP server should provide direct access to your Firebase data

## Troubleshooting

If the MCP server doesn't work:

1. **Restart VS Code** - MCP servers load on startup
2. **Check authentication**: Run `firebase login:list`
3. **Verify project**: Run `firebase projects:list`
4. **Check settings**: Ensure `.vscode/settings.json` is correctly formatted

## Related Documentation

- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [MCP Documentation](https://modelcontextprotocol.io/)
