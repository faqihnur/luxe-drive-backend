module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');
    const Car = sequelize.define('Car', {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        nama_mobil: { type: DataTypes.STRING, allowNull: false },
        merk: { type: DataTypes.STRING, allowNull: false },
        harga_per_hari: { type: DataTypes.DECIMAL(10,2), allowNull: false },
        status_ketersediaan: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        url_gambar: { type: DataTypes.STRING }
    }, {
        tableName: 'cars',
        timestamps: true,
        underscored: true
    });

    Car.associate = (models) => {
        Car.hasMany(models.Rental, { foreignKey: 'car_id' });
    };

    return Car;
};
