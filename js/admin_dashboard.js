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

    SharedData.emergencyRequests.sort((a, b) => b.id - a.id).forEach(request => {
        const row = document.createElement('tr');
        if (request.isUrgent) {
            row.classList.add('urgent');
        }
        
        const donorNames = request.donorResponses.map(donor => donor.name).join(', ');
        
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.bloodType}</td>
            <td>${request.quantity}</td>
            <td>${request.status}</td>
            <td>${request.donorResponses.length}</td>
            <td>${donorNames || 'No donors yet'}</td>
            <td>${request.hospitalName}</td>
            <td>
                ${request.status === 'Pending' || request.status === 'Donor Found' ? `
                    <button class="approve-btn" onclick="approveRequest(${request.id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="reject-btn" onclick="rejectRequest(${request.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : request.status}
            </td>
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
    const request = SharedData.emergencyRequests.find(r => r.id === requestId);
    if (request) {
        request.status = 'Approved';
        SharedData.saveData();
        updateRequestsTable();
        showAlert('Request approved successfully.');
    }
}

function rejectRequest(requestId) {
    const request = SharedData.emergencyRequests.find(r => r.id === requestId);
    if (request) {
        request.status = 'Rejected';
        SharedData.saveData();
        updateRequestsTable();
        showAlert('Request rejected.');
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
    const hospitalName = document.getElementById('hospital-name').value;
    const isUrgent = document.getElementById('urgent').checked;

    const newRequest = SharedData.addEmergencyRequest(bloodType, quantity, hospitalName, isUrgent);
    
    if (newRequest) {
        showAlert(`${isUrgent ? 'Urgent' : 'Emergency'} request for ${quantity} units of ${bloodType} blood submitted successfully for ${hospitalName}!`);
        updateRequestsTable();
        e.target.reset();
    } else {
        showAlert('Failed to submit emergency request. Please try again.');
    }
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

// Call this function when the admin dashboard loads
document.addEventListener('DOMContentLoaded', function() {
    updateRequestsTable();
    document.getElementById('emergency-request-form').addEventListener('submit', submitEmergencyRequest);
    SharedData.addListener(updateDashboard);
    window.addEventListener('bloodBridgeDataUpdated', (event) => {
        updateDashboard();
    });
});

// Refresh the table periodically
setInterval(updateRequestsTable, 30000); // Every 30 seconds

