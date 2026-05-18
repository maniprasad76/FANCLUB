import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs — SXO navigation aid + SEO BreadcrumbList schema
 * Improves user navigation experience and helps search engines understand page hierarchy
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumbs-item">
          <Link to="/" className="breadcrumbs-link" aria-label="Home">
            <Home size={14} />
          </Link>
        </li>
        {items.map((item, i) => (
          <li className="breadcrumbs-item" key={i}>
            <ChevronRight size={12} className="breadcrumbs-separator" />
            {item.href && i < items.length - 1 ? (
              <Link to={item.href} className="breadcrumbs-link">{item.label}</Link>
            ) : (
              <span className="breadcrumbs-current" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
