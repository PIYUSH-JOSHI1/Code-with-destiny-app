# 🚀 Deployment Guide - Code with Destiny

## **Deployment Platforms**
- **Frontend:** Vercel
- **Backend:** Render.com
- **Email:** EmailJS
- **Payments:** Razorpay

---

## **PART 1: Deploy Backend to Render**

### **Step 1: Prepare Backend**

Files already updated:
- ✅ `backend/requirements.txt` - Added gunicorn
- ✅ `backend/.env` - Set to production
- ✅ `backend/render.yaml` - Render configuration

### **Step 2: Create GitHub Repository**

```bash
# Initialize git in your project root
git init
git add .
git commit -m "Initial commit - Code with Destiny"

# Create repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/book-website.git
git branch -M main
git push -u origin main
```

### **Step 3: Deploy to Render**

1. Go to https://render.com/
2. Sign up with GitHub
3. Click **New → Web Service**
4. Select your GitHub repository
5. Configure:
   - **Name:** `code-with-destiny-api`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free

6. Add Environment Variables:
   ```
   RAZORPAY_KEY_ID=rzp_test_RqiiBVZnaNY7wy
   RAZORPAY_KEY_SECRET=SLsQgd3D0f6T2KGrfdxsTOSZ
   BOOK_DRIVE_LINK=https://drive.google.com/file/d/1lBH-fdCcyfp6_ZUpph6nviZklm5d3Mwt/view?usp=drive_link
   FLASK_ENV=production
   FLASK_DEBUG=False
   SECRET_KEY=your-super-secret-key-here
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```

7. Click **Create Web Service**
8. Wait for deployment (5-10 minutes)
9. **Copy the URL** - looks like: `https://code-with-destiny-api.onrender.com`

---

## **PART 2: Deploy Frontend to Vercel**

### **Step 1: Prepare Frontend**

1. Update `script.js` with your Render backend URL:

```javascript
// Line 10 in script.js - Replace with your Render URL
const API_URL = 'https://code-with-destiny-api.onrender.com';
```

2. Commit changes:
```bash
git add .
git commit -m "Update backend URL for production"
git push
```

### **Step 2: Deploy to Vercel**

1. Go to https://vercel.com/
2. Sign up with GitHub
3. Click **Import Project**
4. Select your GitHub repository
5. Configure:
   - **Framework:** Next.js (or leave blank for static)
   - **Root Directory:** `.` (root)
   - **Build Command:** (leave blank)
   - **Output Directory:** (leave blank)

6. Click **Deploy**
7. Wait for deployment (2-5 minutes)
8. **Get your Vercel URL** - looks like: `https://your-project.vercel.app`

---

## **PART 3: Update Backend with Frontend URL**

Once Vercel deploys:

1. Go to Render Dashboard
2. Select your service
3. Go to **Environment**
4. Update: `FRONTEND_URL=https://your-vercel-url.vercel.app`
5. **Save** (auto-redeploys)

---

## **PART 4: Test Live Deployment**

1. Open your Vercel URL: `https://your-project.vercel.app`
2. Test free purchase:
   - Fill form with Amount: 0
   - Click "Get the Book"
   - Check email for book link ✅

3. Test paid purchase:
   - Fill form with Amount: 99
   - Razorpay modal opens
   - Use test card: `4111 1111 1111 1111`
   - Check email ✅

---

## **Files to Deploy**

### **For Vercel (Frontend):**
```
/
├── index.html
├── styles.css
├── script.js
├── public/
│   └── images/
│       ├── 1.png
│       ├── 2.png
│       ├── 3.png
│       └── 4.png
├── .gitignore
└── README.md (optional)
```

### **For Render (Backend):**
```
/backend/
├── app.py
├── requirements.txt
├── .env (with production values)
├── render.yaml
├── orders.db (auto-created)
└── .gitignore
```

---

## **Important Notes**

⚠️ **Before Final Deployment:**

1. **Test locally first** - ensure everything works on localhost
2. **Use Razorpay Test Keys** - start with rzp_test_* keys
3. **Never commit .env** - keep secrets safe
4. **Update URLs** - after getting Render & Vercel URLs
5. **Monitor logs** - check Render dashboard for errors

---

## **Troubleshooting**

### **Backend not responding**
- Check Render logs (Dashboard → Logs)
- Verify environment variables set
- Check FLASK_ENV is `production`

### **Email not sending**
- Verify EmailJS template has correct parameters
- Check EmailJS service is connected to Gmail
- Verify Public Key in script.js

### **Payment not verifying**
- Check Razorpay Key ID and Secret in backend
- Verify signature verification logic
- Check backend logs for errors

---

## **Live URLs After Deployment**

Once deployed, update these:

**In script.js:**
```javascript
const API_URL = 'https://your-app-name.onrender.com';
```

**In backend/.env:**
```
FRONTEND_URL=https://your-project.vercel.app
```

---

**You're live! 🎉**
