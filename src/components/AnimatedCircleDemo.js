import React, { useState } from 'react';
import AnimatedCircle from './ui/animated-circle';

const AnimatedCircleDemo = () => {
  const [isAnimating, setIsAnimating] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Animated Circle Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Basic animated circle */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Basic Circle</h3>
            <div className="flex justify-center">
              <AnimatedCircle 
                size={80} 
                strokeWidth={3} 
                color="#3B82F6" 
                duration={2}
              />
            </div>
          </div>

          {/* Large circle with different color */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Large Green Circle</h3>
            <div className="flex justify-center">
              <AnimatedCircle 
                size={120} 
                strokeWidth={6} 
                color="#10B981" 
                duration={3}
              />
            </div>
          </div>

          {/* Fast animation */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Fast Purple Circle</h3>
            <div className="flex justify-center">
              <AnimatedCircle 
                size={100} 
                strokeWidth={4} 
                color="#8B5CF6" 
                duration={1}
                delay={0.5}
              />
            </div>
          </div>

          {/* Red circle with delay */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Delayed Red Circle</h3>
            <div className="flex justify-center">
              <AnimatedCircle 
                size={90} 
                strokeWidth={5} 
                color="#EF4444" 
                duration={2.5}
                delay={1}
              />
            </div>
          </div>

          {/* Orange circle */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Orange Circle</h3>
            <div className="flex justify-center">
              <AnimatedCircle 
                size={110} 
                strokeWidth={8} 
                color="#F97316" 
                duration={2}
              />
            </div>
          </div>

          {/* Pink circle */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Pink Circle</h3>
            <div className="flex justify-center">
              <AnimatedCircle 
                size={70} 
                strokeWidth={2} 
                color="#EC4899" 
                duration={1.5}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Interactive Demo</h3>
          <div className="space-y-4">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {isAnimating ? 'Stop Animation' : 'Start Animation'}
            </button>
            
            <div className="flex justify-center">
              {isAnimating && (
                <AnimatedCircle 
                  size={150} 
                  strokeWidth={6} 
                  color="#059669" 
                  duration={3}
                  className="animate-pulse"
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Usage Example</h3>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto">
{`import AnimatedCircle from './components/ui/animated-circle';

<AnimatedCircle 
  size={100}           // Circle size in pixels
  strokeWidth={4}      // Line thickness
  color="blue"         // Stroke color
  duration={2}         // Animation duration in seconds
  delay={0}           // Animation delay in seconds
  className="my-class" // Additional CSS classes
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AnimatedCircleDemo;