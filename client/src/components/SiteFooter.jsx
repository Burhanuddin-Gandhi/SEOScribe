import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-800/50 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <p className="text-gray-600">
          SEOScribe &copy; {new Date().getFullYear()} &mdash; AI-Powered SEO Analysis
        </p>
        <Link to="/methodology" className="text-violet-400 hover:text-violet-300 font-medium">
          How we verify our data →
        </Link>
      </div>
    </footer>
  );
}