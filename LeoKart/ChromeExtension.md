# Chrome Extension for WebXR to OpenXR Communication

This document outlines the WebXR-OpenXR Bridge system that enables WebXR applications to communicate with the OpenXR runtime through a Chrome extension and Windows message passing.

## Architecture Overview

```
WebXR Application → Chrome Extension → Native Messaging Host → Windows Messages → OpenXR Runtime
                 ←                    ←                      ←                   ←
```

The system uses bidirectional communication allowing both GET and SET operations for OpenXR runtime settings.

## Current Implementation

### Core Components

1. **Chrome Extension**: Injects the `WebXROpenXRBridge` API and handles communication with the native messaging host
2. **Native Messaging Host** (`openxr-bridge.exe`): Translates between JSON messages and Windows messages
3. **Windows Message System**: Direct communication with the OpenXR runtime via window messages
4. **OpenXR Runtime**: Receives and responds to setting changes and queries

### Why This Architecture

Chrome's security model requires this multi-component approach:

1. **Browser Sandbox Limitations**: Web applications cannot directly access system resources or communicate with native applications
2. **Security Boundary Crossing**: The extension serves as a controlled gateway between web content and native code
3. **JavaScript API Injection**: The extension injects the `WebXROpenXRBridge` API into web pages
4. **Permission Management**: The extension handles authorization for OpenXR setting modifications
5. **Protocol Translation**: Converts between JavaScript API calls and Windows messages expected by the runtime

## Implementation Details

### Extension Structure

```
extension/
├── manifest.json          # Extension manifest (v3)
├── background.js          # Background service worker
├── content-script.js      # Content script injected into pages
├── webxr-api.js           # WebXR API implementation
└── icons/                 # Extension icons
```

### Native Messaging Host

```
native-messaging-host/
├── openxr-bridge.exe              # Compiled native host
├── com.openxr.bridge.json         # Native messaging manifest
└── OpenXRMessages.h               # Message definitions
```

## JavaScript API

### Available Methods

The extension provides the `window.WebXROpenXRBridge` object with the following methods:

```javascript
// Settings with GET/SET support
WebXROpenXRBridge.getIPDScale()                    // Returns Promise<number>
WebXROpenXRBridge.setIPDScale(value)               // Returns Promise<void>

WebXROpenXRBridge.getSceneScale()                  // Returns Promise<number>
WebXROpenXRBridge.setSceneScale(value)             // Returns Promise<void>

WebXROpenXRBridge.getParallaxStrength()            // Returns Promise<number>
WebXROpenXRBridge.setParallaxStrength(value)       // Returns Promise<void>

WebXROpenXRBridge.getProjectionMethod()            // Returns Promise<number> (0=camera, 1=display)
WebXROpenXRBridge.setProjectionMethod(value)       // Returns Promise<void>

WebXROpenXRBridge.getConvergence()                 // Returns Promise<number>
WebXROpenXRBridge.setConvergence(value)            // Returns Promise<void>

WebXROpenXRBridge.getPerspectiveFactor()           // Returns Promise<number>
WebXROpenXRBridge.setPerspectiveFactor(value)      // Returns Promise<void>

WebXROpenXRBridge.getControlMode()                 // Returns Promise<number> (0=FirstPerson, 1=Fly)
WebXROpenXRBridge.setControlMode(value)            // Returns Promise<void>

// Pose control
WebXROpenXRBridge.getHeadPose()                    // Returns Promise<PoseObject>
WebXROpenXRBridge.setHeadPose(poseObject)          // Returns Promise<void>

WebXROpenXRBridge.getLeftHandPose()                // Returns Promise<PoseObject>
WebXROpenXRBridge.setLeftHandPose(poseObject)      // Returns Promise<void>

WebXROpenXRBridge.getRightHandPose()               // Returns Promise<PoseObject>
WebXROpenXRBridge.setRightHandPose(poseObject)     // Returns Promise<void>

// Utility
WebXROpenXRBridge.resetSettings()                  // Returns Promise<void>
```

