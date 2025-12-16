// src/pages/documentation/Archivage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileArchive, Search, Filter, Download, Eye,
  Calendar, FileText, User, Building, Trash2
} from 'lucide-react';
import './Archivage.css';

const Archivage = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    // Simuler le chargement des données
    const mockDocuments = [
      {
        id: 1,
        name: 'Rapport annuel 2023',
        type: 'Rapport',
        size: '2.5 MB',
        date: '2023-12-31',
        uploadedBy: 'Admin System',
        category: 'Administratif',
        retention: '10 ans'
      },
      {
        id: 2,
        name: 'Contrat prestataire Centre Médical',
        type: 'Contrat',
        size: '1.2 MB',
        date: '2023-06-15',
        uploadedBy: 'Dr. Martin',
        category: 'Juridique',
        retention: '5 ans'
      }
    ];
    setDocuments(mockDocuments);
  }, []);

  return (
    <div className="archivage-page">
      <h1><FileArchive size={24} /> {t('archiving')}</h1>
      
      <div className="archive-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{documents.length}</div>
            <div className="stat-label">{t('totalDocuments')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon size">
            <Database size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">4.2 GB</div>
            <div className="stat-label">{t('totalSize')}</div>
          </div>
        </div>
      </div>

      <div className="documents-table">
        <table>
          <thead>
            <tr>
              <th>{t('documentName')}</th>
              <th>{t('type')}</th>
              <th>{t('size')}</th>
              <th>{t('date')}</th>
              <th>{t('uploadedBy')}</th>
              <th>{t('category')}</th>
              <th>{t('retention')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td>
                  <div className="document-name">
                    <FileText size={16} />
                    {doc.name}
                  </div>
                </td>
                <td>
                  <span className="type-badge">{doc.type}</span>
                </td>
                <td>{doc.size}</td>
                <td>
                  <div className="date-cell">
                    <Calendar size={14} />
                    {doc.date}
                  </div>
                </td>
                <td>
                  <div className="uploader-cell">
                    <User size={14} />
                    {doc.uploadedBy}
                  </div>
                </td>
                <td>{doc.category}</td>
                <td>
                  <span className="retention-badge">{doc.retention}</span>
                </td>
                <td>
                  <div className="document-actions">
                    <button className="btn-action view">
                      <Eye size={16} />
                    </button>
                    <button className="btn-action download">
                      <Download size={16} />
                    </button>
                    <button className="btn-action delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Archivage;