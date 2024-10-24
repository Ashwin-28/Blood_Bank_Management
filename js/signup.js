document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const userType = document.querySelector('input[name="user-type"]:checked').value;

        if (password !== confirmPassword) {
            showCustomAlert("Passwords don't match!");
            return;
        }

        // Show loading animation
        showLoading();

        // Simulate API call for signup
        setTimeout(() => {
            // Hide loading animation
            hideLoading();

            // Store user data locally
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const newUser = { fullname, email, password, userType };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            showCustomAlert('Signup successful! Please log in.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
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
