// Test user registration
import fetch from 'node-fetch';

const baseURL = 'http://localhost:3000';

async function testUserRegistration() {
    console.log('🧪 Testing User Registration...\n');

    // Generate a random username to avoid conflicts
    const randomUsername = `testuser_${Math.floor(Math.random() * 10000)}`;

    const userData = {
        username: randomUsername,
        password: 'testpassword123',
        email: `${randomUsername}@example.com`,
        role: 'user'
    };

    try {
        console.log(`Registering user: ${userData.username}`);

        const response = await fetch(`${baseURL}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        console.log('Response:', data);

        if (response.ok) {
            console.log('✅ User registration successful!');

            // Now try to login with the registered user
            console.log(`\nTesting login with ${userData.username}...`);

            const loginResponse = await fetch(`${baseURL}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: userData.username,
                    password: userData.password
                })
            });

            const loginData = await loginResponse.json();

            console.log(`Login Status: ${loginResponse.status}`);
            console.log('Login Response:', loginData);

            if (loginResponse.ok) {
                console.log('✅ Login successful!');
            } else {
                console.log('❌ Login failed!');
            }
        } else {
            console.log('❌ User registration failed!');
        }
    } catch (error) {
        console.error('Error testing user registration:', error);
    }
}

// Run the test
testUserRegistration();
