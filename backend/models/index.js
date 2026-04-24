const sequelize = require('../config/database');
const User = require('./User');
const Animal = require('./Animal');
const HealthRecord = require('./HealthRecord');
const Vaccination = require('./Vaccination');
const FeedManagement = require('./FeedManagement');
const WeightTracking = require('./WeightTracking');
const BreedingRecord = require('./BreedingRecord');
const VetVisit = require('./VetVisit');
const Medication = require('./Medication');
const Herd = require('./Herd');
const Alert = require('./Alert');
const MortalityRecord = require('./MortalityRecord');
const MilkProduction = require('./MilkProduction');
const FinancialRecord = require('./FinancialRecord');
const DiseaseDetection = require('./DiseaseDetection');

// Associations
Animal.hasMany(HealthRecord, { foreignKey: 'animal_id' });
HealthRecord.belongsTo(Animal, { foreignKey: 'animal_id' });

Animal.hasMany(Vaccination, { foreignKey: 'animal_id' });
Vaccination.belongsTo(Animal, { foreignKey: 'animal_id' });

Animal.hasMany(WeightTracking, { foreignKey: 'animal_id' });
WeightTracking.belongsTo(Animal, { foreignKey: 'animal_id' });

Animal.hasMany(BreedingRecord, { foreignKey: 'animal_id' });
BreedingRecord.belongsTo(Animal, { foreignKey: 'animal_id' });

Animal.hasMany(VetVisit, { foreignKey: 'animal_id' });
VetVisit.belongsTo(Animal, { foreignKey: 'animal_id' });

Animal.hasMany(Medication, { foreignKey: 'animal_id' });
Medication.belongsTo(Animal, { foreignKey: 'animal_id' });

Animal.hasMany(MilkProduction, { foreignKey: 'animal_id' });
MilkProduction.belongsTo(Animal, { foreignKey: 'animal_id' });

Animal.hasMany(MortalityRecord, { foreignKey: 'animal_id' });
MortalityRecord.belongsTo(Animal, { foreignKey: 'animal_id' });

Animal.hasMany(DiseaseDetection, { foreignKey: 'animal_id' });
DiseaseDetection.belongsTo(Animal, { foreignKey: 'animal_id' });

Animal.hasMany(Alert, { foreignKey: 'animal_id' });
Alert.belongsTo(Animal, { foreignKey: 'animal_id' });

Herd.hasMany(Animal, { foreignKey: 'herd_id' });
Animal.belongsTo(Herd, { foreignKey: 'herd_id' });

module.exports = {
  sequelize,
  User,
  Animal,
  HealthRecord,
  Vaccination,
  FeedManagement,
  WeightTracking,
  BreedingRecord,
  VetVisit,
  Medication,
  Herd,
  Alert,
  MortalityRecord,
  MilkProduction,
  FinancialRecord,
  DiseaseDetection
};
