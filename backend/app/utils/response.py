from flask import jsonify
from datetime import datetime

class Response:
    """Standard response formatting"""
    
    @staticmethod
    def success(data=None, message='Success', status_code=200):
        """Return success response"""
        return jsonify({
            'success': True,
            'message': message,
            'data': data,
            'timestamp': datetime.utcnow().isoformat()
        }), status_code
    
    @staticmethod
    def error(message='Error', error_code='UNKNOWN_ERROR', status_code=400, details=None):
        """Return error response"""
        return jsonify({
            'success': False,
            'message': message,
            'error_code': error_code,
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        }), status_code
    
    @staticmethod
    def paginated(items, total, page, per_page, message='Success'):
        """Return paginated response"""
        total_pages = (total + per_page - 1) // per_page
        
        return jsonify({
            'success': True,
            'message': message,
            'data': items,
            'pagination': {
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
