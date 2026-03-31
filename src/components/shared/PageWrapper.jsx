import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const pageTransition = {
  duration: 0.35,
  ease: [0.25, 0.46, 0.45, 0.94],
};

const PageWrapper = memo(function PageWrapper({ children, className }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={pageTransition}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
});

export default PageWrapper;
