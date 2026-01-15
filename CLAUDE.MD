# Project Context for Claude

## Project Overview

This is an enablement/learning platform application built with React, TypeScript, and Vite. The application provides learning paths, courses, assessments, coaching, and cohort-based learning features.

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with custom components
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI Services**: Google AI (Gemini) via AI SDK
- **Rich Text Editor**: TipTap
- **Animations**: Framer Motion, GSAP

## Project Structure

```
src/
├── components/       # Reusable React components
├── pages/           # Route-level page components
├── context/         # React Context providers
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries and services
├── scripts/         # Build and utility scripts
├── types/           # TypeScript type definitions
├── App.tsx          # Main application component
└── main.tsx         # Application entry point
```

## Key Features

1. **Authentication** - Supabase Auth with OAuth
2. **Learning Paths** - Structured learning journeys with courses
3. **Assessments** - Diagnostics, quizzes, and flashcards
4. **Study Buddy** - AI-powered learning assistant
5. **Cohorts** - Group learning sessions
6. **Coaching** - 1:1 coaching features
7. **Q&A Forum** - Community knowledge sharing
8. **Admin Console** - Content and user management
9. **Public Pages** - Marketing landing page and public course views
10. **Tools Page** - Utility tools for content creation

## Development Guidelines

### AI Service Usage (CRITICAL)

**See AGENTS.MD for detailed AI service guidelines.**

Key rules:
- Always use the `ai` SDK, never call provider SDKs directly
- Use model format: `provider/model` (e.g., `anthropic/claude-sonnet-4.5`)
- Use environment variable: `AI_GATEWAY_API_KEY`
- Never reference provider-specific API keys
- For agentic workflows, use `ToolLoopAgent`

### Code Style

- Use TypeScript with strict type checking
- Functional components with hooks
- Named exports for components
- CSS modules or Tailwind for styling
- ESLint configured for React + TypeScript

### State Management

- React Context for global state (Auth, Program, UserMemory, Chat)
- Local state with `useState` for component-level state
- Custom hooks for reusable stateful logic

### Routing

- React Router v7 for navigation
- Protected routes use `<ProtectedRoute>` wrapper
- Route structure defined in `App.tsx`

### Component Patterns

- Error boundaries for error handling
- Loading states for async operations
- Accessibility considerations (ARIA labels, keyboard navigation)
- Responsive design (mobile-first)

### Database

- Supabase for backend services
- PostgreSQL database
- Real-time subscriptions where needed
- Row-level security policies

## Key Files to Reference

- `AGENTS.MD` - AI service patterns and rules
- `src/App.tsx` - Application routing structure
- `src/context/AuthContext.tsx` - Authentication logic
- `src/context/ProgramContext.tsx` - Program data management
- `src/lib/aiService.ts` - AI integration
- `package.json` - Dependencies and scripts

## Environment Variables

Required environment variables:
- `AI_GATEWAY_API_KEY` - For AI services
- Supabase connection details
- Other service API keys

## Common Tasks

### Running the Application
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation links if needed
4. Update types if necessary

### Adding a New Component
1. Create component in `src/components/`
2. Use TypeScript for props interface
3. Export as named export
4. Add Tailwind classes for styling

### Working with AI Features
1. Always follow AGENTS.MD guidelines
2. Use the `ai` SDK functions
3. Specify models explicitly
4. Handle streaming responses appropriately

## Testing

- Manual testing in development mode
- No automated test suite currently configured

## Deployment

- Application built for Vercel deployment
- AI Gateway routing handled automatically on Vercel
- Environment variables configured in Vercel dashboard

## Important Notes

- Never commit `.env` files
- Use TypeScript types consistently
- Follow React best practices
- Maintain accessibility standards
- Keep components focused and reusable
- Document complex logic with comments
- Use semantic HTML elements

## Getting Help

- Check AGENTS.MD for AI service patterns
- Review existing components for patterns
- Check package.json for available scripts
- Review React Router v7 docs for routing questions
- Check Supabase docs for database operations
