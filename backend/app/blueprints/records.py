from flask import Blueprint, request, send_file
from app.database import get_db
from app.utils import Response, token_required
from bson import ObjectId
from datetime import datetime
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

records_bp = Blueprint('records', __name__, url_prefix='/api/records')

@records_bp.route('/create', methods=['POST'])
@token_required
def create_record():
    """Create a new medical record"""
    try:
        data = request.get_json()
        
        required_fields = ['patient_id', 'record_type', 'title']
        if not all(field in data for field in required_fields):
            return Response.error('Missing required fields', 'MISSING_FIELDS', 400)
        
        # Validate record type
        valid_types = ['consultation', 'prescription', 'lab_report', 'scan', 'discharge_summary']
        if data['record_type'] not in valid_types:
            return Response.error(f'Invalid record type. Must be one of: {", ".join(valid_types)}', 'INVALID_TYPE', 400)
        
        db = get_db()
        
        # Verify patient exists
        patient = db.patients.find_one({'patient_id': data['patient_id']})
        if not patient:
            return Response.error('Patient not found', 'PATIENT_NOT_FOUND', 404)
        
        # Get department if provided
        department_id = None
        if data.get('department_id'):
            department = db.departments.find_one({'_id': ObjectId(data['department_id'])})
            if department:
                department_id = department['_id']
        
        record_doc = {
            'patient_id': data['patient_id'],
            'hospital_id': ObjectId(request.hospital_id),
            'department_id': department_id,
            'record_type': data['record_type'],
            'doctor_id': ObjectId(request.user_id),
            'title': data['title'],
            'description': data.get('description', ''),
            'file_url': data.get('file_url', ''),
            'file_type': data.get('file_type', 'pdf'),
            'encrypted_data': data.get('encrypted_data', ''),
            'downloadable': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.patient_records.insert_one(record_doc)
        
        # Create audit log
        db.audit_logs.insert_one({
            'hospital_id': ObjectId(request.hospital_id),
            'user_id': ObjectId(request.user_id),
            'action': 'CREATE_RECORD',
            'resource_type': 'record',
            'resource_id': str(result.inserted_id),
            'old_value': None,
            'new_value': {'record_type': data['record_type']},
            'ip_address': request.remote_addr,
            'timestamp': datetime.utcnow()
        })
        
        return Response.success({
            'record_id': str(result.inserted_id),
            'patient_id': data['patient_id']
        }, 'Medical record created successfully', 201)
    
    except Exception as e:
        return Response.error(str(e), 'CREATION_ERROR', 500)


@records_bp.route('/<patient_id>', methods=['GET'])
@token_required
def get_patient_records(patient_id):
    """Get all records for a patient"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        db = get_db()
        
        # Verify patient exists and user has access
        patient = db.patients.find_one({
            'patient_id': patient_id,
            'hospital_id': ObjectId(request.hospital_id)
        })
        
        if not patient:
            return Response.error('Patient not found', 'PATIENT_NOT_FOUND', 404)
        
        # Get total count
        total = db.patient_records.count_documents({'patient_id': patient_id})
        
        # Get paginated records
        skip = (page - 1) * per_page
        records = list(db.patient_records.find({'patient_id': patient_id})
                      .skip(skip)
                      .limit(per_page)
                      .sort('created_at', -1))
        
        # Convert ObjectIds
        for record in records:
            record['_id'] = str(record['_id'])
            record['hospital_id'] = str(record['hospital_id'])
            record['doctor_id'] = str(record['doctor_id'])
            if record['department_id']:
                record['department_id'] = str(record['department_id'])
        
        return Response.paginated(records, total, page, per_page, 'Records retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)


@records_bp.route('/<record_id>/download', methods=['GET'])
@token_required
def download_record_pdf(record_id):
    """Download medical record as PDF"""
    try:
        db = get_db()
        
        record = db.patient_records.find_one({'_id': ObjectId(record_id)})
        
        if not record:
            return Response.error('Record not found', 'RECORD_NOT_FOUND', 404)
        
        # Verify user has access
        if str(record['hospital_id']) != request.hospital_id:
            # Also check if it's patient requesting their own record
            patient = db.patients.find_one({'patient_id': record['patient_id']})
            if not patient or request.user_id != str(patient.get('_id')):
                return Response.error('Unauthorized to download this record', 'UNAUTHORIZED', 403)
        
        # Generate PDF
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=12
        )
        
        elements.append(Paragraph('Medical Record', title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Patient info
        patient = db.patients.find_one({'patient_id': record['patient_id']})
        patient_info = [
            ['Patient Name:', patient['full_name']],
            ['Patient ID:', record['patient_id']],
            ['Date of Birth:', patient.get('date_of_birth', 'N/A')],
            ['Blood Group:', patient.get('blood_group', 'N/A')]
        ]
        
        patient_table = Table(patient_info, colWidths=[2*inch, 4*inch])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E5E7EB')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        
        elements.append(patient_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Record details
        elements.append(Paragraph('Record Details', styles['Heading2']))
        
        record_info = [
            ['Record Type:', record['record_type'].replace('_', ' ').title()],
            ['Title:', record['title']],
            ['Date:', record['created_at'].strftime('%d-%m-%Y %H:%M')],
            ['Description:', record.get('description', 'N/A')[:200]]
        ]
        
        record_table = Table(record_info, colWidths=[2*inch, 4*inch])
        record_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E5E7EB')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        
        elements.append(record_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Footer
        elements.append(Paragraph(
            f'<br/>Generated on: {datetime.utcnow().strftime("%d-%m-%Y %H:%M:%S")}<br/>HealthAI System',
            styles['Normal']
        ))
        
        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        
        # Log download
        db.audit_logs.insert_one({
            'hospital_id': record['hospital_id'],
            'user_id': ObjectId(request.user_id),
            'action': 'DOWNLOAD_RECORD',
            'resource_type': 'record',
            'resource_id': record_id,
            'ip_address': request.remote_addr,
            'timestamp': datetime.utcnow()
        })
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"medical_record_{record_id}.pdf"
        )
    
    except Exception as e:
        return Response.error(str(e), 'DOWNLOAD_ERROR', 500)


@records_bp.route('/<record_id>', methods=['GET'])
@token_required
def get_record(record_id):
    """Get specific record details"""
    try:
        db = get_db()
        
        record = db.patient_records.find_one({'_id': ObjectId(record_id)})
        
        if not record:
            return Response.error('Record not found', 'RECORD_NOT_FOUND', 404)
        
        # Convert ObjectIds
        record['_id'] = str(record['_id'])
        record['hospital_id'] = str(record['hospital_id'])
        record['doctor_id'] = str(record['doctor_id'])
        if record['department_id']:
            record['department_id'] = str(record['department_id'])
        
        return Response.success(record, 'Record retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RETRIEVAL_ERROR', 500)


@records_bp.route('/<record_id>', methods=['DELETE'])
@token_required
def delete_record(record_id):
    """Delete a medical record"""
    try:
        db = get_db()
        
        record = db.patient_records.find_one({'_id': ObjectId(record_id)})
        
        if not record:
            return Response.error('Record not found', 'RECORD_NOT_FOUND', 404)
        
        # Verify user is the creator or admin
        if str(record['doctor_id']) != request.user_id and request.user_role != 'admin':
            return Response.error('Unauthorized to delete this record', 'UNAUTHORIZED', 403)
        
        db.patient_records.delete_one({'_id': ObjectId(record_id)})
        
        # Create audit log
        db.audit_logs.insert_one({
            'hospital_id': record['hospital_id'],
            'user_id': ObjectId(request.user_id),
            'action': 'DELETE_RECORD',
            'resource_type': 'record',
            'resource_id': record_id,
            'old_value': {'record_type': record['record_type']},
            'new_value': None,
            'ip_address': request.remote_addr,
            'timestamp': datetime.utcnow()
        })
        
        return Response.success(None, 'Record deleted successfully')
    
    except Exception as e:
        return Response.error(str(e), 'DELETE_ERROR', 500)
