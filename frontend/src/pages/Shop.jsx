import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectAuthenticated, logoutUser } from '../store/slices/authSlice';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const Shop = () => {
    const user = useSelector(selectUser);
    const authenticated = useSelector(selectAuthenticated);
    const dispatch = useDispatch();
    const logout = () => dispatch(logoutUser());
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [selectedCategory]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const url = selectedCategory 
                ? `${API_BASE_URL}/api/shop/items?category=${selectedCategory}`
                : `${API_BASE_URL}/api/shop/items`;
            
            const response = await axios.get(url);
            if (response.data.success) {
                setProducts(response.data.items);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/shop/categories`);
            if (response.data.success) {
                setCategories(response.data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            fetchProducts();
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/shop/items?search=${searchTerm}`);
            if (response.data.success) {
                setProducts(response.data.items);
            }
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const addToCart = (productId) => {
        if (!authenticated) {
            alert('Please login to add items to cart');
            navigate('/login');
            return;
        }
        // TODO: Implement add to cart functionality
        alert('Add to cart functionality coming soon!');
    };

    return (
        <div>
            {/* Header Section */}
            <section className="header shop-header">
                <nav>
                    <Link to="/"><img src="/images/sports-amigo-logo.png" alt="SportsAmigo Association Logo" /></Link>
                    <div className="nav-links" id="navLinks">
                        <ul>
                            <li><Link to="/">HOME</Link></li>
                            <li><Link to="/about">ABOUT</Link></li>
                            <li><Link to="/events">EVENTS</Link></li>
                            {/* <li><Link to="/shop" className="active">SHOP</Link></li> */}
                            <li><Link to="/contact">CONTACT</Link></li>
                            {authenticated ? (
                                <>
                                    <li className="dropdown">
                                        <a href="#">{user.first_name || user.email} ▼</a>
                                        <div className="dropdown-content">
                                            <Link to={`/${user.role}/dashboard`}>Dashboard</Link>
                                            {user.role === 'player' && <Link to="/player/wallet">💰 Wallet</Link>}
                                            <a href="#" onClick={handleLogout}>Logout</a>
                                        </div>
                                    </li>
                                </>
                            ) : (
                                <li><Link to="/login">LOGIN</Link></li>
                            )}
                        </ul>
                    </div>
                </nav>

                <div className="text-box">
                    <h1>SportsAmigo Shop</h1>
                    <p>Discover premium sports gear, apparel, and equipment for all your sporting needs.</p>
                </div>
            </section>

            {/* Shop Section */}
            <section className="shop-section">
                <div className="container">
                    <h1>Browse Products</h1>
                    
                    {/* Search and Filter Bar */}
                    <div className="shop-controls">
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder="Search products..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button type="button" onClick={handleSearch}>🔍</button>
                        </div>
                        
                        <div className="filter-container">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="loading-message">Loading products...</div>
                    ) : (
                        <div className="products-grid">
                            {products.length > 0 ? (
                                products.map(product => (
                                    <div key={product._id} className="product-card">
                                        <div className="product-image">
                                            <img 
                                                src={product.imageUrl || '/images/shop/default-product.jpg'} 
                                                alt={product.name}
                                                onError={(e) => e.target.src = '/images/bg.jpg'}
                                            />
                                            {product.stock === 0 && (
                                                <div className="out-of-stock-overlay">Out of Stock</div>
                                            )}
                                        </div>
                                        <div className="product-info">
                                            <h3>{product.name}</h3>
                                            <p className="product-category">{product.category}</p>
                                            <p className="product-description">
                                                {product.description ? product.description.substring(0, 100) + '...' : 'No description available'}
                                            </p>
                                            <div className="product-price">${product.price ? product.price.toFixed(2) : '0.00'}</div>
                                            {product.stock > 0 ? (
                                                <button 
                                                    className="add-to-cart-btn" 
                                                    onClick={() => addToCart(product._id)}
                                                >
                                                    Add to Cart
                                                </button>
                                            ) : (
                                                <button className="add-to-cart-btn" disabled>
                                                    Out of Stock
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-products-message">
                                    <p>No products found{searchTerm ? ` for "${searchTerm}"` : selectedCategory ? ` in ${selectedCategory}` : ''}.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <section className="footer">
                <h4>About SportsAmigo Shop</h4>
                <p>Premium sports gear, apparel, and equipment for all your sporting needs.</p>
                <p>Made with <i className="fa fa-heart-o"></i> by SportsAmigo Team</p>
            </section>
        </div>
    );
};

export default Shop;
