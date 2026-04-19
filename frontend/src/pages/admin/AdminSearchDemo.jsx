import React, { useState, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

const Badge = ({ label, color }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
        {label}
    </span>
);

const AdminSearchDemo = () => {
    const [query, setQuery] = useState('');
    const [type, setType] = useState('all');
    const [results, setResults] = useState(null);
    const [meta, setMeta] = useState(null);
    const [headers, setHeaders] = useState({});
    const [loading, setLoading] = useState(false);
    const [reindexing, setReindexing] = useState(false);
    const [reindexResult, setReindexResult] = useState(null);

    const doSearch = useCallback(async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResults(null);
        setMeta(null);
        setHeaders({});
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/search`, {
                params: { q: query, type, limit: 15 },
                withCredentials: true
            });
            setResults(res.data.results || {});
            setMeta(res.data.searchMeta || {});
            // Extract custom headers
            setHeaders({
                'X-Search-Engine': res.headers['x-search-engine'] || 'N/A',
                'X-Search-Time': res.headers['x-search-time'] || 'N/A',
                'X-Search-Provider': res.headers['x-search-provider'] || 'N/A',
                'X-Solr-Enabled': res.headers['x-solr-enabled'] || 'N/A'
            });
        } catch (err) {
            console.error('Search error:', err);
            setMeta({ engine: 'error', responseTimeMs: 0 });
        } finally {
            setLoading(false);
        }
    }, [query, type]);

    const doReindex = async () => {
        setReindexing(true);
        setReindexResult(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/admin/search/reindex`, {}, { withCredentials: true });
            setReindexResult(res.data.data);
        } catch (err) {
            setReindexResult({ error: err.message });
        } finally {
            setReindexing(false);
        }
    };

    const renderResultTable = (label, icon, data, fields) => {
        if (!data || !data.data || data.data.length === 0) return null;
        return (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <i className={`fas ${icon} text-indigo-500`}></i>
                    <h3 className="font-bold text-gray-800">{label}</h3>
                    <Badge label={`${data.pagination?.total || data.data.length} results`} color="bg-indigo-100 text-indigo-700" />
                    <Badge label={data.searchMeta?.engine || 'unknown'} color={data.searchMeta?.engine === 'solr' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} />
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left">
                            <tr>
                                {fields.map(f => <th key={f.key} className="px-4 py-2.5 font-semibold text-gray-600">{f.label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.slice(0, 10).map((row, i) => (
                                <tr key={row.id || row._id || i} className="border-t border-slate-100 hover:bg-indigo-50/50 transition-colors">
                                    {fields.map(f => (
                                        <td key={f.key} className="px-4 py-2.5 text-gray-700">{f.render ? f.render(row) : (row[f.key] || '—')}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <i className="fas fa-search text-white text-xl"></i>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-800">SearchStax / Solr Demo</h1>
                            <p className="text-gray-500 text-sm">Search optimization using Apache Solr via SearchStax — visible in Network tab headers</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 mb-6">
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[250px]">
                            <div className="relative">
                                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                                    placeholder="Search events, teams, users... (try 'cricket', 'football', a name)"
                                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <select value={type} onChange={(e) => setType(e.target.value)}
                            className="px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500">
                            <option value="all">All</option>
                            <option value="events">Events</option>
                            <option value="teams">Teams</option>
                            <option value="users">Users</option>
                        </select>
                        <button onClick={doSearch} disabled={loading || !query.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2">
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                            Search
                        </button>
                        <button onClick={doReindex} disabled={reindexing}
                            className="px-4 py-3 border border-amber-300 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-50 flex items-center gap-2">
                            {reindexing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                            Reindex Solr
                        </button>
                    </div>

                    {reindexResult && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
                            {reindexResult.error ? (
                                <span><i className="fas fa-exclamation-triangle mr-2"></i> {reindexResult.error}</span>
                            ) : (
                                <span><i className="fas fa-check-circle mr-2"></i> Reindexed: {reindexResult.events} events, {reindexResult.teams} teams, {reindexResult.users} users in {reindexResult.timeMs}ms</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Response Headers (visible proof for professor) */}
                {meta && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                                <h2 className="font-bold flex items-center gap-2">
                                    <i className="fas fa-network-wired"></i> Response Headers (Network Tab Proof)
                                </h2>
                            </div>
                            <div className="p-6">
                                <p className="text-xs text-gray-500 mb-3">These headers are visible in browser DevTools → Network → select the request → Headers tab</p>
                                {Object.entries(headers).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{key}</span>
                                        <span className={`text-sm font-semibold ${val.includes('Solr') ? 'text-emerald-600' : 'text-gray-700'}`}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                                <h2 className="font-bold flex items-center gap-2">
                                    <i className="fas fa-info-circle"></i> Search Metadata
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Engine</span>
                                        <Badge label={meta.engine || 'N/A'} color={meta.engine?.includes('Solr') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} />
                                    </div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Provider</span><span className="font-semibold text-gray-800">{meta.provider || 'N/A'}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Response Time</span><span className="font-mono font-bold text-indigo-600">{meta.responseTimeMs}ms</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Solr Enabled</span><Badge label={meta.solrEnabled ? 'Yes' : 'No'} color={meta.solrEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} /></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Solr Configured</span><Badge label={meta.solrConfigured ? 'Yes' : 'No'} color={meta.solrConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {results && (
                    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                        {renderResultTable('Events', 'fa-calendar-alt', results.events, [
                            { key: 'title', label: 'Title', render: r => r.title || r.name || '—' },
                            { key: 'sport_type', label: 'Sport' },
                            { key: 'location', label: 'Location' },
                            { key: 'status', label: 'Status' }
                        ])}
                        {renderResultTable('Teams', 'fa-users', results.teams, [
                            { key: 'name', label: 'Team Name' },
                            { key: 'sport_type', label: 'Sport' },
                            { key: 'description', label: 'Description', render: r => (r.description || '—').substring(0, 80) }
                        ])}
                        {renderResultTable('Users', 'fa-user', results.users, [
                            { key: 'name', label: 'Name', render: r => `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email || '—' },
                            { key: 'email', label: 'Email' },
                            { key: 'role', label: 'Role' }
                        ])}
                        {(!results.events?.data?.length && !results.teams?.data?.length && !results.users?.data?.length) && (
                            <div className="text-center py-8 text-gray-400">
                                <i className="fas fa-search text-4xl mb-3"></i>
                                <p>No results found for "{query}"</p>
                            </div>
                        )}
                    </div>
                )}

                {/* How to Demo */}
                <div className="mt-6 bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <h2 className="font-bold flex items-center gap-2">
                            <i className="fas fa-graduation-cap"></i> How to Demo to Professor
                        </h2>
                    </div>
                    <div className="p-6 text-sm text-gray-700 space-y-3">
                        <p><strong>1.</strong> Type a search term (e.g. "cricket", "Mumbai", a player name) and press Search</p>
                        <p><strong>2.</strong> Open browser <strong>DevTools → Network tab</strong></p>
                        <p><strong>3.</strong> Click on the <code className="bg-gray-100 px-1 rounded">search?q=...</code> request in the Network list</p>
                        <p><strong>4.</strong> Click <strong>Headers</strong> → scroll to <strong>Response Headers</strong></p>
                        <p><strong>5.</strong> Show: <code className="bg-emerald-50 text-emerald-700 px-1 rounded">X-Search-Engine: SearchStax-Solr</code>, <code className="bg-emerald-50 text-emerald-700 px-1 rounded">X-Search-Time: Xms</code>, <code className="bg-emerald-50 text-emerald-700 px-1 rounded">X-Search-Provider: SearchStax (Apache Solr)</code></p>
                        <p><strong>6.</strong> Explain: "We use SearchStax (managed Apache Solr) for full-text search with eDisMax queries, fuzzy matching (~2), and field boosting (title^4, description^2)"</p>
                        <p><strong>7.</strong> Click <strong>Reindex Solr</strong> to show live re-indexing of all MongoDB documents into Solr</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSearchDemo;
