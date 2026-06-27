import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/Container';

export default function NotFoundPage() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="font-display text-[8rem] font-extrabold leading-none text-gradient sm:text-[12rem]"
      >
        404
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="font-display text-2xl font-bold">This page took an unscheduled break</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          The page you’re looking for doesn’t exist or has moved. Let’s get you back to learning.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="gradient" size="lg" asChild>
            <Link to="/">
              <Home className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/tutors">
              <Search className="h-4 w-4" /> Find a Tutor
            </Link>
          </Button>
        </div>
      </motion.div>
    </Container>
  );
}
