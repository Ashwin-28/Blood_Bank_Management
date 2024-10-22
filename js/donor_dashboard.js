document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please log in to access this page.');
        window.location.href = '../index.html';
        return;
    }

    // Display the donor's name
    const welcomeMessage = document.createElement('h2');
    welcomeMessage.textContent = `Welcome, ${currentUser.fullname}!`;
    document.querySelector('main').prepend(welcomeMessage);

    loadDonationHistory();
    loadUpcomingDrives();
    loadDonationCenters();
    loadEmergencyNotifications();

    const clearButton = document.getElementById('clear-notifications');
    clearButton.addEventListener('click', clearAllNotifications);

    // Refresh notifications every 30 seconds
    setInterval(loadEmergencyNotifications, 30000);
});

function loadDonationHistory() {
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const locations = ['City Hospital', 'Red Cross Center', 'Community Clinic', 'University Medical Center', 'Downtown Blood Bank'];
    
    // Generate a random blood type for this donor
    const donorBloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
    
    // Generate 5-10 random donation entries
    const historyCount = Math.floor(Math.random() * 6) + 5;
    const history = [];

    for (let i = 0; i < historyCount; i++) {
        const date = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000); // Random date within the last year
        history.push({
            date: date.toISOString(),
            location: locations[Math.floor(Math.random() * locations.length)],
            bloodType: donorBloodType, // Use the same blood type for all entries
            quantity: Math.random() < 0.9 ? 1 : 2 // 90% chance of donating 1 unit, 10% chance of 2 units
        });
    }

    // Sort history by date, most recent first
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tableBody = document.querySelector('#history-table tbody');
    tableBody.innerHTML = '';

    history.forEach(donation => {
        const donationDate = new Date(donation.date);
        const formattedDate = `${donationDate.toLocaleDateString()} ${donationDate.toLocaleTimeString()}`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${donation.location}</td>
            <td>${donation.bloodType}</td>
            <td>${donation.quantity}</td>
        `;
        tableBody.appendChild(row);
    });
}

function loadUpcomingDrives() {
    const locations = ['City Hall', 'University Campus', 'Shopping Mall', 'Community Center', 'Local Church', 'Public Library', 'High School Gymnasium'];
    
    // Generate 3-7 random upcoming drives
    const drivesCount = Math.floor(Math.random() * 5) + 3;
    const drives = [];

    for (let i = 0; i < drivesCount; i++) {
        const date = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within the next 30 days
        drives.push({
            date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            location: locations[Math.floor(Math.random() * locations.length)]
        });
    }

    // Sort drives by date
    drives.sort((a, b) => new Date(a.date) - new Date(b.date));

    const drivesList = document.getElementById('drives-list');
    drivesList.innerHTML = '';

    drives.forEach(drive => {
        const li = document.createElement('li');
        const driveDate = new Date(drive.date);
        const formattedDate = driveDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        li.innerHTML = `
            <strong>${formattedDate}</strong> - ${drive.location}
            <button onclick="registerForDrive(this, '${drive.date}', '${drive.location}')">Register</button>
        `;
        drivesList.appendChild(li);
    });
}

function loadDonationCenters() {
    // Simulated data - replace with actual API call
    const centers = ['City Hospital', 'Red Cross Center', 'Community Clinic'];
    const select = document.querySelector('select[name="donation-center"]');

    centers.forEach(center => {
        const option = document.createElement('option');
        option.value = center;
        option.textContent = center;
        select.appendChild(option);
    });
}

function loadEmergencyNotifications() {
    console.log("Loading emergency notifications...");
    SharedData.loadData(); // Make sure to load the latest data
    const notifications = SharedData.emergencyNotifications;
    console.log("Notifications:", notifications);

    const notificationsList = document.querySelector('#emergency-notifications ul');
    const clearButton = document.getElementById('clear-notifications');
    notificationsList.innerHTML = '';

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const donorEmail = currentUser ? currentUser.email : null;
    
    notifications.forEach(notification => {
        console.log("Processing notification:", notification);
        const li = document.createElement('li');
        li.classList.add(notification.isUrgent ? 'urgent' : 'normal');
        
        const hasResponded = SharedData.hasUserResponded(notification.requestId, donorEmail);
        
        const notificationDate = new Date(notification.date);
        const formattedDate = `${notificationDate.toLocaleDateString()} ${notificationDate.toLocaleTimeString()}`;
        
        li.innerHTML = `
            <strong>${formattedDate}</strong> - ${notification.message}
            ${hasResponded ? 
                '<span style="color: #4CAF50; font-weight: bold;">Responded</span>' : 
                `<button onclick="respondToEmergency(this, '${notification.requestId}', ${notification.isUrgent})">Respond</button>`
            }
        `;
        notificationsList.appendChild(li);
    });

    if (notifications.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No current emergency requests.';
        notificationsList.appendChild(li);
        clearButton.disabled = true;
    } else {
        clearButton.disabled = false;
    }
}

function showAlert(message, isPositive = true) {
    const alertBox = document.createElement('div');
    alertBox.className = `custom-alert ${isPositive ? 'positive' : 'negative'}`;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    // Show the alert
    setTimeout(() => alertBox.classList.add('show'), 10);

    // Automatically close after 3 seconds
    setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => alertBox.remove(), 500);
    }, 3000);
}

function scheduleDonation(e) {
    e.preventDefault();
    const date = e.target.elements['donation-date'].value;
    const center = e.target.elements['donation-center'].value;

    // Simulated API call - replace with actual API call
    console.log(`Donation scheduled for ${date} at ${center}`);
    showAlert('Donation scheduled successfully!');
    
    // Clear the form
    e.target.reset();
}

function registerForDrive(button, date, location) {
    // Simulated API call - replace with actual API call
    console.log(`Registered for blood drive on ${date} at ${location}`);
    showAlert(`Successfully registered for blood drive on ${date} at ${location}`);
    
    // Remove the button
    button.remove();
}

function respondToEmergency(button, requestId, isUrgent) {
    console.log("Responding to emergency:", requestId, isUrgent);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showAlert('Please log in to respond to emergency requests.');
        return;
    }

    // Immediately change the button to "Responded" text
    const respondedSpan = document.createElement('span');
    respondedSpan.textContent = 'Responded';
    respondedSpan.style.color = '#4CAF50'; // Green color
    respondedSpan.style.fontWeight = 'bold';
    button.parentNode.replaceChild(respondedSpan, button);

    // Then process the response
    if (SharedData.respondToEmergency(requestId, currentUser.email, currentUser.fullname)) {
        console.log("Successfully responded to emergency");
        showAlert('Thank you for responding to the request. The hospital will contact you shortly with further instructions.');
    } else {
        console.log("Failed to respond to emergency");
        showAlert('An error occurred while processing your response. Please try again later.');
        // If the response fails, you might want to revert the button, but for now we'll leave it as "Responded"
    }
}

function clearAllNotifications() {
    SharedData.emergencyNotifications = [];
    SharedData.saveData();
    loadEmergencyNotifications();
    showAlert('All notifications have been cleared.', true);
}

// Add this at the end of the file
setInterval(() => {
    console.log("Periodic check for notifications");
    SharedData.loadData();
    loadEmergencyNotifications();
}, 30000); // Check every 30 seconds
