from flask import Blueprint, request, jsonify
from app.database import get_db
from app.utils import JWTAuth, PasswordHash, Response, token_required
from bson import ObjectId
from datetime import datetime
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Email validation regex
EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user (doctor/staff/admin)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name', 'phone', 'role', 'hospital_id']
        if not all(field in data for field in required_fields):
            return Response.error('Missing required fields', 'MISSING_FIELDS', 400)
        
        # Validate email format
        if not re.match(EMAIL_REGEX, data['email']):
            return Response.error('Invalid email format', 'INVALID_EMAIL', 400)
        
        # Validate password strength
        if len(data['password']) < 8:
            return Response.error('Password must be at least 8 characters', 'WEAK_PASSWORD', 400)
        
        # Validate role
        valid_roles = ['admin', 'doctor', 'staff']
        if data['role'] not in valid_roles:
            return Response.error(f'Invalid role. Must be one of: {", ".join(valid_roles)}', 'INVALID_ROLE', 400)
        
        db = get_db()
        
        # Check if email already exists
        existing_user = db.users.find_one({'email': data['email']})
        if existing_user:
            return Response.error('Email already registered', 'EMAIL_EXISTS', 409)
        
        # Verify hospital exists
        hospital = db.hospitals.find_one({'_id': ObjectId(data['hospital_id'])})
        if not hospital:
            return Response.error('Hospital not found', 'HOSPITAL_NOT_FOUND', 404)
        
        # Create new user
        user_doc = {
            'email': data['email'],
            'password_hash': PasswordHash.hash_password(data['password']),
            'full_name': data['full_name'],
            'phone': data['phone'],
            'role': data['role'],
            'hospital_id': ObjectId(data['hospital_id']),
            'department_id': ObjectId(data.get('department_id')) if data.get('department_id') else None,
            'specialization': data.get('specialization'),
            'license_number': data.get('license_number'),
            'status': 'active',
            'created_at': datetime.utcnow(),
            'last_login': None
        }
        
        result = db.users.insert_one(user_doc)
        
        # Generate token
        user_doc['_id'] = result.inserted_id
        token = JWTAuth.generate_token(result.inserted_id, {
            'email': user_doc['email'],
            'role': user_doc['role'],
            'hospital_id': data['hospital_id']
        })
        
        return Response.success({
            'user_id': str(result.inserted_id),
            'email': user_doc['email'],
            'full_name': user_doc['full_name'],
            'role': user_doc['role'],
            'token': token
        }, 'User registered successfully', 201)
    
    except Exception as e:
        return Response.error(str(e), 'REGISTRATION_ERROR', 500)


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user (platform 1: provider, platform 2: patient)"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return Response.error('Email and password required', 'MISSING_CREDENTIALS', 400)
        
        db = get_db()
        
        # Check for provider user (Platform 1)
        user = db.users.find_one({'email': data['email']})
        
        if user and PasswordHash.verify_password(data['password'], user['password_hash']):
            # Update last login
            db.users.update_one({'_id': user['_id']}, {
                '$set': {'last_login': datetime.utcnow()}
            })
            
            # Generate token
            token = JWTAuth.generate_token(user['_id'], {
                'email': user['email'],
                'role': user['role'],
                'hospital_id': str(user['hospital_id'])
            })
            
            return Response.success({
                'user_id': str(user['_id']),
                'email': user['email'],
                'full_name': user['full_name'],
                'role': user['role'],
                'hospital_id': str(user['hospital_id']),
                'platform': 'provider',
                'token': token
            }, 'Login successful')
        
        # Check for patient user (Platform 2)
        patient = db.patients.find_one({'email': data['email']})
        
        if patient and PasswordHash.verify_password(data['password'], patient['password_hash']):
            # Update last login
            db.patients.update_one({'_id': patient['_id']}, {
                '$set': {'last_login': datetime.utcnow()}
            })
            
            # Generate token
            token = JWTAuth.generate_token(patient['_id'], {
                'email': patient['email'],
                'role': 'patient',
                'hospital_id': str(patient['hospital_id'])
            })
            
            return Response.success({
                'patient_id': patient['patient_id'],
                'email': patient['email'],
                'full_name': patient['full_name'],
                'platform': 'patient',
                'token': token
            }, 'Login successful')
        
        return Response.error('Invalid email or password', 'INVALID_CREDENTIALS', 401)
    
    except Exception as e:
        return Response.error(str(e), 'LOGIN_ERROR', 500)


@auth_bp.route('/verify-token', methods=['POST'])
@token_required
def verify_token():
    """Verify if token is valid"""
    return Response.success({
        'user_id': request.user_id,
        'email': request.user_email,
        'role': request.user_role,
        'hospital_id': request.hospital_id
    }, 'Token is valid')


@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        
        if not data.get('old_password') or not data.get('new_password'):
            return Response.error('Old and new password required', 'MISSING_PASSWORD', 400)
        
        if len(data['new_password']) < 8:
            return Response.error('New password must be at least 8 characters', 'WEAK_PASSWORD', 400)
        
        db = get_db()
        
        # Find user
        user = db.users.find_one({'_id': ObjectId(request.user_id)})
        if not user:
            return Response.error('User not found', 'USER_NOT_FOUND', 404)
        
        # Verify old password
        if not PasswordHash.verify_password(data['old_password'], user['password_hash']):
            return Response.error('Old password is incorrect', 'INVALID_PASSWORD', 401)
        
        # Update password
        new_hash = PasswordHash.hash_password(data['new_password'])
        db.users.update_one({'_id': user['_id']}, {
            '$set': {'password_hash': new_hash}
        })
        
        return Response.success(None, 'Password changed successfully')
    
    except Exception as e:
        return Response.error(str(e), 'PASSWORD_CHANGE_ERROR', 500)
