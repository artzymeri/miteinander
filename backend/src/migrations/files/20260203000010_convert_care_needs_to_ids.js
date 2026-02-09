/**
 * Migration: Convert care_needs and skills from text to IDs
 * 
 * This migration updates existing data to store care_need IDs instead of text.
 * The care_needs table must already exist with seeded data.
 */

module.exports = {
  name: '20260203000010_convert_care_needs_to_ids',

  async up(queryInterface, Sequelize) {
    // Get all care needs to build a lookup map
    const [careNeeds] = await queryInterface.sequelize.query(
      'SELECT id, `key`, label_en FROM care_needs'
    );
    
    // Create a lookup map: lowercase text -> id
    const textToIdMap = {};
    careNeeds.forEach(cn => {
      textToIdMap[cn.key.toLowerCase()] = cn.id;
      textToIdMap[cn.label_en.toLowerCase()] = cn.id;
      // Add common variations
      const words = cn.label_en.toLowerCase().split(' ');
      if (words.length > 1) {
        textToIdMap[words.join(' ')] = cn.id;
      }
    });
    
    // Also add specific mappings for the mock data
    const specificMappings = {
      'daily assistance': textToIdMap['dailyliving'] || textToIdMap['daily living activities'],
      'medication reminders': textToIdMap['medication'] || textToIdMap['medication management'],
      'companionship': textToIdMap['companionship'],
      'elderly care': textToIdMap['dailyliving'] || textToIdMap['daily living activities'],
      'medication management': textToIdMap['medication'] || textToIdMap['medication management'],
      'mobility assistance': textToIdMap['mobility'] || textToIdMap['mobility assistance'],
      'meal preparation': textToIdMap['nutrition'] || textToIdMap['nutrition & meal preparation'],
      'mobility': textToIdMap['mobility'] || textToIdMap['mobility assistance'],
      'dailyliving': textToIdMap['dailyliving'] || textToIdMap['daily living activities'],
    };
    
    Object.assign(textToIdMap, specificMappings);
    
    console.log('Care need text-to-ID mapping:', textToIdMap);
    
    // Update care_recipients
    const [recipients] = await queryInterface.sequelize.query(
      'SELECT id, care_needs FROM care_recipients WHERE care_needs IS NOT NULL'
    );
    
    for (const recipient of recipients) {
      try {
        const careNeedsArray = JSON.parse(recipient.care_needs);
        if (Array.isArray(careNeedsArray) && careNeedsArray.length > 0) {
          // Check if already converted (first item is a number)
          if (typeof careNeedsArray[0] === 'number') {
            console.log(`  Recipient ${recipient.id} already has ID format, skipping`);
            continue;
          }
          
          // Convert text to IDs
          const ids = careNeedsArray
            .map(text => {
              const normalized = String(text).toLowerCase().trim();
              const id = textToIdMap[normalized];
              if (!id) {
                console.log(`  Warning: No mapping for "${text}"`);
              }
              return id;
            })
            .filter(id => id !== undefined);
          
          if (ids.length > 0) {
            await queryInterface.sequelize.query(
              'UPDATE care_recipients SET care_needs = ? WHERE id = ?',
              {
                replacements: [JSON.stringify(ids), recipient.id],
                type: Sequelize.QueryTypes.UPDATE,
              }
            );
            console.log(`  Updated care_recipient ${recipient.id}: ${careNeedsArray} -> ${ids}`);
          }
        }
      } catch (e) {
        console.log(`  Error parsing care_needs for recipient ${recipient.id}:`, e.message);
      }
    }
    
    // Update care_givers (skills field)
    const [caregivers] = await queryInterface.sequelize.query(
      'SELECT id, skills FROM care_givers WHERE skills IS NOT NULL'
    );
    
    for (const caregiver of caregivers) {
      try {
        const skillsArray = JSON.parse(caregiver.skills);
        if (Array.isArray(skillsArray) && skillsArray.length > 0) {
          // Check if already converted (first item is a number)
          if (typeof skillsArray[0] === 'number') {
            console.log(`  CareGiver ${caregiver.id} already has ID format, skipping`);
            continue;
          }
          
          // Convert text to IDs
          const ids = skillsArray
            .map(text => {
              const normalized = String(text).toLowerCase().trim();
              const id = textToIdMap[normalized];
              if (!id) {
                console.log(`  Warning: No mapping for skill "${text}"`);
              }
              return id;
            })
            .filter(id => id !== undefined);
          
          if (ids.length > 0) {
            await queryInterface.sequelize.query(
              'UPDATE care_givers SET skills = ? WHERE id = ?',
              {
                replacements: [JSON.stringify(ids), caregiver.id],
                type: Sequelize.QueryTypes.UPDATE,
              }
            );
            console.log(`  Updated care_giver ${caregiver.id}: ${skillsArray} -> ${ids}`);
          }
        }
      } catch (e) {
        console.log(`  Error parsing skills for caregiver ${caregiver.id}:`, e.message);
      }
    }
    
    console.log('✅ Converted care_needs and skills to use IDs');
  },

  async down(queryInterface, Sequelize) {
    // This migration is not easily reversible as we'd need to store the original text
    console.log('⚠️  This migration cannot be easily reversed. The original text values are not preserved.');
  },
};
