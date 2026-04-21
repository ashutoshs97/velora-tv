import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';

export default function FocusableButton({ className = '', children, onClick, ...props }) {
  const { ref, focused } = useFocusable({
    onEnterPress: onClick
  });

  const focusClass = focused ? 'ring-4 ring-white ring-offset-2 ring-offset-black scale-105 z-50' : '';

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`transition-all duration-200 ${className} ${focusClass}`}
      {...props}
    >
      {children}
    </button>
  );
}
