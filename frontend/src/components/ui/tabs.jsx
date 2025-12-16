// src/components/ui/tabs.jsx
import React from 'react';

export const Tabs = ({ defaultValue, className, children }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  
  return (
    <div className={`tabs ${className}`}>
      {React.Children.map(children, child => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        if (child.type === TabsContent) {
          return React.cloneElement(child, { activeTab });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, activeTab, setActiveTab, className }) => {
  return (
    <div className={`tabs-list ${className}`}>
      {React.Children.map(children, child => {
        if (child.type === TabsTrigger) {
          return React.cloneElement(child, { 
            isActive: child.props.value === activeTab,
            onClick: () => setActiveTab(child.props.value)
          });
        }
        return child;
      })}
    </div>
  );
};

export const TabsTrigger = ({ children, value, isActive, onClick, className }) => {
  return (
    <button
      className={`tab-trigger ${isActive ? 'active' : ''} ${className}`}
      onClick={onClick}
      data-value={value}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, activeTab, className }) => {
  if (value !== activeTab) return null;
  
  return (
    <div className={`tab-content ${className}`}>
      {children}
    </div>
  );
};