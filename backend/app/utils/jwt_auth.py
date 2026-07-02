import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from config.settings import get_config

config = get_config()

class JWTAuth:
    """JWT token generation and validation"""
    
    @staticmethod
    def generate_token(user_id, user_data):
        """Generate JWT token"""
        payload = {
            'user_id': str(user_id),
            'email': user_data.get('email'),
            'role': user_data.get('role'),
            'hospital_id': str(user_data.get('hospital_id')),
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(seconds=config.JWT_EXPIRY)
        }
        
        token = jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)
        return token
    
    @staticmethod
    def verify_token(token):
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def get_token_from_request():
        """Extract token from Authorization header"""
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        try:
            # Format: Bearer <token>
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                return parts[1]
        except:
            pass
        
        return None


def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = JWTAuth.get_token_from_request()
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        payload = JWTAuth.verify_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user info to request context
        request.user_id = payload.get('user_id')
        request.user_email = payload.get('email')
        request.user_role = payload.get('role')
        request.hospital_id = payload.get('hospital_id')
        
        return f(*args, **kwargs)
    
    return decorated


def role_required(*allowed_roles):
    """Decorator to require specific roles"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if request.user_role not in allowed_roles:
                return jsonify({'error': f'Access denied. Required roles: {", ".join(allowed_roles)}'}), 403
            
            return f(*args, **kwargs)
        
        return decorated
    
    return decorator
