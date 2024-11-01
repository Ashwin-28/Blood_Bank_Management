let requestsChart;

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.userType !== 'manager') {
        alert('Please log in as a manager to access this page.');
        window.location.href = '../index.html';
        return;
    }

    updateDashboard();
    createBloodInventoryChart();
    SharedData.addListener(updateDashboard);
});

function updateDashboard() {
    updateInventoryTable();
    updateBloodHistoryTable();
    updateBloodInventoryChart();
}

function updateInventoryTable() {
    const tableBody = document.querySelector('#inventory-table tbody');
    tableBody.innerHTML = '';

    for (const [bloodType, units] of Object.entries(SharedData.inventory)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bloodType}</td>
            <td>${units}</td>
            <td>
                <input type="number" min="0" value="${units}">
                <button onclick="updateInventory('${bloodType}', this)">Update</button>
            </td>
        `;
        tableBody.appendChild(row);
    }
}

function updateBloodHistoryTable() {
    const tableBody = document.querySelector('#blood-history-table tbody');
    tableBody.innerHTML = '';

    // Combine incoming and outgoing blood history
    const allHistory = [...SharedData.incomingBlood, ...SharedData.outgoingBlood].sort((a, b) => new Date(b.date) - new Date(a.date));

    allHistory.forEach(entry => {
        const row = document.createElement('tr');
        row.dataset.type = entry.type; // Add this line to set the data-type attribute
        row.innerHTML = `
            <td>${new Date(entry.date).toLocaleString()}</td>
            <td>${entry.bloodType}</td>
            <td>${entry.quantity}</td>
            <td>${entry.type === 'incoming' ? 'Incoming' : 'Outgoing'}</td>
            <td>${entry.source || entry.destination}</td>
            <td>${entry.donorName || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateInventory(bloodType, button) {
    const newValue = parseInt(button.previousElementSibling.value);
    if (isNaN(newValue) || newValue < 0) {
        showNotification('Please enter a valid number', 'error');
        return;
    }
    
    const oldValue = SharedData.inventory[bloodType];
    const difference = newValue - oldValue;
    
    SharedData.inventory[bloodType] = newValue;
    
    // Add entry to blood history
    const historyEntry = {
        date: new Date().toISOString(),
        bloodType: bloodType,
        quantity: Math.abs(difference),
        type: difference > 0 ? 'incoming' : 'outgoing',
        source: difference > 0 ? 'Inventory Update' : 'Inventory Adjustment',
        destination: difference < 0 ? 'Inventory Adjustment' : ''
    };
    
    if (difference > 0) {
        SharedData.incomingBlood.push(historyEntry);
    } else if (difference < 0) {
        SharedData.outgoingBlood.push(historyEntry);
    }
    
    SharedData.saveData();
    updateDashboard();
    showNotification(`Inventory updated for ${bloodType}`);
}

function createCharts() {
    createInventoryChart();
    createBloodFlowChart();
    createAnalyticsChart();
}

function createInventoryChart() {
    const ctx = document.getElementById('inventory-chart').getContext('2d');
    const inventoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(SharedData.inventory),
            datasets: [{
                label: 'Current Stock',
                data: Object.values(SharedData.inventory),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Current Blood Inventory'
                }
            }
        }
    });
}

function createBloodFlowChart() {
    const ctx = document.getElementById('blood-flow-chart').getContext('2d');
    const bloodFlowChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Will be populated with dates
            datasets: [{
                label: 'Incoming Blood',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }, {
                label: 'Outgoing Blood',
                data: [],
                borderColor: 'rgba(255, 99, 132, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Blood Flow Over Time'
                }
            }
        }
    });
}

