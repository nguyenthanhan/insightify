import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-gray-100 px-4 py-3 dark:bg-gray-800">
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
