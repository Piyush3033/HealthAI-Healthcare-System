from flask import Blueprint, request
from app.database import get_db
from app.utils import Response, token_required
from app.services.ai_service import ai_service
from bson import ObjectId
from datetime import datetime

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/summarize-record/<record_id>', methods=['POST'])
@token_required
def summarize_record(record_id):
    """Summarize a medical record using AI"""
    try:
        db = get_db()
        
        record = db.patient_records.find_one({'_id': ObjectId(record_id)})
        if not record:
            return Response.error('Record not found', 'RECORD_NOT_FOUND', 404)
        
        # Summarize using AI
        summary = ai_service.summarize_medical_record(
            record.get('description', ''),
            record.get('record_type', 'consultation')
        )
        
        # Store summary in database
        db.patient_records.update_one(
            {'_id': ObjectId(record_id)},
            {'$set': {'ai_summary': summary, 'summary_generated_at': datetime.utcnow()}}
        )
        
        return Response.success({
            'record_id': record_id,
            'summary': summary
        }, 'Record summarized successfully')
    
    except Exception as e:
        return Response.error(str(e), 'SUMMARIZATION_ERROR', 500)


@ai_bp.route('/health-insights/<patient_id>', methods=['GET'])
@token_required
def get_health_insights(patient_id):
    """Generate health insights for a patient"""
    try:
        db = get_db()
        
        # Verify patient exists
        patient = db.patients.find_one({'patient_id': patient_id})
        if not patient:
            return Response.error('Patient not found', 'PATIENT_NOT_FOUND', 404)
        
        # Get patient's records
        records = list(db.patient_records.find({'patient_id': patient_id}).limit(50))
        
        if not records:
            return Response.success({
                'message': 'No medical records found for insights generation',
                'insights': {}
            }, 'No records available')
        
        # Generate insights using AI
        insights = ai_service.generate_health_insights(records)
        
        # Store insights in database
        db.patient_insights.update_one(
            {'patient_id': patient_id},
            {
                '$set': {
                    'patient_id': patient_id,
                    'insights': insights,
                    'generated_at': datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return Response.success(insights, 'Health insights generated successfully')
    
    except Exception as e:
        return Response.error(str(e), 'INSIGHTS_ERROR', 500)


@ai_bp.route('/search-records', methods=['POST'])
@token_required
def search_records_nlp():
    """Search patient records using NLP"""
    try:
        data = request.get_json()
        patient_id = data.get('patient_id')
        query = data.get('query', '')
        
        if not patient_id or not query:
            return Response.error('Patient ID and query required', 'MISSING_PARAMS', 400)
        
        if len(query) < 2:
            return Response.error('Query must be at least 2 characters', 'INVALID_QUERY', 400)
        
        db = get_db()
        
        # Get patient records
        records = list(db.patient_records.find({'patient_id': patient_id}))
        
        # Search using NLP
        search_results = ai_service.nlp_search_records(records, query)
        
        # Convert ObjectIds
        for record in search_results:
            record['_id'] = str(record['_id'])
            record['hospital_id'] = str(record['hospital_id'])
            record['doctor_id'] = str(record['doctor_id'])
            if record.get('department_id'):
                record['department_id'] = str(record['department_id'])
        
        return Response.success({
            'query': query,
            'results_count': len(search_results),
            'results': search_results
        }, 'Search results retrieved')
    
    except Exception as e:
        return Response.error(str(e), 'SEARCH_ERROR', 500)


@ai_bp.route('/predict-risks/<patient_id>', methods=['GET'])
@token_required
def predict_health_risks(patient_id):
    """Predict health risks for a patient"""
    try:
        db = get_db()
        
        # Get patient data
        patient = db.patients.find_one({'patient_id': patient_id})
        if not patient:
            return Response.error('Patient not found', 'PATIENT_NOT_FOUND', 404)
        
        from datetime import datetime as dt
        
        # Calculate age
        dob = patient.get('date_of_birth', '')
        age = 0
        if dob:
            try:
                birth_date = dt.strptime(dob, '%Y-%m-%d')
                age = (dt.now() - birth_date).days // 365
            except:
                age = 0
        
        # Predict risks
        patient_data = {
            'patient_id': patient_id,
            'age': age,
            'blood_group': patient.get('blood_group', ''),
            'gender': patient.get('gender', '')
        }
        
        risk_assessment = ai_service.predict_health_risks(patient_data)
        
        # Store assessment
        db.risk_assessments.update_one(
            {'patient_id': patient_id},
            {
                '$set': {
                    'patient_id': patient_id,
                    'assessment': risk_assessment,
                    'generated_at': datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return Response.success(risk_assessment, 'Risk assessment generated successfully')
    
    except Exception as e:
        return Response.error(str(e), 'RISK_ASSESSMENT_ERROR', 500)


@ai_bp.route('/health-status/<patient_id>', methods=['GET'])
@token_required
def get_health_status(patient_id):
    """Get comprehensive health status including AI analysis"""
    try:
        db = get_db()
        
        # Get patient
        patient = db.patients.find_one({'patient_id': patient_id})
        if not patient:
            return Response.error('Patient not found', 'PATIENT_NOT_FOUND', 404)
        
        # Get latest insights
        insights = db.patient_insights.find_one(
            {'patient_id': patient_id},
            sort=[('generated_at', -1)]
        )
        
        # Get latest risk assessment
        risk_assessment = db.risk_assessments.find_one(
            {'patient_id': patient_id},
            sort=[('generated_at', -1)]
        )
        
        # Get recent records
        recent_records = list(db.patient_records.find(
            {'patient_id': patient_id}
        ).sort('created_at', -1).limit(5))
        
        # Convert ObjectIds
        for record in recent_records:
            record['_id'] = str(record['_id'])
        
        status = {
            'patient_id': patient_id,
            'full_name': patient['full_name'],
            'insights': insights.get('insights', {}) if insights else {},
            'risk_assessment': risk_assessment.get('assessment', {}) if risk_assessment else {},
            'recent_records': recent_records,
            'last_updated': datetime.utcnow().isoformat()
        }
        
        return Response.success(status, 'Health status retrieved successfully')
    
    except Exception as e:
        return Response.error(str(e), 'STATUS_ERROR', 500)