### Pose Object Format

```javascript
const poseObject = {
    position: {
        x: 0.0,    // meters
        y: 1.75,   // meters (height)
        z: 0.0     // meters
    },
    orientation: {
        x: 0.0,    // quaternion x
        y: 0.0,    // quaternion y
        z: 0.0,    // quaternion z
        w: 1.0     // quaternion w
    }
};
```

## Usage Examples

### Basic Settings Control

```javascript
// Check if the bridge is available
if (window.WebXROpenXRBridge) {
    console.log("OpenXR Bridge extension detected!");
    
    try {
        // Get current IPD scale
        const currentIPD = await WebXROpenXRBridge.getIPDScale();
        console.log("Current IPD scale:", currentIPD);
        
        // Set new IPD scale
        await WebXROpenXRBridge.setIPDScale(0.8);
        console.log("IPD scale updated successfully");
        
        // Switch to display-centric projection
        await WebXROpenXRBridge.setProjectionMethod(1);
        
        // Set scene scale
        await WebXROpenXRBridge.setSceneScale(1.2);
        
    } catch (error) {
        console.error("Failed to modify OpenXR settings:", error);
    }
} else {
    console.log("OpenXR Bridge extension not found");
}
```

### Head Pose Control

```javascript
// Set a specific head pose
const headPose = {
    position: { x: 0.0, y: 1.75, z: 0.0 },
    orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 }
};

try {
    await WebXROpenXRBridge.setHeadPose(headPose);
    console.log("Head pose updated");
    
    // Get current head pose
    const currentPose = await WebXROpenXRBridge.getHeadPose();
    console.log("Current head pose:", currentPose);
    
} catch (error) {
    console.error("Head pose operation failed:", error);
}
```

### Settings Panel Implementation

```javascript
// Create a settings panel that syncs with runtime
class OpenXRSettingsPanel {
    constructor() {
        this.initializeUI();
        this.startPolling();
    }
    
    async initializeUI() {
        try {
            // Get current values and populate UI
            const ipd = await WebXROpenXRBridge.getIPDScale();
            document.getElementById('ipdSlider').value = ipd;
            
            const scene = await WebXROpenXRBridge.getSceneScale();
            document.getElementById('sceneSlider').value = scene;
            
            const projection = await WebXROpenXRBridge.getProjectionMethod();
            document.getElementById('projectionToggle').checked = projection === 1;
            
        } catch (error) {
            console.error("Failed to initialize settings:", error);
        }
    }
    
    async onIPDChange(value) {
        try {
            await WebXROpenXRBridge.setIPDScale(parseFloat(value));
        } catch (error) {
            console.error("Failed to set IPD:", error);
        }
    }
    
    // Poll for changes made externally
    startPolling() {
        setInterval(async () => {
            try {
                const currentValues = await Promise.all([
                    WebXROpenXRBridge.getIPDScale(),
                    WebXROpenXRBridge.getSceneScale(),
                    WebXROpenXRBridge.getProjectionMethod()
                ]);
                
                // Update UI if values changed
                this.updateUI(currentValues);
                
            } catch (error) {
                // Runtime might not be available
            }
        }, 1000);
    }
}
```

## Windows Message Protocol

### Message Flow

1. **JavaScript Call**: `WebXROpenXRBridge.setIPDScale(0.8)`
2. **Extension Processing**: Content script receives message, forwards to background script
3. **Native Host**: Background script sends JSON to native messaging host
4. **Windows Message**: Native host sends `OPENXR_MESSAGE_SET_IPD_SCALE` to runtime window
5. **Runtime Processing**: OpenXR runtime processes the setting change
6. **Response**: Runtime sends response back through the same chain

### Supported Messages

