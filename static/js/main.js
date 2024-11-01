document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const userType = document.querySelector('input[name="user-type"]:checked').value;

        // Show loading animation
        showLoading();

        // Simulate API call for login
        setTimeout(() => {
            // Hide loading animation
            hideLoading();

            // Check user credentials against locally stored data
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password && u.userType === userType);

            if (user) {
                // Successful login
                localStorage.setItem('currentUser', JSON.stringify(user));

                switch(userType) {
                    case 'admin':
                        window.location.href = '/admin_dashboard';
                        break;
                    case 'donor':
                        window.location.href = '/donor_dashboard';
                        break;
                    case 'manager':
                        window.location.href = '/manager_dashboard';
                        break;
                    default:
                        showCustomAlert('Invalid user type');
                }
            } else {
                showCustomAlert('Invalid email, password, or user type. Please try again.');
            }
        }, 1500);
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
