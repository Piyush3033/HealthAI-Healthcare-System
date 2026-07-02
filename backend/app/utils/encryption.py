from cryptography.fernet import Fernet
import hashlib
import base64
from config.settings import get_config

config = get_config()

class Encryption:
    """Handles encryption/decryption for sensitive data (Aadhaar, etc.)"""
    
    @staticmethod
    def _get_cipher():
        """Get Fernet cipher instance"""
        # Ensure key is 32 bytes and base64 encoded
        key = config.ENCRYPTION_KEY
        if isinstance(key, str):
            key = key.encode()
        
        # Create a valid Fernet key from the provided key
        # Pad if necessary
        while len(base64.urlsafe_b64decode(key + b'==')) < 32:
            key = base64.urlsafe_b64encode(base64.urlsafe_b64decode(key + b'=='))
        
        # Use the first 32 bytes for a new key
        valid_key = base64.urlsafe_b64encode(
            hashlib.sha256(key if isinstance(key, bytes) else key.encode()).digest()
        )
        return Fernet(valid_key)
    
    @staticmethod
    def encrypt(data):
        """Encrypt sensitive data"""
        if not data:
            return None
        
        try:
            cipher = Encryption._get_cipher()
            encrypted = cipher.encrypt(data.encode() if isinstance(data, str) else data)
            return encrypted.decode()
        except Exception as e:
            print(f"Encryption error: {e}")
            return None
    
    @staticmethod
    def decrypt(encrypted_data):
        """Decrypt sensitive data"""
        if not encrypted_data:
            return None
        
        try:
            cipher = Encryption._get_cipher()
            decrypted = cipher.decrypt(encrypted_data.encode() if isinstance(encrypted_data, str) else encrypted_data)
            return decrypted.decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return None
    
    @staticmethod
    def hash_aadhaar(aadhaar):
        """Hash Aadhaar number for storage"""
        if not aadhaar:
            return None
        
        # Remove any spaces
        aadhaar = aadhaar.replace(' ', '')
        
        # Hash with SHA256
        hash_obj = hashlib.sha256(aadhaar.encode())
        return hash_obj.hexdigest()
    
    @staticmethod
    def mask_aadhaar(aadhaar):
        """Mask Aadhaar for display (show last 4 digits only)"""
        if not aadhaar:
            return None
        
        aadhaar = aadhaar.replace(' ', '')
        if len(aadhaar) < 4:
            return 'XXXX-XXXX-XXXX'
        
        return f"XXXX-XXXX-{aadhaar[-4:]}"


# For password hashing, use bcrypt
import bcrypt

class PasswordHash:
    """Handles password hashing and verification"""
    
    @staticmethod
    def hash_password(password):
        """Hash password using bcrypt"""
        if not password:
            raise ValueError('Password cannot be empty')
        
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode(), salt)
        return hashed.decode()
    
    @staticmethod
    def verify_password(password, hashed):
        """Verify password against hash"""
        if not password or not hashed:
            return False
        
        return bcrypt.checkpw(password.encode(), hashed.encode())
