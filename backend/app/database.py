from pymongo import MongoClient
from contextlib import contextmanager
import os

class Database:
    """MongoDB database connection handler"""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        pass
    
    @classmethod
    def initialize(cls, mongodb_uri):
        """Initialize MongoDB connection"""
        if cls._client is None:
            cls._client = MongoClient(mongodb_uri)
            cls._db = cls._client['healthai']
            cls._create_indexes()
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        if cls._db is None:
            raise RuntimeError('Database not initialized. Call Database.initialize() first.')
        return cls._db
    
    @classmethod
    def get_client(cls):
        """Get MongoDB client"""
        if cls._client is None:
            raise RuntimeError('Database not initialized. Call Database.initialize() first.')
        return cls._client
    
    @classmethod
    def _create_indexes(cls):
        """Create database indexes for performance"""
        db = cls._db
        
        # Users indexes
        db.users.create_index('email', unique=True)
        db.users.create_index('hospital_id')
        db.users.create_index('department_id')
        
        # Patients indexes
        db.patients.create_index('patient_id', unique=True)
        db.patients.create_index('hospital_id')
        db.patients.create_index('aadhaar_hash', unique=True)
        
        # Departments indexes
        db.departments.create_index([('hospital_id', 1), ('department_code', 1)], unique=True)
        
        # Records indexes
        db.patient_records.create_index('patient_id')
        db.patient_records.create_index('hospital_id')
        db.patient_records.create_index('doctor_id')
        db.patient_records.create_index('department_id')
        
        # Appointments indexes
        db.appointments.create_index('patient_id')
        db.appointments.create_index('doctor_id')
        db.appointments.create_index('hospital_id')
        db.appointments.create_index('appointment_datetime')
        
        # Schedules indexes
        db.doctors_schedules.create_index('doctor_id')
        db.doctors_schedules.create_index('hospital_id')
        
        # Referrals indexes
        db.referrals.create_index('patient_id')
        db.referrals.create_index('from_hospital_id')
        db.referrals.create_index('to_hospital_id')
        db.referrals.create_index('from_doctor_id')
        db.referrals.create_index('status')
        
        # Audit logs indexes
        db.audit_logs.create_index('hospital_id')
        db.audit_logs.create_index('user_id')
        db.audit_logs.create_index('timestamp')
        db.audit_logs.create_index('resource_type')
    
    @classmethod
    def close(cls):
        """Close database connection"""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
    
    @classmethod
    @contextmanager
    def session(cls):
        """Context manager for database sessions"""
        try:
            yield cls.get_db()
        except Exception as e:
            raise e


def get_db():
    """Convenience function to get database instance"""
    return Database.get_db()
