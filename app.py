from flask import Flask, render_template, request, redirect, url_for, flash, session
import mysql.connector
from mysql.connector import pooling
from datetime import datetime
import hashlib  # For password hashing

app = Flask(__name__)
app.secret_key = "Ashwin_1828"  # Replace with a strong secret key

# Database Configuration
local_db_config = {
    'user': 'admin',
    'password': 'Ashwin_1828',
    'host': 'database-1.c3y28cwgmdxk.us-east-1.rds.amazonaws.com',
    'database': 'Blood_Bank_Management'
}

# Connection pool
pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    **local_db_config
)

def get_db_connection():
    try:
        return pool.get_connection()
    except mysql.connector.Error as err:
        flash(f"Database connection error: {err}", 'error')
        return None

# Testing the Database Connection
@app.route('/test-db-connection')
def test_db_connection():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DATABASE();")
        db = cursor.fetchone()
        cursor.close()
        conn.close()
        return f"Connected to database: {db[0]}"
    return "Failed to connect to database."

# Home Route
@app.route('/')
def home():
    if 'user' in session:
        role = session['user']['role']
        if role == 'admin':
            return redirect(url_for('admin_dashboard'))
        elif role == 'manager':
            return redirect(url_for('manager_dashboard'))
        elif role == 'donor':
            return redirect(url_for('donor_dashboard'))
    return render_template('home.html')

# User Registration
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user' in session:
        return redirect(url_for('home'))

    if request.method == 'POST':
        fullname = request.form['fullname']
        email = request.form['email']
        password = request.form['password']
        blood_type = request.form['blood_type']
        role = request.form.get('role', 'donor')  # Default role is donor

        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()

            # Check if email already exists
            cursor.execute("SELECT * FROM register WHERE email = %s", (email,))
            if cursor.fetchone():
                flash('Email already exists. Please login.', 'error')
                cursor.close()
                conn.close()
                return redirect(url_for('login'))

            # Hash the password before storing
            hashed_password = hashlib.sha256(password.encode()).hexdigest()

            try:
                cursor.execute("""
                    INSERT INTO register (fullname, email, password, blood_type, role) 
                    VALUES (%s, %s, %s, %s, %s)
                """, (fullname, email, hashed_password, blood_type, role))
                conn.commit()
                flash('Registration successful! Please login.', 'success')
                return redirect(url_for('login'))
            except Exception as e:
                flash(f'Registration failed: {str(e)}', 'error')
            finally:
                cursor.close()
                conn.close()

    return render_template('signup.html')

# User Login
@app.route('/index', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            cursor.execute("SELECT * FROM register WHERE email = %s AND password = %s", (email, hashed_password))
            user = cursor.fetchone()
            cursor.close()
            conn.close()

            if user:
                session['user'] = {'email': email, 'role': user[4]}  # Assuming role is at index 4
                if user[4] == 'admin':
                    return redirect(url_for('admin_dashboard'))
                return redirect(url_for('dashboard'))
            else:
                flash('Invalid email or password.', 'error')

    return render_template('index.html')

# Dashboard Route for Donors
@app.route('/dashboard')
def dashboard():
    if 'user' not in session or session['user']['role'] != 'user':
        flash('Access restricted to donors.', 'error')
        return redirect(url_for('login'))

    email = session['user']['email']
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("SELECT fullname, email, blood_type FROM register WHERE email = %s", (email,))
        user_data = cursor.fetchone()

        cursor.execute("SELECT * FROM request WHERE blood_type = %s AND status = 'open'", (user_data[2],))
        blood_requests = cursor.fetchall()

        cursor.close()
        conn.close()

        return render_template('dashboards/donor_dashboard.html', user_data=user_data, blood_requests=blood_requests)

# Admin Dashboard Route
@app.route('/admin_dashboard')
def admin_dashboard():
    if 'user' not in session or session['user']['role'] != 'admin':
        flash('Access restricted to administrators.', 'error')
        return redirect(url_for('login'))

    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM request WHERE status = 'open'")
        open_requests = cursor.fetchall()
        cursor.execute("SELECT blood_type, quantity FROM inventory")
        inventory = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template('dashboards/admin_dashboard.html', open_requests=open_requests, inventory=inventory)

# Request Blood Route
@app.route('/request', methods=['GET', 'POST'])
def request_blood():
    if request.method == 'POST':
        location = request.form['location']
        blood_type = request.form['blood_type']
        urgency = request.form['urgency']

        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM register WHERE email = %s", (session['user']['email'],))
            requester_id = cursor.fetchone()[0]

            try:
                cursor.execute("INSERT INTO request (location, blood_type, urgency, requester_id) VALUES (%s, %s, %s, %s)",
                               (location, blood_type, urgency, requester_id))
                conn.commit()
                flash('Blood request submitted successfully!', 'success')
            except Exception as e:
                conn.rollback()
                flash('Error occurred while submitting request.', 'error')
            
            cursor.close()
            conn.close()
            return redirect(url_for('dashboard'))

    return render_template('request.html')

# Donation Confirmation
@app.route('/donate-blood/<int:request_id>')
def donate_blood(request_id):
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE request SET status = 'donated' WHERE id = %s", (request_id,))
        conn.commit()
        cursor.close()
        conn.close()
        flash('Donation confirmed!', 'success')
    return redirect(url_for('dashboard'))

# Running the App
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
