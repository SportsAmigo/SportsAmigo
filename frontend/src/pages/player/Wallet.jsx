import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import axios from 'axios';

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
        <div>
            <section className="header shop-header">
                <nav>
                    <Link to="/"><img src="/images/sports-amigo-logo.png" alt="SportsAmigo Logo" /></Link>
                    <div className="nav-links">
                        <ul>
                            <li><Link to="/">HOME</Link></li>
                            <li><Link to="/about">ABOUT</Link></li>
                            <li><Link to="/shop">SHOP</Link></li>
                            <li><Link to="/contact">CONTACT</Link></li>
                            <li><Link to="/shop/cart">🛒 Cart</Link></li>
                            <li className="dropdown">
                                <a href="#">{user?.first_name}</a>
                                <div className="dropdown-content">
                                    <Link to="/wallet" className="active">💰 My Wallet</Link>
                                    <Link to="/shop/orders">My Orders</Link>
                                    <Link to="/player/dashboard">Dashboard</Link>
                                    <Link to="/logout">Logout</Link>
                                </div>
                            </li>
                        </ul>
                    </div>
                </nav>
                <div className="text-box">
                    <h1>My Wallet</h1>
                    <p>Manage your wallet balance and view transaction history.</p>
                </div>
            </section>

            <section className="wallet-section">
                <div className="container">
                    <div className="wallet-balance-card">
                        <div className="balance-header">
                            <h2>My Wallet Balance</h2>
                            <div className="balance-amount">
                                ₹<span>{walletData.balance.toFixed(2)}</span>
                            </div>
                            <p className="balance-status">
                                <span className="status-indicator active"></span>
                                Wallet Active
                            </p>
                        </div>
                        
                        <div className="quick-actions">
                            <button className="add-funds-btn" onClick={() => setShowAddFundsModal(true)}>
                                + Add Funds
                            </button>
                            <Link to="/shop" className="shop-now-btn">Shop Now</Link>
                        </div>
                    </div>

                    <div className="wallet-stats">
                        <div className="stat-card">
                            <div className="stat-icon">+</div>
                            <div className="stat-info">
                                <h3>Total Credits</h3>
                                <p>₹{walletData.totalCredits.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">-</div>
                            <div className="stat-info">
                                <h3>Total Debits</h3>
                                <p>₹{walletData.totalDebits.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">#</div>
                            <div className="stat-info">
                                <h3>Transactions</h3>
                                <p>{walletData.transactionCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="transaction-history">
                        <div className="history-header">
                            <h2>Recent Transactions</h2>
                        </div>
                        <div className="transactions-list">
                            {walletData.recentTransactions && walletData.recentTransactions.length > 0 ? (
                                walletData.recentTransactions.map((transaction, index) => (
                                    <div key={index} className={`transaction-item ${transaction.transactionType.toLowerCase()}`}>
                                        <div className="transaction-icon">
                                            {transaction.transactionType === 'Credit' ? '💰' : '🛍️'}
                                        </div>
                                        <div className="transaction-details">
                                            <h4>{transaction.description}</h4>
                                            <p className="transaction-time">
                                                {new Date(transaction.timestamp).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className={`transaction-amount ${transaction.transactionType.toLowerCase()}`}>
                                            {transaction.transactionType === 'Credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-transactions">
                                    <div className="no-transactions-icon">💳</div>
                                    <h3>No transactions yet</h3>
                                    <p>Your transaction history will appear here once you start using your wallet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {showAddFundsModal && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowAddFundsModal(false)}>&times;</span>
                        <div className="modal-body">
                            <h2>Add Funds to Wallet</h2>
                            <form onSubmit={handleAddFunds}>
                                <div className="form-group">
                                    <label htmlFor="fundAmount">Amount (₹)</label>
                                    <input
                                        type="number"
                                        id="fundAmount"
                                        value={fundAmount}
                                        onChange={(e) => setFundAmount(e.target.value)}
                                        min="1"
                                        max="50000"
                                        placeholder="Enter amount to add"
                                        required
                                    />
                                    <small className="form-help">Minimum: ₹1 | Maximum: ₹50,000</small>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowAddFundsModal(false)} className="cancel-btn">
                                        Cancel
                                    </button>
                                    <button type="submit" className="add-funds-submit-btn">
                                        Add Funds
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
