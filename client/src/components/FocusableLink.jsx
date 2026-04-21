import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { Link } from 'react-router-dom';

export default function FocusableLink({ to, className = '', activeClassName = '', isNavActive = false, children, ...props }) {
  const { ref, focused } = useFocusable();

  const focusClass = focused ? 'ring-4 ring-white ring-offset-2 ring-offset-black scale-105 z-50' : '';
  const activeClass = isNavActive ? activeClassName : '';

  return (
    <Link
      to={to}
      ref={ref}
      className={`transition-all duration-200 ${className} ${activeClass} ${focusClass}`}
      {...props}
    >
      {children}
    </Link>
  );
}
