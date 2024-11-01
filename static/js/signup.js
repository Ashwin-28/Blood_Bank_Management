document.addEventListener('DOMContentLoaded', function() {
    const userTypeInputs = document.querySelectorAll('input[name="user_type"]');
    const bloodGroupField = document.getElementById('blood-group-field');
    const bloodGroupSelect = document.getElementById('blood-group');

    // Handle blood group field visibility
    userTypeInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'donor') {
                bloodGroupField.style.display = 'block';
                bloodGroupSelect.required = true;
            } else {
                bloodGroupField.style.display = 'none';
                bloodGroupSelect.required = false;
            }
        });
    });

    // Form validation
    const form = document.getElementById('signup-form');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');

    form.addEventListener('submit', function(event) {
        if (password.value !== confirmPassword.value) {
            event.preventDefault();
            alert('Passwords do not match!');
        }
    });
});
