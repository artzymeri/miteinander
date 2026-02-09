module.exports = (sequelize, DataTypes) => {
  const CareNeed = sequelize.define('CareNeed', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Unique identifier key in camelCase',
    },
    labelEn: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'label_en',
      comment: 'English label in Pascal Case',
    },
    labelDe: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'label_de',
      comment: 'German label in Pascal Case',
    },
    labelFr: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'label_fr',
      comment: 'French label in Pascal Case',
    },
    descriptionEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_en',
    },
    descriptionDe: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_de',
    },
    descriptionFr: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_fr',
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Icon name from Lucide icons',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'updated_by',
    },
  }, {
    tableName: 'care_needs',
    timestamps: true,
    underscored: true,
  });

  // Helper to convert string to Pascal Case
  CareNeed.toPascalCase = (str) => {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to convert string to camelCase key
  CareNeed.toCamelCaseKey = (str) => {
    if (!str) return str;
    const pascal = str
      .toLowerCase()
      .split(/[\s_-]+/)
      .map((word, index) => 
        index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('');
    return pascal;
  };

  // Hook to normalize labels to Pascal Case before saving
  CareNeed.beforeCreate((careNeed) => {
    careNeed.labelEn = CareNeed.toPascalCase(careNeed.labelEn);
    careNeed.labelDe = CareNeed.toPascalCase(careNeed.labelDe);
    careNeed.labelFr = CareNeed.toPascalCase(careNeed.labelFr);
    if (!careNeed.key) {
      careNeed.key = CareNeed.toCamelCaseKey(careNeed.labelEn);
    }
  });

  CareNeed.beforeUpdate((careNeed) => {
    if (careNeed.changed('labelEn')) {
      careNeed.labelEn = CareNeed.toPascalCase(careNeed.labelEn);
    }
    if (careNeed.changed('labelDe')) {
      careNeed.labelDe = CareNeed.toPascalCase(careNeed.labelDe);
    }
    if (careNeed.changed('labelFr')) {
      careNeed.labelFr = CareNeed.toPascalCase(careNeed.labelFr);
    }
  });

  return CareNeed;
};
