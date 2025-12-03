import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectAuthenticated, logoutUser } from '../store/slices/authSlice';

const Contact = () => {
    const user = useSelector(selectUser);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // TODO: Implement contact form submission
        alert('Contact form submission will be implemented soon!');
    };

    return (
        <div>
            <div className="sub-header">
                <nav>
                    <Link to="/"><img src="/images/sports-amigo-logo.png" alt="SportsAmigo Logo" /></Link>
                    <div className="nav-links">
                        <ul>
                            <li><Link to="/">HOME</Link></li>
                            <li><Link to="/about">ABOUT</Link></li>
                            <li><Link to="/events">EVENTS</Link></li>
                            <li><Link to="/contact">CONTACT</Link></li>
                            {user ? (
                                <>
                                    <li className="dropdown">
                                        <a href="#">{user.first_name || user.email}</a>
                                        <div className="dropdown-content">
                                            <Link to={`/${user.role}/dashboard`}>Dashboard</Link>
                                            <Link to="/logout">Logout</Link>
                                        </div>
                                    </li>
                                </>
                            ) : (
                                <li><Link to="/login">LOGIN</Link></li>
                            )}
                        </ul>
                    </div>
                </nav>
                <h1>Contact Us</h1>
            </div>

            <section className="location">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1727.7533758744887!2d80.02548949911474!3d13.55551290617472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d773f1e0f8721%3A0xadb0842ffc2719e4!2sIndian%20Institute%20of%20Information%20Technology%2C%20Sri%20City%2C%20Chittoor!5e0!3m2!1sen!2sin!4v1759916318593!5m2!1sen!2sin" 
                    width="600" 
                    height="450" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy"
                    title="Location Map"
                ></iframe>
            </section>

            <section className="contact-us">
                <div className="row">
                    <div className="contact-col">
                        <div>
                            <i className="fa fa-home"></i>
                            <span>
                                <h5>Indian Institute of Information Technology, Sri City</h5>
                                <p>Chittoor, Andhra Pradesh, India</p>
                            </span>
                        </div>
                        <div>
                            <i className="fa fa-phone"></i>
                            <span>
                                <h5>+91 1234567890</h5>
                                <p>Monday to Friday, 9AM to 6PM</p>
                            </span>
                        </div>
                        <div>
                            <i className="fa fa-envelope-o"></i>
                            <span>
                                <h5>info.sportsamigo@gmail.com</h5>
                                <p>Email us your query</p>
                            </span>
                        </div>
                    </div>
                    <div className="contact-col">
                        <form onSubmit={handleSubmit}>
                            <input 
                                type="text" 
                                name="name" 
                                placeholder="Enter your name" 
                                value={formData.name}
                                onChange={handleChange}
                                required 
                            />
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="Enter email address" 
                                value={formData.email}
                                onChange={handleChange}
                                required 
                            />
                            <input 
                                type="text" 
                                name="subject" 
                                placeholder="Enter your subject" 
                                value={formData.subject}
                                onChange={handleChange}
                                required 
                            />
                            <textarea 
                                rows="8" 
                                name="message" 
                                placeholder="Message" 
                                value={formData.message}
                                onChange={handleChange}
                                required
                            ></textarea>
                            <button type="submit" className="hero-btn red-btn">Send Message</button>
                        </form>
                    </div>
                </div>
            </section>

            <section className="cta">
                <h1>Have Questions? We're Here to Help</h1>
                <Link to="/about" className="hero-btn">LEARN MORE ABOUT US</Link>
            </section>

            <section className="footer">
                <h4>About SportsAmigo</h4>
                <p>Connecting players, teams, and organizers to create the ultimate sports experience.<br />
                    Join us today and be part of the sports revolution!</p>
                <p>Made with <i className="fa fa-heart-o"></i> by SportsAmigo Team</p>
            </section>
        </div>
    );
};

export default Contact;
