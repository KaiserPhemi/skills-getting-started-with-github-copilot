document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

          // Build main card markup (static parts)
          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>

            <!-- Participants section (will be populated below) -->
            <div class="participants">
              <h5>Participants (${details.participants.length})</h5>
              <ul class="participants-list"></ul>
              <p class="participant-empty hidden">No participants yet</p>
            </div>
          `;

        // Populate participants list safely using DOM methods
        const participantsList = activityCard.querySelector(".participants-list");
        const emptyNotice = activityCard.querySelector(".participant-empty");

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            // Create list item with email and delete button
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const del = document.createElement("button");
            del.className = "delete-participant";
            del.setAttribute("aria-label", `Unregister ${p}`);
            del.textContent = "\u00d7"; // multiplication sign as a simple icon

            // Delete handler: call server to unregister, then update UI
            del.addEventListener("click", async () => {
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                if (resp.ok) {
                  // Remove from DOM
                  li.remove();

                  // Update participants header count and availability
                  const participantsH5 = activityCard.querySelector(".participants h5");
                  const availabilityEl = activityCard.querySelector(".availability");
                  const currentCount = activityCard.querySelectorAll(".participants-list li").length;
                  participantsH5.textContent = `Participants (${currentCount})`;
                  const spots = details.max_participants - currentCount;
                  availabilityEl.innerHTML = `<strong>Availability:</strong> ${spots} spots left`;

                  // Show empty notice if no participants remain
                  if (currentCount === 0) {
                    emptyNotice.classList.remove("hidden");
                  }
                } else {
                  const err = await resp.json().catch(() => null);
                  console.error("Failed to unregister:", err || resp.statusText);
                  // Optionally show a user-visible message here
                }
              } catch (error) {
                console.error("Error unregistering participant:", error);
              }
            });

            li.appendChild(span);
            li.appendChild(del);
            participantsList.appendChild(li);
          });
          emptyNotice.classList.add("hidden");
        } else {
          // Show "No participants yet"
          emptyNotice.classList.remove("hidden");
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so new participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
