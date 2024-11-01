from flask import Flask, render_template, request, redirect, url_for, flash, session
import mysql.connector
from mysql.connector import pooling
from datetime import datetime
import hashlib  # For password hashing
from werkzeug.security import generate_password_hash

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
    if request.method == 'POST':
        try:
            # Get form data
            fullname = request.form['fullname']
            email = request.form['email']
            password = request.form['password']
            user_type = request.form['user_type']
            blood_group = request.form['blood_group'] if user_type == 'donor' else None

            # Hash the password
            hashed_password = generate_password_hash(password)

            # Get connection from pool
            conn = get_db_connection()
            if not conn:
                flash('Database connection error', 'error')
                return render_template('signup.html')

            cursor = conn.cursor()

            # Create SQL query based on user type
            if user_type == 'donor':
                query = """
                INSERT INTO users (fullname, email, password, user_type, blood_group)
                VALUES (%s, %s, %s, %s, %s)
                """
                values = (fullname, email, hashed_password, user_type, blood_group)
            else:
                query = """
                INSERT INTO users (fullname, email, password, user_type)
                VALUES (%s, %s, %s, %s)
                """
                values = (fullname, email, hashed_password, user_type)

            # Execute query
            cursor.execute(query, values)
            conn.commit()
            cursor.close()
            conn.close()

            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))

        except Exception as e:
            if 'conn' in locals():
                conn.rollback()
                conn.close()
            flash(f'Registration failed: {str(e)}', 'error')
            return render_template('signup.html')

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
