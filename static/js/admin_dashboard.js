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

let hasRequests = true;
let hasNotifications = true;

document.getElementById('clear-all-requests').addEventListener('click', () => {
    showConfirmationModal('Are you sure you want to clear all blood requests? This action cannot be undone.', clearAllRequests);
});

function clearAllRequests() {
    if (hasRequests) {
        // Clear the requests from your data source (e.g., database)
        SharedData.emergencyRequests = [];
        SharedData.saveData();

        // Clear the table in the UI
        const table = document.getElementById('requests-table');
        table.querySelector('tbody').innerHTML = '';
        
        // Disable the button after clearing
        const clearButton = document.getElementById('clear-all-requests');
        clearButton.disabled = true;
        clearButton.classList.add('disabled');
        
        // Show a success message
        showAlert('All blood requests have been cleared.', 'success');
        
        // Update the state
        hasRequests = false;
    }
}

function clearAllNotifications() {
    if (hasNotifications) {
        // Clear the notifications from your data source
        SharedData.emergencyNotifications = [];
        SharedData.saveData();

        // Clear the notifications list in the UI
        const notificationsList = document.getElementById('notifications-list');
        notificationsList.innerHTML = '';
        
        // Disable the button after clearing
        const clearButton = document.getElementById('clear-notifications');
        clearButton.disabled = true;
        clearButton.classList.add('disabled');
        
        // Show a success message
        showAlert('All notifications have been cleared.', 'success');
        
        // Update the state
        hasNotifications = false;
    }
}

// Function to add a new request (example)
function addNewRequest(requestData) {
    if (!hasRequests) {
        // Clear the "No requests" message if it exists
        const table = document.getElementById('requests-table');
        table.querySelector('tbody').innerHTML = '';
        
        // Enable the clear button
        const clearButton = document.getElementById('clear-all-requests');
        clearButton.disabled = false;
        clearButton.classList.remove('disabled');
        
        hasRequests = true;
    }
    
    // Add the new request to the table
    // ... (code to add the request to the table)
}

// Function to add a new notification (example)
function addNewNotification(notificationData) {
    if (!hasNotifications) {
        // Clear the "No notifications" message if it exists
        const notificationsList = document.getElementById('notifications-list');
        notificationsList.innerHTML = '';
        
        // Enable the clear button
        const clearButton = document.getElementById('clear-notifications');
        clearButton.disabled = false;
        clearButton.classList.remove('disabled');
        
        hasNotifications = true;
    }
    
    // Add the new notification to the list
    // ... (code to add the notification to the list)
}

document.getElementById('clear-notifications').addEventListener('click', () => {
    showConfirmationModal('Are you sure you want to clear all notifications? This action cannot be undone.', clearAllNotifications);
});

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-message alert-${type}`;
    alertDiv.innerHTML = `
        <span class="alert-close">&times;</span>
        ${message}
    `;
    document.body.appendChild(alertDiv);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertDiv.classList.add('hide');
        setTimeout(() => {
            alertDiv.remove();
        }, 500);
    }, 5000);

    // Close button functionality
    alertDiv.querySelector('.alert-close').addEventListener('click', () => {
        alertDiv.classList.add('hide');
        setTimeout(() => {
            alertDiv.remove();
        }, 500);
    });
}

function showConfirmationModal(message, onConfirm) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
        <h3 class="modal-title">Confirm Action</h3>
        <p class="modal-message">${message}</p>
        <div class="modal-buttons">
            <button class="modal-button modal-button-cancel">Cancel</button>
            <button class="modal-button modal-button-confirm">Confirm</button>
        </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    const cancelButton = modalContent.querySelector('.modal-button-cancel');
    const confirmButton = modalContent.querySelector('.modal-button-confirm');
    
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
    
    confirmButton.addEventListener('click', () => {
        onConfirm();
        document.body.removeChild(modalOverlay);
    });
}
