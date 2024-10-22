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
            <button onclick="registerForDrive('${drive.date}', '${drive.location}')">Register</button>
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
    const notifications = SharedData.emergencyNotifications;
    const notificationsList = document.getElementById('emergency-notifications');
    
    if (!notificationsList) {
        const section = document.createElement('section');
        section.id = 'emergency-notifications';
        section.innerHTML = '<h2>Emergency Notifications</h2><ul></ul>';
        document.querySelector('main').prepend(section);
    }
    
    const list = document.querySelector('#emergency-notifications ul');
    list.innerHTML = '';

    notifications.forEach(notification => {
        const li = document.createElement('li');
        li.classList.add(notification.isUrgent ? 'urgent' : 'normal');
        li.innerHTML = `
            <strong>${new Date(notification.date).toLocaleString()}</strong> - ${notification.message}
            <button onclick="respondToEmergency(${notification.requestId}, ${notification.isUrgent})">Respond</button>
        `;
        list.appendChild(li);
    });
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
    e.target.reset();
}

function registerForDrive(date, location) {
    // Simulated API call - replace with actual API call
    console.log(`Registered for blood drive on ${date} at ${location}`);
    showAlert(`Successfully registered for blood drive on ${date} at ${location}`);
}

function respondToEmergency(requestId, isUrgent) {
    const donorEmail = localStorage.getItem('userEmail');
    
    if (SharedData.respondToEmergency(requestId, donorEmail)) {
        showAlert('Thank you for responding to the request. The hospital will contact you shortly with further instructions.');
        loadEmergencyNotifications(); // Refresh the notifications list
    } else {
        showAlert('You have already responded to this request or the request is no longer available.');
    }
}
