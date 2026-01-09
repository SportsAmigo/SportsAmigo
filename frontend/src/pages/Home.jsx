import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectAuthenticated, logoutUser } from '../store/slices/authSlice';

const Home = () => {
    const user = useSelector(selectUser);
    const authenticated = useSelector(selectAuthenticated);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        dispatch(logoutUser());
        navigate('/');
    };

    return (
        <div>
            {/* Header Section */}
            <section className="header">
                <nav>
                    <Link to="/"><img src="/images/sports-amigo-logo.png" alt="SportsAmigo Association Logo" /></Link>
                    <div className="nav-links" id="navLinks">
                        <ul>
                            <li><Link to="/">HOME</Link></li>
                            <li><Link to="/about">ABOUT</Link></li>
                            <li><Link to="/events">EVENTS</Link></li>
                            <li><Link to="/contact">CONTACT</Link></li>
                            {authenticated ? (
                                <>
                                    <li className="dropdown">
                                        <a href="#">{user.first_name || user.email} ▼</a>
                                        <div className="dropdown-content">
                                            <Link to={`/${user.role}/dashboard`}>Dashboard</Link>
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
                    <h1>SportsAmigo</h1>
                    <p>Join the largest sports community and experience the thrill of competition, the joy of teamwork, and the pride of victory.</p>
                    <Link to="/about" className="hero-btn">Visit Us To Know More</Link>
                </div>
            </section>

            {/* Upcoming Events */}
            <section className="upcoming-events">
                <h1>Upcoming Events</h1>
                <p>Discover our exciting lineup of sporting events and competitions</p>

                <div className="row">
                    <div className="event-col">
                        <h3>Football Championship</h3>
                        <p>The annual football championship bringing together the best teams from across the country.</p>
                    </div>
                    <div className="event-col">
                        <h3>Intercity Football Cup</h3>
                        <p>A fast-paced 7-a-side tournament featuring clubs from nearby cities. Expect exciting matches and great atmosphere.</p>
                    </div>
                    <div className="event-col">
                        <h3>Sunday Amateur League</h3>
                        <p>Weekly amateur football league open for community teams — perfect for local talent and weekend action.</p>
                    </div>
                </div>
            </section>

            {/* Player Spotlight */}
            <section className="player-spotlight">
                <h1>Player Spotlight</h1>
                <p>Celebrating the achievements and contributions of the athletes</p>

                <div className="row">
                    <div className="player-col">
                        <img src="/images/football-training-equipment-7-1024x664.jpg" alt="Football Training" />
                        <div className="layer">
                            {/* <h3>FOOTBALL STARS</h3> */}
                        </div>
                    </div>
                    <div className="player-col">
                        <img src="/images/images-11-2021-04-27T224355.172.jpeg" alt="Sports Action" />
                        <div className="layer">
                            {/* <h3>CRICKET HEROES</h3> */}
                        </div>
                    </div>
                    <div className="player-col">
                        <img src="/images/79d129948cc454bcf63debf8fe8dbb74.jpg" alt="Basketball Player" />
                        <div className="layer">
                            {/* <h3>BASKETBALL LEGENDS</h3> */}
                        </div>
                    </div>
                </div>
            </section>

            {/* Facilities */}
            <section className="facilities">
                <h1>Our Facilities</h1>
                <p>World-class sporting facilities to support athletes and teams</p>

                <div className="row">
                    <div className="facilities-col">
                        <img src="/images/banner2.jpg" alt="Stadium" />
                        <h3>Stadiums</h3>
                        <p>Our state-of-the-art stadiums offer the perfect venue for events of all sizes, from local competitions to international tournaments.</p>
                    </div>
                    <div className="facilities-col">
                        <img src="/images/581A3451.webp" alt="Training Center" />
                        <h3>Training Centers</h3>
                        <p>Dedicated training facilities equipped with the latest technology and equipment to help athletes reach their full potential.</p>
                    </div>
                    <div className="facilities-col">
                        <img src="/images/2.webp" alt="Gym" />
                        <h3>Modern Gymnasiums</h3>
                        <p>Fully equipped gymnasiums designed to meet the needs of athletes, with professional trainers available for guidance.</p>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <h1>What Our Members Say</h1>
                <p>Hear from athletes, coaches, and administrators who are part of our community</p>

                <div className="row">
                    <div className="testimonials-col">
                        <img src="/images/adithya.png" alt="Adithya Ram" />
                        <div>
                            <p>SportsAmigo has provided me with incredible opportunities to grow as an athlete. The coaching and facilities are world-class, and the community is supportive and inspiring.</p>
                            <h3>Adithya Ram</h3>
                            <i className="fa fa-star"></i>
                            <i className="fa fa-star"></i>
                            <i className="fa fa-star"></i>
                            <i className="fa fa-star"></i>
                            <i className="fa fa-star-half-o"></i>
                        </div>
                    </div>
                    <div className="testimonials-col">
                        <img src="/images/marcin-sowinski-jozek-frontnew-copy.jpg" alt="Jose Mourinho" />
                        <div>
                            <p>As a coach, I've seen firsthand how the Association nurtures talent and creates pathways for athletes to succeed. The resources and support provided are exceptional, and the events are organized professionally.</p>
                            <h3>Jose Mourinho</h3>
                            <i className="fa fa-star"></i>
                            <i className="fa fa-star"></i>
                            <i className="fa fa-star"></i>
                            <i className="fa fa-star"></i>
                            <i className="fa fa-star"></i>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call To Action */}
            <section className="cta">
                <h1>Join Our Sports Community Today</h1>
                <Link to="/signup" className="hero-btn">REGISTER NOW</Link>
            </section>

            {/* Footer */}
            <section className="footer">
                <h4>About SportsAmigo</h4>
                <p>Join the largest sports community and experience the thrill of competition, the joy of teamwork, and the pride of victory.</p>
                <p>Made with <i className="fa fa-heart-o"></i> by SportsAmigo Team</p>
            </section>
        </div>
    );
};

export default Home;
