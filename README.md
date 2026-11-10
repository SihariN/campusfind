# CampusFind 🎓

**A Full-Stack Campus Lost and Found Platform**

CampusFind is a web-based lost-and-found platform designed to help university students report lost belongings, discover found items, and reconnect lost possessions with their owners.

The platform provides a centralized space for managing lost-and-found reports, making it easier for students to find and recover their belongings.

🌐 **Live Demo:** https://campusfind-frontend-six.vercel.app/

📂 **GitHub Repository:** https://github.com/SihariN/campusfind

---

## ✨ Features

- **User Authentication** – User registration and secure login.
- **Lost and Found Reports** – Create and manage item reports.
- **Item Listings** – Browse available lost-and-found listings.
- **Image Uploads** – Upload item images using Cloudinary.
- **User Profiles** – Manage user account information.
- **Admin Dashboard** – Administrative access and listing management.
- **Database Integration** – Persistent storage using PostgreSQL.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React, JavaScript |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Image Storage | Cloudinary |
| Authentication | JWT |
| Version Control | Git, GitHub |
| Deployment | Vercel |

---

## 🏗️ System Architecture

CampusFind follows a frontend-backend architecture.

1. **Frontend:** Next.js provides the user interface and communicates with the backend through HTTP requests.
2. **Backend:** FastAPI handles application logic, authentication, and API operations.
3. **Database:** PostgreSQL stores user accounts and application data.
4. **Image Storage:** Cloudinary handles uploaded images.

```text
       User
        |
        v
  Next.js Frontend
        |
      REST API
        |
        v
   FastAPI Backend
      /       \
     v         v
PostgreSQL  Cloudinary
  Database   Image Storage
```

---

## 📁 Project Structure

```text
campusfind/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── models.py
│   │   ├── database.py
│   │   ├── auth.py
│   │   └── main.py
│   ├── requirements.txt
│   └── create_admin.py
│
├── .gitignore
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites

- Node.js
- Python 3.14
- PostgreSQL database
- Cloudinary account
- Git

### 1. Clone the repository

```bash
git clone https://github.com/SihariN/campusfind.git
cd campusfind
```

### 2. Configure the backend

```bash
cd backend
py -3.14 -m venv .venv
```

Activate the virtual environment:

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:

```env
DATABASE_URL=postgresql+psycopg://username:password@host/database
JWT_SECRET_KEY=your_secure_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend API documentation:

http://127.0.0.1:8000/docs

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Open:

http://localhost:3000

---

## 🔐 Environment Variables

The application requires environment variables for database connectivity, authentication, image storage, and frontend-backend communication.

**Never commit actual credentials, API keys, database passwords, or secret keys to GitHub.**

---

## 🚀 Deployment

CampusFind is deployed using Vercel.

- **Frontend:** https://campusfind-frontend-six.vercel.app/
- **Backend:** https://campusfind-gray.vercel.app/
- **API Documentation:** https://campusfind-gray.vercel.app/docs
- **Database Hosting:** Neon PostgreSQL
- **Image Storage:** Cloudinary

---

## 👩‍💻 Developer

**Sihari N. Sathyawardhana**

BSc (Hons) in IT and Management

GitHub: [@SihariN](https://github.com/SihariN)

---

*CampusFind — Helping campus communities reconnect with their belongings.*