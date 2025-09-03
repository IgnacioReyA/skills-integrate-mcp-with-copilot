document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const quickSignupForm = document.getElementById("quick-signup-form");
  const quickEmailInput = document.getElementById("quick-email");
  const quickMessageDiv = document.getElementById("quick-message");
  let currentEmail = "";

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

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;

        // Add register button if email is set
        const registerBtn = currentEmail ? `<button class="register-btn" data-activity="${name}">Register Student</button>` : '';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          ${registerBtn}
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", async (e) => {
          const activity = button.getAttribute("data-activity");
          if (!currentEmail) {
            showQuickMessage("Please set your email first.", "error");
            return;
          }
          try {
            const response = await fetch(`/activities/${activity}/signup`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: currentEmail }),
            });
            const result = await response.json();
            if (response.ok) {
              showQuickMessage(result.message, "success");
              fetchActivities();
            } else {
              showQuickMessage(result.detail || "Signup failed", "error");
            }
          } catch (err) {
            showQuickMessage("Network error", "error");
          }
        });
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showQuickMessage(result.message, "success");
        fetchActivities();
      } else {
        showQuickMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showQuickMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle quick signup form (set email)
  quickSignupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = quickEmailInput.value.trim();
    if (!email) {
      showQuickMessage("Please enter your email.", "error");
      return;
    }
    currentEmail = email;
    showQuickMessage(`Email set to ${email}`, "success");
    fetchActivities();
  });

  // Initialize app
  fetchActivities();
});
