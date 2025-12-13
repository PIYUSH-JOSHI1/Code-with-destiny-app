# 🚀 Code with Destiny - Production Setup Guide

## Complete Step-by-Step Setup

### **Phase 1: Get Razorpay Credentials**

1. Go to https://razorpay.com/
2. Click "Sign Up" or "Dashboard"
3. Create account with email
4. Complete KYC verification
5. Go to **Settings → API Keys**
6. You'll see two keys:
   - **Key ID** (public key) - starts with `rzp_test_` or `rzp_live_`
   - **Key Secret** (private key) - keep this secret!

**For Testing:** Use Test Mode (you'll see test keys starting with `rzp_test_`)
**For Live:** Switch to Live Mode when ready

---

## **Phase 2: Setup Python Backend**

### **Step 1: Install Python**

**Windows:**
1. Download from https://www.python.org/downloads/
2. Run installer
3. ✅ Check "Add Python to PATH"
4. Click Install

**Verify installation:**
```bash
python --version
pip --version
```

---

### **Step 2: Navigate to Backend Folder**

Open PowerShell and run:

```bash
cd "C:\Users\Piyush\Downloads\book-website-with-effects\backend"
```

---

### **Step 3: Create Virtual Environment**

```bash
python -m venv venv
```

**Activate it:**

```bash
.\venv\Scripts\Activate.ps1
```

You should see `(venv)` at the start of your terminal line.

---

### **Step 4: Install Dependencies**

```bash
pip install -r requirements.txt
```

Wait for all packages to install.

---

### **Step 5: Configure .env File**

1. Open `backend\.env` in VS Code
2. Replace with your actual values:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_xxxxxxxxxxxx
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-super-secret-key-change-in-production
FRONTEND_URL=http://localhost:5000
```

**Get your keys from:** https://dashboard.razorpay.com/app/settings/api-keys

---

### **Step 6: Start Backend Server**

```bash
python app.py
```

You should see:
```
🚀 Starting Code with Destiny Backend...
💻 Server running on http://localhost:5000
```

**Keep this terminal open!** Don't close it.

---

## **Phase 3: Test the Setup**

### **Open Another PowerShell/Terminal**

Test the backend is running:

```bash
curl http://localhost:5000/
```

You should see:
```json
{
  "status": "success",
  "message": "Code with Destiny Backend API",
  "version": "1.0.0"
}
```

---

## **Phase 4: Update Frontend URL**

In `script.js`, update the backend URL if needed:

```javascript
// Currently set to:
const API_URL = 'http://localhost:5000';
```

---

## **Phase 5: Test Payment Flow**

1. Open your website in browser: `http://localhost/` (or wherever you're hosting the frontend)
2. Scroll to "Get the Book" section
3. Fill form:
   - Name: Test User
   - Email: test@example.com
   - WhatsApp: +91 9999999999
   - Amount: ₹99 (or click Free)
4. Click "Get the Book"

**For Free Purchase:**
- Should show success immediately

**For Paid Purchase:**
- Razorpay modal opens
- Click on payment method
- Use Test Card: `4111 1111 1111 1111`
- Any future date for expiry
- Any 3-digit CVV
- Click Pay
- Payment succeeds!

---

## **Phase 6: Check Database**

Backend creates `orders.db` automatically. To view orders:

```bash
# Install sqlite3 browser (optional)
# Or use Python to check:
python -c "import sqlite3; conn = sqlite3.connect('orders.db'); c = conn.cursor(); c.execute('SELECT * FROM orders'); print(c.fetchall())"
```

---

## **Phase 7: Deployment to Production**

When ready to go live:

### **7A. Use Live Razorpay Keys**
- Switch from Test to Live mode in Razorpay
- Update `.env` with live keys (starting with `rzp_live_`)

### **7B. Deploy Backend**

Options:
1. **Heroku** (easiest for beginners)
2. **AWS EC2**
3. **DigitalOcean**
4. **Your own server**

**For Heroku:**
```bash
heroku login
heroku create your-app-name
git push heroku main
```

### **7C: Update Frontend URL**
```javascript
const API_URL = 'https://your-app-name.herokuapp.com';
```

### **7D: Setup Email Service**
Current setup just logs emails. For production:
- Use SendGrid, Mailgun, or Gmail SMTP
- Update `send_email()` function in `app.py`

---

## **Troubleshooting**

### **Port 5000 Already in Use**
```bash
# Kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in app.py:
app.run(port=5001)
```

### **Module Not Found Error**
```bash
# Make sure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall requirements
pip install -r requirements.txt
```

### **Razorpay Not Opening**
- Check browser console (F12)
- Verify Key ID is correct in `.env`
- Check CORS is enabled in Flask (it is)

### **Payment Not Verifying**
- Check Key Secret in `.env`
- Verify signature matching in backend logs
- Use same test credentials

---

## **API Endpoints Reference**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/orders/create` | Create new order |
| POST | `/api/payments/verify` | Verify payment signature |
| GET | `/api/orders/<id>` | Get order details |
| POST | `/api/send-book` | Send book to user |

---

## **Important Security Notes**

⚠️ **Never share your Key Secret!**
- Don't commit `.env` to Git
- Don't expose it in frontend code
- Always verify signatures on backend

---

## **Next Steps**

1. ✅ Setup complete
2. Test with test credentials
3. Get approved for live keys
4. Deploy to production
5. Monitor orders in database

---

## **Contact Support**

- Razorpay Docs: https://razorpay.com/docs/
- Flask Docs: https://flask.palletsprojects.com/
- Report Issues: Check console logs (F12)

---

**Happy selling!** 📚✨
