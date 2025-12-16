// src/pages/interaction/Messagerie.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mail, Search, Filter, Send, Paperclip,
  User, Clock, Check, CheckCheck, Phone
} from 'lucide-react';
import './Messagerie.css';

const Messagerie = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Simuler le chargement des données
    const mockMessages = [
      {
        id: 1,
        contact: 'Dr. Martin',
        role: 'Médecin',
        lastMessage: 'Bonjour, avez-vous les résultats du patient ?',
        time: '10:30',
        unread: 2,
        online: true
      },
      {
        id: 2,
        contact: 'Centre Médical Central',
        role: 'Centre de santé',
        lastMessage: 'Nouvelle convention à signer',
        time: 'Hier',
        unread: 0,
        online: false
      }
    ];
    setMessages(mockMessages);
  }, []);

  return (
    <div className="messagerie-page">
      <h1><Mail size={24} /> {t('messaging')}</h1>
      
      <div className="messagerie-container">
        <div className="conversations-list">
          <div className="conversations-header">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder={t('searchConversations')} />
            </div>
            <button className="btn-new">
              <Mail size={18} />
              {t('newMessage')}
            </button>
          </div>

          <div className="conversations">
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`conversation-item ${selectedConversation?.id === msg.id ? 'active' : ''}`}
                onClick={() => setSelectedConversation(msg)}
              >
                <div className="contact-avatar">
                  {msg.contact.charAt(0)}
                  {msg.online && <div className="online-indicator"></div>}
                </div>
                <div className="contact-info">
                  <div className="contact-name">
                    <strong>{msg.contact}</strong>
                    <span className="contact-role">{msg.role}</span>
                  </div>
                  <div className="last-message">{msg.lastMessage}</div>
                </div>
                <div className="message-info">
                  <div className="message-time">{msg.time}</div>
                  {msg.unread > 0 && (
                    <div className="unread-count">{msg.unread}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="message-container">
          {selectedConversation ? (
            <>
              <div className="message-header">
                <div className="contact-header">
                  <div className="contact-avatar large">
                    {selectedConversation.contact.charAt(0)}
                  </div>
                  <div className="contact-details">
                    <h3>{selectedConversation.contact}</h3>
                    <div className="contact-status">
                      {selectedConversation.online ? (
                        <span className="online">{t('online')}</span>
                      ) : (
                        <span className="offline">{t('offline')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="header-actions">
                  <button className="btn-action">
                    <Phone size={18} />
                  </button>
                </div>
              </div>

              <div className="messages-history">
                <div className="message received">
                  <div className="message-content">
                    <p>Bonjour, avez-vous les résultats du patient Jean Dupont ?</p>
                    <div className="message-time">
                      <Clock size={12} />
                      10:30
                    </div>
                  </div>
                </div>
                <div className="message sent">
                  <div className="message-content">
                    <p>Oui, je les envoie maintenant.</p>
                    <div className="message-time">
                      <Clock size={12} />
                      10:32
                      <CheckCheck size={12} className="read" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="message-input">
                <button className="btn-attachment">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  placeholder={t('typeMessage')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="btn-send">
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <Mail size={64} />
              <h3>{t('selectConversation')}</h3>
              <p>{t('selectConversationMessage')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messagerie;