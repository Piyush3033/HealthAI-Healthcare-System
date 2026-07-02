from flask import Flask
from flask_cors import CORS
from app.database import Database
from config.settings import get_config

def create_app(config_name=None):
    """Application factory"""
    
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Initialize database
    Database.initialize(config.MONGODB_URI)
    
    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": config.CORS_ORIGIN.split(','),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Register blueprints
    from app.blueprints.auth import auth_bp
    from app.blueprints.hospitals import hospitals_bp
    from app.blueprints.patients import patients_bp
    from app.blueprints.records import records_bp
    from app.blueprints.permissions import permissions_bp
    from app.blueprints.referrals import referrals_bp
    from app.blueprints.ai import ai_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(hospitals_bp)
    app.register_blueprint(patients_bp)
    app.register_blueprint(records_bp)
    app.register_blueprint(permissions_bp)
    app.register_blueprint(referrals_bp)
    app.register_blueprint(ai_bp)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'service': 'HealthAI Backend'}, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {
            'success': False,
            'message': 'Endpoint not found',
            'error_code': 'NOT_FOUND'
        }, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {
            'success': False,
            'message': 'Internal server error',
            'error_code': 'INTERNAL_ERROR'
        }, 500
    
    # Shutdown handler
    @app.teardown_appcontext
    def shutdown_db(exception=None):
        pass  # Database connection is managed per-request
    
    return app
