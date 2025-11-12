import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Reset activities before each test for isolation
    for activity in activities.values():
        activity["participants"] = activity["participants"][:2]  # restore to initial 2 participants


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Soccer Team" in data
    assert "participants" in data["Soccer Team"]


def test_signup_for_activity():
    email = "newstudent@mergington.edu"
    activity = "Soccer Team"
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200
    assert email in activities[activity]["participants"]


def test_signup_duplicate():
    email = activities["Soccer Team"]["participants"][0]
    activity = "Soccer Team"
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]


def test_unregistered_participant():
    email = "notregistered@mergington.edu"
    activity = "Soccer Team"
    response = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert response.status_code == 404
    assert "not registered" in response.json()["detail"]


def test_unregister_success():
    activity = "Soccer Team"
    email = activities[activity]["participants"][0]
    response = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert response.status_code == 200
    assert email not in activities[activity]["participants"]
