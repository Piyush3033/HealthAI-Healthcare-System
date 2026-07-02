from flask import Blueprint, request
from app.database import get_db
from app.utils import Response, token_required, role_required
from bson import ObjectId
from datetime import datetime

hospitals_bp = Blueprint('hospitals', __name__, url_prefix='/api/hospitals')

@hospitals_bp.route('', methods=['POST'])
@role_required('admin')
def create_hospital():
    """Create a new hospital (only by super-admin)"""
    try:
        data = request.get_json()
        
        required_fields = ['hospital_name', 'city', 'state', 'pincode', 'phone']
        if not all(field in data for field in required_fields):
            return Response.error('Missing required fields', 'MISSING_FIELDS', 400)
        
        db = get_db()
        
        hospital_doc = {
            'hospital_name': data['hospital_name'],
            'address': data.get('address', ''),
            'city': data['city'],
            'state': data['state'],
            'pincode': data['pincode'],
            'phone': data['phone'],
            'email': data.get('email', ''),
            'website': data.get('website', ''),
            'bed_count': int(data.get('bed_count', 0)),
            'established_year': int(data.get('established_year', 0)),
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.hospitals.insert_one(hospital_doc)
        
        return Response.success({
            'hospital_id': str(result.inserted_id),
            'hospital_name': hospital_doc['hospital_name']
        }, 'Hospital created successfully', 201)
    
    except Exception as e:
        return Response.error(str(e), 'CREATION_ERROR', 500)


@hospitals_bp.route('', methods=['GET'])
@token_required
def list_hospitals():
    """List all hospitals (with pagination)"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        if page < 1:
            page = 1
        
        db = get_db()
        
        # Get total count
        total = db.hospitals.count_documents({'status': 'active'})
        
        # Get paginated results
        skip = (page - 1) * per_page
        hospitals = list(db.hospitals.find({'status': 'active'})
                        .skip(skip)
                        .limit(per_page))
        
        # Convert ObjectId to string
        for hospital in hospitals:
            hospital['_id'] = str(hospital['_id'])
        
        return Response.paginated(hospitals, total, page, per_page, 'Hospitals retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)


@hospitals_bp.route('/<hospital_id>', methods=['GET'])
@token_required
def get_hospital(hospital_id):
    """Get specific hospital details"""
    try:
        db = get_db()
        
        hospital = db.hospitals.find_one({'_id': ObjectId(hospital_id)})
        
        if not hospital:
            return Response.error('Hospital not found', 'HOSPITAL_NOT_FOUND', 404)
        
        hospital['_id'] = str(hospital['_id'])
        
        return Response.success(hospital, 'Hospital retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)


@hospitals_bp.route('/<hospital_id>', methods=['PUT'])
@token_required
def update_hospital(hospital_id):
    """Update hospital details (admin only)"""
    try:
        data = request.get_json()
        db = get_db()
        
        # Verify hospital exists
        hospital = db.hospitals.find_one({'_id': ObjectId(hospital_id)})
        if not hospital:
            return Response.error('Hospital not found', 'HOSPITAL_NOT_FOUND', 404)
        
        # Update fields
        update_doc = {k: v for k, v in data.items() if k not in ['_id', 'created_at']}
        update_doc['updated_at'] = datetime.utcnow()
        
        db.hospitals.update_one({'_id': ObjectId(hospital_id)}, {'$set': update_doc})
        
        return Response.success(None, 'Hospital updated successfully')
    
    except Exception as e:
        return Response.error(str(e), 'UPDATE_ERROR', 500)


@hospitals_bp.route('/<hospital_id>/network', methods=['GET'])
@token_required
def get_hospital_network(hospital_id):
    """Get all hospitals in network for referrals"""
    try:
        db = get_db()
        
        # Get all active hospitals except the requesting hospital
        hospitals = list(db.hospitals.find({
            'status': 'active',
            '_id': {'$ne': ObjectId(hospital_id)}
        }).projection({'hospital_name': 1, 'city': 1, 'phone': 1, 'email': 1}))
        
        for hospital in hospitals:
            hospital['_id'] = str(hospital['_id'])
        
        return Response.success(hospitals, 'Hospital network retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)
