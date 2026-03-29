/**
 * COMPLETE TESTING SCRIPT
 * Tests the entire Schedule Matches flow
 * Run: node test-schedule-flow.js
 */

const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';
const EVENT_ID = '692e1a4851263793184be75'; // Replace with your event ID

// Organizer login credentials
const ORGANIZER_EMAIL = 'frank@frank.com'; // Replace with your organizer email
const ORGANIZER_PASSWORD = 'frank'; // Replace with your password

let authCookie = '';

async function login() {
    try {
        console.log('\n🔐 Logging in as organizer...');
        
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: ORGANIZER_EMAIL,
            password: ORGANIZER_PASSWORD
        }, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
            // Extract cookie
            authCookie = response.headers['set-cookie']?.[0]?.split(';')[0] || '';
            console.log('✅ Logged in successfully');
            console.log('👤 User:', response.data.user.first_name, response.data.user.last_name);
            return true;
        }

        console.error('❌ Login failed:', response.data.message);
        return false;

    } catch (error) {
        console.error('❌ Login error:', error.response?.data || error.message);
        return false;
    }
}

async function getEventDetails() {
    try {
        console.log('\n📋 Fetching event details...');
        
        const response = await axios.get(
            `${BASE_URL}/api/organizer/event/${EVENT_ID}`,
            {
                headers: { Cookie: authCookie },
                withCredentials: true
            }
        );

        if (response.data.success) {
            const event = response.data.event;
            console.log('✅ Event:', event.name);
            console.log('📊 Team Registrations:', event.team_registrations?.length || 0);
            
            if (event.team_registrations) {
                const pending = event.team_registrations.filter(r => r.status === 'pending');
                const confirmed = event.team_registrations.filter(r => r.status === 'confirmed');
                
                console.log('\nTeam Status:');
                console.log(`  ✅ Confirmed: ${confirmed.length}`);
                console.log(`  ⏳ Pending: ${pending.length}`);
                
                if (confirmed.length > 0) {
                    console.log('\nConfirmed Teams:');
                    confirmed.forEach((reg, i) => {
                        console.log(`  ${i + 1}. ${reg.team_id?.name || 'Unknown'}`);
                    });
                }

                if (pending.length > 0) {
                    console.log('\n⚠️  WARNING: You have', pending.length, 'pending teams!');
                    console.log('Run: node fix-confirm-teams.js');
                }

                return { event, teams: confirmed.map(r => r.team_id) };
            }

            return { event, teams: [] };
        }

        console.error('❌ Failed to fetch event');
        return null;

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

async function scheduleMatches(teams) {
    try {
        if (teams.length < 2) {
            console.error('\n❌ Need at least 2 confirmed teams to schedule matches!');
            console.log('Current confirmed teams:', teams.length);
            console.log('\n💡 Solution: Run "node fix-confirm-teams.js" first');
            return false;
        }

        console.log('\n🎮 Generating round-robin fixtures for', teams.length, 'teams...');

        // Generate simple round-robin
        const matches = [];
        let matchNumber = 1;

        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                matches.push({
                    match_number: matchNumber++,
                    team_a: teams[i]._id,
                    team_a_name: teams[i].name,
                    team_b: teams[j]._id,
                    team_b_name: teams[j].name,
                    round: 'Round 1',
                    match_date: new Date(Date.now() + (matchNumber * 24 * 60 * 60 * 1000)).toISOString(),
                    venue: 'Test Stadium'
                });
            }
        }

        console.log(`✅ Generated ${matches.length} matches`);
        console.log('\n📤 Sending to backend...');

        const response = await axios.post(
            `${BASE_URL}/api/organizer/event/${EVENT_ID}/schedule-matches`,
            { matches },
            {
                headers: {
                    Cookie: authCookie,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            }
        );

        if (response.data.success) {
            console.log('\n✅ SUCCESS!');
            console.log(`📊 Matches created: ${response.data.matchesCreated}`);
            
            if (response.data.errors && response.data.errors.length > 0) {
                console.log('\n⚠️  Warnings:');
                response.data.errors.forEach(err => console.log(`  - ${err}`));
            }

            return true;
        }

        console.error('❌ Failed:', response.data.message);
        return false;

    } catch (error) {
        console.error('\n❌ Schedule error:', error.response?.data || error.message);
        if (error.response?.data?.errors) {
            console.log('\nErrors:');
            error.response.data.errors.forEach(err => console.log(`  - ${err}`));
        }
        return false;
    }
}

async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('  SCHEDULE MATCHES - COMPLETE TEST');
    console.log('='.repeat(60));

    // Step 1: Login
    const loggedIn = await login();
    if (!loggedIn) {
        console.log('\n❌ Test failed at login step');
        return;
    }

    // Step 2: Get event details
    const eventData = await getEventDetails();
    if (!eventData) {
        console.log('\n❌ Test failed at fetch event step');
        return;
    }

    // Step 3: Schedule matches
    const scheduled = await scheduleMatches(eventData.teams);
    if (!scheduled) {
        console.log('\n❌ Test failed at schedule step');
        return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('  ✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n💡 Now open your browser and refresh the Schedule Matches page\n');
}

// Run the tests
runTests().catch(console.error);
