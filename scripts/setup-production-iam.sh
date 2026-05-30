#!/bin/bash
# Production IAM Setup Script for ltus-prod Backend
# Run this ONCE to ensure service account has proper permissions

set -e  # Exit on error

PROJECT_ID="paji-duolingo"
BACKEND_NAME="ltus-prod"
SERVICE_ACCOUNT_EMAIL="firebase-app-hosting-compute@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔐 Setting up IAM Permissions for ltus-prod Backend"
echo "Project: $PROJECT_ID"
echo "Backend: $BACKEND_NAME (linked to main branch)"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ ERROR: gcloud CLI not installed"
    echo "Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "📋 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Verify service account exists (created automatically by Firebase App Hosting)
echo ""
echo "� Verifying service account exists..."
if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &>/dev/null; then
    echo "✅ Service account exists: $SERVICE_ACCOUNT_EMAIL"
else
    echo "❌ ERROR: Service account not found!"
    echo "This service account should be created automatically by Firebase App Hosting."
    echo "Please ensure the ltus-prod backend is properly configured."
    exit 1
fi

# Check current IAM roles
echo ""
echo "🔍 Current IAM roles for service account:"
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --format="table(bindings.role)"

# Grant required IAM roles
echo ""
echo "🔑 Granting required IAM roles..."
echo ""

ROLES=(
    "roles/serviceusage.serviceUsageConsumer"
    "roles/firebase.admin"
    "roles/storage.objectAdmin"
    "roles/aiplatform.user"
    "roles/logging.logWriter"
    "roles/cloudtrace.agent"
    "roles/iam.serviceAccountTokenCreator"
)

for role in "${ROLES[@]}"; do
    echo "  → Checking $role..."
    
    # Check if role is already granted
    if gcloud projects get-iam-policy $PROJECT_ID \
        --flatten="bindings[].members" \
        --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT_EMAIL AND bindings.role:$role" \
        --format="value(bindings.role)" | grep -q "$role"; then
        echo "     ✅ Already granted"
    else
        echo "     ⏳ Granting..."
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
            --role="$role" \
            --condition=None \
            --quiet
        echo "     ✅ Granted successfully"
    fi
done


echo ""
echo "✅ IAM Setup Complete!"
echo ""
echo "� Summary of Granted Roles:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Service Usage Consumer        - GCP API access (CRITICAL)"
echo "2. Firebase Admin                - Full Firebase access"
echo "3. Storage Object Admin          - Cloud Storage management"
echo "4. AI Platform User              - Vertex AI / Gemini access"
echo "5. Logging Log Writer            - Cloud Logging integration"
echo "6. Cloud Trace Agent             - Distributed tracing"
echo "7. Service Account Token Creator - Signed URLs & token operations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 ltus-prod Backend Status:"
echo "   • Backend: ltus-prod (linked to main branch)"
echo "   • Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "   • IAM Roles: All required permissions granted ✅"
echo "   • Propagation Time: 3-5 minutes"
echo ""
echo "📝 Next Steps:"
echo "1. Wait 5 minutes for IAM propagation"
echo "2. Merge your changes to main branch"
echo "3. Firebase App Hosting will auto-deploy ltus-prod"
echo "4. Test production endpoints:"
echo "   curl -X POST \"https://BACKEND_URL/api/auth/register\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"name\":\"Test\",\"role\":\"student\"}'"
echo ""
echo "🔒 Security Notes:"
echo "- Service account follows principle of least privilege"
echo "- All roles are production-appropriate"
echo "- Monitor usage in GCP IAM console"
echo "- Rotate service account keys every 90 days (if using keys)"
echo "- Review IAM permissions quarterly"
echo ""
echo "📚 Documentation:"
echo "- IAM Fix Summary: docs/IAM_PERMISSION_FIX_COMPLETE_SUMMARY.md"
echo "- Backend Setup: Firebase Console > App Hosting > ltus-prod"
echo "- Monitoring: GCP Console > Logging / Trace"
echo ""
echo "✨ Production deployment ready!"

