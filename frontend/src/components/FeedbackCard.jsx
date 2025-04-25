import React from 'react';
import { motion } from 'framer-motion';
import { Card, Heading, Text } from './index';

function FeedbackCard({ title, items, type }) {
  const getTypeStyles = () => {
    switch (type) {
      case 'strengths':
        return {
          container: 'bg-green-50 dark:bg-green-900/20',
          title: 'text-green-800 dark:text-green-200',
          item: 'text-green-700 dark:text-green-300'
        };
      case 'improvements':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/20',
          title: 'text-yellow-800 dark:text-yellow-200',
          item: 'text-yellow-700 dark:text-yellow-300'
        };
      default:
        return {
          container: 'bg-gray-50 dark:bg-gray-800/50',
          title: 'text-gray-800 dark:text-gray-200',
          item: 'text-gray-700 dark:text-gray-300'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Card className={`${styles.container} p-6`}>
      <Heading level={3} className={`mb-4 ${styles.title}`}>
        {title}
      </Heading>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-start ${styles.item}`}
          >
            <span className="mr-2">•</span>
            <Text>{item}</Text>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

export default FeedbackCard; 