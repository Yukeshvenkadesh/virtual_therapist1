# MongoDB Setup Guide

## Quick Fix for the Connection Error

The error `querySrv EBADNAME _mongodb._tcp.<cluster-url>` means your `.env` file still has placeholder values instead of your actual MongoDB Atlas connection string.

## Steps to Fix

### 1. Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Select your cluster (or create one if you don't have one)
4. Click **"Connect"** button
5. Choose **"Connect your application"**
6. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 2. Update Your .env File

Open `.env` file in the project root and update the `MONGODB_URI` line:

**Before (placeholder):**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/virtual_therapist?retryWrites=true&w=majority
```

**After (your actual connection string):**
```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/virtual_therapist?retryWrites=true&w=majority
```

**Important:**
- Replace `<username>` with your MongoDB Atlas username
- Replace `<password>` with your MongoDB Atlas password
- Replace `<cluster-url>` with your actual cluster URL (e.g., `cluster0.xxxxx.mongodb.net`)
- Make sure to include `/virtual_therapist` before the `?` to specify the database name

### 3. Verify Your Connection String Format

Your connection string should look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/virtual_therapist?retryWrites=true&w=majority
```

### 4. Restart the Backend

After updating `.env`, restart your backend:
```bash
cd backend
npm run dev
```

## If You Don't Have MongoDB Atlas

### Option 1: Create Free MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for free (M0 cluster is free forever)
3. Create a cluster (takes ~5 minutes)
4. Create a database user
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get your connection string as described above

### Option 2: Use Local MongoDB

If you have MongoDB installed locally:

1. Update `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/virtual_therapist
   ```

2. Make sure MongoDB is running:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

## Security Notes

⚠️ **Never commit your `.env` file to git!** It contains sensitive credentials.

The `.env` file is already in `.gitignore`, so you're safe.

## Troubleshooting

### Error: "querySrv EBADNAME"
- **Cause**: Placeholder values in MONGODB_URI
- **Fix**: Update `.env` with actual MongoDB Atlas connection string

### Error: "Authentication failed"
- **Cause**: Wrong username/password
- **Fix**: Verify credentials in MongoDB Atlas → Database Access

### Error: "IP not whitelisted"
- **Cause**: Your IP address is not allowed
- **Fix**: Go to MongoDB Atlas → Network Access → Add IP Address (or use 0.0.0.0/0 for development)

### Error: "Connection timeout"
- **Cause**: Network/firewall issues
- **Fix**: Check your internet connection and firewall settings

## Testing the Connection

After updating `.env`, test the connection:

```bash
cd backend
npm run dev
```

You should see:
```
[auth_service] Connected to MongoDB
[auth_service] Listening on 4000
```

If you see errors, check the error message - it will now provide more helpful information about what's wrong.