function createAnalyticsChart() {
    const ctx = document.getElementById('analytics-chart').getContext('2d');
    window.analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Pending', 'Approved', 'Rejected'],
            datasets: [{
                label: 'Blood Request Status',
                data: [0, 0, 0], // Initial data, will be updated
                backgroundColor: [
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 99, 132, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateCharts() {
    updateInventoryChart();
    updateBloodFlowChart();
    updateAnalyticsChart();
}

function updateInventoryChart() {
    const inventoryChart = Chart.getChart('inventory-chart');
    inventoryChart.data.datasets[0].data = Object.values(SharedData.inventory);
    inventoryChart.update();
}

function updateBloodFlowChart() {
    const bloodFlowChart = Chart.getChart('blood-flow-chart');
    const dates = [...new Set([...SharedData.incomingBlood, ...SharedData.outgoingBlood].map(entry => entry.date))].sort();
    
    bloodFlowChart.data.labels = dates.map(date => new Date(date).toLocaleDateString());
    bloodFlowChart.data.datasets[0].data = dates.map(date => 
        SharedData.incomingBlood.filter(entry => entry.date === date).reduce((sum, entry) => sum + entry.quantity, 0)
    );
    bloodFlowChart.data.datasets[1].data = dates.map(date => 
        SharedData.outgoingBlood.filter(entry => entry.date === date).reduce((sum, entry) => sum + entry.quantity, 0)
    );
    bloodFlowChart.update();
}

function updateAnalyticsChart() {
    if (window.analyticsChart) {
        window.analyticsChart.data.datasets[0].data = [
            SharedData.analytics.pending,
            SharedData.analytics.approved,
            SharedData.analytics.rejected
        ];
        window.analyticsChart.update();
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

function addAnimations() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        table.classList.add('fade-in');
    });

    const charts = document.querySelectorAll('canvas');
    charts.forEach(chart => {
        chart.classList.add('slide-in');
    });
}

function pollForUpdates() {
    SharedData.loadData();
    updateDashboard();
}

// Poll for updates every 5 seconds
setInterval(pollForUpdates, 5000);

function createBloodHistoryChart() {
    const ctx = document.getElementById('blood-history-chart').getContext('2d');
    window.bloodHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Incoming Blood',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Outgoing Blood',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Units of Blood'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Blood Flow History'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

function updateBloodHistoryChart() {
    if (!window.bloodHistoryChart) return;

    const allHistory = [...SharedData.incomingBlood, ...SharedData.outgoingBlood]
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const dates = [...new Set(allHistory.map(entry => entry.date))];

    const incomingData = dates.map(date => {
        const total = SharedData.incomingBlood
            .filter(entry => entry.date === date)
            .reduce((sum, entry) => sum + entry.quantity, 0);
        return { x: date, y: total };
    });

    const outgoingData = dates.map(date => {
        const total = SharedData.outgoingBlood
            .filter(entry => entry.date === date)
            .reduce((sum, entry) => sum + entry.quantity, 0);
        return { x: date, y: total };
    });

    window.bloodHistoryChart.data.labels = dates;
    window.bloodHistoryChart.data.datasets[0].data = incomingData;
    window.bloodHistoryChart.data.datasets[1].data = outgoingData;
    window.bloodHistoryChart.update();
}

function createBloodInventoryChart() {
    const ctx = document.getElementById('blood-inventory-chart').getContext('2d');
    window.bloodInventoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'A+',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                },
                {
                    label: 'A-',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1
                },
                {
                    label: 'B+',
                    data: [],
                    borderColor: 'rgb(255, 206, 86)',
                    tension: 0.1
                },
                {
                    label: 'B-',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'AB+',
                    data: [],
                    borderColor: 'rgb(153, 102, 255)',
                    tension: 0.1
                },
                {
                    label: 'AB-',
                    data: [],
                    borderColor: 'rgb(255, 159, 64)',
                    tension: 0.1
                },
                {
                    label: 'O+',
                    data: [],
                    borderColor: 'rgb(0, 204, 102)',
                    tension: 0.1
                },
                {
                    label: 'O-',
                    data: [],
                    borderColor: 'rgb(204, 51, 0)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Units of Blood'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Blood Inventory Levels Over Time'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

function updateBloodInventoryChart() {
    if (!window.bloodInventoryChart) return;

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const dates = [...new Set(SharedData.inventoryHistory.map(entry => entry.date))];

    window.bloodInventoryChart.data.labels = dates;

    bloodTypes.forEach((bloodType, index) => {
        const data = dates.map(date => {
            const entry = SharedData.inventoryHistory.find(e => e.date === date && e.bloodType === bloodType);
            return entry ? entry.quantity : null;
        });
        window.bloodInventoryChart.data.datasets[index].data = data;
    });

    window.bloodInventoryChart.update();
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}
