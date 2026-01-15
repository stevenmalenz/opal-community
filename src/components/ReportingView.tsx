import { TrendingUp, Users, Search } from 'lucide-react';
import { Card } from './Card';
import './ReportingView.css';

export function ReportingView() {
    return (
        <div className="reporting-view">
            <div className="reporting-header">
                <div className="header-title">
                    <h2>Analytics</h2>
                    <p>Insights into content performance and learner behavior.</p>
                </div>
                <div className="date-range">
                    <span>Last 30 Days</span>
                </div>
            </div>

            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-icon blue">
                        <Users size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Active Learners</span>
                        <span className="stat-value">1,248</span>
                        <span className="stat-trend positive">+12% vs last month</span>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-icon purple">
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Content Views</span>
                        <span className="stat-value">45.2k</span>
                        <span className="stat-trend positive">+8% vs last month</span>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-icon green">
                        <Search size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Searches</span>
                        <span className="stat-value">8,932</span>
                        <span className="stat-trend negative">-3% vs last month</span>
                    </div>
                </Card>
            </div>

            <div className="charts-grid">
                <Card className="chart-card">
                    <div className="card-header">
                        <h3>Top Content</h3>
                        <button className="btn-text">View All</button>
                    </div>
                    <div className="list-view">
                        {[
                            { title: 'Sales Negotiation Playbook', views: '4.2k', trend: '+15%' },
                            { title: 'Q4 Product Roadmap', views: '3.1k', trend: '+8%' },
                            { title: 'Competitor Battlecards: 2024', views: '2.8k', trend: '+22%' },
                            { title: 'Objection Handling Scripts', views: '2.1k', trend: '-5%' },
                            { title: 'Pricing Calculator Guide', views: '1.9k', trend: '+2%' },
                        ].map((item, i) => (
                            <div key={i} className="list-item">
                                <span className="item-rank">{i + 1}</span>
                                <span className="item-title">{item.title}</span>
                                <span className="item-views">{item.views}</span>
                                <span className={`item-trend ${item.trend.startsWith('+') ? 'pos' : 'neg'}`}>
                                    {item.trend}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="chart-card">
                    <div className="card-header">
                        <h3>Top Search Queries</h3>
                    </div>
                    <div className="list-view">
                        {[
                            { query: 'how to handle pricing objection', count: 432 },
                            { query: 'competitor x comparison', count: 389 },
                            { query: 'q4 commission plan', count: 312 },
                            { query: 'demo login credentials', count: 256 },
                            { query: 'refund policy', count: 198 },
                        ].map((item, i) => (
                            <div key={i} className="list-item">
                                <span className="item-rank">{i + 1}</span>
                                <span className="item-title">"{item.query}"</span>
                                <span className="item-count">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
