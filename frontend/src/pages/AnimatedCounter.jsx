// src/components/Dashboard/AnimatedCounter.jsx
import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ value, duration = 1500, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = typeof value === 'number' ? value : 0;
    const incrementTime = duration / end;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className="font-bold">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;