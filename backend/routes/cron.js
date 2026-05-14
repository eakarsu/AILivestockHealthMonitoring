const express = require('express');
const router = express.Router();
const { Vaccination, Animal, Alert } = require('../models');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/aiService');
const { Op } = require('sequelize');

// POST /api/cron/vaccination-reminders
// Checks vaccinations due within the next 14 days and generates AI reminder messages.
// Intended to be called by a cron job (with a valid JWT or internal secret).
router.post('/vaccination-reminders', auth, async (req, res) => {
  try {
    const today = new Date();
    const windowDays = parseInt(req.body.window_days) || 14;
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() + windowDays);

    // Find all vaccinations due in the next windowDays days that are not yet completed for this reminder cycle
    const upcomingVaccinations = await Vaccination.findAll({
      where: {
        next_due_date: {
          [Op.gte]: today.toISOString().split('T')[0],
          [Op.lte]: cutoffDate.toISOString().split('T')[0]
        },
        status: { [Op.ne]: 'Scheduled_Reminder_Sent' }
      },
      include: [Animal],
      order: [['next_due_date', 'ASC']]
    });

    if (upcomingVaccinations.length === 0) {
      return res.json({
        message: 'No upcoming vaccinations found in the specified window',
        window_days: windowDays,
        processed: 0,
        alerts_created: 0
      });
    }

    // Group vaccinations by animal for efficient AI calls
    const byAnimal = {};
    for (const vax of upcomingVaccinations) {
      const animalId = vax.animal_id;
      if (!byAnimal[animalId]) {
        byAnimal[animalId] = { animal: vax.Animal, vaccinations: [] };
      }
      byAnimal[animalId].vaccinations.push(vax);
    }

    const results = [];
    let alertsCreated = 0;

    for (const [animalId, group] of Object.entries(byAnimal)) {
      const { animal, vaccinations } = group;
      if (!animal) continue;

      const vaxList = vaccinations.map(v => ({
        vaccine: v.vaccine_name,
        type: v.vaccine_type,
        due_date: v.next_due_date,
        days_until_due: Math.ceil((new Date(v.next_due_date) - today) / (1000 * 60 * 60 * 24)),
        last_administered: v.date_administered,
        dosage: v.dosage,
        administered_by: v.administered_by
      }));

      // Generate AI reminder message
      const systemPrompt = `You are a veterinary AI specialist. Generate a clear, professional vaccination reminder message for farm staff.
      Include: which vaccines are due and when, urgency level, preparation notes, and any health considerations for the animal.
      Keep the message concise and actionable (under 300 words).`;

      const prompt = `Generate a vaccination reminder for:
      Animal: ${animal.name} (Tag: ${animal.tag_id}, Species: ${animal.species}, Breed: ${animal.breed || 'Unknown'})
      Age: ${animal.date_of_birth ? Math.floor((today - new Date(animal.date_of_birth)) / (1000 * 60 * 60 * 24 * 365)) + ' years' : 'Unknown'}
      Current Status: ${animal.status}

      Upcoming Vaccinations: ${JSON.stringify(vaxList, null, 2)}`;

      let reminderMessage = '';
      try {
        const aiResult = await queryAI(prompt, systemPrompt);
        reminderMessage = aiResult.content;
      } catch (aiErr) {
        // Fallback reminder if AI unavailable
        reminderMessage = `Vaccination reminder for ${animal.name} (${animal.tag_id}):\n` +
          vaxList.map(v => `- ${v.vaccine} due in ${v.days_until_due} day(s) (${v.due_date})`).join('\n') +
          `\n\nPlease schedule with your veterinarian.`;
      }

      // Determine urgency: if any vax is due within 3 days, mark as High
      const mostUrgent = vaxList.reduce((min, v) => v.days_until_due < min ? v.days_until_due : min, Infinity);
      const severity = mostUrgent <= 3 ? 'High' : 'Medium';
      const urgencyLabel = mostUrgent <= 3 ? 'Urgent' : 'Upcoming';

      // Create alert
      const alert = await Alert.create({
        animal_id: parseInt(animalId),
        alert_type: 'Vaccination Reminder',
        severity,
        title: `${urgencyLabel} Vaccination Due: ${animal.name} (${animal.tag_id})`,
        message: reminderMessage,
        source: 'Vaccination Reminder Cron',
        is_read: false,
        is_resolved: false
      });
      alertsCreated++;

      // Mark vaccinations as reminder sent
      for (const vax of vaccinations) {
        await vax.update({ status: 'Scheduled_Reminder_Sent' });
      }

      results.push({
        animal_id: parseInt(animalId),
        animal_name: animal.name,
        tag_id: animal.tag_id,
        vaccinations_count: vaccinations.length,
        most_urgent_days: mostUrgent,
        severity,
        alert_id: alert.id,
        reminder_preview: reminderMessage.substring(0, 200) + '...'
      });
    }

    res.json({
      message: 'Vaccination reminders processed successfully',
      window_days: windowDays,
      processed: upcomingVaccinations.length,
      animals_affected: results.length,
      alerts_created: alertsCreated,
      results
    });
  } catch (error) {
    console.error('Vaccination reminder cron error:', error);
    res.status(500).json({ error: 'Failed to process vaccination reminders' });
  }
});

module.exports = router;
