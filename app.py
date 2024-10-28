from flask import Flask, render_template, request, redirect, url_for, flash, session
import mysql.connector
from mysql.connector import pooling
from datetime import datetime

app = Flask(__name__)
app.secret_key = "your_secret_key_here"  # Replace with a strong secret key

# Database Configuration
local_db_config = {
    'user': 'your_local_username',
    'password': 'your_local_password',
    'host': '127.0.0.1',
    'database': 'blood_bank_management'
}

# Create a connection pool
pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="mypool",
    pool_size=5,
    **local_db_config
)

def get_db_connection():
    return pool.get_connection()

# Testing the Database Connection
@app.route('/test-db-connection')
def test_db_connection():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DATABASE();")
    db = cursor.fetchone()
    cursor.close()
    conn.close()
    return f"Connected to database: {db[0]}"

# Home Route
@app.route('/')
def index():
    return render_template('index.html')

# User Registration
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        fullname = request.form['fullname']
        email = request.form['email']
        password = request.form['password']
        blood_type = request.form['blood_type']

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM register WHERE email = %s", (email,))
        if cursor.fetchone():
            flash('Email already exists. Please login.', 'error')
            return redirect(url_for('login'))

        cursor.execute("INSERT INTO register (fullname, email, password, blood_type) VALUES (%s, %s, %s, %s)",
                       (fullname, email, password, blood_type))
        conn.commit()
        cursor.close()
        conn.close()

        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')

# User Login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM register WHERE email = %s AND password = %s", (email, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            session['user'] = {'email': email}  # Store user info in session
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password.', 'error')

    return render_template('login.html')

# Dashboard Route
@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        flash('Please login first.', 'error')
        return redirect(url_for('login'))

    email = session['user']['email']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT fullname, email, blood_type FROM register WHERE email = %s", (email,))
    user_data = cursor.fetchone()

    cursor.execute("SELECT * FROM request WHERE blood_type = %s AND status = 'open'", (user_data[2],))
    blood_requests = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template('dashboard.html', user_data=user_data, blood_requests=blood_requests)

# User Request Submission
@app.route('/request', methods=['GET', 'POST'])
def request_blood():
    if request.method == 'POST':
        location = request.form['location']
        blood_type = request.form['blood_type']
        urgency = request.form['urgency']

        conn = get_db_connection()
        cursor = conn.cursor()
        requester_id = cursor.execute("SELECT id FROM register WHERE email = %s", (session['user']['email'],)).fetchone()[0]
        
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

# Respond to a Request
@app.route('/respond/<int:requester_id>/<int:request_id>')
def respond(requester_id, request_id):
    # Fetch requester and request details, then render respond.html
    # Implementation omitted for brevity
    pass

# Donation Confirmation
@app.route('/donate-blood/<int:request_id>/<int:requester_id>')
def donate_blood(request_id, requester_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE request SET status = 'donated' WHERE id = %s", (request_id,))
    conn.commit()
    cursor.close()
    conn.close()
    flash('Donation confirmed!', 'success')
    return redirect(url_for('dashboard'))

# Running the App
if __name__ == '__main__':
    app.run(debug=True)
