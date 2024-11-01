document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    const userTypeRadios = document.querySelectorAll('input[name="user-type"]');
    const bloodGroupField = document.getElementById('blood-group-field');

    // Show/hide blood group field based on user type selection
    userTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            bloodGroupField.style.display = this.value === 'donor' ? 'block' : 'none';
        });
    });

    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const userType = document.querySelector('input[name="user-type"]:checked').value;
        const bloodGroup = userType === 'donor' ? document.getElementById('blood-group').value : null;

        if (password !== confirmPassword) {
            showCustomAlert("Passwords don't match!");
            return;
        }

        showLoading();

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullname,
                    email,
                    password,
                    userType,
                    bloodGroup
                })
            });

            const data = await response.json();

            if (response.ok) {
                showCustomAlert('Signup successful! Please log in.');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                showCustomAlert(data.message || 'Signup failed. Please try again.');
            }
        } catch (error) {
            showCustomAlert('An error occurred. Please try again.');
            console.error('Signup error:', error);
        } finally {
            hideLoading();
        }
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
});
