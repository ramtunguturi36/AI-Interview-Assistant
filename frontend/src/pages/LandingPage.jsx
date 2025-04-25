import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="space-y-20 pt-20">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-grid-16"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 leading-tight">
              Master Your Interview Skills
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 mt-4">
                With AI-Powered Practice
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
              Get instant, personalized feedback on your interview responses and improve your chances of landing your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/upload-resume"
                className="inline-flex items-center px-8 py-4 rounded-full text-lg font-semibold text-indigo-600 bg-white hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-bounce-subtle"
              >
                Start Your Practice Interview
                <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link
                to="/sessions"
                className="inline-flex items-center px-8 py-4 rounded-full text-lg font-semibold text-white border-2 border-white hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
              >
                View Past Sessions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '1',
                title: 'Upload Your Resume',
                description: 'Share your resume to get personalized interview questions based on your experience',
                icon: '📄'
              },
              {
                step: '2',
                title: 'Answer Questions',
                description: 'Record your responses to AI-generated interview questions tailored to your profile',
                icon: '🎯'
              },
              {
                step: '3',
                title: 'Get Instant Feedback',
                description: 'Receive detailed feedback and suggestions to improve your interview performance',
                icon: '✨'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="relative bg-white rounded-2xl shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                  {item.step}
                </div>
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            Why Choose Us
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: 'AI-Powered Analysis',
                description: 'Get detailed feedback on your responses using advanced AI technology',
                icon: '🤖'
              },
              {
                title: 'Practice Anytime',
                description: 'Access mock interviews 24/7 from anywhere in the world',
                icon: '🌍'
              },
              {
                title: 'Personalized Questions',
                description: 'Questions tailored to your experience and job role',
                icon: '🎯'
              },
              {
                title: 'Instant Feedback',
                description: 'Get immediate insights to improve your interview performance',
                icon: '⚡'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300 group"
              >
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-grid-16"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl text-gray-200 mb-12 leading-relaxed">
            Join thousands of job seekers who have improved their interview skills with our AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/upload-resume"
              className="inline-flex items-center px-8 py-4 rounded-full text-lg font-semibold bg-white text-indigo-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Practicing Now
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              to="/sessions"
              className="inline-flex items-center px-8 py-4 rounded-full text-lg font-semibold text-white border-2 border-white hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
            >
              View Past Sessions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage; 