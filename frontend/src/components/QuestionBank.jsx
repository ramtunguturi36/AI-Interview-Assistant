import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, Heading, Text, SkeletonLoader } from './index';

function QuestionBank({ 
  questions = [], 
  onSelectQuestion,
  loading = false,
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Extract all unique tags from questions
  const allTags = [...new Set(questions.flatMap(q => q.tags || []))];

  useEffect(() => {
    // Filter questions based on search term and selected tags
    let filtered = questions;
    
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.category && q.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(q => 
        selectedTags.some(tag => (q.tags || []).includes(tag))
      );
    }
    
    setFilteredQuestions(filtered);
  }, [questions, searchTerm, selectedTags]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleQuestion = (id) => {
    if (expandedQuestion === id) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(id);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-4">
        <Heading level={2}>Question Bank</Heading>
        <Text>Browse and search through our collection of interview questions.</Text>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search questions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="secondary" 
            onClick={() => {
              setSearchTerm('');
              setSelectedTags([]);
            }}
          >
            Clear Filters
          </Button>
        </div>
        
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedTags.includes(tag)
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {loading ? (
        <SkeletonLoader type="card" count={3} height="h-32" />
      ) : filteredQuestions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuestions.map(question => (
            <Card 
              key={question.id} 
              hover 
              onClick={() => toggleQuestion(question.id)}
              className="cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <Heading level={4} className="line-clamp-2">{question.text}</Heading>
                  {question.category && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      {question.category}
                    </span>
                  )}
                </div>
                
                {expandedQuestion === question.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-2"
                  >
                    {question.tags && question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {question.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {question.hints && (
                      <div>
                        <Text size="sm" weight="medium">Hints:</Text>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                          {question.hints.map((hint, index) => (
                            <li key={index}>{hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectQuestion(question);
                      }}
                    >
                      Use This Question
                    </Button>
                  </motion.div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Text>No questions found matching your criteria.</Text>
        </div>
      )}
    </div>
  );
}

export default QuestionBank; 