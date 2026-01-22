#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class KSPCricketAPITester:
    def __init__(self, base_url="https://live-cric-updates.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.passed_tests.append(name)
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Try to parse JSON response
                try:
                    json_response = response.json()
                    print(f"   Response: {json.dumps(json_response, indent=2)[:200]}...")
                    return True, json_response
                except:
                    print(f"   Response: {response.text[:200]}...")
                    return True, response.text
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:500]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.Timeout:
            self.failed_tests.append({
                "test": name,
                "error": "Request timeout",
                "timeout": timeout
            })
            print(f"❌ Failed - Request timeout after {timeout}s")
            return False, {}
        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        
        if success and isinstance(response, dict):
            message = response.get('message', '')
            if 'KSP Cricket API' in message:
                print("   ✓ Correct API message found")
                return True
            else:
                print(f"   ⚠️  Unexpected message: {message}")
        
        return success

    def test_current_matches(self):
        """Test current matches endpoint"""
        success, response = self.run_test(
            "Current Matches",
            "GET",
            "matches/current",
            200
        )
        
        if success and isinstance(response, dict):
            if response.get('status') == 'success':
                data = response.get('data', [])
                count = response.get('count', 0)
                print(f"   ✓ Found {count} matches")
                
                # Check if matches have required fields
                if data and len(data) > 0:
                    match = data[0]
                    required_fields = ['id', 'name', 'teams']
                    missing_fields = [field for field in required_fields if field not in match]
                    if missing_fields:
                        print(f"   ⚠️  Missing fields in match data: {missing_fields}")
                    else:
                        print("   ✓ Match data structure looks good")
                
                return True
            else:
                print(f"   ⚠️  Unexpected status: {response.get('status')}")
        
        return success

    def test_all_matches(self):
        """Test all matches endpoint"""
        success, response = self.run_test(
            "All Matches",
            "GET",
            "matches/all",
            200
        )
        return success

    def test_match_details(self):
        """Test match details endpoint with a sample match ID"""
        # First get current matches to find a valid match ID
        success, matches_response = self.run_test(
            "Get Match ID for Details Test",
            "GET",
            "matches/current",
            200
        )
        
        if success and isinstance(matches_response, dict):
            matches = matches_response.get('data', [])
            if matches and len(matches) > 0:
                match_id = matches[0].get('id')
                if match_id:
                    success, response = self.run_test(
                        f"Match Details (ID: {match_id})",
                        "GET",
                        f"matches/{match_id}",
                        200
                    )
                    return success
        
        # If no matches found, test with a dummy ID (should return 404)
        success, response = self.run_test(
            "Match Details (Invalid ID)",
            "GET",
            "matches/invalid_id",
            404
        )
        return success

    def test_series_endpoint(self):
        """Test series endpoint"""
        success, response = self.run_test(
            "Series List",
            "GET",
            "series",
            200
        )
        return success

    def test_subscribers_endpoint(self):
        """Test subscribers endpoint"""
        success, response = self.run_test(
            "Subscribers Count",
            "GET",
            "subscribers",
            200
        )
        
        if success and isinstance(response, dict):
            if 'active_subscribers' in response:
                count = response.get('active_subscribers', 0)
                print(f"   ✓ Active subscribers: {count}")
                return True
        
        return success

    def test_telegram_bot_info(self):
        """Test Telegram bot info endpoint"""
        success, response = self.run_test(
            "Telegram Bot Info",
            "GET",
            "telegram/bot-info",
            200
        )
        
        if success and isinstance(response, dict):
            if response.get('status') == 'success':
                bot_username = response.get('bot_username')
                bot_name = response.get('bot_name')
                print(f"   ✓ Bot username: {bot_username}")
                print(f"   ✓ Bot name: {bot_name}")
                return True
            elif response.get('status') == 'error':
                print(f"   ⚠️  Bot error: {response.get('message')}")
        
        return success

    def test_add_subscriber(self):
        """Test adding a subscriber"""
        test_subscriber = {
            "chat_id": 123456789,
            "username": "test_user",
            "first_name": "Test User"
        }
        
        success, response = self.run_test(
            "Add Subscriber",
            "POST",
            "subscribers",
            200,
            data=test_subscriber
        )
        
        if success:
            # Test removing the subscriber
            success2, response2 = self.run_test(
                "Remove Subscriber",
                "DELETE",
                f"subscribers/{test_subscriber['chat_id']}",
                200
            )
            return success and success2
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🏏 Starting KSP Cricket API Tests")
        print("=" * 50)
        
        # Core API tests
        self.test_root_endpoint()
        self.test_current_matches()
        self.test_all_matches()
        self.test_match_details()
        self.test_series_endpoint()
        
        # Subscriber tests
        self.test_subscribers_endpoint()
        self.test_add_subscriber()
        
        # Telegram tests
        self.test_telegram_bot_info()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {len(self.failed_tests)}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   - {failure.get('test', 'Unknown')}")
                if 'expected' in failure:
                    print(f"     Expected: {failure['expected']}, Got: {failure['actual']}")
                if 'error' in failure:
                    print(f"     Error: {failure['error']}")
        
        if self.passed_tests:
            print(f"\n✅ Passed Tests:")
            for test in self.passed_tests:
                print(f"   - {test}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = KSPCricketAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())