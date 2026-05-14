import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as API from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';
import HealthTrendChart from '../components/HealthTrendChart';

const featureConfigs = {
  'animals': {
    title: 'Animal Registry', api: API.animalsAPI, icon: '🐄',
    columns: ['tag_id', 'name', 'species', 'breed', 'gender', 'weight', 'status'],
    columnLabels: { tag_id: 'Tag ID', name: 'Name', species: 'Species', breed: 'Breed', gender: 'Gender', weight: 'Weight (kg)', status: 'Status' },
    fields: [
      { name: 'tag_id', label: 'Tag ID', type: 'text', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'species', label: 'Species', type: 'select', options: ['Cattle', 'Sheep', 'Goat', 'Swine', 'Poultry'], required: true },
      { name: 'breed', label: 'Breed', type: 'text' },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
      { name: 'weight', label: 'Weight (kg)', type: 'number' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Sold', 'Deceased', 'Quarantined'] },
      { name: 'purchase_date', label: 'Purchase Date', type: 'date' },
      { name: 'purchase_price', label: 'Purchase Price ($)', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: true, aiLabel: 'AI Health Analysis', aiAction: (api, id) => api.aiAnalysis(id),
  },
  'health-records': {
    title: 'Health Records', api: API.healthRecordsAPI, icon: '❤️',
    columns: ['animal_id', 'record_date', 'temperature', 'heart_rate', 'diagnosis', 'status'],
    columnLabels: { animal_id: 'Animal ID', record_date: 'Date', temperature: 'Temp (°C)', heart_rate: 'Heart Rate', diagnosis: 'Diagnosis', status: 'Status' },
    fields: [
      { name: 'animal_id', label: 'Animal ID', type: 'number', required: true },
      { name: 'record_date', label: 'Record Date', type: 'date', required: true },
      { name: 'temperature', label: 'Temperature (°C)', type: 'number' },
      { name: 'heart_rate', label: 'Heart Rate (bpm)', type: 'number' },
      { name: 'respiratory_rate', label: 'Respiratory Rate', type: 'number' },
      { name: 'weight', label: 'Weight (kg)', type: 'number' },
      { name: 'body_condition_score', label: 'Body Condition Score', type: 'number' },
      { name: 'symptoms', label: 'Symptoms', type: 'textarea' },
      { name: 'diagnosis', label: 'Diagnosis', type: 'text' },
      { name: 'treatment', label: 'Treatment', type: 'textarea' },
      { name: 'veterinarian', label: 'Veterinarian', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Normal', 'Under Treatment', 'Monitoring', 'Critical'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: true, aiLabel: 'AI Health Analysis', aiAction: (api, id) => api.aiAnalysis(id),
  },
  'disease-detection': {
    title: 'Disease Detection', api: API.diseaseDetectionAPI, icon: '🔬',
    columns: ['animal_id', 'detection_date', 'disease_name', 'severity', 'confidence_level', 'status'],
    columnLabels: { animal_id: 'Animal ID', detection_date: 'Date', disease_name: 'Disease', severity: 'Severity', confidence_level: 'Confidence', status: 'Status' },
    fields: [
      { name: 'animal_id', label: 'Animal ID', type: 'number', required: true },
      { name: 'detection_date', label: 'Detection Date', type: 'date', required: true },
      { name: 'disease_name', label: 'Disease Name', type: 'text', required: true },
      { name: 'symptoms', label: 'Symptoms', type: 'textarea' },
      { name: 'confidence_level', label: 'Confidence Level (0-1)', type: 'number' },
      { name: 'detection_method', label: 'Detection Method', type: 'text' },
      { name: 'severity', label: 'Severity', type: 'select', options: ['None', 'Mild', 'Moderate', 'Severe', 'Critical'] },
      { name: 'contagious', label: 'Contagious', type: 'select', options: ['true', 'false'] },
      { name: 'quarantine_required', label: 'Quarantine Required', type: 'select', options: ['true', 'false'] },
      { name: 'treatment_plan', label: 'Treatment Plan', type: 'textarea' },
      { name: 'detected_by', label: 'Detected By', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Under Treatment', 'Monitoring', 'Resolved', 'Clear'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: true, aiLabel: 'AI Disease Prediction',
    aiAction: (api, id, item) => api.aiPredict({ symptoms: item?.symptoms || '', animalType: item?.Animal?.species || item?.animal_type || 'Cattle', history: item, animal_id: item?.animal_id || item?.Animal?.id || null }),
  },
  'vaccinations': {
    title: 'Vaccination Tracking', api: API.vaccinationsAPI, icon: '💉',
    columns: ['animal_id', 'vaccine_name', 'date_administered', 'next_due_date', 'administered_by', 'status'],
    columnLabels: { animal_id: 'Animal ID', vaccine_name: 'Vaccine', date_administered: 'Date Given', next_due_date: 'Next Due', administered_by: 'Given By', status: 'Status' },
    fields: [
      { name: 'animal_id', label: 'Animal ID', type: 'number', required: true },
      { name: 'vaccine_name', label: 'Vaccine Name', type: 'text', required: true },
      { name: 'vaccine_type', label: 'Vaccine Type', type: 'text' },
      { name: 'date_administered', label: 'Date Administered', type: 'date', required: true },
      { name: 'next_due_date', label: 'Next Due Date', type: 'date' },
      { name: 'dosage', label: 'Dosage', type: 'text' },
      { name: 'batch_number', label: 'Batch Number', type: 'text' },
      { name: 'administered_by', label: 'Administered By', type: 'text' },
      { name: 'site', label: 'Injection Site', type: 'text' },
      { name: 'reaction', label: 'Reaction', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['Completed', 'Scheduled', 'Overdue', 'Cancelled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'feed-management': {
    title: 'Feed Management', api: API.feedManagementAPI, icon: '🌾',
    columns: ['feed_type', 'brand', 'quantity_kg', 'feeding_date', 'total_cost', 'status'],
    columnLabels: { feed_type: 'Feed Type', brand: 'Brand', quantity_kg: 'Qty (kg)', feeding_date: 'Date', total_cost: 'Cost ($)', status: 'Status' },
    fields: [
      { name: 'animal_id', label: 'Animal ID (optional)', type: 'number' },
      { name: 'herd_id', label: 'Herd ID (optional)', type: 'number' },
      { name: 'feed_type', label: 'Feed Type', type: 'text', required: true },
      { name: 'brand', label: 'Brand', type: 'text' },
      { name: 'quantity_kg', label: 'Quantity (kg)', type: 'number' },
      { name: 'feeding_date', label: 'Feeding Date', type: 'date', required: true },
      { name: 'feeding_time', label: 'Feeding Time', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Twice Daily', 'Free Access'] },
      { name: 'cost_per_kg', label: 'Cost Per Kg ($)', type: 'number' },
      { name: 'total_cost', label: 'Total Cost ($)', type: 'number' },
      { name: 'nutritional_info', label: 'Nutritional Info', type: 'textarea' },
      { name: 'supplier', label: 'Supplier', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'Suspended'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: true, aiLabel: 'AI Feed Optimization',
    aiAction: (api) => api.aiOptimize({ animalData: { species: 'Cattle', weight: 600 }, currentFeed: { type: 'Mixed', quantity: 15 } }),
  },
  'weight-tracking': {
    title: 'Weight Tracking', api: API.weightTrackingAPI, icon: '⚖️',
    columns: ['animal_id', 'weight', 'measurement_date', 'body_condition_score', 'daily_gain', 'target_weight'],
    columnLabels: { animal_id: 'Animal ID', weight: 'Weight (kg)', measurement_date: 'Date', body_condition_score: 'BCS', daily_gain: 'Daily Gain', target_weight: 'Target' },
    fields: [
      { name: 'animal_id', label: 'Animal ID', type: 'number', required: true },
      { name: 'weight', label: 'Weight (kg)', type: 'number', required: true },
      { name: 'measurement_date', label: 'Measurement Date', type: 'date', required: true },
      { name: 'method', label: 'Method', type: 'select', options: ['Scale', 'Tape', 'Visual Estimate'] },
      { name: 'body_condition_score', label: 'Body Condition Score', type: 'number' },
      { name: 'daily_gain', label: 'Daily Gain (kg)', type: 'number' },
      { name: 'target_weight', label: 'Target Weight (kg)', type: 'number' },
      { name: 'measured_by', label: 'Measured By', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'breeding-records': {
    title: 'Breeding Records', api: API.breedingRecordsAPI, icon: '🧬',
    columns: ['animal_id', 'breeding_date', 'method', 'pregnancy_status', 'expected_due_date', 'status'],
    columnLabels: { animal_id: 'Animal ID', breeding_date: 'Date', method: 'Method', pregnancy_status: 'Pregnancy', expected_due_date: 'Due Date', status: 'Status' },
    fields: [
      { name: 'animal_id', label: 'Animal ID', type: 'number', required: true },
      { name: 'mate_id', label: 'Mate ID', type: 'number' },
      { name: 'breeding_date', label: 'Breeding Date', type: 'date', required: true },
      { name: 'method', label: 'Method', type: 'select', options: ['Natural', 'AI', 'Embryo Transfer'] },
      { name: 'expected_due_date', label: 'Expected Due Date', type: 'date' },
      { name: 'actual_birth_date', label: 'Actual Birth Date', type: 'date' },
      { name: 'offspring_count', label: 'Offspring Count', type: 'number' },
      { name: 'pregnancy_status', label: 'Pregnancy Status', type: 'select', options: ['Pending', 'Confirmed', 'Delivered', 'Failed'] },
      { name: 'sire_info', label: 'Sire Info', type: 'text' },
      { name: 'genetic_notes', label: 'Genetic Notes', type: 'textarea' },
      { name: 'complications', label: 'Complications', type: 'textarea' },
      { name: 'veterinarian', label: 'Veterinarian', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'Cancelled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: true, aiLabel: 'AI Breeding Recommendation', aiAction: (api, id) => api.aiRecommendation(id),
  },
  'vet-visits': {
    title: 'Veterinary Visits', api: API.vetVisitsAPI, icon: '👨‍⚕️',
    columns: ['animal_id', 'visit_date', 'veterinarian', 'reason', 'diagnosis', 'cost', 'status'],
    columnLabels: { animal_id: 'Animal ID', visit_date: 'Date', veterinarian: 'Vet', reason: 'Reason', diagnosis: 'Diagnosis', cost: 'Cost ($)', status: 'Status' },
    fields: [
      { name: 'animal_id', label: 'Animal ID', type: 'number', required: true },
      { name: 'visit_date', label: 'Visit Date', type: 'date', required: true },
      { name: 'veterinarian', label: 'Veterinarian', type: 'text', required: true },
      { name: 'clinic', label: 'Clinic', type: 'text' },
      { name: 'reason', label: 'Reason', type: 'text', required: true },
      { name: 'diagnosis', label: 'Diagnosis', type: 'textarea' },
      { name: 'treatment', label: 'Treatment', type: 'textarea' },
      { name: 'prescription', label: 'Prescription', type: 'textarea' },
      { name: 'follow_up_date', label: 'Follow-up Date', type: 'date' },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Completed', 'Follow-up Required', 'Under Treatment', 'Cancelled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'medications': {
    title: 'Medication Tracking', api: API.medicationsAPI, icon: '💊',
    columns: ['animal_id', 'medication_name', 'dosage', 'frequency', 'start_date', 'end_date', 'status'],
    columnLabels: { animal_id: 'Animal ID', medication_name: 'Medication', dosage: 'Dosage', frequency: 'Frequency', start_date: 'Start', end_date: 'End', status: 'Status' },
    fields: [
      { name: 'animal_id', label: 'Animal ID', type: 'number', required: true },
      { name: 'medication_name', label: 'Medication Name', type: 'text', required: true },
      { name: 'medication_type', label: 'Type', type: 'select', options: ['Antibiotic', 'Antiparasitic', 'Supplement', 'Topical', 'Vaccine', 'Other'] },
      { name: 'dosage', label: 'Dosage', type: 'text' },
      { name: 'frequency', label: 'Frequency', type: 'text' },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date' },
      { name: 'prescribed_by', label: 'Prescribed By', type: 'text' },
      { name: 'reason', label: 'Reason', type: 'text' },
      { name: 'side_effects', label: 'Side Effects', type: 'textarea' },
      { name: 'withdrawal_period', label: 'Withdrawal Period', type: 'text' },
      { name: 'cost', label: 'Cost ($)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'Discontinued'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'herds': {
    title: 'Herd Management', api: API.herdsAPI, icon: '🏘️',
    columns: ['name', 'herd_type', 'location', 'current_count', 'capacity', 'manager', 'status'],
    columnLabels: { name: 'Name', herd_type: 'Type', location: 'Location', current_count: 'Count', capacity: 'Capacity', manager: 'Manager', status: 'Status' },
    fields: [
      { name: 'name', label: 'Herd Name', type: 'text', required: true },
      { name: 'herd_type', label: 'Type', type: 'select', options: ['Dairy', 'Beef', 'Sheep', 'Goat', 'Swine', 'Poultry', 'Mixed'] },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'capacity', label: 'Capacity', type: 'number' },
      { name: 'current_count', label: 'Current Count', type: 'number' },
      { name: 'manager', label: 'Manager', type: 'text' },
      { name: 'established_date', label: 'Established Date', type: 'date' },
      { name: 'purpose', label: 'Purpose', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Quarantined'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'alerts': {
    title: 'Alert System', api: API.alertsAPI, icon: '🔔',
    columns: ['alert_type', 'severity', 'title', 'is_resolved', 'createdAt'],
    columnLabels: { alert_type: 'Type', severity: 'Severity', title: 'Title', is_resolved: 'Resolved', createdAt: 'Created' },
    fields: [
      { name: 'animal_id', label: 'Animal ID (optional)', type: 'number' },
      { name: 'alert_type', label: 'Alert Type', type: 'select', options: ['Health', 'Vaccination', 'Feed', 'Breeding', 'Financial', 'Weather', 'Maintenance', 'Regulatory', 'Equipment'], required: true },
      { name: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'], required: true },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'source', label: 'Source', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'milk-production': {
    title: 'Milk Production', api: API.milkProductionAPI, icon: '🥛',
    columns: ['animal_id', 'production_date', 'session', 'quantity_liters', 'fat_percentage', 'quality_grade'],
    columnLabels: { animal_id: 'Animal ID', production_date: 'Date', session: 'Session', quantity_liters: 'Liters', fat_percentage: 'Fat %', quality_grade: 'Grade' },
    fields: [
      { name: 'animal_id', label: 'Animal ID', type: 'number', required: true },
      { name: 'production_date', label: 'Production Date', type: 'date', required: true },
      { name: 'session', label: 'Session', type: 'select', options: ['Morning', 'Evening', 'Midday'] },
      { name: 'quantity_liters', label: 'Quantity (Liters)', type: 'number', required: true },
      { name: 'fat_percentage', label: 'Fat %', type: 'number' },
      { name: 'protein_percentage', label: 'Protein %', type: 'number' },
      { name: 'somatic_cell_count', label: 'Somatic Cell Count', type: 'number' },
      { name: 'temperature', label: 'Storage Temp (°C)', type: 'number' },
      { name: 'quality_grade', label: 'Quality Grade', type: 'select', options: ['A+', 'A', 'B', 'C', 'Rejected'] },
      { name: 'storage_tank', label: 'Storage Tank', type: 'text' },
      { name: 'recorded_by', label: 'Recorded By', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: true, aiLabel: 'AI Production Analysis', aiAction: (api) => api.aiAnalysis(),
  },
  'mortality-records': {
    title: 'Mortality Records', api: API.mortalityRecordsAPI, icon: '📋',
    columns: ['animal_id', 'date_of_death', 'cause_of_death', 'category', 'economic_loss', 'preventable'],
    columnLabels: { animal_id: 'Animal ID', date_of_death: 'Date', cause_of_death: 'Cause', category: 'Category', economic_loss: 'Loss ($)', preventable: 'Preventable' },
    fields: [
      { name: 'animal_id', label: 'Animal ID', type: 'number', required: true },
      { name: 'date_of_death', label: 'Date of Death', type: 'date', required: true },
      { name: 'cause_of_death', label: 'Cause of Death', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Infectious', 'Respiratory', 'Digestive', 'Metabolic', 'Reproductive', 'Nutritional', 'Environmental', 'Trauma', 'External', 'Natural', 'Unknown'] },
      { name: 'age_at_death', label: 'Age at Death', type: 'text' },
      { name: 'symptoms_before_death', label: 'Symptoms Before Death', type: 'textarea' },
      { name: 'autopsy_performed', label: 'Autopsy Performed', type: 'select', options: ['true', 'false'] },
      { name: 'autopsy_findings', label: 'Autopsy Findings', type: 'textarea' },
      { name: 'economic_loss', label: 'Economic Loss ($)', type: 'number' },
      { name: 'preventable', label: 'Preventable', type: 'select', options: ['true', 'false'] },
      { name: 'reported_by', label: 'Reported By', type: 'text' },
      { name: 'veterinarian', label: 'Veterinarian', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'financial-records': {
    title: 'Financial Reports', api: API.financialRecordsAPI, icon: '💰',
    columns: ['category', 'type', 'amount', 'date', 'vendor', 'status'],
    columnLabels: { category: 'Category', type: 'Type', amount: 'Amount ($)', date: 'Date', vendor: 'Vendor', status: 'Status' },
    fields: [
      { name: 'category', label: 'Category', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['Income', 'Expense'], required: true },
      { name: 'amount', label: 'Amount ($)', type: 'number', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'animal_id', label: 'Animal ID (optional)', type: 'number' },
      { name: 'herd_id', label: 'Herd ID (optional)', type: 'number' },
      { name: 'vendor', label: 'Vendor', type: 'text' },
      { name: 'invoice_number', label: 'Invoice Number', type: 'text' },
      { name: 'payment_method', label: 'Payment Method', type: 'select', options: ['Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Auto Debit'] },
      { name: 'status', label: 'Status', type: 'select', options: ['Completed', 'Pending', 'Cancelled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    hasAI: true, aiLabel: 'AI Financial Analysis', aiAction: (api) => api.aiAnalysis(),
  },
};

function FeaturePage({ user, onLogout }) {
  const { featureKey } = useParams();
  const navigate = useNavigate();
  const config = featureConfigs[featureKey];

  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [herdRiskResult, setHerdRiskResult] = useState(null);
  const [herdRiskLoading, setHerdRiskLoading] = useState(false);
  const [allAnimals, setAllAnimals] = useState([]);
  const PAGE_SIZE = 20;

  // Load all animals for disease detection animal selector
  useEffect(() => {
    if (featureKey === 'disease-detection') {
      API.animalsAPI.getAll({ limit: 200 }).then(r => {
        const data = r.data;
        setAllAnimals(Array.isArray(data) ? data : data.data || []);
      }).catch(() => {});
    }
  }, [featureKey]);

  const loadData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await config.api.getAll({ page: pageNum, limit: PAGE_SIZE });
      const data = res.data;
      if (data && data.data && data.pagination) {
        setItems(data.data);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      } else if (Array.isArray(data)) {
        setItems(data);
        setTotalPages(1);
        setTotalCount(data.length);
      } else {
        setItems(data);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      setError('Failed to load data');
    }
    setLoading(false);
  }, [config.api]);

  useEffect(() => {
    if (config) loadData(page);
  }, [featureKey, config, loadData, page]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  if (!config) return <div>Feature not found</div>;

  const handleRowClick = async (item) => {
    try {
      const res = await config.api.getById(item.id);
      setSelectedItem(res.data);
      setShowDetail(true);
      setAiResult(null);
    } catch {
      setSelectedItem(item);
      setShowDetail(true);
    }
  };

  const handleNew = () => {
    setEditItem(null);
    setFormData({});
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    const data = {};
    config.fields.forEach(f => { data[f.name] = item[f.name] || ''; });
    setFormData(data);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await config.api.delete(item.id);
      setShowDetail(false);
      loadData();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const processedData = { ...formData };
      config.fields.forEach(f => {
        if (f.type === 'number' && processedData[f.name]) processedData[f.name] = Number(processedData[f.name]);
        if (processedData[f.name] === 'true') processedData[f.name] = true;
        if (processedData[f.name] === 'false') processedData[f.name] = false;
      });
      if (editItem) {
        await config.api.update(editItem.id, processedData);
      } else {
        await config.api.create(processedData);
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAI = async (item) => {
    setAiLoading(true);
    try {
      const res = await config.aiAction(config.api, item?.id, item);
      setAiResult(res.data);
    } catch (err) {
      setAiResult({ content: 'AI analysis failed: ' + (err.response?.data?.error || err.message), error: true });
    }
    setAiLoading(false);
  };

  const handleHerdRisk = async (herd) => {
    if (!herd?.id) return;
    setHerdRiskLoading(true);
    setHerdRiskResult(null);
    try {
      const res = await API.herdsAPI.riskAssessment(herd.id);
      setHerdRiskResult(res.data);
    } catch (err) {
      setHerdRiskResult({ error: err.response?.data?.error || 'Risk assessment failed' });
    }
    setHerdRiskLoading(false);
  };

  const formatValue = (val, col) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (col === 'confidence_level') return `${(val * 100).toFixed(0)}%`;
    if (col === 'amount' || col === 'cost' || col === 'total_cost' || col === 'economic_loss' || col === 'purchase_price') return `$${Number(val).toLocaleString()}`;
    if (col === 'createdAt' || col?.includes('date')) return val?.substring?.(0, 10) || val;
    return String(val);
  };

  const getSeverityClass = (val) => {
    if (!val) return '';
    const v = String(val).toLowerCase();
    if (v === 'critical' || v === 'high') return 'severity-high';
    if (v === 'medium' || v === 'moderate') return 'severity-medium';
    return 'severity-low';
  };

  const getStatusClass = (val) => {
    if (!val) return '';
    const v = String(val).toLowerCase();
    if (v === 'active' || v === 'completed' || v === 'normal' || v === 'clear' || v === 'resolved') return 'status-good';
    if (v === 'under treatment' || v === 'monitoring' || v === 'follow-up required' || v === 'pending') return 'status-warning';
    if (v === 'critical' || v === 'overdue') return 'status-danger';
    return '';
  };

  return (
    <div className="dashboard-layout">
      <header className="top-bar">
        <div className="top-bar-left">
          <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
          <h1 className="app-title">{config.icon} {config.title}</h1>
        </div>
        <div className="top-bar-right">
          <span className="user-name">{user?.name}</span>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="feature-content">
        <div className="feature-toolbar">
          <div className="toolbar-left">
            <span className="record-count">{totalCount || items.length} records</span>
          </div>
          <div className="toolbar-right">
            {config.hasAI && !['animals', 'health-records', 'breeding-records', 'disease-detection'].includes(featureKey) && (
              <button className="btn-ai" onClick={() => handleAI(null)} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : config.aiLabel}
              </button>
            )}
            <button className="btn-primary" onClick={handleNew}>+ New {config.title.replace(/s$/, '').replace(/ Records?/, ' Record').replace(/ Reports?/, ' Report')}</button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {aiResult && !showDetail && (
          <AIResultDisplay result={aiResult} onClose={() => setAiResult(null)} />
        )}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  {config.columns.map(col => (
                    <th key={col}>{config.columnLabels[col] || col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)} className="clickable-row">
                    <td>{idx + 1}</td>
                    {config.columns.map(col => (
                      <td key={col} className={
                        col === 'severity' ? getSeverityClass(item[col]) :
                        col === 'status' ? getStatusClass(item[col]) : ''
                      }>
                        {formatValue(item[col], col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', justifyContent: 'center' }}>
            <button
              style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
              onClick={() => handlePageChange(page - 1)} disabled={page <= 1}
            >&laquo; Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pn;
              if (totalPages <= 7) pn = i + 1;
              else if (page <= 4) pn = i + 1;
              else if (page >= totalPages - 3) pn = totalPages - 6 + i;
              else pn = page - 3 + i;
              return (
                <button
                  key={pn}
                  style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', backgroundColor: pn === page ? '#4F46E5' : '#fff', color: pn === page ? '#fff' : '#334155' }}
                  onClick={() => handlePageChange(pn)}
                >{pn}</button>
              );
            })}
            <button
              style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}
              onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}
            >Next &raquo;</button>
          </div>
        )}

        {/* Detail Modal */}
        {showDetail && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{config.icon} {config.title} - Detail</h2>
                <button className="btn-close" onClick={() => setShowDetail(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  {config.fields.map(f => (
                    <div key={f.name} className={`detail-item ${f.type === 'textarea' ? 'full-width' : ''}`}>
                      <label>{f.label}</label>
                      <span>{formatValue(selectedItem[f.name], f.name)}</span>
                    </div>
                  ))}
                  {selectedItem.Animal && (
                    <div className="detail-item">
                      <label>Animal</label>
                      <span>{selectedItem.Animal.name} ({selectedItem.Animal.tag_id})</span>
                    </div>
                  )}
                  {selectedItem.Herd && (
                    <div className="detail-item">
                      <label>Herd</label>
                      <span>{selectedItem.Herd.name}</span>
                    </div>
                  )}
                </div>

                {/* Health Trend Chart for animals */}
                {featureKey === 'animals' && selectedItem?.id && (
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <HealthTrendChart animalId={selectedItem.id} />
                  </div>
                )}

                {/* Herd Risk Assessment UI */}
                {featureKey === 'herds' && selectedItem?.id && (
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Herd Risk Assessment</span>
                      <button
                        className="btn-ai"
                        onClick={() => handleHerdRisk(selectedItem)}
                        disabled={herdRiskLoading}
                        style={{ fontSize: '13px', padding: '6px 14px' }}
                      >
                        {herdRiskLoading ? 'Assessing...' : 'Run Risk Assessment'}
                      </button>
                    </div>
                    {herdRiskResult && !herdRiskResult.error && (
                      <div>
                        {/* Risk score bar */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: '#64748B' }}>Overall Risk Score</span>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: herdRiskResult.risk_level === 'critical' ? '#DC2626' : herdRiskResult.risk_level === 'high' ? '#EA580C' : herdRiskResult.risk_level === 'medium' ? '#D97706' : '#059669' }}>
                              {herdRiskResult.risk_score}% — {(herdRiskResult.risk_level || '').toUpperCase()}
                            </span>
                          </div>
                          <div style={{ height: '10px', backgroundColor: '#E2E8F0', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '5px',
                              width: `${Math.min(100, herdRiskResult.risk_score || 0)}%`,
                              backgroundColor: herdRiskResult.risk_level === 'critical' ? '#DC2626' : herdRiskResult.risk_level === 'high' ? '#EA580C' : herdRiskResult.risk_level === 'medium' ? '#D97706' : '#059669',
                            }} />
                          </div>
                        </div>
                        {/* Species risks */}
                        {herdRiskResult.species_risks?.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Species Risk Breakdown</div>
                            {herdRiskResult.species_risks.map((sr, i) => (
                              <div key={i} style={{ fontSize: '13px', padding: '6px 10px', backgroundColor: '#fff', borderRadius: '6px', marginBottom: '4px', border: '1px solid #E2E8F0' }}>
                                <span style={{ fontWeight: '600' }}>{sr.species}</span>: {sr.risk} — {sr.reason}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Recommendations */}
                        {herdRiskResult.recommendations?.length > 0 && (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Recommendations</div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#334155' }}>
                              {herdRiskResult.recommendations.map((r, i) => <li key={i} style={{ marginBottom: '4px' }}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {herdRiskResult?.error && (
                      <div style={{ color: '#DC2626', fontSize: '13px' }}>{herdRiskResult.error}</div>
                    )}
                  </div>
                )}

                {config.hasAI && (
                  <div className="ai-section">
                    <button className="btn-ai btn-full" onClick={() => handleAI(selectedItem)} disabled={aiLoading}>
                      {aiLoading ? 'Analyzing...' : config.aiLabel}
                    </button>
                    {/* Alert indicator for health records with high/critical urgency */}
                    {featureKey === 'health-records' && selectedItem?.ai_urgency && (selectedItem.ai_urgency === 'High' || selectedItem.ai_urgency === 'Critical') && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                        Alert Created
                      </div>
                    )}
                    {aiResult && <AIResultDisplay result={aiResult} onClose={() => setAiResult(null)} />}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-edit" onClick={() => handleEdit(selectedItem)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(selectedItem)}>Delete</button>
                <button className="btn-secondary" onClick={() => setShowDetail(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal form-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editItem ? 'Edit' : 'New'} {config.title.replace(/s$/, '')}</h2>
                <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    {/* Animal selector for disease detection */}
                  {featureKey === 'disease-detection' && (
                    <div className="form-group">
                      <label>Link to Animal <span style={{ color: '#94A3B8', fontSize: '12px' }}>(optional)</span></label>
                      <select
                        value={formData['animal_id'] || ''}
                        onChange={e => setFormData({...formData, animal_id: e.target.value})}
                      >
                        <option value="">Select animal...</option>
                        {allAnimals.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.tag_id}) — {a.species}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {config.fields.map(f => (
                      <div key={f.name} className={`form-group ${f.type === 'textarea' ? 'full-width' : ''}`}>
                        <label>{f.label} {f.required && <span className="required">*</span>}</label>
                        {f.type === 'textarea' ? (
                          <textarea value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})} required={f.required} rows={3} />
                        ) : f.type === 'select' ? (
                          <select value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})} required={f.required}>
                            <option value="">Select...</option>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})} required={f.required} step={f.type === 'number' ? 'any' : undefined} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn-primary">{editItem ? 'Update' : 'Create'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default FeaturePage;
