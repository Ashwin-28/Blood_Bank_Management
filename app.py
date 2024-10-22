from flask import Flask, render_template, request, redirect, url_for, flash
from flask_mysqldb import MySQL
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'your_username'
app.config['MYSQL_PASSWORD'] = 'your_password'
app.config['MYSQL_DB'] = 'bloodbridge'

# Initialize MySQL
mysql = MySQL(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

app.config['SECRET_KEY'] = 'your_secret_key_here'  # Change this to a random secret key

class User(UserMixin):
    def __init__(self, id, fullname, email, user_type):
        self.id = id
        self.fullname = fullname
        self.email = email
        self.user_type = user_type

@login_manager.user_loader
def load_user(user_id):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    if user:
        return User(user[0], user[1], user[2], user[4])
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        fullname = request.form['fullname']
        email = request.form['email']
        password = request.form['password']
        user_type = request.form['user_type']

        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        if user:
            flash('Email already exists.', 'error')
            return redirect(url_for('signup'))

        hashed_password = generate_password_hash(password, method='sha256')
        cur.execute("INSERT INTO users (fullname, email, password, user_type) VALUES (%s, %s, %s, %s)",
                    (fullname, email, hashed_password, user_type))
        mysql.connection.commit()
        cur.close()

        flash('Account created successfully!', 'success')
        return redirect(url_for('login'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user_type = request.form['user_type']

        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s AND user_type = %s", (email, user_type))
        user = cur.fetchone()
        cur.close()

        if user and check_password_hash(user[3], password):
            user_obj = User(user[0], user[1], user[2], user[4])
            login_user(user_obj)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email, password, or user type.', 'error')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.user_type == 'admin':
        return render_template('dashboards/admin_dashboard.html')
    elif current_user.user_type == 'donor':
        return render_template('dashboards/donor_dashboard.html')
    elif current_user.user_type == 'manager':
        return render_template('dashboards/manager_dashboard.html')
    else:
        flash('Invalid user type.', 'error')
        return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