```cpp
// Settings messages
OPENXR_MESSAGE_GET_IPD_SCALE / OPENXR_MESSAGE_SET_IPD_SCALE
OPENXR_MESSAGE_GET_SCENE_SCALE / OPENXR_MESSAGE_SET_SCENE_SCALE
OPENXR_MESSAGE_GET_PROJECTIONMETHOD / OPENXR_MESSAGE_SET_PROJECTIONMETHOD
OPENXR_MESSAGE_GET_CONTROLMODE / OPENXR_MESSAGE_SET_CONTROLMODE
OPENXR_MESSAGE_GET_PARALLAXSTRENGTH / OPENXR_MESSAGE_SET_PARALLAXSTRENGTH
OPENXR_MESSAGE_GET_CONVERGENCE / OPENXR_MESSAGE_SET_CONVERGENCE
OPENXR_MESSAGE_GET_PERSPECTIVEFACTOR / OPENXR_MESSAGE_SET_PERSPECTIVEFACTOR

// Pose messages
OPENXR_MESSAGE_GET_HEADPOSE_POSITION / OPENXR_MESSAGE_SET_HEADPOSE_POSITION
OPENXR_MESSAGE_GET_HEADPOSE_ORIENTATION / OPENXR_MESSAGE_SET_HEADPOSE_ORIENTATION
OPENXR_MESSAGE_GET_LEFTHANDPOSE_POSITION / OPENXR_MESSAGE_SET_LEFTHANDPOSE_POSITION
OPENXR_MESSAGE_GET_LEFTHANDPOSE_ORIENTATION / OPENXR_MESSAGE_SET_LEFTHANDPOSE_ORIENTATION
OPENXR_MESSAGE_GET_RIGHTHANDPOSE_POSITION / OPENXR_MESSAGE_SET_RIGHTHANDPOSE_POSITION
OPENXR_MESSAGE_GET_RIGHTHANDPOSE_ORIENTATION / OPENXR_MESSAGE_SET_RIGHTHANDPOSE_ORIENTATION

// Control messages
OPENXR_MESSAGE_RESET_SETTINGS
OPENXR_MESSAGE_CLIENT_JOINING / OPENXR_MESSAGE_CLIENT_LEAVING
OPENXR_MESSAGE_SERVER_JOINING / OPENXR_MESSAGE_SERVER_LEAVING
```

## Installation and Deployment

### Extension Publication

1. **Chrome Web Store**: The extension is published with ID `kbhoohhidfimoheieoibjlecmkcodipm`
2. **Automatic Installation**: Users install from the Chrome Web Store
3. **No Manual Configuration**: All setup is handled automatically

### Runtime Integration

The OpenXR runtime installer handles:

1. **Native Host Installation**: Copies `openxr-bridge.exe` to appropriate location
2. **Registry Configuration**: Sets up native messaging host registry entries
3. **Manifest Creation**: Generates `com.openxr.bridge.json` with correct paths
4. **Extension Reference**: Provides users with extension installation link

### Registry Setup

```
HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.openxr.bridge
Default = "C:\Path\To\com.openxr.bridge.json"
```

## Error Handling

### Common Scenarios

```javascript
try {
    await WebXROpenXRBridge.setIPDScale(0.8);
} catch (error) {
    switch (error.message) {
        case 'No active OpenXR session':
            console.log("OpenXR runtime not running");
            break;
        case 'Request timed out':
            console.log("Communication timeout");
            break;
        case 'Extension not installed':
            console.log("Please install the WebXR-OpenXR Bridge extension");
            break;
        default:
            console.error("Unexpected error:", error.message);
    }
}
```

### Best Practices

1. **Check Availability**: Always verify `window.WebXROpenXRBridge` exists before use
2. **Handle Timeouts**: Implement proper timeout handling for all API calls
3. **Graceful Degradation**: Provide fallback behavior when the bridge is unavailable
4. **Error User Feedback**: Inform users when OpenXR features require the extension

## Security Considerations

### Current Safeguards

