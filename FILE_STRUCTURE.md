# Virtual Therapist - Complete File Structure

## Project Root
```
virtual_therapist/
├── 📄 README.md                          # Main project documentation
├── 📄 SETUP_GUIDE.md                     # Setup instructions
├── 📄 MODEL_INTEGRATION_GUIDE.md         # Model integration guide
├── 📄 HYBRID_MODEL_SETUP.md              # Hybrid model setup guide
├── 📄 FINAL_SUMMARY.md                   # Project summary
├── 📄 docker-compose.yml                 # Docker orchestration
├── 📄 package.json                       # Root package.json (Next.js)
├── 📄 package-lock.json                  # NPM lock file
├── 📄 pnpm-lock.yaml                     # PNPM lock file
├── 📄 tsconfig.json                      # TypeScript config
├── 📄 next.config.mjs                    # Next.js config
├── 📄 next-env.d.ts                      # Next.js types
├── 📄 postcss.config.mjs                 # PostCSS config
├── 📄 components.json                    # Components config
├── 📄 .env.example                       # Environment variables template
├── 📄 .gitignore                         # Git ignore rules
├── 📄 .gitattributes                     # Git attributes
├── 📄 setup-env.sh                       # Environment setup script
├── 📄 start-dev.sh                       # Development startup script
├── 📄 run-services.sh                    # Services runner script
├── 📄 test-services.sh                   # Service testing script
│
├── 📁 app/                               # Next.js app directory
│   ├── 📄 layout.tsx                     # Next.js layout
│   ├── 📄 page.tsx                       # Next.js page
│   └── 📄 globals.css                    # Global styles
│
├── 📁 backend/                           # Node.js/Express Backend
│   ├── 📄 server.js                      # Main server file
│   ├── 📄 package.json                   # Backend dependencies
│   ├── 📄 package-lock.json              # NPM lock file
│   │
│   ├── 📁 routes/                        # API Routes
│   │   ├── 📄 auth.js                    # Authentication routes
│   │   ├── 📄 patients.js                # Patient management routes
│   │   └── 📄 sessions.js                # Session management routes
│   │
│   ├── 📁 models/                        # MongoDB Models
│   │   ├── 📄 User.js                    # User model
│   │   ├── 📄 Patient.js                 # Patient model
│   │   └── 📄 UserSession.js             # User session model
│   │
│   ├── 📁 middleware/                    # Express Middleware
│   │   └── 📄 auth.js                    # JWT authentication middleware
│   │
│   ├── 📁 analysis_service/              # Legacy analysis service (Flask)
│   │   ├── 📄 app.py                     # Flask application
│   │   ├── 📄 hybrid_model.py            # Hybrid model implementation
│   │   ├── 📄 requirements.txt           # Python dependencies
│   │   ├── 📄 Procfile                   # Heroku deployment config
│   │   ├── 📄 .env                       # Environment variables
│   │   ├── 📄 test_hybrid.py             # Hybrid model tests
│   │   ├── 📄 test_model.py              # Model tests
│   │   ├── 📄 save_hybrid_model.py       # Model saving script
│   │   ├── 📄 upload_hybrid_model.py     # Model upload script
│   │   ├── 📄 upload_model.py            # Model upload script
│   │   │
│   │   ├── 📁 model/                     # Model directory
│   │   │   └── 📄 README.md              # Model README
│   │   │
│   │   └── 📁 models/                    # Models directory
│   │       ├── 📄 README.md              # Models README
│   │       └── 📄 xgboost_classifier.json # XGBoost model file
│   │
│   └── 📁 auth_service/                  # Empty directory (placeholder)
│
├── 📁 frontend/                          # React Frontend (Vite)
│   ├── 📄 package.json                   # Frontend dependencies
│   ├── 📄 package-lock.json              # NPM lock file
│   ├── 📄 vite.config.js                 # Vite configuration
│   ├── 📄 postcss.config.mjs             # PostCSS config
│   ├── 📄 Dockerfile                     # Frontend Dockerfile
│   ├── 📄 index.html                     # HTML entry point
│   ├── 📄 .env                           # Environment variables
│   ├── 📄 .env.local                     # Local environment variables
│   │
│   ├── 📁 public/                        # Static assets
│   │   └── 📄 logo.png                   # Application logo
│   │
│   └── 📁 src/                           # Source code
│       ├── 📄 main.jsx                   # React entry point
│       ├── 📄 App.jsx                    # Main App component
│       ├── 📄 App.css                    # Application styles
│       │
│       └── 📁 components/                # React Components
│           ├── 📄 Header.jsx             # Header component
│           ├── 📄 IndividualView.jsx     # Individual user view
│           ├── 📄 PsychologistView.jsx   # Professional view
│           ├── 📄 Login.jsx              # Login component
│           ├── 📄 Dashboard.jsx          # Dashboard component
│           ├── 📄 ResultCard.jsx         # Result card component
│           └── 📄 ConfidenceChart.jsx    # Confidence chart component
│
├── 📁 model_service/                     # Python FastAPI Model Service
│   ├── 📄 app.py                         # FastAPI application
│   ├── 📄 hybrid_model.py                # Hybrid model implementation
│   ├── 📄 simple_app.py                  # Simple Flask app (alternative)
│   ├── 📄 requirements.txt               # Python dependencies
│   ├── 📄 Dockerfile                     # Model service Dockerfile
│   ├── 📄 test_model.py                  # Model testing script
│   ├── 📄 save_hybrid_model.py           # Model saving script
│   ├── 📄 upload_hybrid_model.py         # Model upload script
│   ├── 📄 upload_model.py                # Model upload script
│   │
│   └── 📁 model/                         # Model files directory
│       └── 📄 README.md                  # Model README
│
├── 📁 components/                        # Shared UI Components (Next.js)
│   ├── 📄 theme-provider.tsx             # Theme provider
│   │
│   └── 📁 ui/                            # UI Components Library
│       ├── 📄 accordion.tsx
│       ├── 📄 alert-dialog.tsx
│       ├── 📄 alert.tsx
│       ├── 📄 aspect-ratio.tsx
│       ├── 📄 avatar.tsx
│       ├── 📄 badge.tsx
│       ├── 📄 breadcrumb.tsx
│       ├── 📄 button.tsx
│       ├── 📄 calendar.tsx
│       ├── 📄 card.tsx
│       ├── 📄 carousel.tsx
│       ├── 📄 chart.tsx
│       ├── 📄 checkbox.tsx
│       ├── 📄 collapsible.tsx
│       ├── 📄 command.tsx
│       ├── 📄 context-menu.tsx
│       ├── 📄 dialog.tsx
│       ├── 📄 drawer.tsx
│       ├── 📄 dropdown-menu.tsx
│       ├── 📄 form.tsx
│       ├── 📄 hover-card.tsx
│       ├── 📄 input-otp.tsx
│       ├── 📄 input.tsx
│       ├── 📄 label.tsx
│       ├── 📄 menubar.tsx
│       ├── 📄 navigation-menu.tsx
│       ├── 📄 pagination.tsx
│       ├── 📄 popover.tsx
│       ├── 📄 progress.tsx
│       ├── 📄 radio-group.tsx
│       ├── 📄 resizable.tsx
│       ├── 📄 scroll-area.tsx
│       ├── 📄 select.tsx
│       ├── 📄 separator.tsx
│       ├── 📄 sheet.tsx
│       ├── 📄 sidebar.tsx
│       ├── 📄 skeleton.tsx
│       ├── 📄 slider.tsx
│       ├── 📄 sonner.tsx
│       ├── 📄 switch.tsx
│       ├── 📄 table.tsx
│       ├── 📄 tabs.tsx
│       ├── 📄 textarea.tsx
│       ├── 📄 toast.tsx
│       ├── 📄 toaster.tsx
│       ├── 📄 toggle-group.tsx
│       ├── 📄 toggle.tsx
│       ├── 📄 tooltip.tsx
│       ├── 📄 use-mobile.tsx
│       └── 📄 use-toast.ts
│
├── 📁 hooks/                             # React Hooks
│   ├── 📄 use-mobile.ts                  # Mobile detection hook
│   └── 📄 use-toast.ts                   # Toast notification hook
│
├── 📁 lib/                               # Utility Libraries
│   └── 📄 utils.ts                       # Utility functions
│
└── 📁 styles/                            # Global Styles
    └── 📄 globals.css                    # Global CSS styles
```

