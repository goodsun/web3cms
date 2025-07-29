# WalletConnect QR Code Debug Guide

## Enhanced Debugging Added

I've added comprehensive debugging to help diagnose why nothing happens when scanning the WalletConnect QR code. Here's what to check:

## 1. Initial Setup Verification

Open your browser's Developer Console (F12) and run:

```javascript
// Check Web3 configuration
debugWeb3State()
```

This will show:
- Whether WalletConnect is enabled in the configuration
- Available connectors
- Current connection state
- Any WalletConnect sessions in localStorage

## 2. Test WalletConnect Manually

Run this command in the console:

```javascript
// Test WalletConnect connection
testWalletConnect()
```

This will:
- Open the modal
- Show modal options
- Display if WalletConnect is enabled

## 3. Monitor Console Logs

When you click "Connect Wallet" and scan the QR code, look for these log patterns:

- 🚀 **Modal Creation**: Shows if WalletConnect is enabled
- 🔍 **WalletConnect Configuration**: Shows available connectors
- 📱 **Connector Setup**: Shows event listeners for each connector
- 🔵 **Modal Events**: All events from the modal
- 🟢 **WalletConnect Events**: Specific WalletConnect events
- 🔌 **Connection Changes**: When connections change

## 4. Common Issues and Solutions

### Issue: WalletConnect Not Enabled

Check the logs for:
```
🚀 Creating AppKit modal with config: {
    enableWalletConnect: false
}
```

**Solution**: Ensure your settings have `enableWalletConnect: true`

### Issue: No WalletConnect Connector

If you don't see a WalletConnect connector in the logs:
```
📱 Setting up listeners for connector: WalletConnect
```

**Possible causes**:
1. WalletConnect is disabled in config
2. Project ID is invalid
3. Network configuration issue

### Issue: QR Code Scans But Nothing Happens

Look for these events:
- Any 🟢 WalletConnect events
- Any 💬 message events from connectors
- Any error messages in console

## 5. Manual Debugging Steps

1. **Clear all wallet data**:
   ```javascript
   clearAuthStorage()
   disconnectWallet()
   ```

2. **Check current configuration**:
   ```javascript
   // Check if config is loaded properly
   const config = await window.Web3ConfigLoader.loadConfig()
   console.log('Web3 Config:', config)
   ```

3. **Verify Project ID**:
   - Go to Settings
   - Check that your Reown Project ID is valid
   - Ensure it's from https://cloud.reown.com

4. **Check Network**:
   - Ensure you're not behind a firewall blocking WebSocket connections
   - WalletConnect uses wss:// protocol for real-time communication

## 6. What to Report

If the issue persists, please share:

1. **Console output** when running `debugWeb3State()`
2. **All logs** that appear when clicking "Connect Wallet"
3. **Any error messages** in the console
4. **Network tab** - check for failed WebSocket connections
5. **Your mobile wallet app** - which wallet are you using?

## 7. Alternative Connection Methods

While debugging, you can try:
1. **Browser Extension Wallets** (MetaMask, etc.)
2. **Injected Wallets** (if your mobile wallet has a built-in browser)

## Technical Details

The enhanced logging tracks:
- Modal initialization with WalletConnect settings
- All connector registrations and events
- Specific WalletConnect protocol messages
- Connection state changes
- Storage of WalletConnect sessions

This should help identify where the connection process is failing.