1. **Extension Permissions**: Limited to registered extension ID in native messaging manifest
2. **Value Validation**: Native host validates setting ranges and formats
3. **Session Verification**: Checks for active OpenXR runtime before processing requests
4. **Timeout Protection**: All requests have timeout limits to prevent hanging
5. **Error Reporting**: Comprehensive error messages help identify issues without exposing system details

### Security Best Practices

1. **Input Validation**: Always validate values before sending to the bridge
2. **Rate Limiting**: Avoid rapid-fire setting changes that could overwhelm the runtime
3. **User Consent**: Consider requiring user permission for sensitive operations
4. **Value Clamping**: Implement reasonable min/max limits in your application
5. **Error Handling**: Don't expose internal system information in error messages

## Advanced Features

### Real-time Monitoring

```javascript
// Monitor settings changes in real-time
class OpenXRMonitor {
    constructor() {
        this.lastValues = {};
        this.startMonitoring();
    }
    
    async startMonitoring() {
        setInterval(async () => {
            try {
                const current = {
                    ipd: await WebXROpenXRBridge.getIPDScale(),
                    scene: await WebXROpenXRBridge.getSceneScale(),
                    projection: await WebXROpenXRBridge.getProjectionMethod()
                };
                
                // Check for changes
                for (const [key, value] of Object.entries(current)) {
                    if (this.lastValues[key] !== value) {
                        this.onSettingChanged(key, value, this.lastValues[key]);
                    }
                }
                
                this.lastValues = current;
                
            } catch (error) {
                this.onError(error);
            }
        }, 500); // Poll every 500ms
    }
    
    onSettingChanged(setting, newValue, oldValue) {
        console.log(`${setting} changed from ${oldValue} to ${newValue}`);
        // Update UI, trigger events, etc.
    }
    
    onError(error) {
        console.error("Monitoring error:", error);
    }
}
```

### Settings Persistence

```javascript
// Save and restore application-specific settings
class SettingsManager {
    constructor(appName) {
        this.appName = appName;
        this.storageKey = `openxr-settings-${appName}`;
    }
    
    async saveCurrentSettings() {
        try {
            const settings = {
                ipd: await WebXROpenXRBridge.getIPDScale(),
                scene: await WebXROpenXRBridge.getSceneScale(),
                projection: await WebXROpenXRBridge.getProjectionMethod(),
                parallax: await WebXROpenXRBridge.getParallaxStrength(),
                convergence: await WebXROpenXRBridge.getConvergence()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
            console.log("Settings saved for", this.appName);
            
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    }
    
    async restoreSettings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return false;
            
            const settings = JSON.parse(saved);
            
            await Promise.all([
                WebXROpenXRBridge.setIPDScale(settings.ipd),
                WebXROpenXRBridge.setSceneScale(settings.scene),
                WebXROpenXRBridge.setProjectionMethod(settings.projection),
                WebXROpenXRBridge.setParallaxStrength(settings.parallax),
                WebXROpenXRBridge.setConvergence(settings.convergence)
            ]);
            
            console.log("Settings restored for", this.appName);
            return true;
            
        } catch (error) {
            console.error("Failed to restore settings:", error);
            return false;
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **Extension Not Found**: User needs to install the Chrome extension
2. **Runtime Not Running**: OpenXR runtime must be active for communication
3. **Permission Denied**: Ensure native messaging host is properly registered
4. **Timeout Errors**: Check if runtime is responsive and not overloaded
5. **Invalid Values**: Verify setting values are within acceptable ranges

### Debugging Tools

1. **Chrome DevTools**: Check console for extension-related errors
2. **Extension Logging**: Enable verbose logging in `webxr-api.js`
3. **Native Host Logs**: Check logs in `%LOCALAPPDATA%\OpenXR\openxr-bridge.log`
4. **Runtime Logs**: Monitor OpenXR runtime logs for message processing

This system provides a robust, bidirectional communication channel between WebXR applications and the OpenXR runtime, enabling rich integration and control capabilities while maintaining security through Chrome's extension architecture. 