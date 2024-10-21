from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bloodbridge.db'
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
migrate = Migrate(app, db)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)

class Donation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    donation_date = db.Column(db.DateTime, nullable=False)
    blood_type = db.Column(db.String(10), nullable=False)
    amount = db.Column(db.Float, nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        fullname = request.form.get('fullname')
        email = request.form.get('email')
        password = request.form.get('password')
        user_type = request.form.get('user_type')

        user = User.query.filter_by(email=email).first()
        if user:
            flash('Email already exists.', 'error')
            return redirect(url_for('signup'))

        new_user = User(fullname=fullname, email=email, password=generate_password_hash(password, method='sha256'), user_type=user_type)
        db.session.add(new_user)
        db.session.commit()

        flash('Account created successfully!', 'success')
        return redirect(url_for('login'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password.', 'error')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    donations = Donation.query.filter_by(user_id=current_user.id).order_by(Donation.donation_date.desc()).limit(5).all()
    return render_template('dashboard.html', user=current_user, donations=donations)

@app.route('/schedule_donation', methods=['GET', 'POST'])
@login_required
def schedule_donation():
    if request.method == 'POST':
        donation_date = datetime.strptime(request.form.get('donation_date'), '%Y-%m-%d')
        blood_type = request.form.get('blood_type')
        amount = float(request.form.get('amount'))

        new_donation = Donation(user_id=current_user.id, donation_date=donation_date, blood_type=blood_type, amount=amount)
        db.session.add(new_donation)
        db.session.commit()

        flash('Donation scheduled successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('schedule_donation.html')

@app.route('/donation_history')
@login_required
def donation_history():
    donations = Donation.query.filter_by(user_id=current_user.id).order_by(Donation.donation_date.desc()).all()
    return render_template('donation_history.html', donations=donations)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
