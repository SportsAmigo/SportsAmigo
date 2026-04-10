import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './Wallet.css';

const Wallet = () => {
    const user = useSelector(selectUser);
    const [walletData, setWalletData] = useState({
        balance: 0,
        totalCredits: 0,
        totalDebits: 0,
        transactionCount: 0,
        recentTransactions: []
    });
    const [showAddFundsModal, setShowAddFundsModal] = useState(false);
    const [fundAmount, setFundAmount] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/wallet', { withCredentials: true });
            if (response.data.success) {
                setWalletData(response.data.wallet);
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFunds = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/wallet/add-funds', 
                { amount: parseFloat(fundAmount) },
                { withCredentials: true }
            );
            if (response.data.success) {
                alert('Funds added successfully!');
                setShowAddFundsModal(false);
                setFundAmount('');
                fetchWalletData();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding funds');
        }
    };

    return (
        <PlayerLayout>
            <div className="browse-wrapper">
                <div className="wallet-header">
                    <div className="wallet-header-content">
                        <div className="header-title-section">
                            <h1><i className="fa fa-wallet"></i> My Wallet</h1>
                            <p>Manage your wallet balance and view transaction history</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Loading wallet...</p>
                    </div>
                ) : (
                    <>
                        <div className="wallet-overview">
                            <div className="wallet-balance-card">
                                <div className="balance-header">
                                    <div className="balance-icon">
                                        <i className="fa fa-wallet"></i>
                                    </div>
                                    <div className="balance-info">
                                        <h2>Current Balance</h2>
                                        <div className="balance-amount">
                                            ₹{walletData.balance.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="balance-actions">
                                    <button className="add-funds-btn" onClick={() => setShowAddFundsModal(true)}>
                                        <i className="fa fa-plus"></i> Add Funds
                                    </button>
                                    <Link to="/shop" className="shop-btn">
                                        <i className="fa fa-shopping-bag"></i> Shop Now
                                    </Link>
                                </div>
                            </div>

                            <div className="wallet-stats-grid">
                                <div className="wallet-stat-card credit">
                                    <div className="stat-icon">
                                        <i className="fa fa-arrow-up"></i>
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Total Credits</span>
                                        <span className="stat-value">₹{walletData.totalCredits.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="wallet-stat-card debit">
                                    <div className="stat-icon">
                                        <i className="fa fa-arrow-down"></i>
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Total Debits</span>
                                        <span className="stat-value">₹{walletData.totalDebits.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="wallet-stat-card transactions">
                                    <div className="stat-icon">
                                        <i className="fa fa-exchange-alt"></i>
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Transactions</span>
                                        <span className="stat-value">{walletData.transactionCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="transactions-section">
                            <div className="transactions-header">
                                <h2><i className="fa fa-history"></i> Recent Transactions</h2>
                            </div>
                            <div className="transactions-container">
                                {walletData.recentTransactions && walletData.recentTransactions.length > 0 ? (
                                    walletData.recentTransactions.map((transaction, index) => (
                                        <div key={index} className={`transaction-item ${transaction.transactionType.toLowerCase()}`}>
                                            <div className="transaction-icon-wrapper">
                                                <i className={`fa ${transaction.transactionType === 'Credit' ? 'fa-plus-circle' : 'fa-minus-circle'}`}></i>
                                            </div>
                                            <div className="transaction-info">
                                                <h4 className="transaction-desc">{transaction.description}</h4>
                                                <p className="transaction-date">
                                                    {new Date(transaction.timestamp).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className={`transaction-amount-display ${transaction.transactionType.toLowerCase()}`}>
                                                {transaction.transactionType === 'Credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-transactions">
                                        <div className="empty-icon">
                                            <i className="fa fa-receipt"></i>
                                        </div>
                                        <h3>No Transactions Yet</h3>
                                        <p>Your transaction history will appear here once you start using your wallet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {showAddFundsModal && (
                <div className="modal-overlay" onClick={() => setShowAddFundsModal(false)}>
                    <div className="funds-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><i className="fa fa-plus-circle"></i> Add Funds to Wallet</h2>
                            <button className="modal-close-btn" onClick={() => setShowAddFundsModal(false)}>
                                <i className="fa fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleAddFunds} className="funds-form">
                                <div className="form-group">
                                    <label htmlFor="fundAmount">Amount (₹)</label>
                                    <input
                                        type="number"
                                        id="fundAmount"
                                        className="form-input"
                                        value={fundAmount}
                                        onChange={(e) => setFundAmount(e.target.value)}
                                        min="1"
                                        max="50000"
                                        placeholder="Enter amount to add"
                                        required
                                    />
                                    <small className="form-hint">Minimum: ₹1 | Maximum: ₹50,000</small>
                                </div>
                                <div className="form-actions">
                                    <button type="button" onClick={() => setShowAddFundsModal(false)} className="btn-cancel">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        <i className="fa fa-check"></i> Add Funds
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </PlayerLayout>
    );
};

export default Wallet;
