document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please log in to access this page.');
        window.location.href = '../index.html';
        return;
    }

    loadDonationHistory();
    loadUpcomingDrives();
    loadDonationCenters();
    loadEmergencyNotifications();
    document.getElementById('schedule-donation-form').addEventListener('submit', scheduleDonation);
    
    // Add event listener for emergency notifications
    window.addEventListener('bloodBridgeDataUpdated', (event) => {
        loadEmergencyNotifications();
    });

    console.log("Shared Data on load:", SharedData);
    SharedData.loadData();
    console.log("Shared Data after loading:", SharedData);
});

function loadDonationHistory() {
    // Simulated data - replace with actual API call
    const history = [
        { date: '2023-05-15', location: 'City Hospital', bloodType: 'A+', quantity: 1 },
        { date: '2023-02-10', location: 'Red Cross Center', bloodType: 'A+', quantity: 1 },
        { date: '2022-11-05', location: 'Community Clinic', bloodType: 'A+', quantity: 1 },
    ];

    const tableBody = document.querySelector('#history-table tbody');
    tableBody.innerHTML = '';

    history.forEach(donation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${donation.date}</td>
            <td>${donation.location}</td>
            <td>${donation.bloodType}</td>
            <td>${donation.quantity}</td>
        `;
        tableBody.appendChild(row);
    });
}

function loadUpcomingDrives() {
    // Simulated data - replace with actual API call
    const drives = [
        { date: '2023-06-01', location: 'City Hall' },
        { date: '2023-06-15', location: 'University Campus' },
        { date: '2023-07-02', location: 'Shopping Mall' },
    ];

    const drivesList = document.getElementById('drives-list');
    drivesList.innerHTML = '';

    drives.forEach(drive => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${drive.date}</strong> - ${drive.location}
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
    const notifications = SharedData.emergencyNotifications;
    console.log("Notifications:", notifications);

    let notificationsList = document.getElementById('emergency-notifications');
    const donorEmail = localStorage.getItem('userEmail');
    const currentTime = new Date().getTime();
    
    if (!notificationsList) {
        console.log("Creating new notifications section");
        const section = document.createElement('section');
        section.id = 'emergency-notifications';
        section.innerHTML = '<h2>Emergency Notifications</h2><ul></ul>';
        document.querySelector('main').prepend(section);
        notificationsList = section;
    }
    
    const list = notificationsList.querySelector('ul');
    list.innerHTML = '';

    if (notifications.length > 0) {
        console.log("There are notifications to display");
        notifications.forEach(notification => {
            console.log("Processing notification:", notification);
            // Only show notifications that are less than 24 hours old
            if (currentTime - notification.timestamp < 24 * 60 * 60 * 1000) {
                const li = document.createElement('li');
                li.classList.add(notification.isUrgent ? 'urgent' : 'normal');
                
                // Check if the user has already responded to this request
                const hasResponded = SharedData.hasUserResponded(notification.requestId, donorEmail);
                
                li.innerHTML = `
                    <strong>${new Date(notification.date).toLocaleString()}</strong> - ${notification.message}
                    ${hasResponded ? 
                        '<span class="responded">Responded</span>' : 
                        `<button onclick="respondToEmergency(this, ${notification.requestId}, ${notification.isUrgent})">Respond</button>`
                    }
                `;
                list.appendChild(li);
                console.log("Added notification to list");
            } else {
                console.log("Notification is older than 24 hours, skipping");
            }
        });
    } else {
        console.log("No notifications to display");
        list.innerHTML = '<li>No current emergency requests.</li>';
    }
    
    // Don't remove the notifications section even if it's empty
    if (notificationsList) {
        if (notificationsList.querySelector('ul').children.length === 0) {
            console.log("No current emergency requests, displaying message");
            notificationsList.querySelector('ul').innerHTML = '<li>No current emergency requests.</li>';
        }
    } else {
        console.log("Notifications list not found in DOM");
    }
}

function showAlert(message) {
    const alertElement = document.createElement('div');
    alertElement.className = 'custom-alert';
    alertElement.textContent = message;
    document.body.appendChild(alertElement);
    
    // Show the alert
    setTimeout(() => {
        alertElement.style.display = 'block';
    }, 100);

    // Remove the alert after 3 seconds
    setTimeout(() => {
        alertElement.remove();
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
    const donorEmail = localStorage.getItem('userEmail');
    
    if (SharedData.respondToEmergency(requestId, donorEmail)) {
        showAlert('Thank you for responding to the request. The hospital will contact you shortly with further instructions.');
        
        // Replace the button with "Responded" text
        const listItem = button.closest('li');
        if (listItem) {
            // Remove the button
            button.remove();
            
            // Create and add the "Responded" text
            const respondedSpan = document.createElement('span');
            respondedSpan.className = 'responded';
            respondedSpan.textContent = 'Responded';
            listItem.appendChild(respondedSpan);
        }
        
        // Refresh the notifications to update any changes
        loadEmergencyNotifications();
    } else {
        showAlert('You have already responded to this request or the request is no longer available.');
    }
}

// Add this at the end of the file
setInterval(() => {
    console.log("Periodic check for notifications");
    SharedData.loadData();
    loadEmergencyNotifications();
}, 30000); // Check every 30 seconds
