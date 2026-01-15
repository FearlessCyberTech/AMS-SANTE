import React from 'react';

// Card Components
export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-6 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-xl font-semibold text-gray-800 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-gray-500 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Button Component
export function Button({ children, variant = 'default', size = 'default', className = '', disabled = false, ...props }) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-800 focus-visible:ring-gray-300',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600',
    ghost: 'hover:bg-gray-100 text-gray-800'
  };
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-8 text-lg',
    icon: 'h-10 w-10'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// Input Component
export function Input({ className = '', type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

// Label Component
export function Label({ children, className = '', ...props }) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
      {children}
    </label>
  );
}

// Alert Components
export function Alert({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'bg-white border-gray-200',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };
  
  return (
    <div className={`relative w-full rounded-lg border p-4 ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = '', ...props }) {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

// Table Components
export function Table({ children, className = '', ...props }) {
  return (
    <div className={`w-full overflow-auto ${className}`}>
      <table className="w-full caption-bottom text-sm" {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={`border-b border-gray-200 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr className={`border-b border-gray-200 transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-100 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`p-4 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

// Badge Component
export function Badge({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    secondary: 'bg-gray-200 text-gray-800',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
    outline: 'border border-gray-300 text-gray-700',
    success: 'bg-green-100 text-green-800 border border-green-200'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

// Tabs Components
export function Tabs({ defaultValue, children, className = '', ...props }) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  
  return (
    <div className={className} {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
}

export function TabsList({ children, activeTab, setActiveTab, className = '', ...props }) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className}`} {...props}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
}

export function TabsTrigger({ value, children, activeTab, setActiveTab, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        activeTab === value ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
      } ${className}`}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, activeTab, ...props }) {
  if (activeTab !== value) return null;
  
  return (
    <div className="mt-2" {...props}>
      {children}
    </div>
  );
}

// Dialog Components
export function Dialog({ open, onOpenChange, children, ...props }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" {...props}>
      {children}
    </div>
  );
}

export function DialogContent({ children, className = '', ...props }) {
  return (
    <div className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 sm:rounded-lg ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = '', ...props }) {
  return (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-gray-500 ${className}`} {...props}>
      {children}
    </p>
  );
}

// Progress Component
export function Progress({ value = 0, className = '', ...props }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`} {...props}>
      <div
        className="h-full w-full flex-1 bg-blue-600 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}

// Avatar Components
export function Avatar({ children, className = '', ...props }) {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt, className = '', ...props }) {
  return (
    <img src={src} alt={alt} className={`aspect-square h-full w-full ${className}`} {...props} />
  );
}

export function AvatarFallback({ children, className = '', ...props }) {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}

// Separator Component
export function Separator({ className = '', ...props }) {
  return (
    <div className={`h-px w-full bg-gray-200 ${className}`} {...props} />
  );
}