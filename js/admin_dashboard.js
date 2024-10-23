// Remove these lines as they're no longer needed
// let bloodRequests = [];
// let inventory = [];

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please log in to access this page.');
        window.location.href = '../index.html';
        return;
    }

    updateDashboard();
    document.getElementById('emergency-request-form').addEventListener('submit', submitEmergencyRequest);
    SharedData.addListener(updateDashboard);
    window.addEventListener('bloodBridgeDataUpdated', (event) => {
        updateDashboard();
    });
});

function updateDashboard() {
    updateRequestsTable();
    updateInventoryTable();
}

function updateRequestsTable() {
    const tableBody = document.querySelector('#requests-table tbody');
    tableBody.innerHTML = '';

    const allRequests = [...SharedData.urgentRequests, ...SharedData.emergencyRequests];
    allRequests.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, most recent first

    allRequests.forEach(request => {
        const row = document.createElement('tr');
        if (request.isUrgent) {
            row.classList.add('urgent');
        }
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.bloodType}</td>
            <td>${request.quantity}</td>
            <td>${request.status}</td>
            <td>${request.donorResponses.length}</td>
            <td>${request.donorResponses.map(donor => donor.name).join(', ')}</td>
            <td>${request.hospitalName}</td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    addActionButtonListeners();
}

function getActionButtons(request) {
    if (request.status === 'Pending' || request.status === 'Donor Found' || request.status === 'Urgent') {
        return `
            <button class="action-button approve-button" data-id="${request.id}">Approve</button>
            <button class="action-button reject-button" data-id="${request.id}">Reject</button>
        `;
    } else {
        return `<button class="action-button delete-button" data-id="${request.id}">Delete</button>`;
    }
}

function addActionButtonListeners() {
    document.querySelectorAll('.approve-button').forEach(button => {
        button.addEventListener('click', () => approveRequest(button.dataset.id));
    });

    document.querySelectorAll('.reject-button').forEach(button => {
        button.addEventListener('click', () => rejectRequest(button.dataset.id));
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', () => deleteRequest(button.dataset.id));
    });
}

function approveRequest(requestId) {
    const request = findRequest(parseInt(requestId));
    if (request) {
        request.status = 'Approved';
        SharedData.inventory[request.bloodType] -= request.quantity;
        SharedData.saveData();
        updateDashboard();
        showNotification(`Request ${requestId} approved`);
    } else {
        showNotification('Request not found', 'error');
    }
}

function rejectRequest(requestId) {
    const request = findRequest(parseInt(requestId));
    if (request) {
        request.status = 'Rejected';
        SharedData.saveData();
        updateDashboard();
        showNotification(`Request ${requestId} rejected`);
    } else {
        showNotification('Request not found', 'error');
    }
}

function deleteRequest(requestId) {
    const requestArrays = [SharedData.urgentRequests, SharedData.emergencyRequests];
    for (let array of requestArrays) {
        const index = array.findIndex(r => r.id === parseInt(requestId));
        if (index !== -1) {
            array.splice(index, 1);
            SharedData.saveData();
            updateDashboard();
            showNotification(`Request ${requestId} deleted`);
            return;
        }
    }
    showNotification('Request not found', 'error');
}

function findRequest(requestId) {
    const requestArrays = [SharedData.urgentRequests, SharedData.emergencyRequests];
    for (let array of requestArrays) {
        const request = array.find(r => r.id === requestId);
        if (request) return request;
    }
    return null;
}

function updateInventoryTable() {
    const tableBody = document.querySelector('#inventory-table tbody');
    tableBody.innerHTML = '';

    for (const [bloodType, units] of Object.entries(SharedData.inventory)) {
        const row = document.createElement('tr');
        const status = getInventoryStatus(units);
        row.innerHTML = `
            <td>${bloodType}</td>
            <td>${units}</td>
            <td><span class="inventory-status ${status.class}">${status.text}</span></td>
        `;
        tableBody.appendChild(row);
    }
}

function getInventoryStatus(units) {
    if (units <= 10) {
        return { text: 'Critical', class: 'status-critical' };
    } else if (units <= 20) {
        return { text: 'Low', class: 'status-low' };
    } else if (units <= 50) {
        return { text: 'Moderate', class: 'status-moderate' };
    } else {
        return { text: 'Sufficient', class: 'status-sufficient' };
    }
}

function submitEmergencyRequest(e) {
    e.preventDefault();
    const bloodType = document.getElementById('blood-type').value;
    const quantity = document.getElementById('quantity').value;
    const isUrgent = document.getElementById('urgent').checked;
    const hospitalName = localStorage.getItem('hospitalName') || "Unknown Hospital";

    const newRequest = SharedData.addEmergencyRequest(bloodType, quantity, hospitalName, isUrgent);
    
    showNotification(`${isUrgent ? 'Urgent' : 'Emergency'} request for ${quantity} units of ${bloodType} blood submitted successfully!`);
    updateDashboard();
    e.target.reset();
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }, 100);
}

function pollForUpdates() {
    SharedData.loadData();
    updateDashboard();
}

// Poll for updates every 5 seconds
setInterval(pollForUpdates, 5000);

function addEmergencyNotification(message, requestId, isUrgent) {
    SharedData.addEmergencyNotification(message, requestId, isUrgent);
    SharedData.saveData();
    console.log("Added new emergency notification:", message);
}
