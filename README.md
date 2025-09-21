# MatchCV

A React Native app that helps people discover nearby individuals with similar hobbies and interests.

## 🏗️ Project Structure

```
MatchCV/
├── mobile/                 # React Native app (Expo)
│   ├── app/               # Expo Router screens
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utilities and helpers
│   ├── store/            # Zustand state management
│   ├── types/            # Mobile-specific types
│   ├── assets/           # Images, fonts, etc.
│   └── package.json      # Mobile dependencies
├── backend/              # Node.js API server
│   ├── src/             # Source code
│   ├── prisma/          # Database schema and migrations
│   └── package.json     # Backend dependencies
├── shared/              # Shared types and utilities
│   ├── types.ts         # Common TypeScript interfaces
│   ├── index.ts         # Exports
│   └── package.json     # Shared package config
└── package.json         # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.19.4
- npm >= 10.0.0
- Expo CLI
- PostgreSQL (for backend)

### Installation

1. **Clone and install all dependencies:**
   ```bash
   git clone <repository-url>
   cd MatchCV
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   # Terminal 1: Start mobile app
   npm run dev:mobile
   
   # Terminal 2: Start backend API
   npm run dev:backend
   ```

### Mobile App Development

```bash
cd mobile
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```

### Backend Development

```bash
cd backend
npm run dev        # Start development server
npm run build      # Build for production
npm test          # Run tests
```

## 📱 Features

- **User Profiles**: Create and edit hobby-based profiles
- **Location-Based Discovery**: Find nearby people with similar interests
- **Smart Matching**: Algorithm-based matching using shared hobbies and distance
- **Real-time Chat**: Connect and chat with matches
- **Privacy Controls**: Choose visibility levels (precise, neighborhood, hidden)
- **Push Notifications**: Get notified of new matches

## 🛠️ Tech Stack

### Mobile (React Native)
- **Framework**: Expo with Expo Router
- **Language**: TypeScript
- **UI Library**: React Native Paper
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query
- **Maps**: React Native Maps
- **Navigation**: Expo Router

### Backend (Node.js)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Real-time**: Socket.io for chat
- **File Upload**: Multer for avatars
- **Security**: Helmet, CORS, rate limiting

### Shared
- **Types**: Common TypeScript interfaces
- **Constants**: App-wide configuration
- **Utilities**: Shared helper functions

## 🗄️ Database Schema

- **Users**: Profile information, location, preferences
- **Hobbies**: Available hobby categories and tags
- **Matches**: User connections and match scores
- **Messages**: Chat history between users
- **Chat Rooms**: Conversation management

## 🔧 Development Scripts

```bash
# Root level
npm run dev:mobile      # Start mobile development
npm run dev:backend     # Start backend development
npm run install:all     # Install all dependencies
npm run clean          # Clean all node_modules
npm test              # Run all tests

# Mobile specific
cd mobile
npm start             # Start Expo dev server
npm run ios          # Run on iOS
npm run android      # Run on Android

# Backend specific
cd backend
npm run dev          # Start with nodemon
npm run build        # Build TypeScript
npm run start        # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
```

## 📦 Deployment

### Mobile App
- **Development**: Expo Go app
- **Production**: EAS Build for App Store/Play Store

### Backend API
- **Development**: Local development server
- **Production**: Deploy to Railway, Render, or AWS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Rom Green** - *Initial work*

---

**MatchCV** - Connecting people through shared passions 🎯