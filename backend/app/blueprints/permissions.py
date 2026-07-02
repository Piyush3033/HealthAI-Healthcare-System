from flask import Blueprint, request
from app.database import get_db
from app.utils import Response, token_required, role_required
from bson import ObjectId
from datetime import datetime

permissions_bp = Blueprint('permissions', __name__, url_prefix='/api/permissions')

@permissions_bp.route('/users/<user_id>/set', methods=['POST'])
@role_required('admin')
def set_user_permissions(user_id):
    """Set granular permissions for a user (admin only)"""
    try:
        data = request.get_json()
        db = get_db()
        
        # Verify user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return Response.error('User not found', 'USER_NOT_FOUND', 404)
        
        # Build permission document
        permission_doc = {
            'user_id': ObjectId(user_id),
            'resource_type': data.get('resource_type'),  # patients, records, appointments, referrals, etc
            'access_level': data.get('access_level'),  # view, edit, manage
            'permissions': {
                'read': data.get('permissions', {}).get('read', False),
                'write': data.get('permissions', {}).get('write', False),
                'execute': data.get('permissions', {}).get('execute', False),
                'delete': data.get('permissions', {}).get('delete', False)
            },
            'hospital_id': user['hospital_id'],
            'accessible_hospitals': data.get('accessible_hospitals', [ObjectId(str(user['hospital_id']))]),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Update or insert permission
        db.user_permissions.update_one(
            {'user_id': ObjectId(user_id), 'resource_type': data.get('resource_type')},
            {'$set': permission_doc},
            upsert=True
        )
        
        return Response.success(None, 'User permissions updated successfully')
    
    except Exception as e:
        return Response.error(str(e), 'PERMISSION_ERROR', 500)


@permissions_bp.route('/users/<user_id>/get', methods=['GET'])
@token_required
def get_user_permissions(user_id):
    """Get all permissions for a user"""
    try:
        db = get_db()
        
        permissions = list(db.user_permissions.find({
            'user_id': ObjectId(user_id)
        }))
        
        for perm in permissions:
            perm['_id'] = str(perm['_id'])
            perm['user_id'] = str(perm['user_id'])
            perm['hospital_id'] = str(perm['hospital_id'])
            perm['accessible_hospitals'] = [str(h) for h in perm.get('accessible_hospitals', [])]
        
        return Response.success(permissions, 'User permissions retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)


@permissions_bp.route('/check', methods=['POST'])
@token_required
def check_permission():
    """Check if user has specific permission"""
    try:
        data = request.get_json()
        db = get_db()
        
        # Get user's permission for resource
        permission = db.user_permissions.find_one({
            'user_id': ObjectId(request.user_id),
            'resource_type': data.get('resource_type')
        })
        
        if not permission:
            return Response.success({
                'has_permission': False,
                'read': False,
                'write': False,
                'execute': False,
                'delete': False
            }, 'Permission check completed')
        
        required_perm = data.get('required_permission')  # read, write, execute, delete
        has_access = permission['permissions'].get(required_perm, False)
        
        return Response.success({
            'has_permission': has_access,
            'permissions': permission['permissions']
        }, 'Permission check completed')
    
    except Exception as e:
        return Response.error(str(e), 'CHECK_ERROR', 500)


@permissions_bp.route('/grant-cross-hospital', methods=['POST'])
@role_required('admin')
def grant_cross_hospital_access(user_id):
    """Grant user access to another hospital (for referrals)"""
    try:
        data = request.get_json()
        db = get_db()
        
        # Verify user exists
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return Response.error('User not found', 'USER_NOT_FOUND', 404)
        
        # Verify target hospital exists
        target_hospital = db.hospitals.find_one({'_id': ObjectId(data.get('hospital_id'))})
        if not target_hospital:
            return Response.error('Target hospital not found', 'HOSPITAL_NOT_FOUND', 404)
        
        # Update accessible hospitals
        db.user_permissions.update_many(
            {'user_id': ObjectId(user_id)},
            {'$addToSet': {'accessible_hospitals': ObjectId(data.get('hospital_id'))}}
        )
        
        return Response.success(None, 'Cross-hospital access granted successfully')
    
    except Exception as e:
        return Response.error(str(e), 'GRANT_ERROR', 500)
