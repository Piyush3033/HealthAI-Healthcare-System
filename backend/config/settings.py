import os
from datetime import timedelta

class Config:
    """Base configuration"""
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    
    # MongoDB
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://localhost:27017/healthai')
    
    # JWT
    JWT_SECRET = os.getenv('JWT_SECRET', 'dev-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRY = int(os.getenv('JWT_EXPIRY', 86400))  # 24 hours
    
    # Encryption
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', 'your-32-byte-encryption-key-here')
    
    # Email (Brevo SMTP)
    BREVO_SMTP_USER = os.getenv('BREVO_SMTP_USER', '')
    BREVO_SMTP_PASSWORD = os.getenv('BREVO_SMTP_PASSWORD', '')
    BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', 'noreply@healthai.com')
    
    # Twilio SMS
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')
    
    # AI/ML
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    
    # CORS
    CORS_ORIGIN = os.getenv('CORS_ORIGIN', 'http://localhost:3000')
    
    # File Storage (S3 or Vercel Blob)
    S3_BUCKET = os.getenv('S3_BUCKET', 'healthai-records')
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    
    # Pagination
    ITEMS_PER_PAGE = 20
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file upload


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    MONGODB_URI = 'mongodb://localhost:27017/healthai_test'


config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config_by_name.get(env, DevelopmentConfig)
