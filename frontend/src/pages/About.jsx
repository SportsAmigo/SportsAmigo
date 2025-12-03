import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

const About = () => {
    const user = useSelector(selectUser);

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
                <h1>About Us</h1>
            </div>

            <section className="about-us">
                <div className="row">
                    <div className="about-col">
                        <p>SportsAmigo was established with the mission to promote and develop football at all levels. We bring
                            communities together through football and provide clear pathways for players, coaches, and hosts to
                            grow.</p>
                        <p>We work closely with national football federations, local leagues, academies, and international clubs
                            to raise standards and create opportunities for talent to progress to the professional level.</p>
                        <p>Our vision is a world where football is accessible to everyone, where grassroots programs feed elite
                            development, and where players can reach their full potential on and off the pitch.</p>
                        <Link to="/contact" className="hero-btn red-btn">CONTACT US</Link>
                    </div>
                    <div className="about-col">
                        <img src="/images/sports-amigo-logo.png" alt="About SportsAmigo" />
                    </div>
                </div>
            </section>

            <section className="facilities">
                <h1 style={{ color: 'black' }}>Our Mission</h1>
                <p>What drives us every day at SportsAmigo</p>

                <div className="row">
                    <div className="facilities-col">
                        <img src="/images/mission1.jpg" alt="Promote Football" />
                        <h3>Promote Football</h3>
                        We are committed to promoting football at every level, from grassroots community pitches to professional
                        leagues and national competitions.
                    </div>
                    <div className="facilities-col">
                        <img src="/images/mission2.jpg" alt="Develop Athletes" />
                        <h3>Develop Players</h3>
                        We provide coaching, scouting, and academy support so players can develop technical skills, tactical understanding, and professional habits.
                    </div>
                    <div className="facilities-col">
                        <img src="/images/mission3.jpg" alt="Unite Communities" />
                        <h3>Unite Communities</h3>
                        We use football to bring communities together, promote inclusion, and create safe spaces where young people can learn teamwork and leadership.
                    </div>
                </div>
            </section>

            <section className="cta">
                <h1>Ready to Join SportsAmigo?</h1>
                <Link to="/login" className="hero-btn">JOIN US TODAY</Link>
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

export default About;
