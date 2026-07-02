from flask import Blueprint, request
from app.database import get_db
from app.utils import Response, token_required, role_required, Encryption, PasswordHash
from bson import ObjectId
from datetime import datetime
import uuid

patients_bp = Blueprint('patients', __name__, url_prefix='/api/patients')

@patients_bp.route('/create', methods=['POST'])
@role_required('admin', 'staff')
def create_patient():
    """Create a new patient (admin/staff only)"""
    try:
        data = request.get_json()
        
        required_fields = ['full_name', 'phone', 'date_of_birth', 'gender', 'aadhaar']
        if not all(field in data for field in required_fields):
            return Response.error('Missing required fields', 'MISSING_FIELDS', 400)
        
        db = get_db()
        
        # Check if Aadhaar already exists
        aadhaar_hash = Encryption.hash_aadhaar(data['aadhaar'])
        existing = db.patients.find_one({'aadhaar_hash': aadhaar_hash})
        if existing:
            return Response.error('Patient with this Aadhaar already exists', 'AADHAAR_EXISTS', 409)
        
        # Generate patient ID
        patient_id = f"PAT{uuid.uuid4().hex[:10].upper()}"
        
        # Encrypt Aadhaar
        aadhaar_encrypted = Encryption.encrypt(data['aadhaar'])
        aadhaar_masked = Encryption.mask_aadhaar(data['aadhaar'])
        
        patient_doc = {
            'patient_id': patient_id,
            'hospital_id': ObjectId(request.hospital_id),
            'full_name': data['full_name'],
            'email': data.get('email', ''),
            'password_hash': None,  # Will be set when patient sets their own password
            'phone': data['phone'],
            'date_of_birth': data['date_of_birth'],
            'gender': data['gender'],
            'blood_group': data.get('blood_group', ''),
            'aadhaar_encrypted': aadhaar_encrypted,
            'aadhaar_hash': aadhaar_hash,
            'aadhaar_masked': aadhaar_masked,
            'address': data.get('address', ''),
            'emergency_contact': data.get('emergency_contact', ''),
            'insurance_provider': data.get('insurance_provider', ''),
            'insurance_number': data.get('insurance_number', ''),
            'status': 'active',
            'created_at': datetime.utcnow(),
            'last_login': None
        }
        
        result = db.patients.insert_one(patient_doc)
        
        # Create audit log
        db.audit_logs.insert_one({
            'hospital_id': ObjectId(request.hospital_id),
            'user_id': ObjectId(request.user_id),
            'action': 'CREATE_PATIENT',
            'resource_type': 'patient',
            'resource_id': patient_id,
            'old_value': None,
            'new_value': {'patient_id': patient_id},
            'ip_address': request.remote_addr,
            'timestamp': datetime.utcnow()
        })
        
        return Response.success({
            'patient_id': patient_id,
            'full_name': patient_doc['full_name'],
            'aadhaar_masked': aadhaar_masked
        }, 'Patient created successfully', 201)
    
    except Exception as e:
        return Response.error(str(e), 'CREATION_ERROR', 500)


