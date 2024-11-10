from flask import Flask, render_template, request, redirect, url_for, flash, session
import mysql.connector
from mysql.connector import pooling
from datetime import datetime
import os
from werkzeug.security import generate_password_hash, check_password_hash
from contextlib import contextmanager
import logging

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "default-secret-key")  # Use environment variables for sensitive data

# Logging configuration
logging.basicConfig(filename='app.log', level=logging.ERROR)

# Database Configuration
local_db_config = {
    'user': os.getenv("DB_USER", "admin"),
    'password': os.getenv("DB_PASSWORD", "password"),
    'host': os.getenv("DB_HOST", "localhost"),
    'database': os.getenv("DB_NAME", "blood_bank1")
}

# Connection pool
pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    **local_db_config
)

@contextmanager
def get_db_connection():
    try:
        conn = pool.get_connection()
        yield conn
    except mysql.connector.Error as err:
        flash(f"Database connection error: {err}", 'error')
        logging.error(f"Database connection error: {err}")
    finally:
        conn.close() if 'conn' in locals() and conn.is_connected() else None

# Testing the Database Connection
@app.route('/test-db-connection')
def test_db_connection():
    with get_db_connection() as conn:
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT DATABASE();")
            db = cursor.fetchone()
            cursor.close()
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
            return redirect(url_for('dashboard'))
    return render_template('home.html')

# User Registration
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        try:
            fullname = request.form['fullname']
            email = request.form['email']
            password = request.form['password']
            user_type = request.form['user_type']
            blood_group = request.form['blood_group'] if user_type == 'donor' else None

            hashed_password = generate_password_hash(password)

            with get_db_connection() as conn:
                cursor = conn.cursor()
                if user_type == 'donor':
                    query = """
                    INSERT INTO register (fullname, email, password, blood_type, user_type)
                    VALUES (%s, %s, %s, %s, %s)
                    """
                    values = (fullname, email, hashed_password, blood_group, user_type)
                else:
                    query = """
                    INSERT INTO register (fullname, email, password, user_type)
                    VALUES (%s, %s, %s, %s)
                    """
                    values = (fullname, email, hashed_password, user_type)

                cursor.execute(query, values)
                conn.commit()
                cursor.close()

            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('index'))

        except Exception as e:
            flash(f'Registration failed: {str(e)}', 'error')
            logging.error(f'Registration failed: {e}')
            return render_template('signup.html')

    return render_template('signup.html')

# User Login
@app.route('/index', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        try:
            email = request.form['email']
            password = request.form['password']

            with get_db_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT * FROM register WHERE email = %s", (email,))
                user = cursor.fetchone()
                cursor.close()

                if user and check_password_hash(user['password'], password):
                    session['user'] = {
                        'email': email,
                        'role': user['user_type']
                    }
                    if user['user_type'] == 'admin':
                        return redirect(url_for('admin_dashboard'))
                    elif user['user_type'] == 'manager':
                        return redirect(url_for('manager_dashboard'))
                    return redirect(url_for('dashboard'))
                else:
                    flash('Invalid email or password.', 'error')
        except Exception as e:
            flash(f'Login error: {str(e)}', 'error')
            logging.error(f'Login error: {e}')

    return render_template('index.html')

# Dashboard Route for Donors
@app.route('/dashboard')
def dashboard():
    if 'user' not in session or session['user']['role'] != 'donor':
        flash('Access restricted to donors.', 'error')
        return redirect(url_for('index'))

    email = session['user']['email']
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT fullname, email, blood_type FROM register WHERE email = %s", (email,))
        user_data = cursor.fetchone()

        cursor.execute("SELECT * FROM request WHERE blood_type = %s AND status = 'open'", (user_data[2],))
        blood_requests = cursor.fetchall()

        cursor.close()

    return render_template('dashboards/donor_dashboard.html', user_data=user_data, blood_requests=blood_requests)

# Admin Dashboard Route
@app.route('/admin_dashboard')
def admin_dashboard():
    if 'user' not in session or session['user']['role'] != 'admin':
        flash('Access restricted to administrators.', 'error')
        return redirect(url_for('index'))

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM request WHERE status = 'open'")
        open_requests = cursor.fetchall()
        cursor.execute("SELECT blood_type, quantity FROM inventory")
        inventory = cursor.fetchall()
        cursor.close()

    return render_template('dashboards/admin_dashboard.html', open_requests=open_requests, inventory=inventory)

# Request Blood Route
@app.route('/request', methods=['GET', 'POST'])
def request_blood():
    if request.method == 'POST':
        location = request.form['location']
        blood_type = request.form['blood_type']
        urgency = request.form['urgency']

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM register WHERE email = %s", (session['user']['email'],))
            requester_id = cursor.fetchone()[0]

            try:
                cursor.execute(
                    "INSERT INTO request (location, blood_type, urgency, requester_id) VALUES (%s, %s, %s, %s)",
                    (location, blood_type, urgency, requester_id)
                )
                conn.commit()
                flash('Blood request submitted successfully!', 'success')
            except Exception as e:
                conn.rollback()
                flash('Error occurred while submitting request.', 'error')
                logging.error(f"Error while submitting request: {e}")
            
            cursor.close()
            
        return redirect(url_for('dashboard'))

    return render_template('request.html')

# Donation Confirmation
@app.route('/donate-blood/<int:request_id>')
def donate_blood(request_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE request SET status = 'donated' WHERE id = %s", (request_id,))
        conn.commit()
        cursor.close()
        
    flash('Donation confirmed!', 'success')
    return redirect(url_for('dashboard'))

# Manager Dashboard Route
@app.route('/manager_dashboard')
def manager_dashboard():
    if 'user' not in session or session['user']['role'] != 'manager':
        flash('Access restricted to managers.', 'error')
        return redirect(url_for('index'))

    # Example logic to fetch manager-specific data
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM request WHERE status = 'open'")  # Example query
        open_requests = cursor.fetchall()
        cursor.execute("SELECT blood_type, quantity FROM inventory")  # Example query
        inventory = cursor.fetchall()
        cursor.close()

    return render_template('dashboards/manager_dashboard.html', open_requests=open_requests, inventory=inventory)

# Running the App
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
