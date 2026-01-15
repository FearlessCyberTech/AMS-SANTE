// src/pages/financier/Facturation.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  DollarSign, Search, Filter, Download, Printer,
  CheckCircle, XCircle, Clock, AlertTriangle,
  Eye, Edit, FileText, User, Building
} from 'lucide-react';
import './Facturation.css';

const Facturation = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    // Simuler le chargement des données
    const mockInvoices = [
      {
        id: 'FACT-2024-001',
        patient: 'Jean Dupont',
        matricule: 'AMS001',
        date: '2024-01-15',
        amount: 15000,
        type: 'Consultation',
        center: 'Centre Médical Central',
        status: 'Paid',
        dueDate: '2024-01-30'
      },
      {
        id: 'FACT-2024-002',
        patient: 'Marie Martin',
        matricule: 'AMS002',
        date: '2024-01-16',
        amount: 250000,
        type: 'Hospitalisation',
        center: 'Hôpital Général',
        status: 'Pending',
        dueDate: '2024-01-31'
      }
    ];
    setInvoices(mockInvoices);
  }, []);

  return (
    <div className="facturation-page">
      <h1><DollarSign size={24} /> {t('billing')}</h1>
      
      <div className="invoice-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{invoices.length}</div>
            <div className="stat-label">{t('totalInvoices')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon paid">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {invoices.filter(i => i.status === 'Paid').length}
            </div>
            <div className="stat-label">{t('paid')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {invoices.filter(i => i.status === 'Pending').length}
            </div>
            <div className="stat-label">{t('pending')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon overdue">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {invoices.filter(i => new Date(i.dueDate) < new Date() && i.status === 'Pending').length}
            </div>
            <div className="stat-label">{t('overdue')}</div>
          </div>
        </div>
      </div>

      <div className="invoice-actions">
        <button className="btn-primary">
          <FileText size={18} />
          {t('newInvoice')}
        </button>
        <button className="btn-secondary">
          <Download size={18} />
          {t('export')}
        </button>
        <button className="btn-secondary">
          <Printer size={18} />
          {t('print')}
        </button>
      </div>

      <div className="invoices-table">
        <table>
          <thead>
            <tr>
              <th>{t('invoiceNumber')}</th>
              <th>{t('patient')}</th>
              <th>{t('date')}</th>
              <th>{t('type')}</th>
              <th>{t('center')}</th>
              <th>{t('amount')}</th>
              <th>{t('status')}</th>
              <th>{t('dueDate')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>
                  <div className="invoice-number">
                    <FileText size={14} />
                    {invoice.id}
                  </div>
                </td>
                <td>
                  <div className="patient-info">
                    <User size={14} />
                    <div>
                      <div>{invoice.patient}</div>
                      <small>{invoice.matricule}</small>
                    </div>
                  </div>
                </td>
                <td>{invoice.date}</td>
                <td>{invoice.type}</td>
                <td>
                  <div className="center-info">
                    <Building size={14} />
                    {invoice.center}
                  </div>
                </td>
                <td className="amount">{invoice.amount.toLocaleString()} FCFA</td>
                <td>
                  <span className={`status-badge status-${invoice.status.toLowerCase()}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className={new Date(invoice.dueDate) < new Date() && invoice.status === 'Pending' ? 'overdue' : ''}>
                  {invoice.dueDate}
                </td>
                <td>
                  <div className="invoice-actions">
                    <button className="btn-action view">
                      <Eye size={16} />
                    </button>
                    <button className="btn-action edit">
                      <Edit size={16} />
                    </button>
                    <button className="btn-action print">
                      <Printer size={16} />
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

export default Facturation;