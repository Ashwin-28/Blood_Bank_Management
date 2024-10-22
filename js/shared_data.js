const SharedData = {
    inventory: {
        'A+': 50,
        'A-': 30,
        'B+': 40,
        'B-': 20,
        'AB+': 15,
        'AB-': 10,
        'O+': 60,
        'O-': 25
    },
    bloodRequests: [],
    pastRequests: [],
    analytics: {
        pending: 0,
        approved: 0,
        rejected: 0
    },
    listeners: [],
    lastUpdateTime: 0,
    emergencyNotifications: [],
    emergencyRequests: [], // New property to store emergency requests
    urgentRequests: [],
    incomingBlood: [],
    outgoingBlood: [],

    loadData() {
        const data = JSON.parse(localStorage.getItem('bloodBridgeData'));
        if (data) {
            this.inventory = data.inventory || this.inventory;
            this.bloodRequests = data.bloodRequests || this.bloodRequests;
            this.pastRequests = data.pastRequests || this.pastRequests;
            this.analytics = data.analytics || this.analytics;
            this.lastUpdateTime = data.lastUpdateTime;
            this.urgentRequests = data.urgentRequests || [];
            this.emergencyRequests = data.emergencyRequests || [];
            this.emergencyNotifications = data.emergencyNotifications || [];
            this.incomingBlood = data.incomingBlood || [];
            this.outgoingBlood = data.outgoingBlood || [];
        }
    },

    addListener(callback) {
        this.listeners.push(callback);
    },

    notifyListeners() {
        this.listeners.forEach(callback => callback());
    },

    updateAnalytics() {
        const allRequests = [...this.bloodRequests, ...this.pastRequests];
        this.analytics = {
            pending: allRequests.filter(r => r.status === 'Pending').length,
            approved: allRequests.filter(r => r.status === 'Approved').length,
            rejected: allRequests.filter(r => r.status === 'Rejected').length
        };
        this.saveData();
    },

    generateRandomRequests() {
        const hospitals = ['Central Hospital', 'City Medical Center', 'Community Health Clinic', 'Regional Hospital', 'University Medical Center'];
        const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        const statuses = ['Pending', 'Approved', 'Rejected'];

        for (let i = 0; i < 10; i++) {
            const request = {
                id: i + 1,
                hospital: hospitals[Math.floor(Math.random() * hospitals.length)],
                bloodType: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
                quantity: Math.floor(Math.random() * 5) + 1,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
            };

            if (request.status === 'Pending') {
                this.bloodRequests.push(request);
            } else {
                this.pastRequests.push(request);
            }
        }

        this.updateAnalytics();
    },

    saveData() {
        console.log("Saving data to localStorage");
        localStorage.setItem('bloodBridgeData', JSON.stringify({
            inventory: this.inventory,
            bloodRequests: this.bloodRequests,
            pastRequests: this.pastRequests,
            analytics: this.analytics,
            lastUpdateTime: this.lastUpdateTime,
            emergencyNotifications: this.emergencyNotifications,
            emergencyRequests: this.emergencyRequests,
            urgentRequests: this.urgentRequests,
            incomingBlood: this.incomingBlood,
            outgoingBlood: this.outgoingBlood
        }));
        this.notifyListeners();
        // Dispatch a custom event to notify other tabs/windows
        window.dispatchEvent(new CustomEvent('bloodBridgeDataUpdated', { detail: this }));
        console.log("Data saved and event dispatched");
    },

    addEmergencyRequest(bloodType, quantity, hospitalName) {
        console.log("Adding emergency request:", bloodType, quantity, hospitalName);
        const newRequest = {
            id: this.emergencyRequests.length + 1,
            bloodType: bloodType,
            quantity: quantity,
            status: 'Pending',
            date: new Date().toISOString(),
            hospital: hospitalName,
            donorResponses: []
        };
        this.emergencyRequests.push(newRequest);

        // Add emergency notification for donors
        this.emergencyNotifications.push({
            id: this.emergencyNotifications.length + 1,
            message: `Emergency request for ${quantity} units of ${bloodType} blood from ${hospitalName}`,
            date: new Date().toISOString(),
            requestId: newRequest.id,
            timestamp: new Date().getTime()
        });

        console.log("Emergency requests after adding:", this.emergencyRequests);
        console.log("Emergency notifications after adding:", this.emergencyNotifications);

        this.saveData();
    },

    respondToEmergency(requestId, donorEmail) {
        let request = this.urgentRequests.find(r => r.id === requestId);
        if (!request) {
            request = this.emergencyRequests.find(r => r.id === requestId);
        }

        if (request && !request.donorResponses.includes(donorEmail)) {
            request.donorResponses.push(donorEmail);
            
            // If this is the first response, update the status
            if (request.donorResponses.length === 1) {
                request.status = 'Donor Found';
            }

            this.saveData();
            return true;
        }
        return false;
    },

    addUrgentRequest(bloodType, quantity, hospitalName) {
        console.log("Adding urgent request:", bloodType, quantity, hospitalName);
        const newRequest = {
            id: this.urgentRequests.length + 1,
            bloodType: bloodType,
            quantity: quantity,
            status: 'Urgent',
            date: new Date().toISOString(),
            hospital: hospitalName,
            donorResponses: []
        };
        this.urgentRequests.push(newRequest);

        // Add urgent notification for donors
        this.emergencyNotifications.push({
            id: this.emergencyNotifications.length + 1,
            message: `URGENT: ${quantity} units of ${bloodType} blood needed at ${hospitalName}`,
            date: new Date().toISOString(),
            requestId: newRequest.id,
            isUrgent: true,
            timestamp: new Date().getTime()
        });

        console.log("Urgent requests after adding:", this.urgentRequests);
        console.log("Emergency notifications after adding:", this.emergencyNotifications);

        this.saveData();
    },

    addIncomingBlood(entry) {
        this.incomingBlood.push(entry);
        this.saveData();
    },

    addOutgoingBlood(entry) {
        this.outgoingBlood.push(entry);
        this.saveData();
    },

    hasUserResponded(requestId, userEmail) {
        const request = this.findRequest(requestId);
        return request && request.donorResponses && request.donorResponses.includes(userEmail);
    },

    findRequest(requestId) {
        const allRequests = [
            ...this.bloodRequests,
            ...this.pastRequests,
            ...this.urgentRequests,
            ...this.emergencyRequests
        ];
        return allRequests.find(request => request.id === requestId);
    },

    addEmergencyNotification(message, requestId, isUrgent) {
        this.emergencyNotifications.push({
            message,
            requestId,
            isUrgent,
            date: new Date(),
            timestamp: new Date().getTime()
        });
        this.saveData();
        console.log("Added new emergency notification:", this.emergencyNotifications[this.emergencyNotifications.length - 1]);
    }
};

// Initialize data
SharedData.loadData();

// Set up event listener for storage changes
window.addEventListener('storage', (event) => {
    if (event.key === 'bloodBridgeData') {
        SharedData.loadData();
        SharedData.notifyListeners();
    }
});

// Set up event listener for custom event
window.addEventListener('bloodBridgeDataUpdated', (event) => {
    const newData = event.detail;
    if (newData.lastUpdateTime > SharedData.lastUpdateTime) {
        SharedData.inventory = newData.inventory;
        SharedData.bloodRequests = newData.bloodRequests;
        SharedData.pastRequests = newData.pastRequests;
        SharedData.analytics = newData.analytics;
        SharedData.lastUpdateTime = newData.lastUpdateTime;
        SharedData.notifyListeners();
    }
});
