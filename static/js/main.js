document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Show loading animation
        showLoading();

        // Simulate API call for login
        setTimeout(() => {
            // Hide loading animation
            hideLoading();

            // Check user credentials against locally stored data
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                // Successful login
                localStorage.setItem('currentUser', JSON.stringify(user));

                // Redirect based on the user role
                switch(user.userType) {
                    case 'admin':
                        window.location.href = '/admin_dashboard';
                        break;
                    case 'donor':
                        window.location.href = '/dashboard'; // Updated to match Flask route
                        break;
                    case 'manager':
                        window.location.href = '/manager_dashboard';
                        break;
                    default:
                        showCustomAlert('Invalid user type');
                }
            } else {
                showCustomAlert('Invalid email or password. Please try again.'); // Updated error message
            }
        }, 1500); // Simulated delay for API call
    });
});

function showLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

function showCustomAlert(message) {
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
        alertBox.remove();
    }, 3000);
}
