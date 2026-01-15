// src/pages/support/Support.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  HelpCircle, MessageSquare, Phone, Mail, FileText,
  Search, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import './Support.css';

const Support = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('faq');

  const faqs = [
    {
      question: t('howToAddBeneficiary'),
      answer: t('howToAddBeneficiaryAnswer'),
      category: 'beneficiaries'
    },
    {
      question: t('howToGenerateReport'),
      answer: t('howToGenerateReportAnswer'),
      category: 'reports'
    }
  ];

  return (
    <div className="support-page">
      <h1><HelpCircle size={24} /> {t('support')}</h1>
      
      <div className="support-tabs">
        <button 
          className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          <FileText size={18} />
          {t('faq')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <MessageSquare size={18} />
          {t('contact')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <Mail size={18} />
          {t('tickets')}
        </button>
      </div>

      <div className="support-content">
        {activeTab === 'faq' && (
          <div className="faq-section">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder={t('searchFAQ')} />
            </div>
            
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <div className="faq-question">
                    <h3>{faq.question}</h3>
                    <span className="faq-category">{faq.category}</span>
                  </div>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="contact-section">
            <div className="contact-methods">
              <div className="contact-method">
                <Phone size={32} />
                <h3>{t('phoneSupport')}</h3>
                <p>+237 233 000 000</p>
                <small>{t('availableHours')}: 8h-18h</small>
              </div>
              
              <div className="contact-method">
                <Mail size={32} />
                <h3>{t('emailSupport')}</h3>
                <p>support@ams-sante.cm</p>
                <small>{t('responseTime')}: 24h</small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;