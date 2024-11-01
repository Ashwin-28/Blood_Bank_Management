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

        // Get form values
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const userType = document.querySelector('input[name="user-type"]:checked')?.value;
        const bloodGroup = userType === 'donor' ? document.getElementById('blood-group').value : null;

        // Basic validation
        if (!fullname || !email || !password || !userType) {
            showCustomAlert('Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            showCustomAlert("Passwords don't match!");
            return;
        }

        showLoading();

        try {
            // Get existing users or create new array
            let users = [];
            const existingUsers = localStorage.getItem('users');
            if (existingUsers) {
                users = JSON.parse(existingUsers);
            }

            // Check if email already exists
            if (users.some(user => user.email === email)) {
                showCustomAlert('Email already exists. Please use a different email.');
                return;
            }

            // Add new user
            const newUser = {
                fullname,
                email,
                password,
                userType,
                bloodGroup,
                dateCreated: new Date().toISOString()
            };
            users.push(newUser);

            // Save to localStorage
            localStorage.setItem('users', JSON.stringify(users));
            
            showCustomAlert('Signup successful! Please log in.');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } catch (error) {
            console.error('Error during signup:', error);
            showCustomAlert('An error occurred. Please try again.');
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
