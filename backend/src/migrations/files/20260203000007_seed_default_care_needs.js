'use strict';

/**
 * Migration: seed_default_care_needs
 * Created: 2026-02-03
 * Description: Seed default care needs for initial setup
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultCareNeeds = [
      {
        key: 'dailyLiving',
        label_en: 'Daily Living Activities',
        label_de: 'Alltägliche Aktivitäten',
        label_fr: 'Activités Quotidiennes',
        description_en: 'Assistance with daily activities like eating, dressing, and bathing',
        description_de: 'Unterstützung bei täglichen Aktivitäten wie Essen, Anziehen und Baden',
        description_fr: 'Aide aux activités quotidiennes comme manger, s\'habiller et se laver',
        icon: 'Home',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'mobility',
        label_en: 'Mobility Assistance',
        label_de: 'Mobilitätshilfe',
        label_fr: 'Aide À La Mobilité',
        description_en: 'Help with walking, transfers, and physical movement',
        description_de: 'Hilfe beim Gehen, Transfers und körperlicher Bewegung',
        description_fr: 'Aide à la marche, aux transferts et aux mouvements physiques',
        icon: 'Accessibility',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'medication',
        label_en: 'Medication Management',
        label_de: 'Medikamentengabe',
        label_fr: 'Gestion Des Médicaments',
        description_en: 'Assistance with medication schedules and administration',
        description_de: 'Unterstützung bei Medikamentenplänen und -verabreichung',
        description_fr: 'Aide aux horaires et à l\'administration des médicaments',
        icon: 'Pill',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'companionship',
        label_en: 'Companionship',
        label_de: 'Gesellschaft',
        label_fr: 'Compagnie',
        description_en: 'Social interaction and emotional support',
        description_de: 'Soziale Interaktion und emotionale Unterstützung',
        description_fr: 'Interaction sociale et soutien émotionnel',
        icon: 'Heart',
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'housekeeping',
        label_en: 'Housekeeping',
        label_de: 'Haushaltsführung',
        label_fr: 'Entretien Ménager',
        description_en: 'Light housework, laundry, and home maintenance',
        description_de: 'Leichte Hausarbeit, Wäsche und Haushaltspflege',
        description_fr: 'Travaux ménagers légers, lessive et entretien de la maison',
        icon: 'Sparkles',
        sort_order: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'mealPreparation',
        label_en: 'Meal Preparation',
        label_de: 'Mahlzeitenzubereitung',
        label_fr: 'Préparation Des Repas',
        description_en: 'Planning and preparing nutritious meals',
        description_de: 'Planung und Zubereitung nahrhafter Mahlzeiten',
        description_fr: 'Planification et préparation de repas nutritifs',
        icon: 'ChefHat',
        sort_order: 6,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'transportation',
        label_en: 'Transportation',
        label_de: 'Transport',
        label_fr: 'Transport',
        description_en: 'Driving to appointments and errands',
        description_de: 'Fahren zu Terminen und Besorgungen',
        description_fr: 'Conduite aux rendez-vous et courses',
        icon: 'Car',
        sort_order: 7,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: 'personalHygiene',
        label_en: 'Personal Hygiene',
        label_de: 'Körperpflege',
        label_fr: 'Hygiène Personnelle',
        description_en: 'Assistance with bathing, grooming, and personal care',
        description_de: 'Unterstützung bei Baden, Körperpflege und persönlicher Hygiene',
        description_fr: 'Aide au bain, à la toilette et aux soins personnels',
        icon: 'Bath',
        sort_order: 8,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('care_needs', defaultCareNeeds);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('care_needs', null, {});
  },
};
