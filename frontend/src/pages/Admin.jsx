// src/pages/Admin.jsx
import React from 'react';
import { motion } from 'framer-motion';

const Admin = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-2">Gérez les paramètres et configurations du système</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Paramètres Système</h2>
        <p className="text-gray-600">Page d'administration en cours de développement...</p>
      </motion.div>
    </div>
  );
};

export default Admin;