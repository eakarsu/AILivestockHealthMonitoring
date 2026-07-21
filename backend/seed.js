require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
if (process.env.ALLOW_DEMO_SEED !== 'true' || process.env.NODE_ENV === 'production') {
  throw new Error('Demo seed is quarantined; set ALLOW_DEMO_SEED=true outside production to run explicitly');
}
if (!process.env.DEMO_SEED_PASSWORD || process.env.DEMO_SEED_PASSWORD.length < 12) {
  throw new Error('DEMO_SEED_PASSWORD must be explicitly supplied with at least 12 characters');
}
const { sequelize, User, Animal, HealthRecord, Vaccination, FeedManagement, WeightTracking,
  BreedingRecord, VetVisit, Medication, Herd, Alert, MortalityRecord, MilkProduction,
  FinancialRecord, DiseaseDetection } = require('./models');

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    await sequelize.sync({ force: true });
    console.log('Tables created');

    // Users
    await User.create({ name: 'Admin User', email: 'admin@livestock.com', password: process.env.DEMO_SEED_PASSWORD, role: 'admin' });
    await User.create({ name: 'John Farmer', email: 'john@livestock.com', password: process.env.DEMO_SEED_PASSWORD, role: 'farmer' });
    console.log('Users seeded');

    // Herds (15)
    const herds = await Herd.bulkCreate([
      { name: 'North Pasture Dairy', herd_type: 'Dairy', location: 'North Field', capacity: 50, current_count: 25, manager: 'John Smith', established_date: '2020-01-15', purpose: 'Milk Production', status: 'Active' },
      { name: 'South Range Beef', herd_type: 'Beef', location: 'South Range', capacity: 100, current_count: 78, manager: 'Mike Johnson', established_date: '2019-03-20', purpose: 'Beef Production', status: 'Active' },
      { name: 'East Valley Sheep', herd_type: 'Sheep', location: 'East Valley', capacity: 200, current_count: 156, manager: 'Sarah Williams', established_date: '2021-06-10', purpose: 'Wool & Meat', status: 'Active' },
      { name: 'West Hill Goats', herd_type: 'Goat', location: 'West Hills', capacity: 75, current_count: 42, manager: 'Emily Brown', established_date: '2022-02-28', purpose: 'Dairy & Meat', status: 'Active' },
      { name: 'Central Poultry', herd_type: 'Poultry', location: 'Central Barn', capacity: 500, current_count: 385, manager: 'David Lee', established_date: '2020-09-15', purpose: 'Eggs & Meat', status: 'Active' },
      { name: 'Riverside Pigs', herd_type: 'Swine', location: 'Riverside Pens', capacity: 60, current_count: 45, manager: 'Tom Wilson', established_date: '2021-01-05', purpose: 'Pork Production', status: 'Active' },
      { name: 'Highland Cattle', herd_type: 'Beef', location: 'Highland Area', capacity: 80, current_count: 62, manager: 'James Taylor', established_date: '2018-07-22', purpose: 'Premium Beef', status: 'Active' },
      { name: 'Valley Floor Dairy', herd_type: 'Dairy', location: 'Valley Floor', capacity: 40, current_count: 35, manager: 'Lisa Anderson', established_date: '2020-11-30', purpose: 'Organic Milk', status: 'Active' },
      { name: 'Mountain Goats', herd_type: 'Goat', location: 'Mountain Side', capacity: 50, current_count: 28, manager: 'Robert Martinez', established_date: '2023-03-12', purpose: 'Cheese Production', status: 'Active' },
      { name: 'Prairie Sheep', herd_type: 'Sheep', location: 'Prairie Field', capacity: 150, current_count: 112, manager: 'Karen White', established_date: '2019-08-18', purpose: 'Wool Production', status: 'Active' },
      { name: 'Barn Poultry B', herd_type: 'Poultry', location: 'Barn B', capacity: 300, current_count: 245, manager: 'Chris Davis', established_date: '2022-05-20', purpose: 'Free Range Eggs', status: 'Active' },
      { name: 'Lakeside Cattle', herd_type: 'Beef', location: 'Lakeside', capacity: 70, current_count: 55, manager: 'Nancy Garcia', established_date: '2021-04-14', purpose: 'Grass-fed Beef', status: 'Active' },
      { name: 'Nursery Herd', herd_type: 'Mixed', location: 'Nursery Barn', capacity: 30, current_count: 18, manager: 'Mark Robinson', established_date: '2023-01-08', purpose: 'Young Animals', status: 'Active' },
      { name: 'Quarantine Pen', herd_type: 'Mixed', location: 'Isolation Area', capacity: 20, current_count: 3, manager: 'Dr. Patricia Clark', established_date: '2020-06-01', purpose: 'Health Isolation', status: 'Active' },
      { name: 'Breeding Stock', herd_type: 'Mixed', location: 'Premium Barn', capacity: 25, current_count: 22, manager: 'Steven Hall', established_date: '2019-12-10', purpose: 'Breeding Program', status: 'Active' }
    ]);
    console.log('Herds seeded');

    // Animals (15)
    const animals = await Animal.bulkCreate([
      { tag_id: 'COW-001', name: 'Bella', species: 'Cattle', breed: 'Holstein', date_of_birth: '2020-03-15', gender: 'Female', weight: 650, color: 'Black & White', status: 'Active', purchase_date: '2020-03-15', purchase_price: 2500, herd_id: herds[0].id },
      { tag_id: 'COW-002', name: 'Daisy', species: 'Cattle', breed: 'Jersey', date_of_birth: '2019-07-22', gender: 'Female', weight: 450, color: 'Brown', status: 'Active', purchase_date: '2019-07-22', purchase_price: 2200, herd_id: herds[0].id },
      { tag_id: 'COW-003', name: 'Thunder', species: 'Cattle', breed: 'Angus', date_of_birth: '2021-01-10', gender: 'Male', weight: 850, color: 'Black', status: 'Active', purchase_date: '2021-01-10', purchase_price: 3500, herd_id: herds[1].id },
      { tag_id: 'SHP-001', name: 'Woolly', species: 'Sheep', breed: 'Merino', date_of_birth: '2022-04-05', gender: 'Female', weight: 65, color: 'White', status: 'Active', purchase_date: '2022-04-05', purchase_price: 350, herd_id: herds[2].id },
      { tag_id: 'SHP-002', name: 'Cloud', species: 'Sheep', breed: 'Suffolk', date_of_birth: '2021-09-18', gender: 'Male', weight: 90, color: 'Black Face', status: 'Active', purchase_date: '2021-09-18', purchase_price: 400, herd_id: herds[2].id },
      { tag_id: 'GOT-001', name: 'Billy', species: 'Goat', breed: 'Boer', date_of_birth: '2022-06-12', gender: 'Male', weight: 75, color: 'White & Brown', status: 'Active', purchase_date: '2022-06-12', purchase_price: 500, herd_id: herds[3].id },
      { tag_id: 'GOT-002', name: 'Nanny', species: 'Goat', breed: 'Saanen', date_of_birth: '2021-11-25', gender: 'Female', weight: 60, color: 'White', status: 'Active', purchase_date: '2021-11-25', purchase_price: 450, herd_id: herds[3].id },
      { tag_id: 'PIG-001', name: 'Porky', species: 'Swine', breed: 'Yorkshire', date_of_birth: '2023-02-14', gender: 'Male', weight: 220, color: 'Pink', status: 'Active', purchase_date: '2023-02-14', purchase_price: 300, herd_id: herds[5].id },
      { tag_id: 'COW-004', name: 'Rosie', species: 'Cattle', breed: 'Hereford', date_of_birth: '2020-08-30', gender: 'Female', weight: 580, color: 'Red & White', status: 'Active', purchase_date: '2020-08-30', purchase_price: 2800, herd_id: herds[6].id },
      { tag_id: 'COW-005', name: 'Duke', species: 'Cattle', breed: 'Charolais', date_of_birth: '2019-12-01', gender: 'Male', weight: 950, color: 'White', status: 'Active', purchase_date: '2019-12-01', purchase_price: 4000, herd_id: herds[1].id },
      { tag_id: 'SHP-003', name: 'Patches', species: 'Sheep', breed: 'Jacob', date_of_birth: '2023-03-20', gender: 'Female', weight: 55, color: 'Spotted', status: 'Active', purchase_date: '2023-03-20', purchase_price: 300, herd_id: herds[9].id },
      { tag_id: 'COW-006', name: 'Maggie', species: 'Cattle', breed: 'Guernsey', date_of_birth: '2021-05-17', gender: 'Female', weight: 500, color: 'Golden', status: 'Active', purchase_date: '2021-05-17', purchase_price: 2600, herd_id: herds[7].id },
      { tag_id: 'PIG-002', name: 'Hamlet', species: 'Swine', breed: 'Duroc', date_of_birth: '2023-07-08', gender: 'Male', weight: 180, color: 'Red', status: 'Active', purchase_date: '2023-07-08', purchase_price: 350, herd_id: herds[5].id },
      { tag_id: 'GOT-003', name: 'Clover', species: 'Goat', breed: 'Alpine', date_of_birth: '2022-10-15', gender: 'Female', weight: 55, color: 'Brown', status: 'Active', purchase_date: '2022-10-15', purchase_price: 400, herd_id: herds[8].id },
      { tag_id: 'COW-007', name: 'Star', species: 'Cattle', breed: 'Holstein', date_of_birth: '2022-01-25', gender: 'Female', weight: 600, color: 'Black & White', status: 'Active', purchase_date: '2022-01-25', purchase_price: 2700, herd_id: herds[0].id }
    ]);
    console.log('Animals seeded');

    // Health Records (15)
    await HealthRecord.bulkCreate([
      { animal_id: animals[0].id, record_date: '2024-01-15', temperature: 38.5, heart_rate: 72, respiratory_rate: 28, weight: 650, body_condition_score: 3.5, symptoms: 'None', diagnosis: 'Healthy', treatment: 'Routine checkup', veterinarian: 'Dr. Smith', status: 'Normal' },
      { animal_id: animals[1].id, record_date: '2024-01-16', temperature: 39.2, heart_rate: 80, respiratory_rate: 32, weight: 448, body_condition_score: 3.0, symptoms: 'Slight cough', diagnosis: 'Mild respiratory infection', treatment: 'Antibiotics prescribed', veterinarian: 'Dr. Smith', status: 'Under Treatment' },
      { animal_id: animals[2].id, record_date: '2024-01-17', temperature: 38.8, heart_rate: 68, respiratory_rate: 26, weight: 855, body_condition_score: 4.0, symptoms: 'None', diagnosis: 'Healthy', treatment: 'None required', veterinarian: 'Dr. Johnson', status: 'Normal' },
      { animal_id: animals[3].id, record_date: '2024-01-18', temperature: 39.0, heart_rate: 90, respiratory_rate: 24, weight: 64, body_condition_score: 3.5, symptoms: 'None', diagnosis: 'Healthy', treatment: 'Deworming', veterinarian: 'Dr. Williams', status: 'Normal' },
      { animal_id: animals[4].id, record_date: '2024-01-19', temperature: 39.5, heart_rate: 95, respiratory_rate: 30, weight: 88, body_condition_score: 3.0, symptoms: 'Limping', diagnosis: 'Foot rot', treatment: 'Foot bath and antibiotics', veterinarian: 'Dr. Williams', status: 'Under Treatment' },
      { animal_id: animals[5].id, record_date: '2024-01-20', temperature: 38.7, heart_rate: 85, respiratory_rate: 22, weight: 76, body_condition_score: 3.5, symptoms: 'None', diagnosis: 'Healthy', treatment: 'Routine checkup', veterinarian: 'Dr. Brown', status: 'Normal' },
      { animal_id: animals[6].id, record_date: '2024-02-01', temperature: 39.1, heart_rate: 88, respiratory_rate: 26, weight: 59, body_condition_score: 3.0, symptoms: 'Decreased appetite', diagnosis: 'Mild digestive issue', treatment: 'Probiotics', veterinarian: 'Dr. Brown', status: 'Monitoring' },
      { animal_id: animals[7].id, record_date: '2024-02-05', temperature: 38.9, heart_rate: 78, respiratory_rate: 20, weight: 222, body_condition_score: 3.5, symptoms: 'None', diagnosis: 'Healthy', treatment: 'None', veterinarian: 'Dr. Davis', status: 'Normal' },
      { animal_id: animals[8].id, record_date: '2024-02-10', temperature: 38.6, heart_rate: 70, respiratory_rate: 28, weight: 582, body_condition_score: 3.5, symptoms: 'None', diagnosis: 'Healthy', treatment: 'Vitamin supplement', veterinarian: 'Dr. Johnson', status: 'Normal' },
      { animal_id: animals[9].id, record_date: '2024-02-12', temperature: 39.8, heart_rate: 82, respiratory_rate: 34, weight: 945, body_condition_score: 3.5, symptoms: 'Nasal discharge', diagnosis: 'BRD suspected', treatment: 'Antibiotic course', veterinarian: 'Dr. Smith', status: 'Under Treatment' },
      { animal_id: animals[10].id, record_date: '2024-02-15', temperature: 38.8, heart_rate: 92, respiratory_rate: 22, weight: 54, body_condition_score: 3.0, symptoms: 'None', diagnosis: 'Healthy', treatment: 'None', veterinarian: 'Dr. Williams', status: 'Normal' },
      { animal_id: animals[11].id, record_date: '2024-02-18', temperature: 38.5, heart_rate: 74, respiratory_rate: 26, weight: 502, body_condition_score: 3.5, symptoms: 'None', diagnosis: 'Healthy', treatment: 'Mineral supplement', veterinarian: 'Dr. Johnson', status: 'Normal' },
      { animal_id: animals[12].id, record_date: '2024-02-20', temperature: 39.0, heart_rate: 76, respiratory_rate: 18, weight: 182, body_condition_score: 3.0, symptoms: 'Skin lesion', diagnosis: 'Minor abrasion', treatment: 'Topical ointment', veterinarian: 'Dr. Davis', status: 'Monitoring' },
      { animal_id: animals[13].id, record_date: '2024-02-22', temperature: 38.6, heart_rate: 86, respiratory_rate: 24, weight: 56, body_condition_score: 3.5, symptoms: 'None', diagnosis: 'Healthy', treatment: 'Routine checkup', veterinarian: 'Dr. Brown', status: 'Normal' },
      { animal_id: animals[14].id, record_date: '2024-02-25', temperature: 38.7, heart_rate: 72, respiratory_rate: 28, weight: 598, body_condition_score: 3.5, symptoms: 'None', diagnosis: 'Healthy', treatment: 'None', veterinarian: 'Dr. Smith', status: 'Normal' }
    ]);
    console.log('Health Records seeded');

    // Vaccinations (15)
    await Vaccination.bulkCreate([
      { animal_id: animals[0].id, vaccine_name: 'BVD Vaccine', vaccine_type: 'Modified Live', date_administered: '2024-01-10', next_due_date: '2024-07-10', dosage: '2ml', batch_number: 'BVD-2024-001', administered_by: 'Dr. Smith', site: 'Subcutaneous', status: 'Completed' },
      { animal_id: animals[1].id, vaccine_name: 'Clostridial Vaccine', vaccine_type: 'Killed', date_administered: '2024-01-12', next_due_date: '2025-01-12', dosage: '5ml', batch_number: 'CLO-2024-015', administered_by: 'Dr. Smith', site: 'Intramuscular', status: 'Completed' },
      { animal_id: animals[2].id, vaccine_name: 'IBR Vaccine', vaccine_type: 'Modified Live', date_administered: '2024-01-15', next_due_date: '2024-07-15', dosage: '2ml', batch_number: 'IBR-2024-008', administered_by: 'Dr. Johnson', site: 'Intranasal', status: 'Completed' },
      { animal_id: animals[3].id, vaccine_name: 'Clostridial + Tetanus', vaccine_type: 'Killed', date_administered: '2024-01-20', next_due_date: '2025-01-20', dosage: '2ml', batch_number: 'CLT-2024-022', administered_by: 'Dr. Williams', site: 'Subcutaneous', status: 'Completed' },
      { animal_id: animals[4].id, vaccine_name: 'Foot Rot Vaccine', vaccine_type: 'Killed', date_administered: '2024-02-01', next_due_date: '2024-08-01', dosage: '3ml', batch_number: 'FRV-2024-005', administered_by: 'Dr. Williams', site: 'Subcutaneous', status: 'Completed' },
      { animal_id: animals[5].id, vaccine_name: 'CDT Vaccine', vaccine_type: 'Toxoid', date_administered: '2024-02-05', next_due_date: '2025-02-05', dosage: '2ml', batch_number: 'CDT-2024-011', administered_by: 'Dr. Brown', site: 'Subcutaneous', status: 'Completed' },
      { animal_id: animals[6].id, vaccine_name: 'CL Vaccine', vaccine_type: 'Killed', date_administered: '2024-02-08', next_due_date: '2025-02-08', dosage: '1ml', batch_number: 'CLV-2024-003', administered_by: 'Dr. Brown', site: 'Subcutaneous', status: 'Completed' },
      { animal_id: animals[7].id, vaccine_name: 'Erysipelas Vaccine', vaccine_type: 'Killed', date_administered: '2024-02-10', next_due_date: '2024-08-10', dosage: '2ml', batch_number: 'ERY-2024-007', administered_by: 'Dr. Davis', site: 'Intramuscular', status: 'Completed' },
      { animal_id: animals[8].id, vaccine_name: 'Leptospirosis Vaccine', vaccine_type: 'Killed', date_administered: '2024-02-12', next_due_date: '2025-02-12', dosage: '5ml', batch_number: 'LEP-2024-014', administered_by: 'Dr. Johnson', site: 'Subcutaneous', status: 'Completed' },
      { animal_id: animals[9].id, vaccine_name: 'Anthrax Vaccine', vaccine_type: 'Live Spore', date_administered: '2024-02-15', next_due_date: '2025-02-15', dosage: '1ml', batch_number: 'ANT-2024-002', administered_by: 'Dr. Smith', site: 'Subcutaneous', status: 'Completed' },
      { animal_id: animals[10].id, vaccine_name: 'Pasteurella Vaccine', vaccine_type: 'Killed', date_administered: '2024-02-18', next_due_date: '2024-08-18', dosage: '2ml', batch_number: 'PAS-2024-009', administered_by: 'Dr. Williams', site: 'Subcutaneous', status: 'Completed' },
      { animal_id: animals[11].id, vaccine_name: 'Brucellosis Vaccine', vaccine_type: 'Live', date_administered: '2024-02-20', next_due_date: '2025-02-20', dosage: '2ml', batch_number: 'BRU-2024-006', administered_by: 'Dr. Johnson', site: 'Subcutaneous', status: 'Completed' },
      { animal_id: animals[12].id, vaccine_name: 'Porcine Parvovirus', vaccine_type: 'Killed', date_administered: '2024-02-22', next_due_date: '2024-08-22', dosage: '2ml', batch_number: 'PPV-2024-004', administered_by: 'Dr. Davis', site: 'Intramuscular', status: 'Completed' },
      { animal_id: animals[13].id, vaccine_name: 'Rabies Vaccine', vaccine_type: 'Killed', date_administered: '2024-02-25', next_due_date: '2025-02-25', dosage: '1ml', batch_number: 'RAB-2024-010', administered_by: 'Dr. Brown', site: 'Intramuscular', status: 'Completed' },
      { animal_id: animals[14].id, vaccine_name: 'PI3 Vaccine', vaccine_type: 'Modified Live', date_administered: '2024-02-28', next_due_date: '2024-08-28', dosage: '2ml', batch_number: 'PI3-2024-013', administered_by: 'Dr. Smith', site: 'Intranasal', status: 'Completed' }
    ]);
    console.log('Vaccinations seeded');

    // Feed Management (15)
    await FeedManagement.bulkCreate([
      { animal_id: animals[0].id, herd_id: herds[0].id, feed_type: 'Dairy Pellets', brand: 'NutriMax', quantity_kg: 12, feeding_date: '2024-02-01', feeding_time: 'Morning', cost_per_kg: 0.85, total_cost: 10.20, nutritional_info: 'Protein 18%, Fiber 12%', supplier: 'FarmFeed Co', status: 'Active' },
      { animal_id: animals[1].id, herd_id: herds[0].id, feed_type: 'Hay', brand: 'Green Valley', quantity_kg: 15, feeding_date: '2024-02-01', feeding_time: 'Morning', cost_per_kg: 0.30, total_cost: 4.50, nutritional_info: 'Timothy hay, high fiber', supplier: 'Local Farm', status: 'Active' },
      { animal_id: animals[2].id, herd_id: herds[1].id, feed_type: 'Beef Finisher', brand: 'CattlePro', quantity_kg: 18, feeding_date: '2024-02-01', feeding_time: 'Morning', cost_per_kg: 0.75, total_cost: 13.50, nutritional_info: 'Protein 14%, Energy rich', supplier: 'AgriSupply', status: 'Active' },
      { animal_id: animals[3].id, herd_id: herds[2].id, feed_type: 'Sheep Mix', brand: 'WoolGrow', quantity_kg: 3, feeding_date: '2024-02-01', feeding_time: 'Morning', cost_per_kg: 0.65, total_cost: 1.95, nutritional_info: 'Protein 16%, Minerals added', supplier: 'FarmFeed Co', status: 'Active' },
      { animal_id: animals[5].id, herd_id: herds[3].id, feed_type: 'Goat Pellets', brand: 'CapriNutrition', quantity_kg: 4, feeding_date: '2024-02-01', feeding_time: 'Morning', cost_per_kg: 0.70, total_cost: 2.80, nutritional_info: 'Protein 15%, Copper free', supplier: 'AgriSupply', status: 'Active' },
      { animal_id: animals[7].id, herd_id: herds[5].id, feed_type: 'Pig Grower', brand: 'PorkPlus', quantity_kg: 8, feeding_date: '2024-02-01', feeding_time: 'Morning', cost_per_kg: 0.55, total_cost: 4.40, nutritional_info: 'Protein 20%, Lysine enriched', supplier: 'SwineNutrition', status: 'Active' },
      { herd_id: herds[0].id, feed_type: 'Silage', brand: 'SiloPro', quantity_kg: 200, feeding_date: '2024-02-01', feeding_time: 'Afternoon', cost_per_kg: 0.15, total_cost: 30.00, nutritional_info: 'Corn silage, fermented', supplier: 'Local Farm', status: 'Active' },
      { herd_id: herds[1].id, feed_type: 'Mineral Block', brand: 'MineralMax', quantity_kg: 25, feeding_date: '2024-02-01', feeding_time: 'Free Access', cost_per_kg: 1.20, total_cost: 30.00, nutritional_info: 'Salt, calcium, phosphorus', supplier: 'FarmFeed Co', status: 'Active' },
      { herd_id: herds[2].id, feed_type: 'Lucerne Hay', brand: 'AlfaGreen', quantity_kg: 50, feeding_date: '2024-02-02', feeding_time: 'Morning', cost_per_kg: 0.45, total_cost: 22.50, nutritional_info: 'High protein hay', supplier: 'HayBarn Ltd', status: 'Active' },
      { herd_id: herds[3].id, feed_type: 'Browse Mix', brand: 'NaturalGraze', quantity_kg: 30, feeding_date: '2024-02-02', feeding_time: 'Afternoon', cost_per_kg: 0.35, total_cost: 10.50, nutritional_info: 'Mixed browse, leaves', supplier: 'Local Farm', status: 'Active' },
      { herd_id: herds[5].id, feed_type: 'Sow Lactation', brand: 'PorkPlus', quantity_kg: 10, feeding_date: '2024-02-02', feeding_time: 'Morning', cost_per_kg: 0.60, total_cost: 6.00, nutritional_info: 'High energy, lactation support', supplier: 'SwineNutrition', status: 'Active' },
      { herd_id: herds[6].id, feed_type: 'Grass Hay', brand: 'PastureKing', quantity_kg: 100, feeding_date: '2024-02-02', feeding_time: 'Morning', cost_per_kg: 0.25, total_cost: 25.00, nutritional_info: 'Mixed grass, sun-dried', supplier: 'Local Farm', status: 'Active' },
      { herd_id: herds[7].id, feed_type: 'Organic Pellets', brand: 'BioFarm', quantity_kg: 80, feeding_date: '2024-02-02', feeding_time: 'Morning', cost_per_kg: 1.10, total_cost: 88.00, nutritional_info: 'Certified organic, protein 17%', supplier: 'OrganicFeed Inc', status: 'Active' },
      { herd_id: herds[8].id, feed_type: 'Goat Dairy Mix', brand: 'CapriNutrition', quantity_kg: 20, feeding_date: '2024-02-02', feeding_time: 'Twice Daily', cost_per_kg: 0.80, total_cost: 16.00, nutritional_info: 'Calcium enriched for dairy', supplier: 'AgriSupply', status: 'Active' },
      { herd_id: herds[9].id, feed_type: 'Sheep Pellets', brand: 'WoolGrow', quantity_kg: 60, feeding_date: '2024-02-02', feeding_time: 'Morning', cost_per_kg: 0.55, total_cost: 33.00, nutritional_info: 'Balanced minerals, copper-safe', supplier: 'FarmFeed Co', status: 'Active' }
    ]);
    console.log('Feed Management seeded');

    // Weight Tracking (15)
    await WeightTracking.bulkCreate([
      { animal_id: animals[0].id, weight: 650, measurement_date: '2024-02-01', method: 'Scale', body_condition_score: 3.5, daily_gain: 0.8, target_weight: 700, measured_by: 'John Smith' },
      { animal_id: animals[1].id, weight: 450, measurement_date: '2024-02-01', method: 'Scale', body_condition_score: 3.0, daily_gain: 0.5, target_weight: 480, measured_by: 'John Smith' },
      { animal_id: animals[2].id, weight: 855, measurement_date: '2024-02-02', method: 'Scale', body_condition_score: 4.0, daily_gain: 1.2, target_weight: 900, measured_by: 'Mike Johnson' },
      { animal_id: animals[3].id, weight: 65, measurement_date: '2024-02-02', method: 'Scale', body_condition_score: 3.5, daily_gain: 0.15, target_weight: 75, measured_by: 'Sarah Williams' },
      { animal_id: animals[4].id, weight: 90, measurement_date: '2024-02-03', method: 'Scale', body_condition_score: 3.0, daily_gain: 0.20, target_weight: 100, measured_by: 'Sarah Williams' },
      { animal_id: animals[5].id, weight: 75, measurement_date: '2024-02-03', method: 'Scale', body_condition_score: 3.5, daily_gain: 0.18, target_weight: 85, measured_by: 'Emily Brown' },
      { animal_id: animals[6].id, weight: 60, measurement_date: '2024-02-04', method: 'Tape', body_condition_score: 3.0, daily_gain: 0.12, target_weight: 70, measured_by: 'Emily Brown' },
      { animal_id: animals[7].id, weight: 222, measurement_date: '2024-02-04', method: 'Scale', body_condition_score: 3.5, daily_gain: 0.9, target_weight: 250, measured_by: 'Tom Wilson' },
      { animal_id: animals[8].id, weight: 582, measurement_date: '2024-02-05', method: 'Scale', body_condition_score: 3.5, daily_gain: 0.7, target_weight: 620, measured_by: 'James Taylor' },
      { animal_id: animals[9].id, weight: 950, measurement_date: '2024-02-05', method: 'Scale', body_condition_score: 3.5, daily_gain: 1.0, target_weight: 1000, measured_by: 'Mike Johnson' },
      { animal_id: animals[10].id, weight: 55, measurement_date: '2024-02-06', method: 'Scale', body_condition_score: 3.0, daily_gain: 0.10, target_weight: 65, measured_by: 'Karen White' },
      { animal_id: animals[11].id, weight: 502, measurement_date: '2024-02-06', method: 'Scale', body_condition_score: 3.5, daily_gain: 0.6, target_weight: 530, measured_by: 'Lisa Anderson' },
      { animal_id: animals[12].id, weight: 182, measurement_date: '2024-02-07', method: 'Scale', body_condition_score: 3.0, daily_gain: 0.85, target_weight: 220, measured_by: 'Tom Wilson' },
      { animal_id: animals[13].id, weight: 56, measurement_date: '2024-02-07', method: 'Tape', body_condition_score: 3.5, daily_gain: 0.14, target_weight: 65, measured_by: 'Robert Martinez' },
      { animal_id: animals[14].id, weight: 600, measurement_date: '2024-02-08', method: 'Scale', body_condition_score: 3.5, daily_gain: 0.75, target_weight: 650, measured_by: 'John Smith' }
    ]);
    console.log('Weight Tracking seeded');

    // Breeding Records (15)
    await BreedingRecord.bulkCreate([
      { animal_id: animals[0].id, mate_id: animals[2].id, breeding_date: '2024-01-05', method: 'Natural', expected_due_date: '2024-10-12', pregnancy_status: 'Confirmed', sire_info: 'Thunder - Angus', veterinarian: 'Dr. Smith', status: 'Active' },
      { animal_id: animals[1].id, breeding_date: '2024-01-10', method: 'AI', expected_due_date: '2024-10-17', pregnancy_status: 'Confirmed', sire_info: 'Champion Bull #445', veterinarian: 'Dr. Smith', status: 'Active' },
      { animal_id: animals[3].id, mate_id: animals[4].id, breeding_date: '2023-11-15', method: 'Natural', expected_due_date: '2024-04-15', pregnancy_status: 'Confirmed', sire_info: 'Cloud - Suffolk', veterinarian: 'Dr. Williams', status: 'Active' },
      { animal_id: animals[6].id, mate_id: animals[5].id, breeding_date: '2023-12-20', method: 'Natural', expected_due_date: '2024-05-20', pregnancy_status: 'Confirmed', sire_info: 'Billy - Boer', veterinarian: 'Dr. Brown', status: 'Active' },
      { animal_id: animals[8].id, breeding_date: '2024-02-01', method: 'AI', expected_due_date: '2024-11-08', pregnancy_status: 'Pending', sire_info: 'Premium Hereford #221', veterinarian: 'Dr. Johnson', status: 'Active' },
      { animal_id: animals[11].id, breeding_date: '2024-01-25', method: 'AI', expected_due_date: '2024-11-01', pregnancy_status: 'Confirmed', sire_info: 'Elite Guernsey #118', veterinarian: 'Dr. Johnson', status: 'Active' },
      { animal_id: animals[14].id, mate_id: animals[2].id, breeding_date: '2024-02-10', method: 'Natural', expected_due_date: '2024-11-17', pregnancy_status: 'Pending', sire_info: 'Thunder - Angus', veterinarian: 'Dr. Smith', status: 'Active' },
      { animal_id: animals[0].id, breeding_date: '2023-01-15', method: 'AI', actual_birth_date: '2023-10-22', offspring_count: 1, pregnancy_status: 'Delivered', sire_info: 'Grand Champion #332', veterinarian: 'Dr. Smith', status: 'Completed' },
      { animal_id: animals[1].id, breeding_date: '2023-03-10', method: 'Natural', actual_birth_date: '2023-12-15', offspring_count: 1, pregnancy_status: 'Delivered', sire_info: 'Duke - Charolais', veterinarian: 'Dr. Smith', status: 'Completed' },
      { animal_id: animals[3].id, breeding_date: '2022-11-20', method: 'Natural', actual_birth_date: '2023-04-20', offspring_count: 2, pregnancy_status: 'Delivered', sire_info: 'Ram #55', veterinarian: 'Dr. Williams', status: 'Completed' },
      { animal_id: animals[6].id, breeding_date: '2023-06-15', method: 'Natural', actual_birth_date: '2023-11-15', offspring_count: 2, pregnancy_status: 'Delivered', sire_info: 'Buck #22', veterinarian: 'Dr. Brown', status: 'Completed' },
      { animal_id: animals[13].id, mate_id: animals[5].id, breeding_date: '2024-01-30', method: 'Natural', expected_due_date: '2024-06-30', pregnancy_status: 'Confirmed', sire_info: 'Billy - Boer', veterinarian: 'Dr. Brown', status: 'Active' },
      { animal_id: animals[10].id, mate_id: animals[4].id, breeding_date: '2024-02-05', method: 'Natural', expected_due_date: '2024-07-05', pregnancy_status: 'Pending', sire_info: 'Cloud - Suffolk', veterinarian: 'Dr. Williams', status: 'Active' },
      { animal_id: animals[8].id, breeding_date: '2023-02-15', method: 'AI', actual_birth_date: '2023-11-22', offspring_count: 1, pregnancy_status: 'Delivered', sire_info: 'Hereford Elite #180', veterinarian: 'Dr. Johnson', status: 'Completed' },
      { animal_id: animals[11].id, breeding_date: '2023-04-20', method: 'Natural', actual_birth_date: '2024-01-25', offspring_count: 1, pregnancy_status: 'Delivered', sire_info: 'Guernsey Bull #90', veterinarian: 'Dr. Johnson', status: 'Completed' }
    ]);
    console.log('Breeding Records seeded');

    // Vet Visits (15)
    await VetVisit.bulkCreate([
      { animal_id: animals[0].id, visit_date: '2024-01-15', veterinarian: 'Dr. Smith', clinic: 'Valley Vet Clinic', reason: 'Annual checkup', diagnosis: 'Healthy', treatment: 'Routine examination, all normal', cost: 150, status: 'Completed' },
      { animal_id: animals[1].id, visit_date: '2024-01-16', veterinarian: 'Dr. Smith', clinic: 'Valley Vet Clinic', reason: 'Cough symptoms', diagnosis: 'Mild respiratory infection', treatment: 'Prescribed antibiotics', prescription: 'Oxytetracycline 200mg', follow_up_date: '2024-01-30', cost: 250, status: 'Follow-up Required' },
      { animal_id: animals[2].id, visit_date: '2024-01-17', veterinarian: 'Dr. Johnson', clinic: 'Farm Animal Hospital', reason: 'Pre-breeding exam', diagnosis: 'Fit for breeding', treatment: 'Semen evaluation, all parameters normal', cost: 300, status: 'Completed' },
      { animal_id: animals[3].id, visit_date: '2024-01-20', veterinarian: 'Dr. Williams', clinic: 'Small Ruminant Center', reason: 'Deworming', diagnosis: 'Moderate parasite load', treatment: 'Deworming treatment administered', prescription: 'Ivermectin', cost: 85, status: 'Completed' },
      { animal_id: animals[4].id, visit_date: '2024-02-01', veterinarian: 'Dr. Williams', clinic: 'Small Ruminant Center', reason: 'Lameness', diagnosis: 'Foot rot', treatment: 'Hoof trimming and foot bath', prescription: 'Penicillin injection', follow_up_date: '2024-02-15', cost: 175, status: 'Follow-up Required' },
      { animal_id: animals[5].id, visit_date: '2024-02-05', veterinarian: 'Dr. Brown', clinic: 'Caprine Health Center', reason: 'Routine checkup', diagnosis: 'Healthy', treatment: 'General examination', cost: 120, status: 'Completed' },
      { animal_id: animals[6].id, visit_date: '2024-02-08', veterinarian: 'Dr. Brown', clinic: 'Caprine Health Center', reason: 'Decreased appetite', diagnosis: 'Mild acidosis', treatment: 'Dietary adjustment recommended', prescription: 'Sodium bicarbonate', cost: 140, status: 'Completed' },
      { animal_id: animals[7].id, visit_date: '2024-02-10', veterinarian: 'Dr. Davis', clinic: 'Swine Health Services', reason: 'Growth evaluation', diagnosis: 'Normal growth', treatment: 'Growth rate assessment, on track', cost: 100, status: 'Completed' },
      { animal_id: animals[8].id, visit_date: '2024-02-12', veterinarian: 'Dr. Johnson', clinic: 'Farm Animal Hospital', reason: 'Pregnancy check', diagnosis: 'Not confirmed yet', treatment: 'Ultrasound performed', follow_up_date: '2024-03-12', cost: 200, status: 'Follow-up Required' },
      { animal_id: animals[9].id, visit_date: '2024-02-15', veterinarian: 'Dr. Smith', clinic: 'Valley Vet Clinic', reason: 'Nasal discharge', diagnosis: 'Suspected BRD', treatment: 'Antibiotic treatment started', prescription: 'Florfenicol', follow_up_date: '2024-02-22', cost: 350, status: 'Under Treatment' },
      { animal_id: animals[10].id, visit_date: '2024-02-18', veterinarian: 'Dr. Williams', clinic: 'Small Ruminant Center', reason: 'Pre-breeding exam', diagnosis: 'Ready for breeding', treatment: 'Reproductive assessment', cost: 130, status: 'Completed' },
      { animal_id: animals[11].id, visit_date: '2024-02-20', veterinarian: 'Dr. Johnson', clinic: 'Farm Animal Hospital', reason: 'Milk quality concern', diagnosis: 'Subclinical mastitis', treatment: 'Intramammary antibiotics', prescription: 'Cephalosporin', follow_up_date: '2024-03-05', cost: 280, status: 'Under Treatment' },
      { animal_id: animals[12].id, visit_date: '2024-02-22', veterinarian: 'Dr. Davis', clinic: 'Swine Health Services', reason: 'Skin lesion', diagnosis: 'Minor abrasion', treatment: 'Cleaned and applied antiseptic', cost: 90, status: 'Completed' },
      { animal_id: animals[13].id, visit_date: '2024-02-25', veterinarian: 'Dr. Brown', clinic: 'Caprine Health Center', reason: 'Pregnancy confirmation', diagnosis: 'Pregnancy confirmed - twins', treatment: 'Ultrasound performed', cost: 160, status: 'Completed' },
      { animal_id: animals[14].id, visit_date: '2024-02-28', veterinarian: 'Dr. Smith', clinic: 'Valley Vet Clinic', reason: 'Annual checkup', diagnosis: 'Healthy', treatment: 'Routine examination', cost: 150, status: 'Completed' }
    ]);
    console.log('Vet Visits seeded');

    // Medications (15)
    await Medication.bulkCreate([
      { animal_id: animals[1].id, medication_name: 'Oxytetracycline', medication_type: 'Antibiotic', dosage: '200mg', frequency: 'Once daily', start_date: '2024-01-16', end_date: '2024-01-23', prescribed_by: 'Dr. Smith', reason: 'Respiratory infection', withdrawal_period: '28 days', cost: 45, status: 'Completed' },
      { animal_id: animals[4].id, medication_name: 'Penicillin G', medication_type: 'Antibiotic', dosage: '150mg', frequency: 'Twice daily', start_date: '2024-02-01', end_date: '2024-02-10', prescribed_by: 'Dr. Williams', reason: 'Foot rot', withdrawal_period: '14 days', cost: 35, status: 'Active' },
      { animal_id: animals[6].id, medication_name: 'Sodium Bicarbonate', medication_type: 'Supplement', dosage: '50g', frequency: 'Daily with feed', start_date: '2024-02-08', end_date: '2024-02-22', prescribed_by: 'Dr. Brown', reason: 'Acidosis', withdrawal_period: 'None', cost: 15, status: 'Active' },
      { animal_id: animals[9].id, medication_name: 'Florfenicol', medication_type: 'Antibiotic', dosage: '300mg', frequency: 'Every 48 hours', start_date: '2024-02-15', end_date: '2024-02-25', prescribed_by: 'Dr. Smith', reason: 'BRD treatment', withdrawal_period: '38 days', cost: 80, status: 'Active' },
      { animal_id: animals[11].id, medication_name: 'Cephalosporin', medication_type: 'Antibiotic', dosage: 'Intramammary tube', frequency: 'After each milking', start_date: '2024-02-20', end_date: '2024-02-26', prescribed_by: 'Dr. Johnson', reason: 'Subclinical mastitis', withdrawal_period: '96 hours', cost: 55, status: 'Active' },
      { animal_id: animals[0].id, medication_name: 'Vitamin AD3E', medication_type: 'Supplement', dosage: '10ml', frequency: 'Monthly', start_date: '2024-01-01', end_date: '2024-12-31', prescribed_by: 'Dr. Smith', reason: 'Nutritional supplement', withdrawal_period: 'None', cost: 25, status: 'Active' },
      { animal_id: animals[3].id, medication_name: 'Ivermectin', medication_type: 'Antiparasitic', dosage: '0.2mg/kg', frequency: 'Single dose', start_date: '2024-01-20', end_date: '2024-01-20', prescribed_by: 'Dr. Williams', reason: 'Deworming', withdrawal_period: '35 days', cost: 20, status: 'Completed' },
      { animal_id: animals[7].id, medication_name: 'Iron Dextran', medication_type: 'Supplement', dosage: '200mg', frequency: 'Single injection', start_date: '2024-02-10', end_date: '2024-02-10', prescribed_by: 'Dr. Davis', reason: 'Iron supplementation', withdrawal_period: 'None', cost: 12, status: 'Completed' },
      { animal_id: animals[2].id, medication_name: 'Selenium/Vitamin E', medication_type: 'Supplement', dosage: '5ml', frequency: 'Quarterly', start_date: '2024-01-15', end_date: '2024-12-31', prescribed_by: 'Dr. Johnson', reason: 'Muscle health', withdrawal_period: 'None', cost: 18, status: 'Active' },
      { animal_id: animals[8].id, medication_name: 'Calcium Borogluconate', medication_type: 'Supplement', dosage: '500ml IV', frequency: 'As needed', start_date: '2024-02-12', end_date: '2024-02-12', prescribed_by: 'Dr. Johnson', reason: 'Preventive for milk fever', withdrawal_period: 'None', cost: 30, status: 'Completed' },
      { animal_id: animals[5].id, medication_name: 'Fenbendazole', medication_type: 'Antiparasitic', dosage: '5mg/kg', frequency: 'Single dose', start_date: '2024-02-05', end_date: '2024-02-05', prescribed_by: 'Dr. Brown', reason: 'Routine deworming', withdrawal_period: '16 days', cost: 18, status: 'Completed' },
      { animal_id: animals[10].id, medication_name: 'Copper Bolus', medication_type: 'Supplement', dosage: '4g capsule', frequency: 'Every 6 months', start_date: '2024-02-18', end_date: '2024-08-18', prescribed_by: 'Dr. Williams', reason: 'Copper deficiency prevention', withdrawal_period: 'None', cost: 22, status: 'Active', notes: 'Sheep-safe copper level' },
      { animal_id: animals[12].id, medication_name: 'Topical Antiseptic', medication_type: 'Topical', dosage: 'Apply to wound', frequency: 'Twice daily', start_date: '2024-02-22', end_date: '2024-03-01', prescribed_by: 'Dr. Davis', reason: 'Skin abrasion care', withdrawal_period: 'None', cost: 10, status: 'Active' },
      { animal_id: animals[13].id, medication_name: 'Pregnancy Supplement', medication_type: 'Supplement', dosage: '20ml', frequency: 'Daily', start_date: '2024-02-25', end_date: '2024-06-30', prescribed_by: 'Dr. Brown', reason: 'Pregnancy nutritional support', withdrawal_period: 'None', cost: 35, status: 'Active' },
      { animal_id: animals[14].id, medication_name: 'Multivitamin Drench', medication_type: 'Supplement', dosage: '30ml', frequency: 'Monthly', start_date: '2024-01-01', end_date: '2024-12-31', prescribed_by: 'Dr. Smith', reason: 'General health maintenance', withdrawal_period: 'None', cost: 20, status: 'Active' }
    ]);
    console.log('Medications seeded');

    // Alerts (15)
    await Alert.bulkCreate([
      { animal_id: animals[1].id, alert_type: 'Health', severity: 'High', title: 'Respiratory Infection Detected', message: 'Daisy (COW-002) showing signs of respiratory infection. Antibiotics prescribed. Monitor closely.', source: 'Health Check', is_read: false, is_resolved: false },
      { animal_id: animals[4].id, alert_type: 'Health', severity: 'Medium', title: 'Foot Rot Treatment', message: 'Cloud (SHP-002) diagnosed with foot rot. Treatment in progress. Follow-up needed.', source: 'Vet Visit', is_read: true, is_resolved: false },
      { animal_id: animals[9].id, alert_type: 'Health', severity: 'Critical', title: 'BRD Suspected', message: 'Duke (COW-005) showing symptoms of Bovine Respiratory Disease. Immediate treatment started.', source: 'Health Check', is_read: false, is_resolved: false },
      { alert_type: 'Vaccination', severity: 'Medium', title: 'Vaccination Due - BVD Booster', message: '5 animals due for BVD booster vaccination within next 2 weeks.', source: 'Schedule', is_read: false, is_resolved: false },
      { alert_type: 'Feed', severity: 'Low', title: 'Feed Stock Low', message: 'Dairy Pellets stock running low. Current supply will last approximately 5 days.', source: 'Inventory', is_read: false, is_resolved: false },
      { animal_id: animals[11].id, alert_type: 'Health', severity: 'High', title: 'Mastitis Detected', message: 'Maggie (COW-006) diagnosed with subclinical mastitis. Milk must be discarded during treatment.', source: 'Milk Testing', is_read: false, is_resolved: false },
      { alert_type: 'Breeding', severity: 'Low', title: 'Pregnancy Check Due', message: 'Rosie (COW-004) is due for pregnancy confirmation ultrasound.', source: 'Schedule', is_read: false, is_resolved: false },
      { alert_type: 'Financial', severity: 'Medium', title: 'Monthly Expenses Above Budget', message: 'February veterinary expenses exceed monthly budget by 15%. Review recommended.', source: 'Finance', is_read: true, is_resolved: false },
      { animal_id: animals[6].id, alert_type: 'Health', severity: 'Low', title: 'Appetite Monitoring', message: 'Nanny (GOT-002) showing decreased appetite. Currently on probiotics. Monitor food intake.', source: 'Health Check', is_read: true, is_resolved: false },
      { alert_type: 'Weather', severity: 'High', title: 'Heat Wave Warning', message: 'Temperature expected to exceed 38°C this week. Ensure all herds have adequate water and shade.', source: 'Weather Service', is_read: false, is_resolved: false },
      { alert_type: 'Maintenance', severity: 'Low', title: 'Fence Repair Needed', message: 'Section 3 of North Pasture fence reported damaged. Repair needed before cattle rotation.', source: 'Farm Inspection', is_read: false, is_resolved: false },
      { animal_id: animals[12].id, alert_type: 'Health', severity: 'Low', title: 'Wound Care Follow-up', message: 'Hamlet (PIG-002) skin abrasion healing. Continue antiseptic application.', source: 'Vet Visit', is_read: true, is_resolved: false },
      { alert_type: 'Regulatory', severity: 'Medium', title: 'TB Test Due', message: 'Annual tuberculosis testing due for all cattle within 30 days per regulatory requirement.', source: 'Compliance', is_read: false, is_resolved: false },
      { alert_type: 'Equipment', severity: 'Medium', title: 'Milking Machine Service', message: 'Milking machine #2 due for scheduled maintenance. Service appointment needed.', source: 'Maintenance', is_read: false, is_resolved: false },
      { animal_id: animals[3].id, alert_type: 'Breeding', severity: 'Low', title: 'Lambing Expected Soon', message: 'Woolly (SHP-001) expected to lamb within next 2 weeks. Prepare lambing pen.', source: 'Breeding Records', is_read: false, is_resolved: false }
    ]);
    console.log('Alerts seeded');

    // Disease Detection (15)
    await DiseaseDetection.bulkCreate([
      { animal_id: animals[1].id, detection_date: '2024-01-16', disease_name: 'Bovine Respiratory Disease', symptoms: 'Cough, nasal discharge, elevated temperature', confidence_level: 0.75, detection_method: 'Clinical Examination', severity: 'Moderate', contagious: true, quarantine_required: false, treatment_plan: 'Antibiotic course, isolation recommended', detected_by: 'Dr. Smith', status: 'Under Treatment' },
      { animal_id: animals[4].id, detection_date: '2024-02-01', disease_name: 'Foot Rot', symptoms: 'Lameness, swelling between toes, foul smell', confidence_level: 0.92, detection_method: 'Clinical Examination', severity: 'Moderate', contagious: true, quarantine_required: false, treatment_plan: 'Antibiotics, foot bath, hoof trimming', detected_by: 'Dr. Williams', status: 'Under Treatment' },
      { animal_id: animals[9].id, detection_date: '2024-02-15', disease_name: 'Bovine Respiratory Disease', symptoms: 'Nasal discharge, depression, fever 40.2°C', confidence_level: 0.85, detection_method: 'Clinical + Lab', severity: 'Severe', contagious: true, quarantine_required: true, treatment_plan: 'Florfenicol treatment, isolation, monitoring', detected_by: 'Dr. Smith', status: 'Active' },
      { animal_id: animals[11].id, detection_date: '2024-02-20', disease_name: 'Subclinical Mastitis', symptoms: 'Elevated somatic cell count, no visible symptoms', confidence_level: 0.88, detection_method: 'Milk Testing', severity: 'Mild', contagious: false, quarantine_required: false, treatment_plan: 'Intramammary antibiotics', detected_by: 'Dr. Johnson', status: 'Under Treatment' },
      { animal_id: animals[6].id, detection_date: '2024-02-08', disease_name: 'Ruminal Acidosis', symptoms: 'Decreased appetite, loose stool, lethargy', confidence_level: 0.70, detection_method: 'Clinical Examination', severity: 'Mild', contagious: false, quarantine_required: false, treatment_plan: 'Diet adjustment, sodium bicarbonate supplementation', detected_by: 'Dr. Brown', status: 'Monitoring' },
      { animal_id: animals[3].id, detection_date: '2024-01-20', disease_name: 'Haemonchosis', symptoms: 'Pale mucous membranes, weight loss', confidence_level: 0.80, detection_method: 'Fecal Examination', severity: 'Moderate', contagious: false, quarantine_required: false, treatment_plan: 'Ivermectin deworming', detected_by: 'Dr. Williams', status: 'Resolved' },
      { animal_id: animals[7].id, detection_date: '2024-02-10', disease_name: 'Iron Deficiency Anemia', symptoms: 'Pale skin, weakness, poor growth', confidence_level: 0.90, detection_method: 'Blood Test', severity: 'Mild', contagious: false, quarantine_required: false, treatment_plan: 'Iron dextran injection', detected_by: 'Dr. Davis', status: 'Resolved' },
      { animal_id: animals[0].id, detection_date: '2024-01-15', disease_name: 'None Detected', symptoms: 'No symptoms', confidence_level: 0.95, detection_method: 'Routine Screening', severity: 'None', contagious: false, quarantine_required: false, treatment_plan: 'Continue routine monitoring', detected_by: 'Dr. Smith', status: 'Clear' },
      { animal_id: animals[2].id, detection_date: '2024-01-17', disease_name: 'None Detected', symptoms: 'No symptoms', confidence_level: 0.93, detection_method: 'Routine Screening', severity: 'None', contagious: false, quarantine_required: false, treatment_plan: 'Continue routine monitoring', detected_by: 'Dr. Johnson', status: 'Clear' },
      { animal_id: animals[5].id, detection_date: '2024-02-05', disease_name: 'Intestinal Parasites', symptoms: 'Mild diarrhea, rough coat', confidence_level: 0.72, detection_method: 'Fecal Examination', severity: 'Mild', contagious: false, quarantine_required: false, treatment_plan: 'Fenbendazole treatment', detected_by: 'Dr. Brown', status: 'Resolved' },
      { animal_id: animals[8].id, detection_date: '2024-02-12', disease_name: 'None Detected', symptoms: 'No symptoms', confidence_level: 0.91, detection_method: 'Routine Screening', severity: 'None', contagious: false, quarantine_required: false, treatment_plan: 'Continue routine monitoring', detected_by: 'Dr. Johnson', status: 'Clear' },
      { animal_id: animals[10].id, detection_date: '2024-02-18', disease_name: 'None Detected', symptoms: 'No symptoms', confidence_level: 0.94, detection_method: 'Routine Screening', severity: 'None', contagious: false, quarantine_required: false, treatment_plan: 'Continue routine monitoring', detected_by: 'Dr. Williams', status: 'Clear' },
      { animal_id: animals[12].id, detection_date: '2024-02-22', disease_name: 'Dermatitis', symptoms: 'Skin lesion, minor abrasion', confidence_level: 0.65, detection_method: 'Clinical Examination', severity: 'Mild', contagious: false, quarantine_required: false, treatment_plan: 'Topical antiseptic', detected_by: 'Dr. Davis', status: 'Monitoring' },
      { animal_id: animals[13].id, detection_date: '2024-02-25', disease_name: 'None Detected', symptoms: 'No symptoms', confidence_level: 0.89, detection_method: 'Routine Screening', severity: 'None', contagious: false, quarantine_required: false, treatment_plan: 'Continue routine monitoring', detected_by: 'Dr. Brown', status: 'Clear' },
      { animal_id: animals[14].id, detection_date: '2024-02-28', disease_name: 'None Detected', symptoms: 'No symptoms', confidence_level: 0.96, detection_method: 'Routine Screening', severity: 'None', contagious: false, quarantine_required: false, treatment_plan: 'Continue routine monitoring', detected_by: 'Dr. Smith', status: 'Clear' }
    ]);
    console.log('Disease Detection seeded');

    // Mortality Records (15)
    await MortalityRecord.bulkCreate([
      { animal_id: animals[0].id, date_of_death: '2023-03-15', cause_of_death: 'Bloat', category: 'Digestive', age_at_death: '4 years', symptoms_before_death: 'Distended abdomen, difficulty breathing', autopsy_performed: true, autopsy_findings: 'Ruminal tympany, frothy bloat', economic_loss: 2500, preventable: true, reported_by: 'John Smith', veterinarian: 'Dr. Smith', notes: 'Historical record - different animal' },
      { animal_id: animals[1].id, date_of_death: '2023-06-22', cause_of_death: 'Lightning Strike', category: 'Environmental', age_at_death: '2 years', symptoms_before_death: 'Found deceased in field after storm', autopsy_performed: false, economic_loss: 1800, preventable: false, reported_by: 'Mike Johnson', veterinarian: 'Dr. Johnson', notes: 'Historical record' },
      { animal_id: animals[2].id, date_of_death: '2023-09-10', cause_of_death: 'Dystocia', category: 'Reproductive', age_at_death: '6 years', symptoms_before_death: 'Prolonged labor, calf malposition', autopsy_performed: true, autopsy_findings: 'Uterine rupture', economic_loss: 3500, preventable: true, reported_by: 'John Smith', veterinarian: 'Dr. Smith', notes: 'Historical record' },
      { animal_id: animals[3].id, date_of_death: '2023-01-05', cause_of_death: 'Hypothermia', category: 'Environmental', age_at_death: '3 days', symptoms_before_death: 'Lamb found weak and cold', autopsy_performed: false, economic_loss: 200, preventable: true, reported_by: 'Sarah Williams', veterinarian: 'Dr. Williams', notes: 'Neonatal loss during cold snap' },
      { animal_id: animals[4].id, date_of_death: '2023-04-18', cause_of_death: 'Predator Attack', category: 'External', age_at_death: '1 year', symptoms_before_death: 'Found with bite wounds', autopsy_performed: false, economic_loss: 350, preventable: true, reported_by: 'Sarah Williams', veterinarian: 'Dr. Williams', notes: 'Coyote attack, fence breach' },
      { animal_id: animals[5].id, date_of_death: '2023-07-30', cause_of_death: 'Enterotoxemia', category: 'Infectious', age_at_death: '8 months', symptoms_before_death: 'Sudden onset diarrhea, convulsions', autopsy_performed: true, autopsy_findings: 'Clostridium perfringens type D', economic_loss: 450, preventable: true, reported_by: 'Emily Brown', veterinarian: 'Dr. Brown', notes: 'Vaccination was overdue' },
      { animal_id: animals[6].id, date_of_death: '2023-11-12', cause_of_death: 'Old Age', category: 'Natural', age_at_death: '14 years', symptoms_before_death: 'Gradual decline, weight loss, weakness', autopsy_performed: false, economic_loss: 100, preventable: false, reported_by: 'Emily Brown', veterinarian: 'Dr. Brown', notes: 'End of productive life' },
      { animal_id: animals[7].id, date_of_death: '2023-05-25', cause_of_death: 'Porcine Circovirus', category: 'Infectious', age_at_death: '4 months', symptoms_before_death: 'Wasting, lymph node enlargement', autopsy_performed: true, autopsy_findings: 'PMWS confirmed', economic_loss: 280, preventable: true, reported_by: 'Tom Wilson', veterinarian: 'Dr. Davis', notes: 'Vaccination protocol updated' },
      { animal_id: animals[8].id, date_of_death: '2023-08-14', cause_of_death: 'Hardware Disease', category: 'Digestive', age_at_death: '5 years', symptoms_before_death: 'Off feed, grunting, reluctance to move', autopsy_performed: true, autopsy_findings: 'Wire penetration of reticulum', economic_loss: 2800, preventable: true, reported_by: 'James Taylor', veterinarian: 'Dr. Johnson', notes: 'Magnet not placed' },
      { animal_id: animals[9].id, date_of_death: '2023-02-28', cause_of_death: 'Pneumonia', category: 'Respiratory', age_at_death: '3 years', symptoms_before_death: 'Severe respiratory distress, high fever', autopsy_performed: true, autopsy_findings: 'Mannheimia haemolytica confirmed', economic_loss: 3200, preventable: true, reported_by: 'Mike Johnson', veterinarian: 'Dr. Smith', notes: 'Late detection' },
      { animal_id: animals[10].id, date_of_death: '2023-10-05', cause_of_death: 'Copper Toxicity', category: 'Nutritional', age_at_death: '2 years', symptoms_before_death: 'Jaundice, dark urine, weakness', autopsy_performed: true, autopsy_findings: 'Liver copper accumulation', economic_loss: 300, preventable: true, reported_by: 'Karen White', veterinarian: 'Dr. Williams', notes: 'Wrong mineral supplement used' },
      { animal_id: animals[11].id, date_of_death: '2023-12-20', cause_of_death: 'Milk Fever', category: 'Metabolic', age_at_death: '7 years', symptoms_before_death: 'Recumbent, cold ears, dilated pupils', autopsy_performed: false, economic_loss: 2600, preventable: true, reported_by: 'Lisa Anderson', veterinarian: 'Dr. Johnson', notes: 'Post-calving hypocalcemia' },
      { animal_id: animals[12].id, date_of_death: '2023-06-08', cause_of_death: 'Crush Injury', category: 'Trauma', age_at_death: '2 weeks', symptoms_before_death: 'Found crushed by sow', autopsy_performed: false, economic_loss: 50, preventable: true, reported_by: 'Tom Wilson', veterinarian: 'Dr. Davis', notes: 'Farrowing crate modification needed' },
      { animal_id: animals[13].id, date_of_death: '2023-08-30', cause_of_death: 'Pregnancy Toxemia', category: 'Metabolic', age_at_death: '3 years', symptoms_before_death: 'Lethargy, sweet breath, recumbency', autopsy_performed: true, autopsy_findings: 'Fatty liver, ketosis', economic_loss: 400, preventable: true, reported_by: 'Robert Martinez', veterinarian: 'Dr. Brown', notes: 'Late pregnancy nutritional failure' },
      { animal_id: animals[14].id, date_of_death: '2023-04-02', cause_of_death: 'Johnes Disease', category: 'Infectious', age_at_death: '6 years', symptoms_before_death: 'Chronic diarrhea, progressive weight loss', autopsy_performed: true, autopsy_findings: 'Mycobacterium paratuberculosis confirmed', economic_loss: 2700, preventable: false, reported_by: 'John Smith', veterinarian: 'Dr. Smith', notes: 'Herd testing initiated' }
    ]);
    console.log('Mortality Records seeded');

    // Milk Production (15) - using recent dates for dashboard stats
    await MilkProduction.bulkCreate([
      { animal_id: animals[0].id, production_date: daysAgo(1), session: 'Morning', quantity_liters: 18.5, fat_percentage: 3.8, protein_percentage: 3.2, somatic_cell_count: 150000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 1', recorded_by: 'John Smith' },
      { animal_id: animals[0].id, production_date: daysAgo(1), session: 'Evening', quantity_liters: 15.2, fat_percentage: 4.0, protein_percentage: 3.3, somatic_cell_count: 145000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 1', recorded_by: 'John Smith' },
      { animal_id: animals[1].id, production_date: daysAgo(1), session: 'Morning', quantity_liters: 14.8, fat_percentage: 5.2, protein_percentage: 3.8, somatic_cell_count: 120000, temperature: 4.0, quality_grade: 'A+', storage_tank: 'Tank 1', recorded_by: 'John Smith' },
      { animal_id: animals[1].id, production_date: daysAgo(1), session: 'Evening', quantity_liters: 12.5, fat_percentage: 5.5, protein_percentage: 3.9, somatic_cell_count: 125000, temperature: 4.0, quality_grade: 'A+', storage_tank: 'Tank 1', recorded_by: 'John Smith' },
      { animal_id: animals[11].id, production_date: daysAgo(2), session: 'Morning', quantity_liters: 16.2, fat_percentage: 4.5, protein_percentage: 3.5, somatic_cell_count: 180000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 2', recorded_by: 'Lisa Anderson' },
      { animal_id: animals[11].id, production_date: daysAgo(2), session: 'Evening', quantity_liters: 13.8, fat_percentage: 4.7, protein_percentage: 3.6, somatic_cell_count: 175000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 2', recorded_by: 'Lisa Anderson' },
      { animal_id: animals[14].id, production_date: daysAgo(2), session: 'Morning', quantity_liters: 20.1, fat_percentage: 3.6, protein_percentage: 3.1, somatic_cell_count: 100000, temperature: 4.0, quality_grade: 'A+', storage_tank: 'Tank 1', recorded_by: 'John Smith' },
      { animal_id: animals[14].id, production_date: daysAgo(2), session: 'Evening', quantity_liters: 17.3, fat_percentage: 3.8, protein_percentage: 3.2, somatic_cell_count: 105000, temperature: 4.0, quality_grade: 'A+', storage_tank: 'Tank 1', recorded_by: 'John Smith' },
      { animal_id: animals[0].id, production_date: daysAgo(3), session: 'Morning', quantity_liters: 19.0, fat_percentage: 3.7, protein_percentage: 3.2, somatic_cell_count: 148000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 1', recorded_by: 'John Smith' },
      { animal_id: animals[0].id, production_date: daysAgo(3), session: 'Evening', quantity_liters: 15.8, fat_percentage: 3.9, protein_percentage: 3.3, somatic_cell_count: 142000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 1', recorded_by: 'John Smith' },
      { animal_id: animals[1].id, production_date: daysAgo(4), session: 'Morning', quantity_liters: 15.0, fat_percentage: 5.3, protein_percentage: 3.8, somatic_cell_count: 118000, temperature: 4.0, quality_grade: 'A+', storage_tank: 'Tank 1', recorded_by: 'John Smith' },
      { animal_id: animals[6].id, production_date: daysAgo(4), session: 'Morning', quantity_liters: 3.5, fat_percentage: 3.8, protein_percentage: 3.4, somatic_cell_count: 200000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 3', recorded_by: 'Emily Brown', notes: 'Goat milk' },
      { animal_id: animals[6].id, production_date: daysAgo(5), session: 'Evening', quantity_liters: 2.8, fat_percentage: 4.0, protein_percentage: 3.5, somatic_cell_count: 195000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 3', recorded_by: 'Emily Brown', notes: 'Goat milk' },
      { animal_id: animals[13].id, production_date: daysAgo(5), session: 'Morning', quantity_liters: 4.2, fat_percentage: 3.5, protein_percentage: 3.3, somatic_cell_count: 160000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 3', recorded_by: 'Robert Martinez', notes: 'Goat milk' },
      { animal_id: animals[13].id, production_date: daysAgo(6), session: 'Evening', quantity_liters: 3.6, fat_percentage: 3.7, protein_percentage: 3.4, somatic_cell_count: 155000, temperature: 4.0, quality_grade: 'A', storage_tank: 'Tank 3', recorded_by: 'Robert Martinez', notes: 'Goat milk' }
    ]);
    console.log('Milk Production seeded');

    // Financial Records (15) - using recent dates
    await FinancialRecord.bulkCreate([
      { category: 'Veterinary', type: 'Expense', amount: 2680, date: daysAgo(2), description: 'Monthly veterinary services', vendor: 'Valley Vet Clinic', payment_method: 'Bank Transfer', status: 'Completed' },
      { category: 'Feed', type: 'Expense', amount: 8500, date: daysAgo(3), description: 'Monthly feed supply order', vendor: 'FarmFeed Co', invoice_number: 'FF-2026-0215', payment_method: 'Bank Transfer', status: 'Completed' },
      { category: 'Milk Sales', type: 'Income', amount: 12500, date: daysAgo(4), description: 'Bi-weekly milk sales to dairy processor', vendor: 'DairyPure Processing', payment_method: 'Bank Transfer', status: 'Completed' },
      { category: 'Livestock Sales', type: 'Income', amount: 15000, date: daysAgo(5), description: 'Sale of 5 beef cattle at auction', vendor: 'County Livestock Auction', payment_method: 'Check', status: 'Completed' },
      { category: 'Equipment', type: 'Expense', amount: 3200, date: daysAgo(6), description: 'Milking machine parts replacement', vendor: 'AgriEquip Solutions', invoice_number: 'AES-2026-0088', payment_method: 'Credit Card', status: 'Completed' },
      { category: 'Labor', type: 'Expense', amount: 6800, date: daysAgo(7), description: 'Farm workers payroll - March', payment_method: 'Bank Transfer', status: 'Completed' },
      { category: 'Medications', type: 'Expense', amount: 890, date: daysAgo(8), description: 'Monthly medication and supplement order', vendor: 'VetPharm Supply', invoice_number: 'VPS-2026-0142', payment_method: 'Bank Transfer', status: 'Completed' },
      { category: 'Wool Sales', type: 'Income', amount: 4200, date: daysAgo(10), description: 'Annual wool clip sale - Merino flock', vendor: 'National Wool Buyers', payment_method: 'Bank Transfer', status: 'Completed' },
      { category: 'Insurance', type: 'Expense', amount: 2100, date: daysAgo(12), description: 'Monthly livestock insurance premium', vendor: 'Farm Mutual Insurance', payment_method: 'Auto Debit', status: 'Completed' },
      { category: 'Utilities', type: 'Expense', amount: 1450, date: daysAgo(14), description: 'Electricity, water, and gas for farm operations', vendor: 'Utility Services', payment_method: 'Auto Debit', status: 'Completed' },
      { category: 'Breeding', type: 'Expense', amount: 1800, date: daysAgo(16), description: 'AI semen straws and breeding supplies', vendor: 'Genetics Plus', invoice_number: 'GP-2026-0033', payment_method: 'Credit Card', status: 'Completed' },
      { category: 'Milk Sales', type: 'Income', amount: 13200, date: daysAgo(18), description: 'Bi-weekly milk sales to dairy processor', vendor: 'DairyPure Processing', payment_method: 'Bank Transfer', status: 'Completed' },
      { category: 'Goat Milk Sales', type: 'Income', amount: 2800, date: daysAgo(20), description: 'Monthly goat milk sales to artisan cheese maker', vendor: 'Mountain Cheese Co', payment_method: 'Bank Transfer', status: 'Completed' },
      { category: 'Maintenance', type: 'Expense', amount: 950, date: daysAgo(22), description: 'Fence repair and barn maintenance supplies', vendor: 'Farm Hardware Store', payment_method: 'Cash', status: 'Completed' },
      { category: 'Egg Sales', type: 'Income', amount: 3600, date: daysAgo(25), description: 'Monthly egg sales - free range', vendor: 'Local Market Direct', payment_method: 'Cash', status: 'Completed' }
    ]);
    console.log('Financial Records seeded');

    console.log('\n✅ All data seeded successfully!');
    console.log('Demo accounts were created with the caller-supplied password.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
