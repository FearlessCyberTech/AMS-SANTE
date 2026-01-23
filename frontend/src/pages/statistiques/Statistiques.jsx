// src/pages/statistiques/Statistiques.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, Users, Stethoscope, DollarSign, 
  Calendar, Filter, Download, BarChart3,
  PieChart, LineChart
} from 'lucide-react';

const Statistiques = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState({
    consultations: [],
    revenues: [],
    beneficiaries: [],
    pathologies: []
  });

  useEffect(() => {
    // Simuler le chargement des données
    setStats({
      consultations: [
        { month: 'Jan', count: 150 },
        { month: 'Fév', count: 180 },
        { month: 'Mar', count: 200 },
        { month: 'Avr', count: 190 },
        { month: 'Mai', count: 210 },
        { month: 'Juin', count: 230 }
      ],
      revenues: [
        { month: 'Jan', amount: 1500000 },
        { month: 'Fév', amount: 1800000 },
        { month: 'Mar', amount: 2000000 },
        { month: 'Avr', amount: 1900000 },
        { month: 'Mai', amount: 2100000 },
        { month: 'Juin', amount: 2300000 }
      ],
      beneficiaries: [
        { type: 'Actifs', count: 1200 },
        { type: 'Suspendus', count: 50 },
        { type: 'Retirés', count: 30 }
      ],
      pathologies: [
        { name: 'Paludisme', count: 45 },
        { name: 'Hypertension', count: 30 },
        { name: 'Diabète', count: 25 },
        { name: 'Infections', count: 40 },
        { name: 'Autres', count: 60 }
      ]
    });
  }, []);

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        {change && <div className="stat-change">{change}</div>}
      </div>
    </div>
  );

  return (
    <div className="statistiques-page">
      <div className="page-header">
        <h1><TrendingUp size={24} /> {t('statistics')}</h1>
        <div className="period-selector">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">{t('thisWeek')}</option>
            <option value="month">{t('thisMonth')}</option>
            <option value="quarter">{t('thisQuarter')}</option>
            <option value="year">{t('thisYear')}</option>
          </select>
          <button className="btn-secondary">
            <Filter size={16} />
            {t('filters')}
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            {t('export')}
          </button>
        </div>
      </div>

      <div className="stats-overview">
        <StatCard
          title={t('totalConsultations')}
          value="1,250"
          change="+12% vs mois dernier"
          icon={Stethoscope}
          color="blue"
        />
        <StatCard
          title={t('totalRevenue')}
          value="12.5M FCFA"
          change="+8% vs mois dernier"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title={t('activeBeneficiaries')}
          value="1,200"
          change="+5% vs mois dernier"
          icon={Users}
          color="purple"
        />
        <StatCard
          title={t('averageCost')}
          value="15,000 FCFA"
          change="-2% vs mois dernier"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <div className="chart-header">
            <h3><LineChart size={18} /> {t('consultationsEvolution')}</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <div className="legend-color blue"></div>
                {t('consultations')}
              </span>
            </div>
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {stats.consultations.map((item, index) => (
                <div key={index} className="bar-container">
                  <div 
                    className="bar" 
                    style={{ height: `${(item.count / 250) * 100}%` }}
                    title={`${item.count} consultations`}
                  >
                    <div className="bar-value">{item.count}</div>
                  </div>
                  <div className="bar-label">{item.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3><PieChart size={18} /> {t('beneficiariesDistribution')}</h3>
          </div>
          <div className="chart-container">
            <div className="pie-chart">
              {stats.beneficiaries.map((item, index) => (
                <div key={index} className="pie-segment">
                  <div className="segment-label">
                    <div className={`segment-color color-${index}`}></div>
                    <span>{item.type}: {item.count}</span>
                  </div>
                  <div className="segment-percentage">
                    {Math.round((item.count / stats.beneficiaries.reduce((a, b) => a + b.count, 0)) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="detailed-stats">
        <div className="table-card">
          <h3><BarChart3 size={18} /> {t('pathologiesStatistics')}</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>{t('pathology')}</th>
                <th>{t('cases')}</th>
                <th>{t('percentage')}</th>
                <th>{t('trend')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.pathologies.map((pathology, index) => (
                <tr key={index}>
                  <td>{pathology.name}</td>
                  <td>{pathology.count}</td>
                  <td>
                    {Math.round((pathology.count / stats.pathologies.reduce((a, b) => a + b.count, 0)) * 100)}%
                  </td>
                  <td>
                    <div className="trend-indicator">
                      <TrendingUp size={14} className="trend-up" />
                      <span>+{Math.floor(Math.random() * 10)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="insights-card">
          <h3>{t('keyInsights')}</h3>
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-icon positive">
                <TrendingUp size={16} />
              </div>
              <div className="insight-content">
                <p>{t('consultationsIncrease')}</p>
                <small>{t('consultationsIncreaseDetail')}</small>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon negative">
                <TrendingDown size={16} />
              </div>
              <div className="insight-content">
                <p>{t('costReduction')}</p>
                <small>{t('costReductionDetail')}</small>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon warning">
                <AlertTriangle size={16} />
              </div>
              <div className="insight-content">
                <p>{t('malariaAlert')}</p>
                <small>{t('malariaAlertDetail')}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;