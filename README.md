# AI Mock Interview Assistant

A sophisticated AI-powered interview preparation platform that helps candidates practice and improve their interview skills through personalized mock interviews, real-time feedback, and detailed performance analysis.

## Features

- 🤖 **AI-Powered Interviews**: Generate personalized interview questions based on your resume and experience
- 📝 **Resume Analysis**: Upload your resume to get tailored questions matching your skills and experience
- 🎯 **Real-time Feedback**: Get instant feedback on your interview responses with detailed evaluations
- 🎥 **Video Recording**: Practice with video responses to improve your presentation skills
- 🔊 **Voice Recognition**: Advanced speech-to-text transcription for accurate response analysis
- 📊 **Performance Analytics**: Track your progress with detailed session statistics and scoring
- 📱 **Responsive Design**: Beautiful, modern UI that works seamlessly across all devices
- 🌙 **Dark Mode Support**: Comfortable interviewing experience in any lighting condition

## Tech Stack

### Frontend
- React.js with Vite for fast development and optimized builds
- TailwindCSS for modern, responsive styling
- Framer Motion for smooth animations
- React Router for navigation
- Chart.js for performance analytics visualization
- Axios for API communication

### Backend
- FastAPI for high-performance API endpoints
- MongoDB for session and user data storage
- SQLite for structured data and caching
- OpenAI Whisper for speech recognition
- Llama 4 Maverick model for AI-powered evaluations
- PDF processing with pdfplumber
- OpenRouter API integration for advanced AI capabilities

## Getting Started

### Prerequisites
- Node.js and npm (v14 or higher)
- Python 3.8 or higher
- MongoDB
- OpenRouter API key

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/AI-Interview-Assistant.git
cd AI-Interview-Assistant
\`\`\`

2. Install frontend dependencies:
\`\`\`bash
cd frontend
npm install
\`\`\`

3. Install backend dependencies:
\`\`\`bash
cd ../backend
pip install -r requirements.txt
\`\`\`

4. Set up environment variables:
Create a .env file in the backend directory with:
\`\`\`
OPENROUTER_API_KEY=your_api_key
MONGODB_URI=your_mongodb_uri
\`\`\`

### Running the Application

1. Start the backend server:
\`\`\`bash
cd backend
uvicorn backend:app --reload
\`\`\`

2. Start the frontend development server:
\`\`\`bash
cd frontend
npm run dev
\`\`\`

The application will be available at http://localhost:3000

## Project Structure

\`\`\`
AI-Interview-Assistant/
├── backend.py           # FastAPI backend server
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application pages/routes
│   │   ├── mock/       # Mock data for development
│   │   └── App.jsx     # Main application component
│   └── package.json    # Frontend dependencies
\`\`\`

## Features in Detail

### Interview Session Flow
1. Upload your resume
2. Receive AI-generated questions based on your profile
3. Record video/audio responses
4. Get instant AI-powered feedback
5. Review performance metrics and improvement suggestions

### Performance Analytics
- Session history tracking
- Score trends and progress monitoring
- Difficulty distribution analysis
- Detailed feedback on communication, technical relevance, and structure

### Customization Options
- Multiple interview types (Technical, Behavioral, etc.)
- Difficulty levels
- Number of questions
- Dark/Light theme preferences

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details