/**
 * Google Account Settings Page
 * 
 * Allows teachers to connect/disconnect their Google account for class scheduling.
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { GoogleConnectButton } from '@/components/teacher/google-connect-button';
import { GoogleConnectionStatus } from '@/components/teacher/google-connection-status';

function GoogleSettingsContent() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [showDeviceMismatchWarning, setShowDeviceMismatchWarning] = useState(false);

  // Handle OAuth callback success/error
  const success = searchParams?.get('success');
  const error = searchParams?.get('error');

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }

    checkConnectionStatus();
  }, [user, router, authLoading, token]);

  const checkConnectionStatus = async () => {
    setIsLoading(true);
    try {
      // Check connection status
      const statusResponse = await fetch('/api/google/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setIsConnected(data.connected);
        setConnectionStatus(data);

        // If connected, fetch device info
        if (data.connected) {
          const infoResponse = await fetch('/api/google/connection-info', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            setDeviceInfo(infoData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for device mismatch error from URL (could come from API errors)
  useEffect(() => {
    if (error === 'device_mismatch') {
      setShowDeviceMismatchWarning(true);
    }
  }, [error]);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account? This will prevent you from scheduling new classes.')) {
      return;
    }

    try {
      const response = await fetch('/api/google/disconnect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsConnected(false);
        setConnectionStatus(null);
        window.location.href = '/teacher/settings/google?success=disconnected';
      } else {
        alert('Failed to disconnect Google account. Please try again.');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Show loading while auth is initializing or checking connection status
  if (authLoading || isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Google Account Settings</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Google Account Settings</h1>

      {/* Success Alert */}
      {success === 'true' && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Connected Successfully</AlertTitle>
          <AlertDescription className="text-green-700">
            Your Google account has been connected. You can now schedule classes with Google Meet.
          </AlertDescription>
        </Alert>
      )}

      {success === 'disconnected' && (
        <Alert className="mb-6 border-blue-500 bg-blue-50">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Disconnected</AlertTitle>
          <AlertDescription className="text-blue-700">
            Your Google account has been disconnected.
          </AlertDescription>
        </Alert>
      )}

      {/* Device Mismatch Warning */}
      {showDeviceMismatchWarning && deviceInfo?.lastDevice && (
        <Alert className="mb-6 border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Device Changed - Reconnection Required</AlertTitle>
          <AlertDescription className="text-orange-700 space-y-3">
            <p>
              Your Google account was authorized on a different device and cannot be used from this device due to security restrictions.
            </p>
            <div className="bg-orange-100 p-3 rounded border border-orange-200">
              <p className="font-medium mb-1">Last connected from:</p>
              <ul className="text-sm space-y-1">
                <li>🌐 <strong>Browser:</strong> {deviceInfo.lastDevice.browser}</li>
                <li>💻 <strong>OS:</strong> {deviceInfo.lastDevice.os}</li>
                <li>📍 <strong>IP:</strong> {deviceInfo.lastDevice.ipPrefix}</li>
                <li>🕒 <strong>Connected:</strong> {new Date(deviceInfo.lastDevice.connectedAt).toLocaleString()}</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  // Auto disconnect then redirect to reconnect
                  await handleDisconnect();
                  // Small delay to ensure disconnect completes
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                🔄 Quick Reconnect from This Device
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeviceMismatchWarning(false)}
              >
                Dismiss
              </Button>
            </div>
            <p className="text-xs mt-2">
              <strong>Note:</strong> This will disconnect your previous device and authorize this one. Only one device can be active at a time for security.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && error !== 'device_mismatch' && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
          <AlertDescription className="text-red-700">
            {error === 'access_denied' && 'You denied access to your Google account.'}
            {error === 'missing_parameters' && 'Missing required parameters. Please try again.'}
            {error === 'callback_failed' && 'Failed to process OAuth callback. Please try again.'}
            {error !== 'access_denied' && error !== 'missing_parameters' && error !== 'callback_failed' && 
              `An error occurred: ${error}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Google Calendar & Meet Integration</CardTitle>
          <CardDescription>
            Connect your Google account to schedule classes, create meetings, and manage recordings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Why connect your Google account?</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Schedule one-time or recurring classes with students</li>
                    <li>Auto-generate Google Meet links for video conferencing</li>
                    <li>Send calendar invites to students automatically</li>
                    <li>Store and manage class recordings in Google Drive</li>
                    <li>Start instant meetings with a single click</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <GoogleConnectButton userId={user?.id || ''} />

              <p className="text-sm text-muted-foreground">
                By connecting your Google account, you authorize DualLing to:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
                <li>Create and manage calendar events</li>
                <li>Access Google Drive files created by this app</li>
                <li>Create Google Meet conference links</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                You can disconnect at any time. We never access your emails or other Google services.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <GoogleConnectionStatus
                status={connectionStatus}
                onDisconnect={handleDisconnect}
              />

              {/* Show device info */}
              {deviceInfo?.legacy && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Legacy Connection Format</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>
                      Your connection was created before device tracking was enabled.
                      To enable device-aware security features, please reconnect your Google account.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          // Auto disconnect then redirect to reconnect
                          await handleDisconnect();
                          // Small delay to ensure disconnect completes
                          setTimeout(() => {
                            window.location.reload();
                          }, 1000);
                        }}
                      >
                        🔄 Quick Reconnect (Enable Device Tracking)
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will disconnect and prompt you to reconnect with enhanced security.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              {deviceInfo?.lastDevice && !deviceInfo?.legacy && (
                <div className="mt-4 p-4 bg-muted rounded-lg border">
                  <p className="text-sm font-medium mb-2">Connection Details:</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>🌐 <strong>Browser:</strong> {deviceInfo.lastDevice.browser}</p>
                    <p>💻 <strong>OS:</strong> {deviceInfo.lastDevice.os}</p>
                    <p>📍 <strong>IP:</strong> {deviceInfo.lastDevice.ipPrefix}</p>
                    <p>🕒 <strong>Last Used:</strong> {new Date(deviceInfo.lastDevice.lastUsedAt).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ℹ️ If you're using a different device or browser, you may need to reconnect.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>
            What you can do after connecting your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📅 Class Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Schedule classes with enrolled students or external participants. Support for one-time and recurring sessions.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🎥 Google Meet Integration</h3>
              <p className="text-sm text-muted-foreground">
                Auto-generate Meet links for every class. Start instant meetings with one click.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📧 Email Invitations</h3>
              <p className="text-sm text-muted-foreground">
                Students receive calendar invites automatically with meeting details and reminders.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">💾 Recording Management</h3>
              <p className="text-sm text-muted-foreground">
                Recordings saved to Google Drive with 30-day retention. Archive important sessions forever.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleSettingsPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Google Account Settings</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <GoogleSettingsContent />
    </Suspense>
  );
}