@patients_bp.route('/<patient_id>', methods=['GET'])
@token_required
def get_patient(patient_id):
    """Get patient details"""
    try:
        db = get_db()
        
        patient = db.patients.find_one({
            'patient_id': patient_id,
            'hospital_id': ObjectId(request.hospital_id)
        })
        
        if not patient:
            return Response.error('Patient not found', 'PATIENT_NOT_FOUND', 404)
        
        # Convert ObjectId to string
        patient['_id'] = str(patient['_id'])
        patient['hospital_id'] = str(patient['hospital_id'])
        
        # Log access for audit
        db.audit_logs.insert_one({
            'hospital_id': ObjectId(request.hospital_id),
            'user_id': ObjectId(request.user_id),
            'action': 'VIEW_PATIENT',
            'resource_type': 'patient',
            'resource_id': patient_id,
            'ip_address': request.remote_addr,
            'timestamp': datetime.utcnow()
        })
        
        return Response.success(patient, 'Patient retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)


@patients_bp.route('', methods=['GET'])
@token_required
def list_patients():
    """List patients in user's hospital"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        if page < 1:
            page = 1
        
        db = get_db()
        
        # Get total count
        total = db.patients.count_documents({'hospital_id': ObjectId(request.hospital_id)})
        
        # Get paginated results
        skip = (page - 1) * per_page
        patients = list(db.patients.find({'hospital_id': ObjectId(request.hospital_id)})
                       .skip(skip)
                       .limit(per_page))
        
        # Convert ObjectIds
        for patient in patients:
            patient['_id'] = str(patient['_id'])
            patient['hospital_id'] = str(patient['hospital_id'])
        
        return Response.paginated(patients, total, page, per_page, 'Patients retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)


@patients_bp.route('/<patient_id>', methods=['PUT'])
@token_required
def update_patient(patient_id):
    """Update patient information"""
    try:
        data = request.get_json()
        db = get_db()
        
        patient = db.patients.find_one({
            'patient_id': patient_id,
            'hospital_id': ObjectId(request.hospital_id)
        })
        
        if not patient:
            return Response.error('Patient not found', 'PATIENT_NOT_FOUND', 404)
        
        # Update allowed fields only
        update_doc = {}
        allowed_fields = ['phone', 'address', 'emergency_contact', 'insurance_provider', 'insurance_number']
        
        for field in allowed_fields:
            if field in data:
                update_doc[field] = data[field]
        
        update_doc['updated_at'] = datetime.utcnow()
        
        db.patients.update_one(
            {'patient_id': patient_id},
            {'$set': update_doc}
        )
        
        return Response.success(None, 'Patient updated successfully')
    
    except Exception as e:
        return Response.error(str(e), 'UPDATE_ERROR', 500)


@patients_bp.route('/<patient_id>/set-password', methods=['POST'])
@token_required
def set_patient_password(patient_id):
    """Patient sets their own password (first login)"""
    try:
        data = request.get_json()
        
        if not data.get('password'):
            return Response.error('Password required', 'MISSING_PASSWORD', 400)
        
        if len(data['password']) < 8:
            return Response.error('Password must be at least 8 characters', 'WEAK_PASSWORD', 400)
        
        db = get_db()
        
        patient = db.patients.find_one({'patient_id': patient_id})
        
        if not patient:
            return Response.error('Patient not found', 'PATIENT_NOT_FOUND', 404)
        
        password_hash = PasswordHash.hash_password(data['password'])
        
        db.patients.update_one(
            {'patient_id': patient_id},
            {'$set': {'password_hash': password_hash}}
        )
        
        return Response.success(None, 'Password set successfully')
    
    except Exception as e:
        return Response.error(str(e), 'ERROR', 500)


@patients_bp.route('/<patient_id>/search', methods=['GET'])
@token_required
def search_patients(patient_id):
    """Search patients by name or Aadhaar (masked)"""
    try:
        search_query = request.args.get('q', '')
        
        if not search_query or len(search_query) < 2:
            return Response.error('Search query must be at least 2 characters', 'INVALID_QUERY', 400)
        
        db = get_db()
        
        # Search by name or patient ID
        patients = list(db.patients.find({
            'hospital_id': ObjectId(request.hospital_id),
            '$or': [
                {'full_name': {'$regex': search_query, '$options': 'i'}},
                {'patient_id': {'$regex': search_query, '$options': 'i'}}
            ]
        }).limit(10))
        
        for patient in patients:
            patient['_id'] = str(patient['_id'])
            patient['hospital_id'] = str(patient['hospital_id'])
        
        return Response.success(patients, 'Search results retrieved')
    
    except Exception as e:
        return Response.error(str(e), 'SEARCH_ERROR', 500)
