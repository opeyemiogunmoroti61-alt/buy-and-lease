'use client';

import { FiHome, FiKey, FiDollarSign } from 'react-icons/fi';

export default function PropertyCards() {
  const actionCards = [
    {
      title: "Buy a home",
      description: "Find your dream home from our extensive listings",
      icon: <FiHome className="w-12 h-12 text-blue-600" />,
      bgColor: "bg-blue-50"
    },
    {
      title: "Rent a home",
      description: "Discover perfect rental properties in your area",
      icon: <FiKey className="w-12 h-12 text-green-600" />,
      bgColor: "bg-green-50"
    },
    {
      title: "Sell a home",
      description: "Get the best value for your property with our experts",
      icon: <FiDollarSign className="w-12 h-12 text-purple-600" />,
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-6 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actionCards.map((card, index) => (
          <div 
            key={index} 
            className={`${card.bgColor} rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-4 bg-white rounded-full shadow-sm">
                {card.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{card.title}</h3>
              <p className="text-gray-600">{card.description}</p>
              <button className="mt-4 px-6 py-2 bg-white text-gray-800 font-medium rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
                Learn more
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}