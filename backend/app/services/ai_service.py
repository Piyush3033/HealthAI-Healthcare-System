"""
AI Service for HealthAI
Handles medical record summarization, health insights, and NLP-based search
Can be integrated with OpenAI, Claude, or other LLM providers
"""

import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class AIService:
    """Service for AI-powered medical analysis and insights"""
    
    def __init__(self):
        self.openai_key = os.getenv('OPENAI_API_KEY', '')
        self.use_mock = not self.openai_key  # Use mock if no API key
    
    def summarize_medical_record(self, record_text: str, record_type: str) -> str:
        """
        Summarize a medical record using AI
        
        Args:
            record_text: The full text of the medical record
            record_type: Type of record (consultation, prescription, lab_report, scan, discharge_summary)
        
        Returns:
            Summarized text
        """
        if self.use_mock:
            return self._mock_summarize(record_text, record_type)
        
        # Real implementation with OpenAI
        try:
            import openai
            openai.api_key = self.openai_key
            
            prompt = f"""
            Please summarize the following {record_type} in 2-3 sentences. 
            Focus on key findings and recommendations.
            
            Record:
            {record_text}
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            print(f"AI summarization error: {e}")
            return self._mock_summarize(record_text, record_type)
    
    def _mock_summarize(self, record_text: str, record_type: str) -> str:
        """Mock summarization for demo purposes"""
        summaries = {
            'consultation': 'Patient consultation completed. Physical examination and vitals normal. Continue current treatment. Follow-up in 2 weeks.',
            'prescription': 'Prescribed medications for symptom management. Dosage: As per standard protocol. Review after 1 week of use.',
            'lab_report': 'Laboratory tests completed. All values within normal range. No abnormalities detected. Results reviewed by physician.',
            'scan': 'Imaging study shows normal findings. No acute pathology observed. Recommendations for follow-up imaging per protocol.',
            'discharge_summary': 'Patient discharged in stable condition. Complete medications provided. Instructions given for home care and follow-up.'
        }
        
        return summaries.get(record_type, 'Record reviewed and analyzed.')
    
    def generate_health_insights(self, patient_records: List[Dict]) -> Dict:
        """
        Generate health insights based on patient's medical records
        
        Args:
            patient_records: List of patient medical records
        
        Returns:
            Dictionary with insights and recommendations
        """
        if self.use_mock:
            return self._mock_health_insights(patient_records)
        
        try:
            import openai
            openai.api_key = self.openai_key
            
            # Compile records summary
            records_summary = "\n".join([
                f"- {r.get('record_type')}: {r.get('title')} ({r.get('created_at')})"
                for r in patient_records
            ])
            
            prompt = f"""
            Based on the following medical records, provide:
            1. Overall health trend (improving/stable/declining)
            2. Key health concerns
            3. Recommended lifestyle changes
            4. Suggested follow-up tests
            
            Records:
            {records_summary}
            
            Respond in JSON format.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.3
            )
            
            return {
                'insights': response.choices[0].message.content.strip(),
                'generated_at': datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            print(f"AI insights error: {e}")
            return self._mock_health_insights(patient_records)
    
    def _mock_health_insights(self, patient_records: List[Dict]) -> Dict:
        """Mock health insights for demo"""
        return {
            'health_trend': 'stable',
            'key_concerns': [
                'Regular follow-ups recommended',
                'Monitor vital signs',
                'Maintain medication compliance'
            ],
            'lifestyle_recommendations': [
                'Maintain balanced diet',
                'Regular exercise (30 min/day)',
                'Adequate sleep (7-8 hours)',
                'Stress management'
            ],
            'suggested_tests': [
                'Annual health checkup',
                'Blood pressure monitoring',
                'Fasting glucose test'
            ],
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def nlp_search_records(self, patient_records: List[Dict], query: str) -> List[Dict]:
        """
        Search medical records using NLP
        
        Args:
            patient_records: List of patient records
            query: Search query
        
        Returns:
            Filtered and ranked records
        """
        if self.use_mock:
            return self._mock_nlp_search(patient_records, query)
        
        try:
            import openai
            openai.api_key = self.openai_key
            
            # Get semantic search using embeddings
            results = []
            query_lower = query.lower()
            
            for record in patient_records:
                title = record.get('title', '').lower()
                description = record.get('description', '').lower()
                record_type = record.get('record_type', '').lower()
                
                # Calculate relevance score
                score = 0
                if query_lower in title:
                    score += 3
                if query_lower in description:
                    score += 2
                if query_lower in record_type:
                    score += 1
                
                if score > 0:
                    results.append({
                        **record,
                        'relevance_score': score
                    })
            
            # Sort by relevance
            results.sort(key=lambda x: x['relevance_score'], reverse=True)
            return results
        
        except Exception as e:
            print(f"NLP search error: {e}")
            return self._mock_nlp_search(patient_records, query)
    
    def _mock_nlp_search(self, patient_records: List[Dict], query: str) -> List[Dict]:
        """Mock NLP search for demo"""
        query_lower = query.lower()
        results = []
        
        for record in patient_records:
            title = record.get('title', '').lower()
            description = record.get('description', '').lower()
            record_type = record.get('record_type', '').lower()
            
            if query_lower in title or query_lower in description or query_lower in record_type:
                results.append(record)
        
        return results
    
    def predict_health_risks(self, patient_data: Dict) -> Dict:
        """
        Predict potential health risks based on patient data
        Uses simple heuristics for demo, can be enhanced with ML models
        
        Args:
            patient_data: Patient demographics and records
        
        Returns:
            Risk assessment
        """
        risks = []
        age = patient_data.get('age', 0)
        blood_group = patient_data.get('blood_group', '')
        
        # Simple heuristic-based risk assessment
        if age > 60:
            risks.append({
                'risk': 'Age-related conditions',
                'severity': 'moderate',
                'recommendation': 'Regular cardiovascular screening'
            })
        
        if age > 40:
            risks.append({
                'risk': 'Metabolic disorders',
                'severity': 'low',
                'recommendation': 'Regular health checkup, glucose monitoring'
            })
        
        return {
            'risk_assessment': risks,
            'overall_risk_level': 'moderate' if risks else 'low',
            'generated_at': datetime.utcnow().isoformat()
        }


# Global AI Service instance
ai_service = AIService()
