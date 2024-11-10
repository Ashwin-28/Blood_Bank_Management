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

            // Successful login (assuming validation is handled by app.py)
            localStorage.setItem('currentUser', JSON.stringify({ email, userType: 'default' })); // Default userType for now

            // Redirect based on the user role
            switch('default') { // Updated to use default userType
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
