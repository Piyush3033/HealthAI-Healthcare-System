from flask import Blueprint, request
from app.database import get_db
from app.utils import Response, token_required, role_required
from bson import ObjectId
from datetime import datetime

referrals_bp = Blueprint('referrals', __name__, url_prefix='/api/referrals')

@referrals_bp.route('/create', methods=['POST'])
@token_required
def create_referral():
    """Create a new cross-hospital referral"""
    try:
        data = request.get_json()
        
        required_fields = ['patient_id', 'to_hospital_id', 'reason', 'urgency']
        if not all(field in data for field in required_fields):
            return Response.error('Missing required fields', 'MISSING_FIELDS', 400)
        
        # Validate urgency level
        valid_urgency = ['routine', 'urgent', 'emergency']
        if data['urgency'] not in valid_urgency:
            return Response.error(f'Invalid urgency. Must be one of: {", ".join(valid_urgency)}', 'INVALID_URGENCY', 400)
        
        db = get_db()
        
        # Verify patient exists
        patient = db.patients.find_one({'patient_id': data['patient_id']})
        if not patient:
            return Response.error('Patient not found', 'PATIENT_NOT_FOUND', 404)
        
        # Verify from hospital (user's hospital)
        from_hospital = db.hospitals.find_one({'_id': ObjectId(request.hospital_id)})
        if not from_hospital:
            return Response.error('From hospital not found', 'HOSPITAL_NOT_FOUND', 404)
        
        # Verify to hospital exists
        to_hospital = db.hospitals.find_one({'_id': ObjectId(data['to_hospital_id'])})
        if not to_hospital:
            return Response.error('To hospital not found', 'HOSPITAL_NOT_FOUND', 404)
        
        # Create referral document
        referral_doc = {
            'patient_id': data['patient_id'],
            'from_hospital_id': ObjectId(request.hospital_id),
            'to_hospital_id': ObjectId(data['to_hospital_id']),
            'from_doctor_id': ObjectId(request.user_id),
            'to_doctor_id': ObjectId(data.get('to_doctor_id')) if data.get('to_doctor_id') else None,
            'reason': data['reason'],
            'medical_summary': data.get('medical_summary', ''),
            'urgency': data['urgency'],
            'status': 'pending',  # pending, accepted, rejected, completed
            'referral_date': datetime.utcnow(),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.referrals.insert_one(referral_doc)
        
        # Create audit log
        db.audit_logs.insert_one({
            'hospital_id': ObjectId(request.hospital_id),
            'user_id': ObjectId(request.user_id),
            'action': 'CREATE_REFERRAL',
            'resource_type': 'referral',
            'resource_id': str(result.inserted_id),
            'old_value': None,
            'new_value': referral_doc,
            'ip_address': request.remote_addr,
            'timestamp': datetime.utcnow()
        })
        
        return Response.success({
            'referral_id': str(result.inserted_id),
            'patient_id': data['patient_id'],
            'status': 'pending'
        }, 'Referral created successfully', 201)
    
    except Exception as e:
        return Response.error(str(e), 'CREATION_ERROR', 500)


@referrals_bp.route('/<referral_id>/accept', methods=['PUT'])
@token_required
def accept_referral(referral_id):
    """Accept an incoming referral"""
    try:
        db = get_db()
        
        # Get referral
        referral = db.referrals.find_one({'_id': ObjectId(referral_id)})
        if not referral:
            return Response.error('Referral not found', 'REFERRAL_NOT_FOUND', 404)
        
        # Verify user is from receiving hospital
        if str(referral['to_hospital_id']) != request.hospital_id:
            return Response.error('Unauthorized to accept this referral', 'UNAUTHORIZED', 403)
        
        # Update referral
        db.referrals.update_one(
            {'_id': ObjectId(referral_id)},
            {
                '$set': {
                    'status': 'accepted',
                    'to_doctor_id': ObjectId(request.user_id),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        # Create audit log
        db.audit_logs.insert_one({
            'hospital_id': ObjectId(request.hospital_id),
            'user_id': ObjectId(request.user_id),
            'action': 'ACCEPT_REFERRAL',
            'resource_type': 'referral',
            'resource_id': referral_id,
            'old_value': {'status': referral['status']},
            'new_value': {'status': 'accepted'},
            'ip_address': request.remote_addr,
            'timestamp': datetime.utcnow()
        })
        
        return Response.success(None, 'Referral accepted successfully')
    
    except Exception as e:
        return Response.error(str(e), 'UPDATE_ERROR', 500)


@referrals_bp.route('/<referral_id>/reject', methods=['PUT'])
@token_required
def reject_referral(referral_id):
    """Reject an incoming referral"""
    try:
        data = request.get_json()
        db = get_db()
        
        # Get referral
        referral = db.referrals.find_one({'_id': ObjectId(referral_id)})
        if not referral:
            return Response.error('Referral not found', 'REFERRAL_NOT_FOUND', 404)
        
        # Verify user is from receiving hospital
        if str(referral['to_hospital_id']) != request.hospital_id:
            return Response.error('Unauthorized to reject this referral', 'UNAUTHORIZED', 403)
        
        # Update referral
        db.referrals.update_one(
            {'_id': ObjectId(referral_id)},
            {
                '$set': {
                    'status': 'rejected',
                    'notes': data.get('rejection_reason', ''),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        # Create audit log
        db.audit_logs.insert_one({
            'hospital_id': ObjectId(request.hospital_id),
            'user_id': ObjectId(request.user_id),
            'action': 'REJECT_REFERRAL',
            'resource_type': 'referral',
            'resource_id': referral_id,
            'old_value': {'status': referral['status']},
            'new_value': {'status': 'rejected'},
            'ip_address': request.remote_addr,
            'timestamp': datetime.utcnow()
        })
        
        return Response.success(None, 'Referral rejected successfully')
    
    except Exception as e:
        return Response.error(str(e), 'UPDATE_ERROR', 500)


@referrals_bp.route('/outgoing', methods=['GET'])
@token_required
def get_outgoing_referrals():
    """Get referrals created by the user's hospital"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        db = get_db()
        
        # Get count
        total = db.referrals.count_documents({'from_hospital_id': ObjectId(request.hospital_id)})
        
        # Get paginated results
        skip = (page - 1) * per_page
        referrals = list(db.referrals.find({
            'from_hospital_id': ObjectId(request.hospital_id)
        }).skip(skip).limit(per_page))
        
        # Convert ObjectIds
        for ref in referrals:
            ref['_id'] = str(ref['_id'])
            ref['from_hospital_id'] = str(ref['from_hospital_id'])
            ref['to_hospital_id'] = str(ref['to_hospital_id'])
            ref['from_doctor_id'] = str(ref['from_doctor_id'])
            ref['to_doctor_id'] = str(ref['to_doctor_id']) if ref['to_doctor_id'] else None
        
        return Response.paginated(referrals, total, page, per_page, 'Outgoing referrals retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)


@referrals_bp.route('/incoming', methods=['GET'])
@token_required
def get_incoming_referrals():
    """Get referrals received by the user's hospital"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        db = get_db()
        
        # Get count
        total = db.referrals.count_documents({'to_hospital_id': ObjectId(request.hospital_id)})
        
        # Get paginated results
        skip = (page - 1) * per_page
        referrals = list(db.referrals.find({
            'to_hospital_id': ObjectId(request.hospital_id)
        }).skip(skip).limit(per_page))
        
        # Convert ObjectIds
        for ref in referrals:
            ref['_id'] = str(ref['_id'])
            ref['from_hospital_id'] = str(ref['from_hospital_id'])
            ref['to_hospital_id'] = str(ref['to_hospital_id'])
            ref['from_doctor_id'] = str(ref['from_doctor_id'])
            ref['to_doctor_id'] = str(ref['to_doctor_id']) if ref['to_doctor_id'] else None
        
        return Response.paginated(referrals, total, page, per_page, 'Incoming referrals retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)


@referrals_bp.route('/<referral_id>', methods=['GET'])
@token_required
def get_referral(referral_id):
    """Get specific referral details"""
    try:
        db = get_db()
        
        referral = db.referrals.find_one({'_id': ObjectId(referral_id)})
        if not referral:
            return Response.error('Referral not found', 'REFERRAL_NOT_FOUND', 404)
        
        # Convert ObjectIds
        referral['_id'] = str(referral['_id'])
        referral['from_hospital_id'] = str(referral['from_hospital_id'])
        referral['to_hospital_id'] = str(referral['to_hospital_id'])
        referral['from_doctor_id'] = str(referral['from_doctor_id'])
        referral['to_doctor_id'] = str(referral['to_doctor_id']) if referral['to_doctor_id'] else None
        
        return Response.success(referral, 'Referral retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)
