module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');
    const Rental = sequelize.define('Rental', {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        car_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        tanggal_mulai: { type: DataTypes.DATEONLY, allowNull: false },
        tanggal_selesai: { type: DataTypes.DATEONLY, allowNull: false },
        total_harga: { type: DataTypes.DECIMAL(12,2), allowNull: false },
        status_pembayaran: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' }
    }, {
        tableName: 'rentals',
        timestamps: true,
        underscored: true
    });

    Rental.associate = (models) => {
        Rental.belongsTo(models.User, { foreignKey: 'user_id' });
        Rental.belongsTo(models.Car, { foreignKey: 'car_id' });
    };

    return Rental;
};
