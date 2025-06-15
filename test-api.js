// Quick API functionality test script
import fetch from 'node-fetch';

const baseURL = 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 Testing API endpoints...\n');

    const tests = [
        {
            name: 'Health Check',
            method: 'GET',
            endpoint: '/health',
            expectStatus: 200
        },
        {
            name: 'Root Endpoint',
            method: 'GET',
            endpoint: '/',
            expectStatus: 200
        },
        {
            name: 'User Registration (should require body)',
            method: 'POST',
            endpoint: '/api/users/register',
            expectStatus: 400 // Bad request due to missing body
        },
        {
            name: 'User Login (should require body)',
            method: 'POST',
            endpoint: '/api/users/login',
            expectStatus: 400 // Bad request due to missing body
        }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
        try {
            const start = Date.now();
            const response = await fetch(`${baseURL}${test.endpoint}`, {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const responseTime = Date.now() - start;

            const status = response.status;
            const success = status === test.expectStatus;

            console.log(`${success ? '✅' : '❌'} ${test.name}`);
            console.log(`   Status: ${status} (expected: ${test.expectStatus})`);
            console.log(`   Response Time: ${responseTime}ms`);

            if (test.endpoint === '/health') {
                const data = await response.json();
                console.log(`   DB Response Time: ${data.database.responseTime}`);
            }

            console.log('');

            if (success) passed++;

        } catch (error) {
            console.log(`❌ ${test.name}`);
            console.log(`   Error: ${error.message}\n`);
        }
    }

    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    console.log(`🎯 Success Rate: ${Math.round((passed / total) * 100)}%`);
}

// Run the test
testAPI().catch(console.error);
