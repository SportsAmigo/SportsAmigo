import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/layout/AdminLayout';
import { API_BASE_URL } from '../../utils/constants';

const StatusBadge = ({ status }) => {
    const isOk = ['active', 'up', 'running', 'passed', 'connected', 'ok'].includes((status || '').toLowerCase());
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${isOk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {status || 'unknown'}
        </span>
    );
};

const ProofCard = ({ title, value, subtitle, accent = 'indigo', icon }) => (
    <div className={`bg-white rounded-2xl shadow-md p-5 border border-${accent}-100`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className={`text-3xl font-bold text-${accent}-700 mt-1`}>{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {icon && <i className={`fas ${icon} text-2xl text-${accent}-200`}></i>}
        </div>
    </div>
);

const AdminOperationalProof = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [proof, setProof] = useState({ redis: null, cicd: null, containers: null, integrations: null });
    const [dbOpt, setDbOpt] = useState(null);
    const [apiStats, setApiStats] = useState(null);
    const [testResults, setTestResults] = useState(null);
    const [deployment, setDeployment] = useState(null);
    const [testsLoading, setTestsLoading] = useState(false);

    const fetchProof = useCallback(async () => {
        try {
            setLoading(true);
            const [redisRes, cicdRes, containersRes, integrationsRes, dbRes, apiRes, deployRes] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/api/admin/observability/redis`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/observability/cicd`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/observability/containers`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/observability/integrations`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/observability/db-optimization`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/observability/api-stats`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/observability/deployment`, { withCredentials: true }),
            ]);
            setProof({
                redis: redisRes.status === 'fulfilled' ? redisRes.value.data?.data : null,
                cicd: cicdRes.status === 'fulfilled' ? cicdRes.value.data?.data : null,
                containers: containersRes.status === 'fulfilled' ? containersRes.value.data?.data : null,
                integrations: integrationsRes.status === 'fulfilled' ? integrationsRes.value.data?.data : null,
            });
            setDbOpt(dbRes.status === 'fulfilled' ? dbRes.value.data?.data : null);
            setApiStats(apiRes.status === 'fulfilled' ? apiRes.value.data?.data : null);
            setDeployment(deployRes.status === 'fulfilled' ? deployRes.value.data?.data : null);
        } catch (e) {
            console.error('Proof fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const runTests = async () => {
        setTestsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/observability/test-results`, { withCredentials: true, timeout: 90000 });
            setTestResults(res.data?.data);
        } catch (e) {
            setTestResults({ status: 'error', error: e.message });
        } finally {
            setTestsLoading(false);
        }
    };

    useEffect(() => { fetchProof(); }, [fetchProof]);

    const exportSnapshot = () => {
        const snapshot = { proof, dbOpt, apiStats, testResults, deployment, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admin-proof-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const TABS = [
        { id: 'overview', label: 'Overview', icon: 'fa-tachometer-alt' },
        { id: 'db', label: 'DB Optimization', icon: 'fa-database' },
        { id: 'api', label: 'API / Swagger', icon: 'fa-code' },
        { id: 'tests', label: 'Unit Tests', icon: 'fa-vial' },
        { id: 'deployment', label: 'Deployment', icon: 'fa-cloud-upload-alt' },
    ];

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">⚗️ Operational Proof Center</h1>
                        <p className="text-gray-600">Live evidence: Redis cache, DB indexes, CI/CD, Docker, Swagger API, unit tests, and deployment telemetry.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchProof} className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-gray-100 flex items-center gap-2">
                            <i className="fas fa-sync-alt"></i> Refresh
                        </button>
                        <button onClick={exportSnapshot} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 flex items-center gap-2">
                            <i className="fas fa-download"></i> Export JSON
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
                            <i className={`fas ${tab.icon}`}></i> {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl shadow-md p-16 text-center">
                        <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                        <p className="text-gray-600">Loading operational telemetry...</p>
                    </div>
                ) : (
                    <>
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <ProofCard title="Redis Cache Δ" value={`${proof.redis?.deltaMs ?? 'N/A'} ms`} subtitle={`Hit: ${proof.redis?.hitLatencyMs ?? '-'} ms | Miss: ${proof.redis?.missLatencyMs ?? '-'} ms`} accent="cyan" icon="fa-bolt" />
                                    <ProofCard title="CI/CD Status" value={(proof.cicd?.pipelineStatus || 'N/A').toUpperCase()} subtitle={`Branch: ${proof.cicd?.branch || 'N/A'}`} accent="indigo" icon="fa-code-branch" />
                                    <ProofCard title="Containers" value={(proof.containers?.serviceStatus || 'N/A').toUpperCase()} subtitle={`Restarts: ${proof.containers?.restartCount ?? 0}`} accent="amber" icon="fa-docker" />
                                    <ProofCard title="Solr / Cloudinary" value={proof.integrations?.solr?.status || 'N/A'} subtitle={`Cloudinary: ${proof.integrations?.cloudinary?.status || 'N/A'}`} accent="emerald" icon="fa-search" />
                                </div>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                                        <div className="px-6 py-4 border-b bg-slate-50 font-bold text-gray-800 flex items-center gap-2">
                                            <i className="fas fa-bolt text-cyan-600"></i> Redis / CI-CD / Docker Details
                                        </div>
                                        <div className="p-6 space-y-4 text-sm">
                                            <div>
                                                <p className="font-semibold text-gray-800 mb-1">Redis</p>
                                                <p className="text-gray-600">Status: {proof.redis?.status || 'unknown'} | Hit ratio: {proof.redis?.hitRatio ?? 'N/A'}</p>
                                                <p className="text-gray-600">Sampled at: {proof.redis?.sampledAt ? new Date(proof.redis.sampledAt).toLocaleString() : 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 mb-1">CI/CD</p>
                                                <p className="text-gray-600">Commit: {proof.cicd?.commitId || 'N/A'} | Env: {proof.cicd?.environment || 'N/A'}</p>
                                                <p className="text-gray-600">Last deploy: {proof.cicd?.lastDeployAt || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 mb-1">Containers</p>
                                                <p className="text-gray-600">CPU: {proof.containers?.cpuPercent ?? 'N/A'}% | Memory: {proof.containers?.memoryMb ?? 'N/A'} MB</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                                        <div className="px-6 py-4 border-b bg-slate-50 font-bold text-gray-800 flex items-center gap-2">
                                            <i className="fas fa-plug text-emerald-600"></i> Solr + Cloudinary Integration
                                        </div>
                                        <div className="p-6 space-y-4 text-sm">
                                            <div>
                                                <p className="font-semibold text-gray-800 mb-1">Solr</p>
                                                <p className="text-gray-600">Status: {proof.integrations?.solr?.status || 'unknown'} | Latency: {proof.integrations?.solr?.latencyMs ?? 'N/A'} ms</p>
                                                <p className="text-gray-600">Event docs: {proof.integrations?.solr?.eventDocuments ?? 'N/A'} | Collection: {proof.integrations?.solr?.eventCollection || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 mb-1">Cloudinary</p>
                                                <p className="text-gray-600">Cloud: {proof.integrations?.cloudinary?.cloudName || 'N/A'} | Status: {proof.integrations?.cloudinary?.status || 'unknown'}</p>
                                                <p className="text-gray-600">Latency: {proof.integrations?.cloudinary?.latencyMs ?? 'N/A'} ms | Folder: {proof.integrations?.cloudinary?.folder || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DB OPTIMIZATION TAB */}
                        {activeTab === 'db' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-2xl shadow-md p-5 border border-blue-100">
                                        <p className="text-sm text-gray-500 mb-1">Redis Cache (DB Benchmark)</p>
                                        <p className="text-3xl font-bold text-blue-700">{dbOpt?.redis?.hitLatencyMs ?? 'N/A'} ms</p>
                                        <p className="text-xs text-gray-500 mt-1">Hit latency | Miss: {dbOpt?.redis?.missLatencyMs ?? 'N/A'} ms</p>
                                        <div className="mt-2"><StatusBadge status={dbOpt?.redis?.status || 'unavailable'} /></div>
                                    </div>
                                    <div className="bg-white rounded-2xl shadow-md p-5 border border-purple-100">
                                        <p className="text-sm text-gray-500 mb-1">Total Indexed Collections</p>
                                        <p className="text-3xl font-bold text-purple-700">{dbOpt?.indexes ? Object.keys(dbOpt.indexes).length : 0}</p>
                                        <p className="text-xs text-gray-500 mt-1">User, Team, Event, Match, Subscription</p>
                                    </div>
                                </div>
                                {dbOpt?.indexes && Object.entries(dbOpt.indexes).map(([collection, indexes]) => (
                                    <div key={collection} className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                                        <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                                            <span className="font-bold text-gray-800 capitalize">{collection} Collection Indexes</span>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{indexes.length} indexes</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Index Name</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fields</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {indexes.map((idx, i) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-mono text-xs text-gray-700">{idx.name}</td>
                                                            <td className="px-4 py-3 text-xs text-gray-600">{JSON.stringify(idx.fields)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* API / SWAGGER TAB */}
                        {activeTab === 'api' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <ProofCard title="Total Endpoints" value={apiStats?.totalEndpoints ?? 'N/A'} subtitle="Documented in Swagger" accent="indigo" icon="fa-code" />
                                    <ProofCard title="B2B Endpoint Groups" value={apiStats?.b2bEndpoints?.length ?? 0} subtitle="Business API groups" accent="amber" icon="fa-building" />
                                    <ProofCard title="B2C Endpoint Groups" value={apiStats?.b2cEndpoints?.length ?? 0} subtitle="Consumer API groups" accent="rose" icon="fa-mobile-alt" />
                                </div>
                                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                                    <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                                        <span className="font-bold text-gray-800 flex items-center gap-2"><i className="fas fa-code text-indigo-600"></i> OpenAPI Tag Breakdown</span>
                                        <a href={`${API_BASE_URL}/api-docs`} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
                                            <i className="fas fa-external-link-alt"></i> Open Swagger UI
                                        </a>
                                    </div>
                                    {apiStats?.tagBreakdown && (
                                        <div className="p-6">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {Object.entries(apiStats.tagBreakdown).sort((a, b) => b[1] - a[1]).map(([tag, count]) => (
                                                    <div key={tag} className="bg-gray-50 rounded-xl p-3 border">
                                                        <p className="text-xs text-gray-500 font-semibold truncate">{tag}</p>
                                                        <p className="text-2xl font-bold text-indigo-700">{count}</p>
                                                        <p className="text-xs text-gray-400">endpoints</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <i className="fas fa-info-circle text-indigo-600 text-xl"></i>
                                        <p className="font-bold text-indigo-800">Swagger Documentation</p>
                                    </div>
                                    <p className="text-indigo-700 text-sm mb-3">OpenAPI 3.0 spec auto-generated from source code annotations. Covers all B2B and B2C flows including auth, events, teams, matches, VAS, subscriptions, commissions, and admin endpoints.</p>
                                    <p className="text-sm text-indigo-600"><strong>Version:</strong> {apiStats?.openApiVersion} | <strong>URL:</strong> <code className="bg-indigo-100 px-2 py-0.5 rounded">/api-docs</code></p>
                                </div>
                            </div>
                        )}

                        {/* UNIT TESTS TAB */}
                        {activeTab === 'tests' && (
                            <div className="space-y-6">
                                {!testResults && (
                                    <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                                        <i className="fas fa-vial text-5xl text-gray-300 mb-4"></i>
                                        <p className="text-gray-600 mb-6">Click "Run Tests" to execute the unit test suite and view results live.</p>
                                        <button onClick={runTests} disabled={testsLoading}
                                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 mx-auto">
                                            {testsLoading ? <><i className="fas fa-spinner fa-spin"></i> Running Tests...</> : <><i className="fas fa-play"></i> Run Tests</>}
                                        </button>
                                    </div>
                                )}
                                {testResults && (
                                    <>
                                        <div className="grid grid-cols-3 gap-4">
                                            <ProofCard title="Tests Passed" value={testResults.passed ?? 0} accent="emerald" icon="fa-check-circle" />
                                            <ProofCard title="Tests Failed" value={testResults.failed ?? 0} accent="red" icon="fa-times-circle" />
                                            <ProofCard title="Total Tests" value={testResults.total ?? 0} accent="indigo" icon="fa-vial" />
                                        </div>
                                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border">
                                            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                                                <span className="font-bold text-gray-800">Test Suite Results — {testResults.lastRun ? new Date(testResults.lastRun).toLocaleString() : ''}</span>
                                                <div className="flex gap-2">
                                                    <StatusBadge status={testResults.status} />
                                                    <button onClick={runTests} disabled={testsLoading} className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-100 flex items-center gap-2">
                                                        {testsLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-redo"></i>} Re-run
                                                    </button>
                                                </div>
                                            </div>
                                            {testResults.testFiles && testResults.testFiles.length > 0 && (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 border-b">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Test File</th>
                                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Passed</th>
                                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Failed</th>
                                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {testResults.testFiles.map((f, i) => (
                                                                <tr key={i} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-3 font-mono text-xs">{f.file}</td>
                                                                    <td className="px-4 py-3 text-emerald-700 font-bold">{f.passed}</td>
                                                                    <td className="px-4 py-3 text-red-600 font-bold">{f.failed}</td>
                                                                    <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {testResults.error && (
                                                <div className="p-6 bg-red-50 border-t border-red-200">
                                                    <p className="text-sm text-red-700 font-mono">{testResults.error}</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* DEPLOYMENT TAB */}
                        {activeTab === 'deployment' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-2xl shadow-md p-5 border border-blue-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <i className="fas fa-globe text-blue-600"></i>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{deployment?.frontend?.platform || 'Vercel'}</p>
                                                <p className="text-sm text-gray-500">Frontend</p>
                                            </div>
                                            <div className="ml-auto"><StatusBadge status={deployment?.frontend?.status || 'unknown'} /></div>
                                        </div>
                                        <p className="text-xs text-gray-600 font-mono break-all">{deployment?.frontend?.url || 'N/A'}</p>
                                    </div>
                                    <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <i className="fas fa-server text-emerald-600"></i>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{deployment?.backend?.platform || 'Render'}</p>
                                                <p className="text-sm text-gray-500">Backend</p>
                                            </div>
                                            <div className="ml-auto"><StatusBadge status={deployment?.backend?.status || 'unknown'} /></div>
                                        </div>
                                        <p className="text-xs text-gray-600 font-mono break-all">{deployment?.backend?.url || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><i className="fas fa-info-circle text-slate-600"></i> Build Info</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Environment', value: deployment?.environment || 'N/A' },
                                            { label: 'Commit ID', value: deployment?.commitId || 'N/A' },
                                            { label: 'Branch', value: deployment?.branch || 'N/A' },
                                            { label: 'Last Checked', value: deployment?.lastChecked ? new Date(deployment.lastChecked).toLocaleString() : 'N/A' },
                                        ].map(item => (
                                            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                                                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">{item.label}</p>
                                                <p className="font-mono text-sm text-gray-800 break-all">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminOperationalProof;