## File Count Summary

### Backend (Node.js/Express)
- **Main Files**: 1 (server.js)
- **Routes**: 3 files
- **Models**: 3 files
- **Middleware**: 1 file
- **Total Backend Files**: 8 core files

### Frontend (React/Vite)
- **Main Files**: 3 (main.jsx, App.jsx, App.css)
- **Components**: 7 files
- **Total Frontend Files**: 10 files

### Model Service (Python/FastAPI)
- **Main Files**: 4 (app.py, hybrid_model.py, simple_app.py, requirements.txt)
- **Utility Scripts**: 4 files
- **Total Model Service Files**: 8 files

### Documentation
- **Markdown Files**: 5 files

### Configuration Files
- **Docker**: 2 Dockerfiles + docker-compose.yml
- **Package Managers**: 4 lock/config files
- **Build Tools**: 4 config files
- **Scripts**: 4 shell scripts

## Key Dependencies

### Backend Dependencies
- express ^4.19.2
- mongoose ^8.6.0
- jsonwebtoken ^9.0.2
- bcryptjs ^2.4.3
- cors ^2.8.5
- dotenv ^16.4.5
- morgan ^1.10.0
- node-fetch ^3.3.2

### Frontend Dependencies
- react ^18.3.1
- react-dom ^18.3.1
- react-router-dom ^6.26.1
- vite ^5.4.0
- tailwindcss ^4.1.12

### Model Service Dependencies
- fastapi 0.104.1
- uvicorn 0.24.0
- torch >=2.2.0
- transformers >=4.42.0
- xgboost >=2.0.0
- scikit-learn >=1.3.0
- numpy >=1.26.0

## Service Ports

- **Frontend**: Port 3000
- **Backend**: Port 4000
- **Model Service**: Port 5001

## Important Notes

1. **backend/analysis_service/** - Legacy Flask service (kept for reference, not actively used)
2. **backend/auth_service/** - Empty directory (placeholder)
3. **components/** - Next.js UI components (may not be used by React frontend)
4. **app/** - Next.js app directory (may be separate from React frontend)
5. **model_service/** - Active Python service used by docker-compose.yml




